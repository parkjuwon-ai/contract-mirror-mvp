// Contract Mirror participant-related action handlers.

function isValidParticipantRole(role) {
  return Boolean(role && state[role]);
}

async function handleVerifyParticipantAction(role) {
  if (!isValidParticipantRole(role)) {
    setToast("지원하지 않는 참여자 역할입니다.");
    return;
  }

  try {
    setToast("본인확인 상태를 저장하고 있습니다.");

    const session = await ensureServiceSession();
    const updatedSession = await ContractMirrorApi.updateParticipant(
      session.id,
      role,
      { verified: true }
    );

    applyServiceSession(updatedSession);
    addEvent("PARTICIPANT_VERIFIED", `${role}=Demo Verified`);
    setToast("본인확인이 완료되었습니다.");
    render();
  } catch (error) {
    console.error("Participant verification failed", error);
    addEvent("PARTICIPANT_VERIFY_FAILED", `${role}=${error.message || "unknown_error"}`);
    setToast(`본인확인 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}

async function handleConsentParticipantAction(role) {
  if (!isValidParticipantRole(role)) {
    setToast("지원하지 않는 참여자 역할입니다.");
    return;
  }

  try {
    setToast("동의 상태를 저장하고 있습니다.");

    const session = await ensureServiceSession();
    const updatedSession = await ContractMirrorApi.updateParticipant(
      session.id,
      role,
      {
        consent: true,
        rejected: false
      }
    );

    applyServiceSession(updatedSession);
    addEvent("CONSENT_COMPLETED", `${role}_recording=true, ai_analysis=true, hash_record=true`);
    setToast("동의 상태가 저장되었습니다.");
    render();
  } catch (error) {
    console.error("Participant consent failed", error);
    addEvent("CONSENT_SAVE_FAILED", `${role}=${error.message || "unknown_error"}`);
    setToast(`동의 상태 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}

async function handleRejectParticipantAction(role) {
  if (!isValidParticipantRole(role)) {
    setToast("지원하지 않는 참여자 역할입니다.");
    return;
  }

  try {
    setToast("거절 상태를 저장하고 있습니다.");

    const session = await ensureServiceSession();
    const updatedSession = await ContractMirrorApi.updateParticipant(
      session.id,
      role,
      {
        consent: false,
        rejected: true
      }
    );

    applyServiceSession(updatedSession);
    addEvent("CONSENT_REJECTED", `${role}_recording=false, ai_analysis=false`);
    setToast("동의 거절 상태가 저장되었습니다.");
    render();
  } catch (error) {
    console.error("Participant rejection failed", error);
    addEvent("CONSENT_REJECT_SAVE_FAILED", `${role}=${error.message || "unknown_error"}`);
    setToast(`거절 상태 저장에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}
