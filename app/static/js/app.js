

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

function startScreen() {
  return wrap(`
    <div class="cm-home-v7">
      <div class="cm-home-scroll-v7">
        <section class="cm-home-hero-v7" aria-labelledby="cmHomeTitle">
          <div class="cm-home-chip-row-v7">
            <span class="cm-home-chip-v7">AI 계약 설명 검증</span>
          </div>

          <h2 id="cmHomeTitle">
            말과 계약서가<br />
            어긋나는 순간을 찾아냅니다.
          </h2>

          <p class="cm-home-lead-v7">
            설명 녹취와 계약서 조항을 나란히 비춰보고,<br />
            충돌 가능성이 있는 지점을 확인 질문으로 바꿔줍니다.
          </p>

          <div class="cm-flow-chip-v7" aria-label="계약미러 진행 흐름">
            <span>계약서 등록</span>
            <i aria-hidden="true">→</i>
            <span>설명 녹취</span>
            <i aria-hidden="true">→</i>
            <span>AI 분석</span>
            <i aria-hidden="true">→</i>
            <span>질문 리포트</span>
          </div>
        </section>

        <section class="cm-mirror-core-v7" aria-label="계약미러 핵심 비교">
          <div class="cm-mirror-stage-v7">
            <article class="cm-side-card-v7 cm-side-voice-v7">
              <div class="cm-side-label-v7">
                <span class="cm-side-icon-v7" aria-hidden="true">🎙</span>
                <em>말로 들은 설명</em>
              </div>
              <strong>수익<br />안정</strong>
              <p>“월 300만 원 정도는<br />안정적으로 나옵니다.”</p>
            </article>

            <div class="cm-crack-v7" aria-hidden="true">
              <span class="cm-crack-line-v7"></span>
            </div>

            <article class="cm-side-card-v7 cm-side-contract-v7">
              <div class="cm-side-label-v7">
                <span class="cm-side-icon-v7" aria-hidden="true">📄</span>
                <em>계약서 조항</em>
              </div>
              <strong>책임<br />없음</strong>
              <p>“회사는 수익 발생 여부에 대해<br />책임지지 않습니다.”</p>
            </article>
          </div>

          <div class="cm-conflict-badge-v7">충돌 가능성 감지</div>

          <div class="cm-ai-card-v7">
            <span>AI가 하는 일</span>
            <strong>충돌 지점을 질문으로 바꿉니다.</strong>
          </div>

          <div class="cm-question-card-v7">
            <span>AI가 바꾼 질문</span>
            <p>“월 300만 원은<br />보장 수익인가요,<br />예상 수익인가요?”</p>
          </div>
        </section>

        <section class="cm-choice-copy-v7" aria-label="계약미러 시작 안내">
          <strong>불안한 계약 설명이 있다면</strong>
          <p>녹취와 계약서를 올려 말과 조항이 다르게 읽히는 지점을 먼저 확인해보세요.</p>
        </section>
      </div>

      <div class="cm-home-fixed-cta-v7" aria-label="계약미러 빠른 시작">
        <button class="cm-fixed-main-v7" type="button" data-action="create-session">
          계약 설명 검증 시작하기
        </button>
        <button class="cm-fixed-sub-v7" type="button" data-action="join-contractor">
          설명자로 참여하기
        </button>
      </div>
    </div>
  `);
}


function stepTitleHTML(stepText, title, options = {}) {
  const noBack = options.noBack ? " no-back" : "";
  return `<div class="cm-step-title-row${noBack}"><span class="screen-step-label${noBack}">${stepText}</span><strong>${title}</strong></div>`;
}

