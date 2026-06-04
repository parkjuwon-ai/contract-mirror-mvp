// Contract Mirror support / fallback screen renderers.
// Extracted from app.js without changing runtime behavior.

function addendumScreen() {
  return wrap(`
    <div class="addendum-workspace-v612 workspace-shell addendum-workspace-v12 addendum-workspace-v13 addendum-workspace-v15">
      <header class="report-header-v612 report-header-v12 report-header-v13 report-header-v15">
        <div>
          <span class="screen-kicker">선택 단계 · 사후 확인 문서</span>
          <h2>추가 확인 문서가 있나요?</h2>
          <p>답변서나 확약서가 있다면 확인 카드에 함께 보관할 수 있습니다. 없다면 바로 최종 확인 카드를 만들 수 있습니다.</p>
        </div>
        <div class="report-meta-v611"><span>${state.sessionId}</span><strong>${state.contractFile}</strong></div>
      </header>
      <div class="addendum-grid-v612 workspace-grid addendum-grid-v15">
        <section class="addendum-main-card workspace-main addendum-main-card-v12 addendum-main-card-v15">
          <div class="addendum-purpose-card-v12 addendum-purpose-card-v13 addendum-purpose-card-v15">
            <strong>사후 문서는 선택 사항입니다.</strong>
            <span>첨부해도 기존 AI 분석 결과는 바뀌지 않으며, 답변서·확약서 같은 사후 근거만 확인 카드에 함께 보관됩니다.</span>
          </div>
          ${state.addendumUploaded ? `
            <section class="addendum-confirm-card addendum-confirm-card-v13 addendum-confirm-card-v15">
              <h3>사후 확인 문서 첨부 완료</h3>
              <div class="verify-row"><span>문서명</span><strong>${state.addendumName}</strong></div>
              <div class="verify-row"><span>연결 방식</span><strong>확인 질문에 대한 답변 문서</strong></div>
              <p>이 문서는 최종 확인 카드에 함께 포함됩니다.</p>
            </section>
          ` : `
            <div class="post-analysis-choice-v15">
              <button class="post-doc-card primary" data-action="upload-addendum" type="button">
                <span>📄</span><strong>문서 첨부하기</strong><em>확약서·특약서가 있다면 함께 보관합니다.</em>
              </button>
              <button class="post-doc-card" data-action="skip-addendum" type="button">
                <span>↷</span><strong>건너뛰고 카드 만들기</strong><em>추가 문서 없이 최종 확인 카드를 생성합니다.</em>
              </button>
            </div>
          `}
        </section>
        <aside class="addendum-side-card workspace-side addendum-side-card-v13 addendum-side-card-v15">
          <h3>이 단계의 목적</h3>
          <p>리포트에서 확인한 질문에 대한 답변이나 확약서가 있을 때만 첨부하세요. 자료가 없다면 바로 최종 확인 카드로 넘어가도 됩니다.</p>
          <div class="mini-verify-summary">
            <div><span>분석 결과</span><strong>유지</strong></div>
            <div><span>확인 질문</span><strong>3건</strong></div>
            <div><span>추가 문서</span><strong>${state.addendumUploaded ? "첨부 완료" : "미첨부"}</strong></div>
          </div>
          <div class="bottom-actions evidence-actions one-primary-actions">
            <button class="big-action primary-result-action" data-action="go-verify">최종 확인 카드 만들기</button>
            <button class="ghost-inline-action" data-action="go-report">리포트로 돌아가기</button>
          </div>
        </aside>
      </div>
    </div>
  `);

}

function failureScreen() {
  return wrap(`
    <div class="screen-kicker" style="color:var(--danger)">진행 불가</div>
    <h2 class="screen-title">녹취를 시작할 수 없습니다.</h2>
    <p class="screen-desc">계약 내용을 설명하는 사람이 녹취 및 AI 분석에 동의하지 않았습니다. 계약미러는 양쪽 모두 본인확인과 동의를 완료해야만 녹취를 시작합니다.</p>
    <div class="status-card-grid">
      ${statusCard("계약 설명을 듣는 사람", "contractor", state.contractor)}
      ${statusCard("계약 내용을 설명하는 사람", "explainer", state.explainer)}
    </div>
    <div class="strong-notice" style="background:var(--danger-soft);color:var(--danger)">
      동의 거부 기록은 세션에 남지만, 녹취는 생성되지 않습니다.
    </div>
    <div class="bottom-actions">
      ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
      <button class="secondary-action" data-action="reset-consents">상태 초기화</button>
    </div>
  `);
}

function startProcessing() {
  state.processingIndex = 0;
  state.progress = 8;
  addEvent("STT_STARTED", "audio_duration=03:20");
  const labels = [
    ["STT_COMPLETED", `transcript_hash=${state.transcriptHash}`],
    ["CONTRACT_PARSE_STARTED", "contract_pages=15"],
    ["CLAUSE_MATCHING_STARTED", "candidate_clauses=4"],
    ["MISMATCH_DETECTED", "candidates=3, highest_risk=high"],
    ["REPORT_HASH_CREATED", `report_hash=${state.reportHash}`]
  ];
  state.processingTimer = setInterval(() => {
    state.progress = Math.min(100, state.progress + 19);
    if (state.processingIndex < processingSteps.length) {
      const ev = labels[state.processingIndex];
      if (ev) addEvent(ev[0], ev[1]);
      state.processingIndex += 1;
      render({ forceScrollToTop: false });
    }
    if (state.progress >= 100 || state.processingIndex >= processingSteps.length) {
      clearInterval(state.processingTimer);
      state.processingTimer = null;
      state.progress = 100;
      render({ forceScrollToTop: false });
    }
  }, 850);
}

