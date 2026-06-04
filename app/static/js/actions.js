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
    "join-contractor": () => handleJoinContractorAction(),
    "go-invite-code": () => goTo(NAVIGATION_TARGETS.INVITE_CODE),
    "submit-invite-code": () => handleSubmitInviteCodeAction(),
    "agree-invitee-recording": () => handleAgreeInviteeRecordingAction(),
    "go-participant-recording": () => handleGoParticipantRecordingAction(),
    "complete-participant-recording": () => handleCompleteParticipantRecordingAction(),
    "go-waiting": () => goTo(NAVIGATION_TARGETS.WAITING),
    "go-failure": () => goTo(NAVIGATION_TARGETS.FAILURE),
    "go-report": () => handleGoReportAction("REPORT_VIEWED"),
    "go-mobile-report": () => handleGoReportAction("MOBILE_REPORT_VIEWED"),
    "copy-report-link": () => handleCopyReportLinkAction(),
    "go-addendum": () => handleGoAddendumAction(),
    "go-verify": () => handleGoVerifyAction(),
    "skip-addendum": () => handleSkipAddendumAction(),
    "new-contract": () => resetDemoState(NAVIGATION_TARGETS.START),
    "upload-addendum": () => handleUploadAddendumAction(),
    "close-vault": () => handleCloseVaultAction(),
    "view-vault": () => handleViewVaultAction(),
    "copy-share-link": () => handleCopyShareLinkAction(),
    "scroll-verify-qr": () => handleScrollVerifyQrAction(),
    "create-session": () => handleCreateSessionAction(),
    "upload-contract": () => handleUploadContractAction(),
    "lock-contract": () => handleLockContractAction(),
    "toggle-contract-record": () => handleToggleContractRecordAction(),
    "start-recording": () => handleStartRecordingAction(),
    "stop-recording": () => handleStopRecordingAction(),
    "open-trust": () => handleOpenTrustAction(),
    "reset-consents": () => handleResetConsentsAction()
  };
  if (route[action]) return route[action]();

  const verifyRole = roleAction("verify-");
  if (verifyRole) {
    return handleVerifyParticipantAction(verifyRole);
  }

  const consentRole = roleAction("consent-");
  if (consentRole) {
    return handleConsentParticipantAction(consentRole);
  }

  const rejectRole = roleAction("reject-");
  if (rejectRole) {
    return handleRejectParticipantAction(rejectRole);
  }
}