function createRoomScreen() {
  return wrap(`
    <button class="screen-back-button" data-action="go-start" type="button" aria-label="처음으로 돌아가기">←</button>
    ${stepTitleHTML("Step 1 / 4", "계약 확인 기록 시작")}
    <h2 class="screen-title">오늘의 계약을 확인할 준비를 합니다.</h2>
    <p class="screen-desc">계약서, 설명 녹취, 동의 기록을 하나의 검증 흐름으로 묶습니다.</p>
    <div class="form-grid compact-form-grid">
      <div class="field"><label>계약명</label><input value="${state.contractName}" readonly /></div>
      <div class="field"><label>계약 유형</label><select disabled><option>${state.contractType}</option></select></div>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="create-session">다음: 기준 계약서 등록하기</button>
    </div>
  `);
}

function uploadContractScreen() {
  return wrap(`
    <button class="screen-back-button" data-action="go-start" type="button" aria-label="처음으로 돌아가기">←</button>
    ${stepTitleHTML("Step 1 / 4", "기준 계약서 등록")}
    <h2 class="screen-title compact">기준 계약서를 등록하세요.</h2>
    <p class="screen-desc">계약서·안내문 파일을 올리면, 다음 단계에서 설명 녹취와 비교합니다.</p>
    <button class="upload-method-card primary single-upload-card" data-action="upload-contract" type="button">
      <span class="upload-method-icon">📄</span>
      <strong>계약서 파일 불러오기</strong>
      <em>비교 기준이 되는 계약서·안내문을 등록합니다.</em>
      <small>PDF · JPG · PNG 지원</small>
    </button>
  `);
}

function contractRecordBlock() {
  if (!state.contractRecordOpen && !isJudge()) {
    return `
      <div class="record-detail cm-user-record-note-v10">
        <div class="record-summary"><strong>계약서 기준 기록이 생성되었습니다.</strong><br>이 기록은 이후 같은 계약서인지 확인하기 위한 기준값입니다.</div>
        <button class="disclosure-button" data-action="toggle-contract-record">기록 기준 설명 보기</button>
      </div>
    `;
  }
  return `
    <div class="record-detail cm-user-record-note-v10">
      <div class="record-summary"><strong>계약서 기준 기록 생성</strong><br>계약서 원문을 노출하지 않고, 나중에 동일 문서인지 확인할 수 있는 기준 기록입니다.</div>
      ${isJudge() ? `<div class="hash-chip">${state.contractHash}</div>` : `<div class="cm-record-ok-chip-v10">기준 기록 생성 완료</div>`}
      <p class="screen-desc small">자세한 기록 정보는 PC 리포트 이후 검증 카드에서 확인할 수 있습니다.</p>
      ${!isJudge() ? `<button class="disclosure-button" data-action="toggle-contract-record">기록 기준 설명 접기</button>` : ""}
    </div>
  `;
}

function lockContractScreen() {
  return wrap(`
    <button class="screen-back-button" data-action="go-upload" type="button" aria-label="계약서 등록으로 돌아가기">←</button>
    ${stepTitleHTML("Step 1 / 4", "기준 계약서 확인")}
    <h2 class="screen-title compact">등록된 계약서를 확인하세요.</h2>
    <p class="screen-desc">이 문서를 기준으로 녹취 설명과 다른 부분을 찾습니다.</p>
    <div class="info-card v69-document-card cm-file-confirm-card">
      <div class="cm-file-card-head">
        <h3>등록된 계약서</h3>
        <button class="cm-file-change-button" data-action="go-upload" type="button">다른 파일로 변경</button>
      </div>
      <div class="info-row"><span>파일명</span><span>${state.contractFile}</span></div>
      <div class="info-row"><span>문서</span><span>15페이지 · PDF</span></div>
    </div>
    <p class="screen-desc small cm-next-step-note">다음 단계에서 계약 상대방을 초대하고, 설명 녹취를 준비합니다.</p>
    <div class="supporting-doc-inline v612-optional-docs cm-pre-doc-note-v9">
      <strong>추가 문서는 나중에 첨부할 수 있습니다.</strong>
      <span>설명 녹취와 계약서 비교가 끝난 뒤, 답변서·확약서 등을 검증 카드에 연결합니다.</span>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="lock-contract">다음: 참여자 초대하기</button>
    </div>
  `);
}

