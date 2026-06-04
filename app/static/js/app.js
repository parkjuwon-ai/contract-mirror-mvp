

function addEvent(label, value) {
  if (!Array.isArray(state.events)) state.events = [];
  state.events.push([`${now()}  ${label}`, value]);
  renderTrustLog();
}

function resetConsentState() {
  state.contractor = { ...state.contractor, consent: false, rejected: false };
  state.explainer = { ...state.explainer, consent: false, rejected: false };
}

function isJudge() {
  return state.mode === "judge";
}

function openTrust() {
  if (!isJudge()) return;
  state.trustOpen = true;
  $("#trustPanel").hidden = false;
  $("#workspace").classList.remove("trust-closed");
  $("#trustToggleTop").setAttribute("aria-expanded", "true");
}

function closeTrust() {
  state.trustOpen = false;
  $("#trustPanel").hidden = true;
  $("#workspace").classList.add("trust-closed");
  $("#trustToggleTop").setAttribute("aria-expanded", "false");
}

function stopProcessingTimer() {
  if (!state.processingTimer) return;
  clearInterval(state.processingTimer);
  state.processingTimer = null;
}

function isKnownStep(step) {
  return SCREEN_STEPS.includes(step);
}

function goTo(step, options = {}) {
  if (!isKnownStep(step)) {
    console.warn(`Unknown Contract Mirror step: ${step}`);
    return;
  }

  const previousStep = state.step;
  stopProcessingTimer();
  state.step = step;

  if (step === NAVIGATION_TARGETS.PROCESSING && options.startProcessing !== false) {
    startProcessing();
  }

  const shouldResetScroll = options.scrollToTop ?? previousStep !== step;
  render({ forceScrollToTop: shouldResetScroll });
}

// Legacy alias kept during stabilization. New navigation should call goTo().
function setStep(step, options = {}) {
  goTo(step, options);
}

function setDevice(device) {
  state.device = device;
  render({ forceScrollToTop: true });
}

function readyToRecord() {
  return state.contractor.verified && state.contractor.consent && state.explainer.verified && state.explainer.consent && !state.contractor.rejected && !state.explainer.rejected;
}

function hasRejection() {
  return state.contractor.rejected || state.explainer.rejected;
}

function phase() {
  if (CONTRACT_PHASE_STEPS.includes(state.step)) return "contract";
  if (CONSENT_PHASE_STEPS.includes(state.step)) return "consent";
  return "result";
}

let lastViewKey = null;

function getViewKey() {
  return `${state.mode}:${state.device}:${state.step}`;
}

function render(options = {}) {
  persistState();
  const viewKey = getViewKey();
  const shouldResetScroll = options.forceScrollToTop ?? viewKey !== lastViewKey;
  renderShell();
  renderScreen();
  renderTrustLog();
  keepMobileScreenAtTop(shouldResetScroll);
  lastViewKey = viewKey;
}

