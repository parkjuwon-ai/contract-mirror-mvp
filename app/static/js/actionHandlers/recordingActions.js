// Contract Mirror recording-related action handlers.
// Keeps recording upload and analysis logic out of actions.js.

function createDemoRecordingFile() {
  const payload = [
    `session_id=${state.sessionId}`,
    `contract_hash=${state.contractHash}`,
    "demo_recording=true",
    "transcript_candidate=예상 수익은 안정적으로 보장된다는 설명 후보 발언입니다.",
    `created_at=${new Date().toISOString()}`
  ].join("\n");

  return new File(
    [payload],
    "demo_recording.txt",
    { type: "text/plain" }
  );
}

async function handleStopRecordingAction() {
  try {
    setToast("녹취 파일을 저장하고 분석을 시작하고 있습니다.");

    const session = await ensureServiceSession();
    const recordingFile = createDemoRecordingFile();

    const recordingSession = await ContractMirrorApi.uploadRecording(
      session.id,
      recordingFile
    );

    applyServiceSession(recordingSession);

    addEvent(
      "RECORDING_HASH_CREATED",
      `recording_hash=${state.recordingHash}, duration=03:20`
    );

    const analyzedSession = await ContractMirrorApi.analyzeSession(session.id);

    applyServiceSession(analyzedSession);

    const analysisStatus = await ContractMirrorApi.getAnalysisStatus(session.id);

    if (analysisStatus) {
      addEvent(
        "ANALYSIS_STATUS_SYNCED",
        `status=${analysisStatus.status}, progress=${analysisStatus.progress}`
      );

      if (state.serviceSession && state.serviceSession.analysis) {
        state.serviceSession.analysis = {
          ...state.serviceSession.analysis,
          ...analysisStatus
        };
      }
    }

    state.recording = false;

    addEvent(
      "ANALYSIS_STARTED",
      `job_id=${analyzedSession.analysis?.jobId || "mock_job"}`
    );

    setToast("AI 분석이 완료되었습니다.");
    goTo(NAVIGATION_TARGETS.PROCESSING);
  } catch (error) {
    console.error("Recording upload or analysis failed", error);

    state.recording = false;

    addEvent("ANALYSIS_FAILED", error.message || "unknown_error");
    setToast(`녹취 저장 또는 분석에 실패했습니다. ${error.message || "잠시 후 다시 시도해주세요."}`);

    goTo(NAVIGATION_TARGETS.PROCESSING);
  }
}