function inviteScreen() {
  const hostReady = state.contractor.verified && state.contractor.consent && !state.contractor.rejected;
  const explainerReady = state.explainer.verified && state.explainer.consent && !state.explainer.rejected;
  const ready = readyToRecord();
  const rowClass = ready ? "ready" : "waiting";
  return wrap(`
    <button class="screen-back-button" data-action="go-lock" type="button" aria-label="계약서 확인으로 돌아가기">←</button>
    ${stepTitleHTML("Step 2 / 4", "참여자 초대 및 동의")}
    <h2 class="screen-title compact">설명자에게 이 코드를 보여주세요.</h2>
    <p class="screen-desc">계약 설명을 들려줄 사람이 입장하면 본인확인과 녹취 동의를 함께 진행합니다.</p>
    <div class="invite-role-note-v8 invite-logic-note-v12">
      <strong>${ready ? "양측 준비가 완료되었습니다." : "설명자가 입장하면 준비 상태가 표시됩니다."}</strong>
      <span>${ready ? "이제 설명 녹취를 시작할 수 있습니다." : "본인확인과 녹취 동의 진행 상황을 함께 확인할 수 있습니다."}</span>
    </div>
    <div class="invite-code-card-v612">
      <span>초대 코드</span>
      <strong>${state.inviteCode}</strong>
      <em>설명자가 이 코드를 입력하거나 QR을 스캔하면 연결됩니다.</em>
    </div>
    <div class="qr-placeholder" aria-label="초대 QR"></div>
    <div class="role-wait-list compact-role-wait invite-state-list-v12 ${rowClass}">
      <div><span>계약 설명을 듣는 사람</span><strong class="${hostReady ? "done" : "wait"}">${hostReady ? "준비 완료" : "동의 필요"}</strong></div>
      <div><span>계약 내용을 설명하는 사람</span><strong class="${explainerReady ? "done" : "wait"}">${explainerReady ? "입장 완료" : "입장 대기 중"}</strong></div>
    </div>
    <div class="bottom-actions one-primary-actions invite-actions-v12">
      <button class="big-action" data-action="go-waiting">양측 준비 상태 확인하기</button>
    </div>
  `);

}

function statusText(done, rejected = false) {
  if (rejected) return `<span class="status-chip fail">거부</span>`;
  if (done) return `<span class="status-chip done">완료</span>`;
  return `<span class="status-chip wait">대기 중</span>`;
}

function statusCard(title, role, person) {
  return `
    <div class="status-card">
      <div class="role-title"><strong>${title}</strong><span class="status-chip ${person.consent ? "done" : person.rejected ? "fail" : "wait"}">${person.rejected ? "거부" : person.consent ? "준비 완료" : "대기"}</span></div>
      <div class="status-list">
        <div class="status-item"><span>본인확인</span>${statusText(person.verified)}</div>
        <div class="status-item"><span>녹취 동의</span>${statusText(person.consent, person.rejected)}</div>
        <div class="status-item"><span>AI 분석 동의</span>${statusText(person.consent, person.rejected)}</div>
      </div>
    </div>
  `;
}

function waitingCommandCard(kind, title, person, description) {
  const complete = person.verified && person.consent && !person.rejected;
  const rejected = person.rejected;
  const stateText = rejected ? "동의 거부" : complete ? "완료" : "진행 중";
  const stateClass = rejected ? "fail" : complete ? "done" : "wait";
  return `
    <section class="waiting-command-card ${stateClass} compact-status-board-v19">
      <div class="waiting-command-head">
        <div>
          <span class="waiting-role-label">${kind}</span>
          <h3>${title}</h3>
        </div>
        <span class="waiting-status-token ${stateClass}">${stateText}</span>
      </div>
      <p>${description}</p>
      <div class="waiting-check-grid">
        <div><span>본인확인</span>${statusText(person.verified, rejected)}</div>
        <div><span>녹취 동의</span>${statusText(person.consent, rejected)}</div>
        <div><span>AI 분석 동의</span>${statusText(person.consent, rejected)}</div>
      </div>
    </section>
  `;
}

