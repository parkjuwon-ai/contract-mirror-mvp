// Contract Mirror miscellaneous UI/demo action handlers.
// Keeps small demo, invite, addendum, sharing, and trust-log actions out of actions.js.

function handleJoinContractorAction() {
  state.device = "host";
  addEvent("INVITE_CODE_FLOW_OPENED", `invite_code=${state.inviteCode}`);
  goTo(NAVIGATION_TARGETS.INVITE_CODE);
}

function handleSubmitInviteCodeAction() {
  addEvent("INVITE_CODE_SUBMITTED", `invite_code=${state.inviteCode}`);
  goTo(NAVIGATION_TARGETS.PARTICIPANT_CONSENT);
}

function handleAgreeInviteeRecordingAction() {
  state.explainer.verified = true;
  state.explainer.consent = true;
  state.explainer.rejected = false;
  addEvent("INVITEE_CONSENT_COMPLETED", "recording=true, ai_analysis=true");
  goTo(NAVIGATION_TARGETS.PARTICIPANT_READY);
}

function handleGoParticipantRecordingAction() {
  addEvent("INVITEE_RECORDING_JOINED", "recording_screen=true");
  goTo(NAVIGATION_TARGETS.PARTICIPANT_RECORDING);
}

function handleCompleteParticipantRecordingAction() {
  addEvent("INVITEE_RECORDING_COMPLETED", "participant_done=true");
  goTo(NAVIGATION_TARGETS.PARTICIPANT_DONE);
}

function handleCopyReportLinkAction() {
  addEvent("REPORT_LINK_COPIED", `/report/${state.sessionId}`);
  copyText(
    `https://contract-mirror.kr/report/${state.sessionId}`,
    "PC로 볼 리포트 링크가 복사되었습니다."
  );
}

function handleGoAddendumAction() {
  addEvent("POST_CONFIRM_DOC_STEP_OPENED", `session_id=${state.sessionId}`);
  goTo(NAVIGATION_TARGETS.ADDENDUM);
}

function handleSkipAddendumAction() {
  state.addendumUploaded = false;
  addEvent("POST_CONFIRM_DOC_SKIPPED", `session_id=${state.sessionId}`);
  goTo(NAVIGATION_TARGETS.VERIFY);
}

function handleUploadAddendumAction() {
  state.addendumUploaded = true;
  addEvent("POST_CONFIRM_DOC_ATTACHED", `file=${state.addendumName}, doc_hash=${state.addendumHash}`);
  render();
}

function handleCloseVaultAction() {
  state.vaultSheet = null;
  render();
}

function handleViewVaultAction() {
  state.vaultSheet = null;
  setToast("보관함 화면은 배포 버전에서 연결됩니다.");
}

function handleCopyShareLinkAction() {
  addEvent("VERIFY_SHARE_LINK_COPIED", `/verify/${state.sessionId}`);
  copyText(
    `https://contract-mirror.kr/verify/${state.sessionId}`,
    "확인 링크가 복사되었습니다."
  );
}

function handleScrollVerifyQrAction() {
  const target = document.querySelector("#verifyQrPanel");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleToggleContractRecordAction() {
  state.contractRecordOpen = !state.contractRecordOpen;
  render();
}

function handleStartRecordingAction() {
  if (!readyToRecord()) return;

  addEvent("RECORDING_STARTED", "all_identity_and_consent_completed=true");
  state.recording = true;
  goTo(NAVIGATION_TARGETS.RECORDING);
}

function handleOpenTrustAction() {
  openTrust();
}

function handleResetConsentsAction() {
  resetConsentState();
  addEvent("SESSION_RESET", "consent_status=reset");
  goTo(NAVIGATION_TARGETS.WAITING);
}
