// Contract Mirror frontend action handlers
// Extracted from app.js without changing runtime behavior.

function handleAction(e) {
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
    "go-report": () => { markProcessingComplete(); addEvent("REPORT_VIEWED", `report_hash=${state.reportHash}`); goTo(NAVIGATION_TARGETS.REPORT); },
    "go-mobile-report": () => { markProcessingComplete(); addEvent("MOBILE_REPORT_VIEWED", `report_hash=${state.reportHash}`); goTo(NAVIGATION_TARGETS.REPORT); },
    "copy-report-link": () => { addEvent("REPORT_LINK_COPIED", `/report/${state.sessionId}`); copyText(`https://contract-mirror.kr/report/${state.sessionId}`, "PC로 볼 리포트 링크가 복사되었습니다."); },
    "go-addendum": () => { addEvent("POST_CONFIRM_DOC_STEP_OPENED", `session_id=${state.sessionId}`); goTo(NAVIGATION_TARGETS.ADDENDUM); },
    "go-verify": () => { addEvent("VERIFY_CARD_CREATED", `/verify/${state.sessionId}`); goTo(NAVIGATION_TARGETS.VERIFY); },
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
    "create-session": async () => {
      try {
        setToast("새 계약 세션을 생성하고 있습니다.");

        const session = await ContractMirrorApi.createSession({
          contractType: getApiContractType()
        });

        applyServiceSession(session);
        addEvent("SESSION_CREATED", `session_id=${state.sessionId}`);
        setToast("새 계약 세션이 생성되었습니다.");
        goTo(NAVIGATION_TARGETS.UPLOAD);
      } catch (error) {
        console.error("Create session failed", error);
        addEvent("SESSION_CREATE_FAILED", error.message || "unknown_error");
        setToast(`세션 생성에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
      }
    },
    "upload-contract": () => { addEvent("CONTRACT_UPLOADED", `file=${state.contractFile}`); goTo(NAVIGATION_TARGETS.LOCK); },
    "lock-contract": () => {
      state.contractor.verified = true;
      state.contractor.consent = true;
      state.contractor.rejected = false;
      addEvent("CONTRACT_HASH_CREATED", `contract_hash=${state.contractHash}`);
      addEvent("CONTRACT_STATUS", "locked_before_recording");
      addEvent("HOST_READY", "contractor_identity_and_consent=preconfirmed_demo");
      goTo(NAVIGATION_TARGETS.INVITE);
    },
    "toggle-contract-record": () => { state.contractRecordOpen = !state.contractRecordOpen; render(); },
    "start-recording": () => { if (readyToRecord()) { addEvent("RECORDING_STARTED", "all_identity_and_consent_completed=true"); state.recording = true; goTo(NAVIGATION_TARGETS.RECORDING); } },
    "stop-recording": () => { addEvent("RECORDING_HASH_CREATED", `recording_hash=${state.recordingHash}, duration=03:20`); state.recording = false; goTo(NAVIGATION_TARGETS.PROCESSING); },
    "open-trust": () => openTrust(),
    "reset-consents": () => { resetConsentState(); addEvent("SESSION_RESET", "consent_status=reset"); goTo(NAVIGATION_TARGETS.WAITING); }
  };
  if (route[action]) return route[action]();

  const verifyRole = roleAction("verify-");
  if (verifyRole) {
    state[verifyRole].verified = true;
    addEvent("PARTICIPANT_VERIFIED", `${verifyRole}=Demo Verified`);
    render();
    return;
  }
  const consentRole = roleAction("consent-");
  if (consentRole) {
    state[consentRole].consent = true;
    state[consentRole].rejected = false;
    addEvent("CONSENT_COMPLETED", `${consentRole}_recording=true, ai_analysis=true, hash_record=true`);
    render();
    return;
  }
  const rejectRole = roleAction("reject-");
  if (rejectRole) {
    state[rejectRole].consent = false;
    state[rejectRole].rejected = true;
    addEvent("CONSENT_REJECTED", `${rejectRole}_recording=false, ai_analysis=false`);
    render();
  }
}