function waitingRoomScreen() {
  const ready = readyToRecord();
  const rejected = hasRejection();
  const explainerTitle = state.explainer.verified || state.explainer.consent ? "김설명" : "입장 전";
  return wrap(`
    <button class="screen-back-button" data-action="go-invite" type="button" aria-label="초대 코드로 돌아가기">←</button>
    ${stepTitleHTML("Step 2 / 4", "동의 상태 확인")}
    <h2 class="screen-title compact">양측 준비 상태 확인</h2>
    <p class="screen-desc">계약자와 설명자가 모두 본인확인, 녹취 동의, AI 분석 동의를 완료해야 분석을 시작할 수 있습니다.</p>
    <div class="waiting-control-tower status-board-v19">
      ${waitingCommandCard("계약자", "박주원", state.contractor, state.contractor.consent ? "본인확인과 녹취·AI 분석 동의가 완료되었습니다." : "계약 설명을 듣는 사람의 본인확인과 동의를 확인합니다.")}
      ${waitingCommandCard("설명자", explainerTitle, state.explainer, state.explainer.consent ? "본인확인과 녹취·AI 분석 동의가 완료되었습니다." : "상대방의 입장, 본인확인, 녹취 동의를 기다리고 있습니다.")}
    </div>
    <div class="waiting-state-panel refined waiting-status-summary-v19">
      <div class="waiting-pulse" aria-hidden="true"></div>
      <div><strong>${ready ? "분석 시작 준비 완료" : "상대방 동의 진행 상태를 확인 중입니다"}</strong><p>${ready ? "양측 동의가 완료되었습니다. 설명 녹취를 시작할 수 있습니다." : "이 화면에서 상대방이 어디까지 진행했는지 확인할 수 있습니다. 모든 동의가 완료되면 아래 버튼이 활성화됩니다."}</p></div>
    </div>
    ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
    ${rejected ? `<div class="bottom-actions"><button class="danger-action" data-action="go-failure">거부 상태 확인하기</button></div>` : `
      <div class="bottom-actions one-primary-actions">
        <button class="big-action" data-action="start-recording" ${ready ? "" : "disabled"}>다음: 설명 녹취 시작하기</button>
        ${ready ? "" : `<button class="ghost-inline-action" data-action="go-invite" type="button">초대 코드 다시 보기</button>`}
      </div>
    `}
  `);
}


function inviteCodeScreen() {
  return wrap(`
    <button class="screen-back-button" data-action="go-start" type="button" aria-label="처음으로 돌아가기">←</button>
    ${stepTitleHTML("초대 참여 1 / 3", "초대 코드 입력")}
    <h2 class="screen-title compact">전달받은 초대 코드를 입력하세요.</h2>
    <p class="screen-desc">계약 설명을 함께 확인하기 위해 계약자가 보낸 초대 코드로 계약 방에 참여합니다.</p>
    <div class="invite-code-entry-card-v9" aria-label="초대 코드 입력 예시">
      <label>초대 코드</label>
      <div class="invite-code-input-mock-v9">${state.inviteCode}</div>
      <small>전달받은 초대 코드를 확인한 뒤 계약 방에 참여합니다.</small>
    </div>
    <div class="safe-notice compact-legal-note">참여 후 본인확인과 녹취 동의가 진행됩니다.</div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="submit-invite-code">계약 방 참여하기</button>
    </div>
  `);
}

