// Contract Mirror session-related action handlers.

async function handleCreateSessionAction() {
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
}
