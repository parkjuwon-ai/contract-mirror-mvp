// Contract Mirror report / verification action handlers.
// Keeps report and verification API loading out of actions.js.

function cloneResultValue(value) {
  if (typeof deepClone === "function") {
    return deepClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function persistResultState() {
  try {
    if (
      typeof STORAGE_KEY !== "undefined" &&
      typeof createPersistedSnapshot === "function"
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedSnapshot()));
    }
  } catch (error) {
    console.warn("Failed to persist result state", error);
  }
}

function normalizeMismatch(mismatch) {
  return {
    ...mismatch,
    risk: mismatch.risk || mismatch.riskLevel || "medium",
    riskLevel: mismatch.riskLevel || mismatch.risk || "medium",
    basis: mismatch.basis || mismatch.evidence || ""
  };
}

async function handleGoReportAction(eventName = "REPORT_VIEWED") {
  try {
    markProcessingComplete();
    setToast("분석 리포트를 불러오고 있습니다.");

    await ensureServiceSession();

    const reportId =
      state.reportId ||
      state.serviceSession?.report?.id;

    if (!reportId) {
      throw new Error("생성된 리포트가 없습니다. 먼저 분석을 완료해주세요.");
    }

    const report = await ContractMirrorApi.getReport(reportId);

    if (!report || !report.id) {
      throw new Error("리포트를 불러오지 못했습니다.");
    }

    state.reportId = report.id;
    state.reportHash = report.hash || state.reportHash;
    state.serviceReport = cloneResultValue(report);

    if (Array.isArray(report.mismatches)) {
      state.mismatches = report.mismatches.map(normalizeMismatch);
    }

    if (Array.isArray(report.questions)) {
      state.questions = cloneResultValue(report.questions);
    }

    if (state.serviceSession) {
      state.serviceSession.report = {
        ...(state.serviceSession.report || {}),
        ...cloneResultValue(report)
      };
    }

    persistResultState();

    addEvent(eventName, `report_id=${state.reportId}, report_hash=${state.reportHash}`);
    setToast("분석 리포트를 불러왔습니다.");
    goTo(NAVIGATION_TARGETS.REPORT);
  } catch (error) {
    console.error("Load report failed", error);
    addEvent("REPORT_LOAD_FAILED", error.message || "unknown_error");
    setToast(`리포트 조회에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}

async function handleGoVerifyAction() {
  try {
    setToast("검증 정보를 불러오고 있습니다.");

    await ensureServiceSession();

    const verificationId =
      state.verificationId ||
      state.serviceSession?.verification?.id;

    if (!verificationId) {
      throw new Error("생성된 검증 카드가 없습니다. 먼저 분석을 완료해주세요.");
    }

    const verification = await ContractMirrorApi.getVerification(verificationId);

    if (!verification || !verification.id) {
      throw new Error("검증 정보를 불러오지 못했습니다.");
    }

    state.verificationId = verification.id;
    state.serviceVerification = cloneResultValue(verification);

    if (verification.contractHash) state.contractHash = verification.contractHash;
    if (verification.recordingHash) state.recordingHash = verification.recordingHash;
    if (verification.reportHash) state.reportHash = verification.reportHash;

    if (state.serviceSession) {
      state.serviceSession.verification = {
        ...(state.serviceSession.verification || {}),
        id: verification.id,
        status: verification.status,
        publicUrl: `/verify/${verification.id}`,
        qrUrl: `/verify/${verification.id}`,
        verifiedAt: verification.verifiedAt
      };
    }

    persistResultState();

    addEvent("VERIFY_CARD_CREATED", `/verify/${state.verificationId}`);
    setToast("검증 정보를 불러왔습니다.");
    goTo(NAVIGATION_TARGETS.VERIFY);
  } catch (error) {
    console.error("Load verification failed", error);
    addEvent("VERIFY_LOAD_FAILED", error.message || "unknown_error");
    setToast(`검증 정보 조회에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);
  }
}