function inviteeConsentScreen() {
  return wrap(`
    <button class="screen-back-button" data-action="go-invite-code" type="button" aria-label="초대 코드 입력으로 돌아가기">←</button>
    ${stepTitleHTML("초대 참여 2 / 3", "녹취 및 AI 분석 동의")}
    <h2 class="screen-title compact">녹취 참여에 동의해주세요.</h2>
    <p class="screen-desc">이 계약 설명은 녹취되어 기준 계약서 조항과 비교 분석됩니다.</p>
    <div class="legal-consent-list compact-consent-list" aria-label="녹취 참여 동의 항목">
      <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>본인확인에 동의합니다.</strong><small>누가 설명에 참여했는지 기록합니다.</small></div></div>
      <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>계약 설명 녹취에 동의합니다.</strong><small>현장에서 들은 설명을 계약서와 비교합니다.</small></div></div>
      <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>AI 분석에 동의합니다.</strong><small>법률 판단이 아닌 위험 탐지 보조 기능입니다.</small></div></div>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="agree-invitee-recording">동의하고 녹취 참여 준비하기</button>
      <button class="ghost-inline-action danger-link" data-action="go-start">참여하지 않기</button>
    </div>
  `);
}

function inviteeReadyScreen() {
  return wrap(`
    ${stepTitleHTML("초대 참여 2 / 3", "동의 완료", { noBack: true })}
    <h2 class="screen-title compact">녹취 참여 준비가 완료되었습니다.</h2>
    <p class="screen-desc">계약자가 녹취를 시작하면 아래 버튼으로 설명 녹취 화면에 참여할 수 있습니다.</p>
    <div class="waiting-state-panel refined invitee-ready-panel-v9">
      <div class="waiting-pulse" aria-hidden="true"></div>
      <div><strong>계약자 녹취 시작 대기 중</strong><p>계약자가 녹취를 시작하면 설명 녹취 화면에 참여합니다.</p></div>
    </div>
    <div class="status-card-grid">
      <div class="status-card"><div class="role-title"><strong>나</strong><span class="status-chip done">준비 완료</span></div><div class="status-list"><div class="status-item"><span>본인확인</span><span class="status-chip done">완료</span></div><div class="status-item"><span>녹취 동의</span><span class="status-chip done">완료</span></div></div></div>
      <div class="status-card"><div class="role-title"><strong>계약자</strong><span class="status-chip wait">대기</span></div><div class="status-list"><div class="status-item"><span>녹취 시작</span><span class="status-chip wait">대기 중</span></div></div></div>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="go-participant-recording">녹취 참여하기</button>
    </div>
  `);
}

function inviteeRecordingScreen() {
  return wrap(`
    ${stepTitleHTML("초대 참여 3 / 3", "설명 녹취 참여", { noBack: true })}
    <h2 class="screen-title compact">계약 설명 녹취 중입니다.</h2>
    <p class="screen-desc">지금 설명되는 발언은 계약서 조항과 함께 비교 분석됩니다.</p>
    <section class="identity-recording-strip compact-invitee-recording-v9">
      <div class="identity-person"><span>계약자</span><strong>박주원</strong><em>본인확인 완료</em></div>
      <div class="identity-link-line" aria-hidden="true"></div>
      <div class="identity-person"><span>설명 참여자</span><strong>나</strong><em>녹취 동의 완료</em></div>
    </section>
    <div class="recording-indicator"><span class="pulse-dot"></span><span>REC</span></div>
    <div class="timer-label">녹취 시간</div>
    <div class="timer">03:20</div>
    <div class="recording-waveform" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="safe-notice">계약자가 녹취를 종료하면 AI 분석 결과가 생성됩니다.</div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="complete-participant-recording">녹취 참여 완료</button>
    </div>
  `);
}

function inviteeDoneScreen() {
  return wrap(`
    ${stepTitleHTML("초대 참여 완료", "참여 완료", { noBack: true })}
    <h2 class="screen-title compact">녹취 참여가 완료되었습니다.</h2>
    <p class="screen-desc">계약자가 상세 분석 리포트를 열면 위험 항목과 확인 질문을 함께 확인할 수 있습니다.</p>
    <div class="info-card invitee-done-card-v9">
      <h3>기록 상태</h3>
      <div class="mini-row"><span>본인확인</span><span>완료</span></div>
      <div class="mini-row"><span>녹취 동의</span><span>완료</span></div>
      <div class="mini-row"><span>녹취 참여</span><span>완료</span></div>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="secondary-action" data-action="go-start">처음 화면으로 돌아가기</button>
    </div>
  `);
}

