// Contract Mirror frontend action handlers
// Extracted from app.js without changing runtime behavior.


function pickLocalFile({ accept = "" } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    let settled = false;

    input.type = "file";
    input.accept = accept;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
      window.removeEventListener("focus", handleFocus);
    };

    const finish = (file) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(file || null);
    };

    const handleFocus = () => {
      setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) {
          finish(null);
        }
      }, 700);
    };

    input.addEventListener("change", () => {
      finish(input.files && input.files[0] ? input.files[0] : null);
    }, { once: true });

    window.addEventListener("focus", handleFocus);

    document.body.appendChild(input);
    input.click();
  });
}


async function handleAction(e) {
  const action = e.currentTarget.dataset.action;
  if (action === "copy-all-questions") {
    copyAllQuestions();
    return;
  }
  if (action && action.startsWith("copy-question-")) {
    copyQuestionById(action.replace("copy-question-", ""));
    return;
  }
  const roleAction = (prefix) => action.startsWith(prefix) ? action.replace(prefix, "") : null;
  const route = {
    "go-start": () => goTo(NAVIGATION_TARGETS.START),
    "go-upload": () => goTo(NAVIGATION_TARGETS.UPLOAD),
    "go-lock": () => goTo(NAVIGATION_TARGETS.LOCK),
    "go-invite": () => goTo(NAVIGATION_TARGETS.INVITE),
    "join-contractor": () => { state.device = "host"; addEvent("INVITE_CODE_FLOW_OPENED", `invite_code=${state.inviteCode}`); goTo(NAVIGATION_TARGETS.INVITE_CODE); },
    "go-invite-code": () => goTo(NAVIGATION_TARGETS.INVITE_CODE),
    "submit-invite-code": () => { addEvent("INVITE_CODE_SUBMITTED", `invite_code=${state.inviteCode}`); goTo(NAVIGATION_TARGETS.PARTICIPANT_CONSENT); },
    "agree-invitee-recording": () => { state.explainer.verified = true; state.explainer.consent = true; state.explainer.rejected = false; addEvent("INVITEE_CONSENT_COMPLETED", "recording=true, ai_analysis=true"); goTo(NAVIGATION_TARGETS.PARTICIPANT_READY); },
    "go-participant-recording": () => { addEvent("INVITEE_RECORDING_JOINED", "recording_screen=true"); goTo(NAVIGATION_TARGETS.PARTICIPANT_RECORDING); },
    "complete-participant-recording": () => { addEvent("INVITEE_RECORDING_COMPLETED", "participant_done=true"); goTo(NAVIGATION_TARGETS.PARTICIPANT_DONE); },
    "go-waiting": () => goTo(NAVIGATION_TARGETS.WAITING),
    "go-failure": () => goTo(NAVIGATION_TARGETS.FAILURE),
    "go-report": () => handleGoReportAction("REPORT_VIEWED"),
    "go-mobile-report": () => handleGoReportAction("MOBILE_REPORT_VIEWED"),
    "copy-report-link": () => { addEvent("REPORT_LINK_COPIED", `/report/${state.sessionId}`); copyText(`https://contract-mirror.kr/report/${state.sessionId}`, "PC로 볼 리포트 링크가 복사되었습니다."); },
    "go-addendum": () => { addEvent("POST_CONFIRM_DOC_STEP_OPENED", `session_id=${state.sessionId}`); goTo(NAVIGATION_TARGETS.ADDENDUM); },
    "go-verify": () => handleGoVerifyAction(),
    "skip-addendum": () => { state.addendumUploaded = false; addEvent("POST_CONFIRM_DOC_SKIPPED", `session_id=${state.sessionId}`); goTo(NAVIGATION_TARGETS.VERIFY); },
    "new-contract": () => resetDemoState(NAVIGATION_TARGETS.START),
    "upload-addendum": () => { state.addendumUploaded = true; addEvent("POST_CONFIRM_DOC_ATTACHED", `file=${state.addendumName}, doc_hash=${state.addendumHash}`); render(); },
    "close-vault": () => { state.vaultSheet = null; render(); },
    "view-vault": () => { state.vaultSheet = null; setToast("보관함 화면은 배포 버전에서 연결됩니다."); },
    "copy-share-link": () => { addEvent("VERIFY_SHARE_LINK_COPIED", `/verify/${state.sessionId}`); copyText(`https://contract-mirror.kr/verify/${state.sessionId}`, "확인 링크가 복사되었습니다."); },
    "scroll-verify-qr": () => {
      const target = document.querySelector("#verifyQrPanel");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    "create-session": () => handleCreateSessionAction(),
    "upload-contract": () => handleUploadContractAction(),
    "lock-contract": () => handleLockContractAction(),
    "toggle-contract-record": () => { state.contractRecordOpen = !state.contractRecordOpen; render(); },
    "start-recording": () => { if (readyToRecord()) { addEvent("RECORDING_STARTED", "all_identity_and_consent_completed=true"); state.recording = true; goTo(NAVIGATION_TARGETS.RECORDING); } },
    "stop-recording": () => handleStopRecordingAction(),
    "open-trust": () => openTrust(),
    "reset-consents": () => { resetConsentState(); addEvent("SESSION_RESET", "consent_status=reset"); goTo(NAVIGATION_TARGETS.WAITING); }
  };
  if (route[action]) return route[action]();

  const verifyRole = roleAction("verify-");
  if (verifyRole) {
    if (!state[verifyRole]) {
      setToast("지원하지 않는 참여자 역할입니다.");
      return;
    }

    try {
      setToast("본인확인 상태를 저장하고 있습니다.");

      const session = await ensureServiceSession();
      const updatedSession = await ContractMirrorApi.updateParticipant(
        session.id,
        verifyRole,
        { verified: true }
      );

      applyServiceSession(updatedSession);
      addEvent("PARTICIPANT_VERIFIED", `${verifyRole}=Demo Verified`);
      setToast("본인확인이 완료되었습니다.");
      render();
    } catch (error) {
      console.error("Participant verification failed", error);
      addEvent("PARTICIPANT_VERIFY_FAILED", `${verifyRole}=${error.message || "unknown_error"}`);
      setToast(`본인확인 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
    }

    return;
  }

  const consentRole = roleAction("consent-");
  if (consentRole) {
    if (!state[consentRole]) {
      setToast("지원하지 않는 참여자 역할입니다.");
      return;
    }

    try {
      setToast("동의 상태를 저장하고 있습니다.");

      const session = await ensureServiceSession();
      const updatedSession = await ContractMirrorApi.updateParticipant(
        session.id,
        consentRole,
        {
          consent: true,
          rejected: false
        }
      );

      applyServiceSession(updatedSession);
      addEvent("CONSENT_COMPLETED", `${consentRole}_recording=true, ai_analysis=true, hash_record=true`);
      setToast("동의 상태가 저장되었습니다.");
      render();
    } catch (error) {
      console.error("Participant consent failed", error);
      addEvent("CONSENT_SAVE_FAILED", `${consentRole}=${error.message || "unknown_error"}`);
      setToast(`동의 상태 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
    }

    return;
  }

  const rejectRole = roleAction("reject-");
  if (rejectRole) {
    if (!state[rejectRole]) {
      setToast("지원하지 않는 참여자 역할입니다.");
      return;
    }

    try {
      setToast("거절 상태를 저장하고 있습니다.");

      const session = await ensureServiceSession();
      const updatedSession = await ContractMirrorApi.updateParticipant(
        session.id,
        rejectRole,
        {
          consent: false,
          rejected: true
        }
      );

      applyServiceSession(updatedSession);
      addEvent("CONSENT_REJECTED", `${rejectRole}_recording=false, ai_analysis=false`);
      setToast("동의 거절 상태가 저장되었습니다.");
      render();
    } catch (error) {
      console.error("Participant rejection failed", error);
      addEvent("CONSENT_REJECT_SAVE_FAILED", `${rejectRole}=${error.message || "unknown_error"}`);
      setToast(`거절 상태 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
    }

    return;
  }
}