function setToast(message) {
  state.toastText = message;
  render({ forceScrollToTop: false });
  window.clearTimeout(setToast._timer);
  setToast._timer = window.setTimeout(() => {
    state.toastText = "";
    render({ forceScrollToTop: false });
  }, 1500);
}

function copyText(text, message = "복사되었습니다.") {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  setToast(message);
}

function copyQuestionById(id) {
  const question = confirmationQuestions.find((item) => item.id === Number(id));
  if (!question) return;
  addEvent("CONFIRMATION_QUESTION_COPIED", `question_id=${question.id}`);
  copyText(question.text, "질문이 복사되었습니다.");
}

function copyAllQuestions() {
  const text = confirmationQuestions.map((question) => `질문 ${question.id}. ${question.text}`).join("\n");
  addEvent("ALL_CONFIRMATION_QUESTIONS_COPIED", `question_count=${confirmationQuestions.length}`);
  copyText(text, "질문 3개가 복사되었습니다.");
}

function markProcessingComplete() {
  stopProcessingTimer();
  state.progress = 100;
  state.processingIndex = processingSteps.length;
}

function summaryDone(condition) {
  return condition ? "done" : "pending";
}

function renderTrustSummary() {
  const el = $("#trustSummary");
  if (!el) return;
  const reportDone = ["report", "verify"].includes(state.step) || state.progress >= 100;
  const verifyDone = state.step === "verify";
  const items = [
    ["계약 설명 세션", state.step !== "start", state.sessionId],
    ["계약자 본인확인", state.contractor.verified, state.contractor.verified ? "완료" : "대기"],
    ["설명자 본인확인", state.explainer.verified, state.explainer.verified ? "완료" : "대기"],
    ["계약서 원본 해시", !["start", "create", "upload"].includes(state.step), "생성 완료"],
    ["녹취 기록 해시", ["processing", "report", "verify"].includes(state.step) || state.progress > 0, "생성 완료"],
    ["STT 변환", reportDone, reportDone ? "완료" : "대기"],
    ["계약 조항 매칭", reportDone, reportDone ? "완료" : "대기"],
    ["불일치 후보", reportDone, reportDone ? "3건 탐지" : "대기"],
    ["분석 리포트 해시", reportDone, reportDone ? "생성 완료" : "대기"],
    ["QR 검증 URL", verifyDone, verifyDone ? "생성 완료" : "대기"]
  ];
  el.innerHTML = `
    <div class="trust-summary-head">
      <strong>Trust Summary</strong>
      <span>세션 검증 상태 요약</span>
    </div>
    <div class="trust-summary-grid">
      ${items.map(([label, done, value]) => `
        <div class="trust-summary-item ${summaryDone(done)}">
          <span class="summary-dot"></span>
          <div><b>${label}</b><em>${value}</em></div>
        </div>
      `).join("")}
    </div>
  `;
}

function logLineClass(line) {
  if (/created|completed|matched|true|high|verified|완료|탐지/.test(line)) return "success";
  if (/pending|대기/.test(line)) return "pending";
  if (/simulated|mock/.test(line)) return "simulated";
  return "";
}

function renderTrustLog() {
  renderTrustSummary();
  const panel = $("#trustLog");
  if (!panel) return;
  const blocks = [
    ["SESSION", [`session_id=${state.sessionId}`, `status=${state.step}`]],
    ["CONTRACT", [`contract_hash=${state.contractHash}`, "status=locked_before_recording"]],
    ["IDENTITY", [`contractor=${state.contractor.verified ? "Demo Verified" : "pending"}`, `explainer=${state.explainer.verified ? "Demo Verified" : "pending"}`]],
    ["CONSENT", [`contractor_recording=${state.contractor.consent}`, `explainer_recording=${state.explainer.consent}`, `contractor_rejected=${state.contractor.rejected}`, `explainer_rejected=${state.explainer.rejected}`, `ai_analysis=${state.contractor.consent && state.explainer.consent}`, `hash_record=${state.contractor.consent && state.explainer.consent}`]],
    ["RECORDING", [`recording_hash=${state.recordingHash}`, "duration=03:20"]],
    ["AI REPORT", ["mismatch_candidates=3", "highest_risk=high", "evidence_fields=audio_time, clause_id, quote_pair, reason", `report_hash=${state.reportHash}`]],
    ["VERIFY CARD", [`session_id=${state.sessionId}`, "contract_hash=matched", "recording_hash=created", "report_hash=created", "qr_status=created, vault_status=stored", `vault_status=${state.vaultSaved ? "stored" : "ready"}`]],
    ["CHAIN", ["anchor_status=simulated", "integration_status=ready_for_chain_anchor"]],
    ["EVENTS", state.events.map(([k, v]) => `${k} :: ${v}`).slice(-14)]
  ];
  panel.innerHTML = blocks.map(([title, lines]) => `
    <div class="log-block"><strong>${title}</strong>${lines.map((line) => `<div class="log-line ${logLineClass(line)}"><span>›</span> ${line}</div>`).join("")}</div>
  `).join("");
}