function participantStatusCard(role, person, opposite) {
  return `
    <div class="status-card-grid">
      ${statusCard("나", role, person)}
      ${statusCard("상대방", role === "contractor" ? "explainer" : "contractor", opposite)}
    </div>
  `;
}

function participantDeviceScreen(role) {
  const person = role === "contractor" ? state.contractor : state.explainer;
  const opposite = role === "contractor" ? state.explainer : state.contractor;
  const roleLabel = role === "contractor" ? "계약 설명을 듣는 사람" : "계약 내용을 설명하는 사람";
  const oppositeLabel = role === "contractor" ? "상대방" : "상대방";

  if (person.rejected) {
    return wrap(`
      <div class="screen-kicker">${roleLabel}</div>
      <h2 class="screen-title">동의를 거부했습니다.</h2>
      <p class="screen-desc">동의 거부 기록은 남지만 녹취는 생성되지 않습니다.</p>
      ${participantStatusCard(role, person, opposite)}
    `);
  }
  if (!person.verified) {
    return wrap(`
      <div class="screen-kicker">${roleLabel}</div>
      <h2 class="screen-title">본인확인이 필요합니다.</h2>
      <p class="screen-desc">녹취와 분석 기록에 남길 참여자 정보를 확인합니다.</p>
      <div class="info-card">
        <h3>오늘 설명할 계약서</h3>
        <div class="mini-row"><span>계약명</span><span>${state.contractName}</span></div>
        <div class="mini-row"><span>문서</span><span>${state.contractFile}</span></div>
      </div>
      <div class="safe-notice compact-legal-note">확인된 참여자 정보는 이후 녹취 기록과 검증 카드에 연결됩니다.</div>
      <div class="bottom-actions one-primary-actions">
        <button class="big-action" data-action="verify-${role}">모바일 신분증으로 본인확인하기</button>
      </div>
    `);
  }
  if (!person.consent) {
    return wrap(`
      <div class="screen-kicker">${roleLabel}</div>
      <h2 class="screen-title compact">본인확인 및 녹취 동의</h2>
      <p class="screen-desc">계약 설명을 기록하고 AI가 다른 설명을 확인합니다.</p>
      <div class="legal-consent-list compact-consent-list" aria-label="계약 설명 검증 동의 항목">
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>본인확인에 동의합니다.</strong></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>계약 설명 녹취에 동의합니다.</strong></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>AI 분석에 동의합니다.</strong></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>검증 기록 생성에 동의합니다.</strong></div></div>
      </div>
      <div class="safe-notice compact-legal-note">AI 분석은 법률 판단이 아닌 위험 탐지 보조 기능입니다.</div>
      <div class="bottom-actions one-primary-actions">
        <button class="big-action" data-action="consent-${role}">본인확인 후 동의하기</button>
        <button class="ghost-inline-action danger-link" data-action="reject-${role}">동의하지 않음</button>
      </div>
    `);
  }
  return wrap(`
    <div class="screen-kicker">${roleLabel}</div>
    <h2 class="screen-title">참여 준비가 완료되었습니다.</h2>
    <p class="screen-desc">${oppositeLabel}도 준비를 완료하면 녹취를 시작할 수 있습니다.</p>
    ${participantStatusCard(role, person, opposite)}
    <div class="safe-notice">이 화면은 닫아도 됩니다. 준비 완료 상태가 표시됩니다.</div>
  `);
}