function keepMobileScreenAtTop(shouldResetScroll = false) {
  if (!shouldResetScroll) return;
  requestAnimationFrame(() => {
    const phoneScreen = document.querySelector(".phone-screen");
    const screen = document.querySelector("#screen");
    const workspace = document.querySelector(".workspace");
    if (phoneScreen) phoneScreen.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (screen) screen.scrollTop = 0;
    if (workspace) workspace.scrollTop = 0;
    if (!isJudge()) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
}

function renderShell() {
  document.body.classList.toggle("judge-mode", isJudge());
  document.body.classList.toggle("user-mode", !isJudge());
  document.body.classList.toggle("home-screen", state.step === "start" && state.device === "host");
  const isWorkspace = WORKSPACE_STEPS.includes(state.step) && state.device === "host";
  document.body.classList.toggle("evidence-screen", isWorkspace);
  document.body.classList.toggle("workspace-screen", isWorkspace);
  document.body.classList.toggle("report-screen", state.step === "report" && state.device === "host");
  document.body.classList.toggle("addendum-screen", state.step === "addendum" && state.device === "host");
  document.body.classList.toggle("verify-screen", state.step === "verify" && state.device === "host");
  document.body.classList.toggle("judge-dashboard", isJudge());
  document.body.classList.toggle("recording-step", state.step === "recording" && state.device === "host");
  document.body.classList.toggle("processing-step", state.step === "processing" && state.device === "host");
  document.body.classList.toggle("judge-final-step", isJudge() && state.device === "host" && state.step === "verify");

  const phoneFrame = document.querySelector(".phone-frame");
  const phoneStatusBar = document.querySelector(".phone-status-bar");
  if (phoneFrame) phoneFrame.classList.toggle("workspace-frame-reset", isWorkspace);
  if (phoneStatusBar) {
    phoneStatusBar.hidden = isWorkspace;
    if (isWorkspace) {
      phoneStatusBar.style.setProperty("display", "none", "important");
    } else {
      phoneStatusBar.style.removeProperty("display");
    }
  }

  const p = phase();
  const phaseLabels = { contract: "계약서 확인", consent: "본인확인·동의", result: "결과 확인" };
  const showProgress = !(state.step === "start" && state.device === "host");
  $("#progressSummary").hidden = !showProgress;
  $("#phasePill").hidden = !showProgress;
  $("#phasePill").textContent = phaseLabels[p];
  $("#modeEyebrow").textContent = isJudge() ? "Judge Technical View" : "Contract Mirror";

  document.querySelectorAll(".summary-step").forEach((el) => {
    el.classList.remove("active", "done");
    const ep = el.dataset.phase;
    const order = { contract: 0, consent: 1, result: 2 };
    if (order[ep] < order[p]) el.classList.add("done");
    if (ep === p) el.classList.add("active");
  });

  const deviceLabels = {
    host: state.step === "start" ? "계약미러" : "계약 확인 기록",
    contractor: "계약 설명을 듣는 사람",
    explainer: "계약 내용을 설명하는 사람"
  };
  $("#deviceLabel").textContent = deviceLabels[state.device];

  const mini = {
    start: "",
    create: "세션 만들기",
    upload: "계약서 등록",
    lock: "기록 확인",
    invite: "초대",
    waiting: readyToRecord() ? "녹취 준비 완료" : "상대방 대기",
    identity: "본인확인",
    consent: "동의",
    recording: "녹취 중",
    processing: "분석 중",
    report: "결과",
    addendum: "사후 확인",
    verify: "검증 카드",
    failure: "진행 불가"
  };
  $("#userStatusMini").textContent = mini[state.step] || "진행 중";

  if (isJudge()) {
    // v5.2.3: /judge is an independent PC dashboard.
    // Do not show the old floating Trust Log panel here; Trust Summary and Raw Log
    // are rendered inside the dashboard as a fixed right column.
    $("#trustToggleTop").hidden = true;
    $("#controlToggle").hidden = false;
    $("#trustPanel").hidden = true;
    $("#workspace").classList.add("trust-closed");
    $("#progressSummary").hidden = true;
    $("#phasePill").hidden = true;
  } else {
    // v6.4: 사용자 제출/데모 화면에서는 폰 바깥 단계바를 숨긴다.
    // 진행 상태는 실제 모바일 화면 내부의 헤더와 CTA로만 전달한다.
    $("#progressSummary").hidden = true;
    $("#phasePill").hidden = true;
    $("#trustToggleTop").hidden = true;
    $("#controlToggle").hidden = true;
    closeTrust();
    $("#controlPanel").hidden = true;
  }
}

function toastHTML() {
  if (!state.toastText) return "";
  return `<div class="cm-toast" role="status">${state.toastText}</div>`;
}

function vaultSheetHTML() {
  if (!state.vaultSheet) return "";
  const saving = state.vaultSheet === "saving";
  return `
    <div class="vault-backdrop" data-action="close-vault" aria-hidden="true"></div>
    <section class="vault-sheet" role="dialog" aria-label="검증 카드 보관 상태">
      ${saving ? `
        <div class="vault-sheet-head">
          <span class="vault-spinner"></span>
          <div><strong>확인 카드를 보관하는 중입니다</strong><p>계약서, 녹취, AI 분석 결과, 양측 동의 기록을 하나의 검증 패키지로 묶고 있습니다.</p></div>
        </div>
        <div class="vault-progress-list">
          <div class="done">✓ 계약 ID 연결</div>
          <div class="done">✓ 계약서 확인값 확인</div>
          <div class="done">✓ 녹취 확인값 확인</div>
          <div class="active">● 확인 카드 보관 중</div>
        </div>
      ` : `
        <div class="vault-sheet-head complete">
          <span class="vault-complete-mark">✓</span>
          <div><strong>계약미러 보안 보관함에 저장되었습니다</strong><p>계약 당시의 계약서, 녹취, AI 분석 결과, 양측 동의 기록이 같은 세션으로 보관됩니다.</p></div>
        </div>
        <div class="vault-summary-grid">
          <div><span>계약 ID</span><strong>${state.sessionId}</strong></div>
          <div><span>기록 무결성</span><strong>정상</strong></div>
          <div><span>위험 탐지</span><strong>높음 1건 · 중간 2건</strong></div>
        </div>
        <div class="vault-sheet-actions">
          <button class="big-action" data-action="view-vault" type="button">보관함에서 보기</button>
          <button class="secondary-action" data-action="go-report" type="button">리포트 내려받기</button>
          <button class="ghost-inline-action" data-action="copy-share-link" type="button">공유용 링크 복사</button>
        </div>
      `}
    </section>
  `;
}

function wrap(content) {
  const isWorkspace = WORKSPACE_STEPS.includes(state.step) && state.device === "host";
  return `<div class="screen-card ${isWorkspace ? "workspace-card" : ""}">${content}${toastHTML()}${vaultSheetHTML()}</div>`;
}

function judgeStatusPill(done, labelWhenDone = "완료", labelWhenPending = "대기") {
  return `<span class="judge-status-pill ${done ? "done" : "pending"}">${done ? labelWhenDone : labelWhenPending}</span>`;
}

function judgeTimelineItem(label, done, detail) {
  return `
    <div class="judge-timeline-item ${done ? "done" : "pending"}">
      <span class="judge-timeline-dot"></span>
      <div><strong>${label}</strong><em>${detail}</em></div>
    </div>
  `;
}

function judgeTrustSummaryItems(reportDone, verifyDone) {
  return [
    ["계약 설명 세션", state.step !== "start", state.sessionId],
    ["계약자 본인확인", state.contractor.verified, state.contractor.verified ? "Demo Verified" : "준비 중"],
    ["설명자 본인확인", state.explainer.verified, state.explainer.verified ? "Demo Verified" : "준비 중"],
    ["계약서 원본 해시", !["start", "create", "upload"].includes(state.step), "생성 완료"],
    ["녹취 기록 해시", ["processing", "report", "verify"].includes(state.step) || state.progress > 0, "생성 완료"],
    ["STT 변환", reportDone, reportDone ? "완료" : "계약서·녹취 대조 준비"],
    ["계약 조항 매칭", reportDone, reportDone ? "완료" : "대조 준비"],
    ["불일치 후보", reportDone, reportDone ? "3건 탐지" : "분석 준비"],
    ["추가 확인 문서", state.addendumUploaded, state.addendumUploaded ? "포함" : "선택 가능"],
    ["분석 리포트 해시", reportDone, reportDone ? "생성 완료" : "생성 준비"],
    ["QR 검증 URL", verifyDone, verifyDone ? "생성 완료" : "검증 카드 생성 준비"],
    ["검증 카드 보관", state.vaultSaved, state.vaultSaved ? "보관 완료" : "보관 준비"],
    ["Chain 연동", true, "데이터 구조 검증 완료"]
  ];
}

function judgeTrustSummaryHTML(reportDone, verifyDone) {
  const items = judgeTrustSummaryItems(reportDone, verifyDone);
  return `
    <section class="judge-trust-card judge-summary-card">
      <div class="judge-card-head">
        <div>
          <span class="judge-section-label">Trust Summary</span>
          <h3>검증 상태 요약</h3>
        </div>
        <strong class="judge-health ${verifyDone ? "done" : "pending"}">${verifyDone ? "정상" : "진행 중"}</strong>
      </div>
      <div class="judge-trust-list">
        ${items.map(([label, done, value]) => `
          <div class="judge-trust-item ${done ? "done" : "pending"}">
            <span class="summary-dot"></span>
            <div><b>${label}</b><em>${value}</em></div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function judgeRawLogHTML() {
  const blocks = [
    ["SESSION", [`session_id=${state.sessionId}`, `status=${state.step}`]],
    ["CONTRACT", [`contract_hash=${state.contractHash}`, "status=locked_before_recording"]],
    ["IDENTITY", [`contractor=${state.contractor.verified ? "Demo Verified" : "ready"}`, `explainer=${state.explainer.verified ? "Demo Verified" : "ready"}`]],
    ["CONSENT", [`contractor_recording=${state.contractor.consent}`, `explainer_recording=${state.explainer.consent}`, `ai_analysis=${state.contractor.consent && state.explainer.consent}`]],
    ["RECORDING", [`recording_hash=${state.recordingHash}`, "duration=03:20"]],
    ["AI REPORT", ["mismatch_candidates=3", "highest_risk=high", "evidence_fields=audio_time, clause_id, quote_pair, reason", `report_hash=${state.reportHash}`]],
    ["VERIFY CARD", [`session_id=${state.sessionId}`, "contract_hash=matched", "recording_hash=created", "report_hash=created", "qr_status=created, vault_status=stored", `vault_status=${state.vaultSaved ? "stored" : "ready"}`]],
    ["CHAIN", ["Demo Tx Hash=0x7a91...c4e2", "data_structure_validated=true", "official_anchor=next_phase"]],
    ["EVENTS", state.events.map(([k, v]) => `${k} :: ${v}`).slice(-10)]
  ];
  return `
    <details class="judge-trust-card judge-raw-card">
      <summary>Raw Trust Log 보기</summary>
      <div class="judge-raw-log">
        ${blocks.map(([title, lines]) => `
          <div class="log-block"><strong>${title}</strong>${lines.map((line) => `<div class="log-line ${logLineClass(line)}"><span>›</span> ${line}</div>`).join("")}</div>
        `).join("")}
      </div>
    </details>
  `;
}

function judgeDashboardScreen() {
  const reportDone = ["report", "verify"].includes(state.step) || state.progress >= 100;
  const verifyDone = state.step === "verify";
  const first = state.mismatches[0];
  const timeline = [
    ["세션 생성", state.step !== "start", state.sessionId],
    ["계약서 원본 해시", !["start", "create", "upload"].includes(state.step), "기준 계약서 고정"],
    ["양측 본인확인", state.contractor.verified && state.explainer.verified, "계약자·설명자"],
    ["녹취 동의", state.contractor.consent && state.explainer.consent, "녹취·AI 분석 동의"],
    ["녹취 기록 해시", ["processing", "report", "verify"].includes(state.step) || state.progress > 0, "03:20 기록"],
    ["AI 불일치 분석", reportDone, reportDone ? "3건 탐지" : "계약서·녹취 대조 중"],
    ["검증 카드", verifyDone, verifyDone ? "QR 생성 완료" : "검증 카드 생성 준비"],
    ["보안 보관함", state.vaultSaved, state.vaultSaved ? "확인 카드 보관 완료" : "보관 준비"],
  ];

  const finalStage = verifyDone ? `
    <section class="judge-verify-stage judge-final-verify-stage">
      <div class="judge-verify-stage-top">
        <div class="judge-status-pill done">기록 무결성 정상</div>
        <div class="judge-status-pill done">QR 확인 카드 보관 완료</div>
      </div>
      <h2 class="judge-verify-title">계약 설명 확인 카드 보관 완료</h2>
      <p class="judge-verify-desc">계약서 원본, 설명 녹취, AI 분석 결과, 양측 동의 기록이 하나의 검증 카드로 묶였습니다.</p>
      <div class="judge-verify-grid">
        <section class="judge-evidence-card">
          <h3 class="judge-card-title">세션 증거 요약</h3>
          <div class="judge-checklist">
            <div class="judge-check-item"><div class="judge-check-label">계약 ID</div><div class="judge-check-value">${state.sessionId}</div></div>
            <div class="judge-check-item"><div class="judge-check-label">계약 내용 위험 탐지</div><div class="judge-check-value">높음 1건 / 중간 2건</div></div>
            <div class="judge-check-item"><div class="judge-check-label">계약자 본인확인</div><div class="judge-check-value ok">완료</div></div>
            <div class="judge-check-item"><div class="judge-check-label">설명자 본인확인</div><div class="judge-check-value ok">완료</div></div>
            <div class="judge-check-item"><div class="judge-check-label">계약서 해시</div><div class="judge-check-value ok">생성 완료</div></div>
            <div class="judge-check-item"><div class="judge-check-label">녹취 해시</div><div class="judge-check-value ok">생성 완료</div></div>
            <div class="judge-check-item"><div class="judge-check-label">리포트 해시</div><div class="judge-check-value ok">생성 완료</div></div>
            <div class="judge-check-item"><div class="judge-check-label">QR 검증</div><div class="judge-check-value ok">가능</div></div>
          </div>
        </section>
        <section class="judge-qr-card">
          <h3 class="judge-card-title">검증 카드</h3>
          <div class="judge-qr-small-label">사후 검증용 QR</div>
          <div class="judge-qr-mark real-qr"><span>CM</span></div>
          <div class="judge-qr-url">contract-mirror.kr/verify/CM-20260601-001</div>
          <div class="judge-check-item"><div class="judge-check-label">검증 URL</div><div class="judge-check-value code">/verify/${state.sessionId}</div></div>
          <div class="judge-check-item"><div class="judge-check-label">Chain 연동</div><div class="judge-check-value">데이터 구조 검증 완료</div></div>
        </section>
      </div>
    </section>
  ` : reportDone ? `
    <section class="judge-panel judge-report-stage">
      <div class="judge-panel-kicker">AI EVIDENCE REPORT</div>
      <div class="mismatch-head">
        <div><h2>${first.title}</h2><p>녹취 발언과 계약서 조항의 충돌 가능성을 증거 필드 단위로 확인합니다.</p></div>
        ${riskBadge(first)}
      </div>
      <div class="evidence-meta">
        <div><span>녹취 위치</span><strong>${first.audioTime}</strong></div>
        <div><span>계약서 위치</span><strong>${first.clause}</strong></div>
      </div>
      <div class="judge-comparison-grid">
        <section class="judge-compare-block"><div class="judge-compare-label">녹취 발언</div><p class="judge-compare-text">“${highlightEvidenceText(first.transcript, "transcript", first.id)}”</p></section>
        <section class="judge-compare-block"><div class="judge-compare-label">계약서 조항</div><p class="judge-compare-text">“${highlightEvidenceText(first.contract, "contract", first.id)}”</p></section>
      </div>
      <div class="judge-reason-box"><div class="judge-reason-title">AI 판단 이유</div><p class="judge-reason-text">${first.reason}</p></div>
      <div class="judge-mismatch-table compact">
        ${state.mismatches.map((m) => `<div class="judge-mismatch-row ${m.riskClass}"><strong>${m.id}. ${m.title}</strong><span>${m.audioTime} · ${m.clause}</span>${riskBadge(m)}</div>`).join("")}
      </div>
    </section>
  ` : `
    <section class="judge-panel judge-empty-evidence">
      <div class="judge-panel-kicker">READY FOR DEMO</div>
      <h2>아직 분석 전 단계입니다.</h2>
      <p>오른쪽 하단의 시연 제어를 열어 본인확인·동의 처리 후 AI 분석 완료를 누르면 이 영역이 증거 리포트로 전환됩니다.</p>
    </section>
  `;

  return `
    <div class="judge-shell judge-v53">
      <section class="judge-hero">
        <div class="judge-hero-top">
          <div class="judge-hero-copy">
            <div class="judge-hero-kicker">JUDGE TRUST CONSOLE</div>
            <h1 class="judge-hero-title">계약 설명 세션 검증 콘솔</h1>
            <p class="judge-hero-desc">사용자 모바일 플로우와 분리된 심사위원용 웹 화면입니다. 본인확인, 녹취, AI 분석, 해시, QR 검증 상태를 한 화면에서 확인합니다.</p>
          </div>
          <div class="judge-hero-badges">
            <div class="judge-badge risk-high">최고 위험도 높음</div>
            <div class="judge-badge info">불일치 후보 ${reportDone ? "3건" : "준비"}</div>
            <div class="judge-badge info">Session ${state.sessionId}</div>
          </div>
        </div>
        <div class="judge-kpi-grid">
          <div class="judge-kpi-card"><div class="judge-kpi-label">본인확인</div><div class="judge-kpi-value">양측 신원 확인 완료</div><div class="judge-kpi-meta">모바일 신분증 기반 Demo Verified</div></div>
          <div class="judge-kpi-card"><div class="judge-kpi-label">계약 설명</div><div class="judge-kpi-value">녹취 세션 완료</div><div class="judge-kpi-meta">계약서·녹취 대조에 필요한 기록 확보</div></div>
          <div class="judge-kpi-card"><div class="judge-kpi-label">AI 분석</div><div class="judge-kpi-value">불일치 후보 3건 탐지</div><div class="judge-kpi-meta">높음 1건 / 중간 2건</div></div>
          <div class="judge-kpi-card"><div class="judge-kpi-label">검증성</div><div class="judge-kpi-value">확인 카드 보관 완료</div><div class="judge-kpi-meta">계약서·녹취·리포트 해시 연결</div></div>
        </div>
      </section>
      <div class="judge-main-grid">
        <aside class="judge-panel judge-session-panel-v53">
          <div class="judge-panel-kicker">SESSION TIMELINE</div>
          <h2 class="judge-panel-title">검증 이벤트</h2>
          <p class="judge-panel-desc">사용자 단계가 아니라, 증거가 생성되는 순서입니다.</p>
          <div class="judge-session-id"><span>Session ID</span><strong>${state.sessionId}</strong></div>
          <div class="judge-timeline-list">${timeline.map(([label, done, detail]) => judgeTimelineItem(label, done, detail)).join("")}</div>
          <div class="recording-compare-card">
            <h3>일반 녹취 vs 계약미러</h3>
            <div class="compare-mini-grid"><div><strong>일반 녹취</strong><span>계약서 기준·조항 연결·사후 검증이 불명확</span></div><div><strong>계약미러</strong><span>본인확인·분석 결과·검증 카드·QR 확인으로 연결</span></div></div>
          </div>
        </aside>
        <main class="judge-center">
          ${finalStage}
          <div class="judge-dashboard-actions">
            <button class="secondary-action" data-action="go-start">시작 상태</button>
            <button class="secondary-action" data-action="go-report">분석 리포트 상태</button>
            <button class="big-action" data-action="go-verify">검증 카드 상태</button>
          </div>
        </main>
        <aside class="judge-panel judge-trust">
          ${judgeTrustSummaryHTML(reportDone, verifyDone)}
          ${judgeRawLogHTML()}
          <section class="judge-trust-card judge-poc-note"><strong>PoC 표시 기준</strong><p>예선 MVP에서는 공식 Chain 연동 전 단계로, 검증 데이터 구조와 트랜잭션 흐름을 데모 형태로 구현했습니다.</p></section>
        </aside>
      </div>
    </div>
  `;
}

function renderScreen() {
  const screen = $("#screen");

  // v5.2.2 role correction:
  // - user route: mobile field flow
  // - judge route: web verification dashboard
  if (isJudge() && state.device === "host") {
    screen.innerHTML = judgeDashboardScreen();
  } else if (state.device !== "host") {
    screen.innerHTML = participantDeviceScreen(state.device);
  } else {
    const screens = {
      start: startScreen,
      create: createRoomScreen,
      upload: uploadContractScreen,
      lock: lockContractScreen,
      invite: inviteScreen,
      waiting: waitingRoomScreen,
      recording: recordingScreen,
      processing: processingScreen,
      report: reportScreen,
      addendum: addendumScreen,
      verify: verifyScreen,
      failure: failureScreen,
      "invite-code": inviteCodeScreen,
      "participant-consent": inviteeConsentScreen,
      "participant-ready": inviteeReadyScreen,
      "participant-recording": inviteeRecordingScreen,
      "participant-done": inviteeDoneScreen
    };
    screen.innerHTML = (screens[state.step] || startScreen)();
  }
  screen.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleAction));
}
