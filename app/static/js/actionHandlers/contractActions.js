// Contract Mirror contract-related action handlers.

async function handleUploadContractAction() {
  try {
    const file = await pickLocalFile({
      accept: ".pdf,.jpg,.jpeg,.png,.txt"
    });

    if (!file) {
      setToast("계약서 선택이 취소되었습니다.");
      return;
    }

    setToast("계약서를 업로드하고 해시를 생성하고 있습니다.");

    const session = await ensureServiceSession();
    const updatedSession = await ContractMirrorApi.uploadContract(session.id, file);

    applyServiceSession(updatedSession);
    addEvent("CONTRACT_UPLOADED", `file=${state.contractFile}, contract_hash=${state.contractHash}`);
    setToast("계약서가 등록되었습니다.");
    goTo(NAVIGATION_TARGETS.LOCK);
  } catch (error) {
    console.error("Upload contract failed", error);
    addEvent("CONTRACT_UPLOAD_FAILED", error.message || "unknown_error");
    setToast(`계약서 업로드에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}

async function handleLockContractAction() {
  try {
    const session = await ensureServiceSession();

    setToast("계약서를 고정하고 있습니다.");

    const lockedSession = await ContractMirrorApi.lockContract(session.id);
    const updatedSession = await ContractMirrorApi.updateParticipant(
      lockedSession.id,
      "contractor",
      {
        verified: true,
        consent: true,
        rejected: false
      }
    );

    applyServiceSession(updatedSession);

    // 기존 데모 흐름 유지: 호스트/계약자 본인확인과 동의는 사전 완료 처리
    state.contractor.verified = true;
    state.contractor.consent = true;
    state.contractor.rejected = false;

    addEvent("CONTRACT_HASH_CREATED", `contract_hash=${state.contractHash}`);
    addEvent("CONTRACT_STATUS", "locked_before_recording");
    addEvent("HOST_READY", "contractor_identity_and_consent=preconfirmed_demo");
    setToast("계약서가 고정되었습니다.");
    goTo(NAVIGATION_TARGETS.INVITE);
  } catch (error) {
    console.error("Lock contract failed", error);
    addEvent("CONTRACT_LOCK_FAILED", error.message || "unknown_error");
    setToast(`계약서 고정에 실패했습니다. ${error.message || "계약서를 먼저 업로드해주세요."}`);
  }
}