function recordingScreen() {
  return wrap(`
    ${stepTitleHTML("Step 3 / 4", "설명 녹취", { noBack: true })}
    <h2 class="screen-title">계약 설명 녹취 중</h2>
    <p class="screen-desc">설명자의 발언을 녹취하고, AI가 기준 계약서 조항과 비교할 준비를 합니다.</p>
    <section class="identity-recording-strip recording-participants-v24">
      <div class="identity-person"><span>계약 설명을 듣는 사람</span><strong>박주원</strong><em>본인확인 완료</em></div>
      <div class="identity-link-line" aria-hidden="true"></div>
      <div class="identity-person"><span>계약 내용을 설명하는 사람</span><strong>김○수</strong><em>본인확인 완료</em></div>
    </section>
    <div class="recording-indicator"><span class="pulse-dot"></span><span>REC</span></div>
    <div class="timer-label">녹취 시간</div>
    <div class="timer">03:20</div>
    <div class="recording-waveform" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="recording-proof-chips compact-recording-proof-v24" aria-label="녹취 검증 상태">
      <span>✓ 양측 동의 완료</span>
      <span>✓ 계약서 연결 완료</span>
      <span class="active">● 설명 녹취 중</span>
    </div>
    <div class="bottom-actions one-primary-actions">
      <button class="big-action" data-action="stop-recording">녹취 종료 후 AI 분석 시작하기</button>
    </div>
  `);
}

const processingSteps = [
  "녹취 내용 정리",
  "계약서 조항 확인",
  "불일치 후보 탐지",
  "검증 리포트 준비"
];

function processingScreen() {
  const list = processingSteps.map((label, idx) => {
    const cls = idx < state.processingIndex ? "done" : idx === state.processingIndex ? "active" : "";
    return `<div class="processing-card ${cls}"><span class="num">${idx + 1}</span><strong>${label}</strong></div>`;
  }).join("");
  return wrap(`
    ${stepTitleHTML("Step 4 / 4", "AI 분석", { noBack: true })}
    <h2 class="screen-title compact">AI가 계약서와 녹취를 대조하고 있습니다.</h2>
    <p class="screen-desc">불일치 후보와 확인 질문을 정리하는 중입니다.</p>
    <div class="progress-bar"><div class="progress-fill" style="width:${state.progress}%"></div></div>
    <div class="processing-list compact-processing-list">${list}</div>
    ${state.progress >= 100 ? `
      <section class="report-bridge-card-v10 report-bridge-card-v13 report-bridge-card-v15">
        <span>상세 분석 완료</span>
        <h3>검증 리포트가 준비되었습니다.</h3>
        <p>계약서·녹취 근거를 넓은 화면에서도 함께 검토할 수 있습니다. PC에서 보려면 리포트 링크를 복사하세요.</p>
      </section>
      <div class="bottom-actions bridge-choice-actions-v15">
        <button class="big-action" data-action="go-mobile-report">모바일에서 리포트 보기</button>
        <button class="secondary-action" data-action="copy-report-link">PC로 볼 링크 복사</button>
        ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
      </div>
    ` : `
      ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
    `}
  `);
}

function riskBadge(mismatch) {
  return `<span class="risk-badge ${mismatch.riskClass}">${mismatch.risk === "높음" ? "최고 위험도 " : "위험도 "}${mismatch.risk}</span>`;
}

function highlightEvidenceText(text, type, id) {
  const markClaim = (value) => `<mark class="cm-highlight claim">${value}</mark>`;
  const markConflict = (value) => `<mark class="cm-highlight conflict">${value}</mark>`;
  const markNotice = (value) => `<mark class="cm-highlight notice">${value}</mark>`;
  if (id === 1 && type === "transcript") return text.replace("보장", markClaim("보장"));
  if (id === 1 && type === "contract") return text.replace("보장하지 않는다", markConflict("보장하지 않는다"));
  if (id === 2 && type === "transcript") return text.replace("해지", markClaim("해지"));
  if (id === 2 && type === "contract") return text.replace("위약금", markConflict("위약금"));
  if (id === 3 && type === "transcript") return text.replace("추가로 들어가는 비용", markClaim("추가로 들어가는 비용"));
  if (id === 3 && type === "contract") return text.replace("별도로 부담", markNotice("별도로 부담"));
  return text;
}

function mismatchCard(mismatch) {
  return `
    <article class="mismatch-card ${mismatch.riskClass}">
      <div class="mismatch-head">
        <div>
          <div class="screen-kicker">불일치 후보 ${mismatch.id}</div>
          <h3>${mismatch.title}</h3>
        </div>
        ${riskBadge(mismatch)}
      </div>
      <div class="evidence-meta">
        <div><span>녹취 위치</span><strong>${mismatch.audioTime}</strong></div>
        <div><span>계약서 위치</span><strong>${mismatch.clause}</strong></div>
      </div>
      <div class="compare-grid">
        <section class="quote-panel audio">
          <span>녹취 발언</span>
          <blockquote>“${highlightEvidenceText(mismatch.transcript, "transcript", mismatch.id)}”</blockquote>
        </section>
        <section class="quote-panel contract">
          <span>계약서 조항</span>
          <blockquote>“${highlightEvidenceText(mismatch.contract, "contract", mismatch.id)}”</blockquote>
        </section>
      </div>
      <div class="ai-reason"><strong>AI 판단 이유</strong><p>${mismatch.reason}</p></div>
    </article>
  `;
}

function evidenceForQuestion(question) {
  return state.mismatches.find((item) => item.id === question.mismatchId) || state.mismatches[0];
}

function questionCard(question) {
  const evidence = evidenceForQuestion(question);
  const lead = question.id === 1;
  if (lead) {
    return `
      <article class="question-card-v611 report-question-card-v25 report-question-card-v26 lead-collision-card-v26">
        <div class="question-card-top">
          <span>충돌 지점 ${question.id} · ${question.short}</span>
          <button class="question-copy-button" data-action="copy-question-${question.id}" type="button" aria-label="충돌 지점 ${question.id} 질문 복사">📋 <em>질문 복사</em></button>
        </div>
        <div class="question-evidence-tags-v25 question-evidence-tags-v26" aria-label="충돌 근거 요약">
          <span>위험도 ${evidence.risk}</span>
          <span>${evidence.clause}</span>
          <span>녹취 ${evidence.audioTime}</span>
        </div>
        <div class="collision-evidence-spotlight-v26" aria-label="대표 설명-계약서 충돌 지점">
          <section>
            <strong>녹취 발언</strong>
            <p>“${highlightEvidenceText(evidence.transcript, "transcript", evidence.id)}”</p>
          </section>
          <section>
            <strong>계약서 조항</strong>
            <p>“${highlightEvidenceText(evidence.contract, "contract", evidence.id)}”</p>
          </section>
        </div>
        <div class="collision-ai-reason-v26">
          <strong>AI 판단</strong>
          <p>${evidence.reason}</p>
        </div>
        <div class="collision-question-v26">
          <span>지금 물어볼 질문</span>
          <p>“${question.text}”</p>
        </div>
      </article>
    `;
  }
  return `
    <article class="question-card-v611 report-question-card-v25 report-question-card-v26">
      <div class="question-card-top">
        <span>충돌 지점 ${question.id}</span>
        <button class="question-copy-button" data-action="copy-question-${question.id}" type="button" aria-label="충돌 지점 ${question.id} 질문 복사">📋 <em>복사</em></button>
      </div>
      <h4>${question.short}</h4>
      <p>${question.text}</p>
      <div class="question-evidence-tags-v25 question-evidence-tags-v26" aria-label="질문 근거 요약">
        <span>위험도 ${evidence.risk}</span>
        <span>${evidence.clause}</span>
        <span>녹취 ${evidence.audioTime}</span>
      </div>
      <details class="question-evidence-detail-v25">
        <summary>AI가 찾은 근거 보기</summary>
        <div class="evidence-detail-grid-v25">
          <div><strong>녹취 발언</strong><p>“${highlightEvidenceText(evidence.transcript, "transcript", evidence.id)}”</p></div>
          <div><strong>계약서 조항</strong><p>“${highlightEvidenceText(evidence.contract, "contract", evidence.id)}”</p></div>
        </div>
        <p class="evidence-reason-v25">${evidence.reason}</p>
      </details>
    </article>
  `;
}

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
