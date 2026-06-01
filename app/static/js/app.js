const boot = window.CONTRACT_MIRROR_BOOT || {};
const bootDevice = ["host", "contractor", "explainer"].includes(boot.initialDevice) ? boot.initialDevice : "host";
const bootStep = ["start", "create", "upload", "lock", "invite", "waiting", "identity", "consent", "recording", "processing", "report", "verify", "failure"].includes(boot.initialStep) ? boot.initialStep : "start";
const bootMode = boot.initialMode === "judge" ? "judge" : "user";

const state = {
  mode: bootMode,
  step: bootStep,
  device: bootDevice,
  sessionId: "CM-20260601-001",
  contractName: "평택 오션 센트럴 비즈 분양 상담",
  contractType: "부동산 분양",
  contractFile: "오션센트럴비즈_분양계약서.pdf",
  contractHash: "sha256:9ab4c7e2f41d8c6378d1a7f04c8e93b22f7a0d51b9c5e3d6a8f0e421b77a3c19",
  transcriptHash: "sha256:1b72fbc9401a2d1147c8d3a29e7f5bca1e5d2f8a90c617e8f43d2b9a74c2e88",
  recordingHash: "sha256:8f2a92c1d41b03f8d91e7ac6b3350f2a7b58d8391c4e6f9a2d1c7b4e9f031a2c",
  reportHash: "sha256:a91c77d03ac9e0b45e6c8f2a19d743b5c8e0d6f4a2b91c7e8d5a0f3c92b6e1d",
  inviteCode: "482 913",
  contractor: { verified: false, consent: false, rejected: false, name: "박○원" },
  explainer: { verified: false, consent: false, rejected: false, name: "김○수" },
  recording: false,
  mismatches: [
    {
      id: 1,
      title: "수익 보장성 발언 ↔ 수익 보장 면책 조항",
      risk: "높음",
      riskClass: "high",
      audioTime: "00:01:24",
      clause: "제5조 2항",
      transcript: "월 수익은 거의 보장된다고 보시면 됩니다.",
      contract: "수익률 및 원금 회수 가능성은 보장하지 않는다.",
      reason: "녹취에서는 수익이 보장되는 것처럼 설명되었지만, 계약서에는 수익률과 원금 회수 가능성을 보장하지 않는다는 면책 조항이 존재합니다."
    },
    {
      id: 2,
      title: "중도해지 가능 발언 ↔ 중도해지 제한 조항",
      risk: "중간",
      riskClass: "medium",
      audioTime: "00:02:07",
      clause: "제8조 1항",
      transcript: "불편하시면 중간에 해지하셔도 큰 문제는 없습니다.",
      contract: "계약 기간 내 임의 해지 시 위약금 및 정산 비용이 발생할 수 있다.",
      reason: "설명은 자유로운 해지가 가능한 것처럼 들리지만, 계약서에는 위약금과 비용 부담 가능성이 명시되어 있습니다."
    },
    {
      id: 3,
      title: "추가 비용 없음 발언 ↔ 별도 비용 부담 조항",
      risk: "확인 필요",
      riskClass: "watch",
      audioTime: "00:02:46",
      clause: "제11조 3항",
      transcript: "추가로 들어가는 비용은 거의 없다고 보시면 됩니다.",
      contract: "관리비, 부대 비용, 제세공과금은 계약자가 별도로 부담한다.",
      reason: "추가 비용이 거의 없다는 설명과 별도 부담 조항 사이에 해석 차이가 발생할 수 있습니다."
    }
  ],
  processingIndex: 0,
  progress: 0,
  processingTimer: null,
  trustOpen: false,
  contractRecordOpen: false,
  events: [
    ["UI_VERSION", "contract_mirror_ui_v6_2_final_polish"],
    ["FLOW", "contract_locked_before_recording"]
  ]
};

const STORAGE_KEY = "contractMirrorV6_2FinalPolishState";

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved && typeof saved === "object") {
    Object.assign(state, saved);
    state.processingTimer = null;
    state.mode = bootMode;
    state.device = bootDevice;
    if (bootStep !== "start") state.step = bootStep;
    if (bootStep === "start" && bootDevice === "host" && bootMode === "user") {
      state.step = "start";
      state.device = "host";
      state.trustOpen = false;
    }
  }
} catch (error) {
  console.warn("Contract Mirror state restore skipped", error);
}

if (bootMode === "judge") {
  state.trustOpen = true;
}

let suppressPersist = false;
const $ = (selector) => document.querySelector(selector);

function persistState() {
  if (suppressPersist) return;
  const snapshot = { ...state, processingTimer: null, trustOpen: false };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    const incoming = JSON.parse(event.newValue);
    const currentDevice = state.device;
    const currentMode = state.mode;
    Object.assign(state, incoming);
    state.device = currentDevice;
    state.mode = currentMode;
    state.processingTimer = null;
    suppressPersist = true;
    render();
    suppressPersist = false;
  } catch (error) {
    console.warn("Contract Mirror state sync skipped", error);
  }
});

function now() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

function addEvent(label, value) {
  state.events.push([`${now()}  ${label}`, value]);
  renderTrustLog();
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

function setStep(step) {
  if (state.processingTimer) {
    clearInterval(state.processingTimer);
    state.processingTimer = null;
  }
  state.step = step;
  if (step === "processing") startProcessing();
  render();
}

function setDevice(device) {
  state.device = device;
  render();
}

function readyToRecord() {
  return state.contractor.verified && state.contractor.consent && state.explainer.verified && state.explainer.consent && !state.contractor.rejected && !state.explainer.rejected;
}

function hasRejection() {
  return state.contractor.rejected || state.explainer.rejected;
}

function phase() {
  if (["start", "create", "upload", "lock"].includes(state.step)) return "contract";
  if (["invite", "waiting", "identity", "consent", "failure", "recording"].includes(state.step)) return "consent";
  return "result";
}

function render() {
  persistState();
  renderShell();
  renderScreen();
  renderTrustLog();
}

function renderShell() {
  document.body.classList.toggle("judge-mode", isJudge());
  document.body.classList.toggle("user-mode", !isJudge());
  document.body.classList.toggle("home-screen", state.step === "start" && state.device === "host");
  document.body.classList.toggle("evidence-screen", ["report", "verify"].includes(state.step) && state.device === "host");
  document.body.classList.toggle("report-screen", state.step === "report" && state.device === "host");
  document.body.classList.toggle("verify-screen", state.step === "verify" && state.device === "host");
  document.body.classList.toggle("judge-dashboard", isJudge());
  document.body.classList.toggle("judge-final-step", isJudge() && state.device === "host" && state.step === "verify");

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
    host: state.step === "start" ? "계약미러" : "계약 설명 세션",
    contractor: "계약 설명을 듣는 사람",
    explainer: "계약 내용을 설명하는 사람"
  };
  $("#deviceLabel").textContent = deviceLabels[state.device];

  const mini = {
    start: "시작",
    create: "세션 만들기",
    upload: "계약서 등록",
    lock: "원본 해시",
    invite: "초대",
    waiting: readyToRecord() ? "녹취 준비 완료" : "상대방 대기",
    identity: "본인확인",
    consent: "동의",
    recording: "녹취 중",
    processing: "분석 중",
    report: "결과",
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
    $("#trustToggleTop").hidden = true;
    $("#controlToggle").hidden = true;
    closeTrust();
    $("#controlPanel").hidden = true;
  }
}

function wrap(content) {
  return `<div class="screen-card">${content}</div>`;
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
    ["분석 리포트 해시", reportDone, reportDone ? "생성 완료" : "생성 준비"],
    ["QR 검증 URL", verifyDone, verifyDone ? "생성 완료" : "검증 카드 생성 준비"],
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
    ["VERIFY CARD", [`session_id=${state.sessionId}`, "contract_hash=matched", "recording_hash=created", "report_hash=created", "qr_status=created"]],
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
  ];

  const finalStage = verifyDone ? `
    <section class="judge-verify-stage judge-final-verify-stage">
      <div class="judge-verify-stage-top">
        <div class="judge-status-pill done">기록 무결성 정상</div>
        <div class="judge-status-pill done">QR 검증 카드 생성 완료</div>
      </div>
      <h2 class="judge-verify-title">계약 설명 검증 카드 생성 완료</h2>
      <p class="judge-verify-desc">계약서 원본, 설명 녹취, AI 분석 리포트, 양측 동의 기록이 하나의 검증 카드로 묶였습니다.</p>
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
        <section class="judge-compare-block"><div class="judge-compare-label">녹취 발언</div><p class="judge-compare-text">“${first.transcript}”</p></section>
        <section class="judge-compare-block"><div class="judge-compare-label">계약서 조항</div><p class="judge-compare-text">“${first.contract}”</p></section>
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
          <div class="judge-kpi-card"><div class="judge-kpi-label">검증성</div><div class="judge-kpi-value">QR 검증 카드 생성 완료</div><div class="judge-kpi-meta">계약서·녹취·리포트 해시 연결</div></div>
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
            <div class="compare-mini-grid"><div><strong>일반 녹취</strong><span>계약서 기준·조항 연결·사후 검증이 불명확</span></div><div><strong>계약미러</strong><span>본인확인·해시·AI 리포트·QR 검증으로 연결</span></div></div>
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
      verify: verifyScreen,
      failure: failureScreen
    };
    screen.innerHTML = (screens[state.step] || startScreen)();
  }
  screen.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleAction));
}

function startScreen() {
  return wrap(`
    <div class="screen-kicker">계약 현장용 모바일 검증 플로우</div>
    <h2 class="screen-title trust-title">말로 들은 설명과 서명할 조항이 다를 때,<br>계약미러가 계약 전에 잡아냅니다.</h2>
    <p class="screen-desc">계약미러는 계약 현장의 설명, 동의, 녹취를 하나의 검증 세션으로 묶고, AI가 계약서 조항과 다른 설명을 찾아냅니다.</p>
    <div class="risk-scenario-card" aria-label="위험 상황 예시">
      <div class="scenario-label">위험 상황 예시</div>
      <div class="scenario-quote verbal"><span>말로 들은 설명</span><strong>“월 수익은 거의 보장됩니다.”</strong></div>
      <div class="scenario-quote document"><span>계약서 조항</span><strong>“수익률 및 원금 회수 가능성은 보장하지 않는다.”</strong></div>
      <p>녹취만으로는 부족합니다. 누가, 언제, 어떤 계약서에 대해, 어떤 설명을 들었는지까지 함께 검증되어야 합니다.</p>
    </div>
    <div class="home-flow-guide compact" aria-label="진행 방식">
      <div class="flow-guide-title">계약미러 검증 흐름</div>
      <div class="flow-guide-item"><span>1</span><strong>누가 참여하는지 확인</strong><em>계약자·설명자 본인확인</em></div>
      <div class="flow-guide-item"><span>2</span><strong>무엇에 동의하는지 확인</strong><em>녹취·AI 분석·검증 기록 동의</em></div>
      <div class="flow-guide-item"><span>3</span><strong>어떤 설명을 들었는지 기록</strong><em>계약 설명 녹취 세션 생성</em></div>
      <div class="flow-guide-item"><span>4</span><strong>검증 카드로 봉인</strong><em>계약서·녹취·리포트 해시 연결</em></div>
    </div>
    <div class="bottom-actions">
      <button class="big-action" data-action="go-create">계약 설명 검증 시작하기</button>
      <button class="secondary-action" data-action="join-contractor">초대번호로 참여하기</button>
    </div>
  `);
}

function createRoomScreen() {
  return wrap(`
    <div class="screen-kicker">계약 설명 세션 만들기</div>
    <h2 class="screen-title">오늘 검증할 계약 설명 세션을 생성합니다.</h2>
    <p class="screen-desc">계약서와 녹취 기록을 하나의 세션 ID로 연결합니다.</p>
    <div class="form-grid">
      <div class="field"><label>계약명</label><input value="${state.contractName}" readonly /></div>
      <div class="field"><label>계약 유형</label><select disabled><option>${state.contractType}</option></select></div>
    </div>
    <div class="bottom-actions">
      <button class="big-action" data-action="create-session">다음: 계약서 등록</button>
      <button class="secondary-action" data-action="go-start">이전</button>
    </div>
  `);
}

function uploadContractScreen() {
  return wrap(`
    <div class="screen-kicker">계약서 확인</div>
    <h2 class="screen-title">계약서를 먼저 등록합니다.</h2>
    <p class="screen-desc">AI가 이 계약서를 기준으로 설명 내용을 비교합니다.</p>
    <div class="upload-box">
      <div class="upload-icon">↥</div>
      <strong>PDF 또는 이미지 파일</strong>
      <p>계약 설명 기준으로 사용할 문서를 등록합니다.</p>
      <span class="file-chip">${state.contractFile}</span>
    </div>
    <div class="bottom-actions">
      <button class="big-action" data-action="upload-contract">기준 계약서 등록하기</button>
      <button class="secondary-action" data-action="go-create">이전</button>
    </div>
  `);
}

function contractRecordBlock() {
  if (!state.contractRecordOpen && !isJudge()) {
    return `
      <div class="record-detail">
        <div class="record-summary"><strong>계약서 원본 해시가 생성되었습니다.</strong><br>이 해시는 이후 같은 계약서인지 확인하기 위한 원본 기준값입니다.</div>
        <button class="disclosure-button" data-action="toggle-contract-record">원본 기준값 설명 보기</button>
      </div>
    `;
  }
  return `
    <div class="record-detail">
      <div class="record-summary"><strong>계약서 원본 해시 생성</strong><br>이 값은 계약서 원문이 아니라, 이후 동일 문서 여부를 확인하기 위한 기준값입니다.</div>
      <div class="hash-chip">${state.contractHash}</div>
      <p class="screen-desc small">심사위원 모드에서는 전체 해시와 세션 연결 상태를 확인할 수 있습니다.</p>
      ${!isJudge() ? `<button class="disclosure-button" data-action="toggle-contract-record">원본 기준값 설명 접기</button>` : ""}
    </div>
  `;
}

function lockContractScreen() {
  return wrap(`
    <div class="screen-kicker">계약서 확인</div>
    <h2 class="screen-title compact">이 계약서를 기준으로 설명을 기록합니다.</h2>
    <p class="screen-desc">녹취 후 AI는 이 문서와 설명 내용을 비교합니다.</p>
    <div class="info-card">
      <h3>오늘 설명할 계약서</h3>
      <div class="info-row"><span>계약명</span><span>${state.contractName}</span></div>
      <div class="info-row"><span>파일명</span><span>${state.contractFile}</span></div>
      <div class="info-row"><span>등록 시각</span><span>2026.05.31 21:42</span></div>
    </div>
    <div class="info-card">
      <h3>계약서 원본 해시</h3>
      ${contractRecordBlock()}
    </div>
    <div class="bottom-actions">
      <button class="big-action" data-action="lock-contract">이 계약서를 기준으로 설명을 기록합니다</button>
      <button class="secondary-action" data-action="go-upload">이전</button>
    </div>
  `);
}

function inviteScreen() {
  return wrap(`
    <div class="screen-kicker">상대방 초대</div>
    <h2 class="screen-title">상대방에게 초대번호를 알려주세요.</h2>
    <p class="screen-desc">계약자와 설명자는 각자 휴대폰에서 본인확인과 동의를 진행합니다.</p>
    <div class="invite-code">${state.inviteCode}</div>
    <div class="qr-placeholder" aria-label="QR placeholder"></div>
    <div class="safe-notice">이 화면에는 상대방의 완료 여부만 표시됩니다. 본인확인과 동의는 각자 휴대폰에서 진행합니다.</div>
    <div class="bottom-actions">
      <button class="big-action" data-action="go-waiting">준비 상태 확인하기</button>
      <button class="secondary-action" data-action="go-lock">이전</button>
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

function waitingRoomScreen() {
  const ready = readyToRecord();
  const rejected = hasRejection();
  return wrap(`
    <div class="screen-kicker">참여자 동의 상태</div>
    <h2 class="screen-title compact">양쪽의 본인확인과 녹취 동의를 기다리고 있습니다.</h2>
    <p class="screen-desc">시스템은 정상적으로 연결되어 있으며, 상대방 완료 상태가 이 화면에 표시됩니다.</p>
    <div class="waiting-state-panel">
      <div class="waiting-pulse" aria-hidden="true"></div>
      <div><strong>${ready ? "녹취 시작 준비 완료" : "상대방 응답 대기 중"}</strong><p>${ready ? "양측 동의가 완료되었습니다. 녹취를 시작할 수 있습니다." : "초대번호가 유효하며 세션이 열려 있습니다."}</p></div>
    </div>
    <div class="info-card">
      <h3>계약 설명 세션</h3>
      <div class="mini-row"><span>세션 ID</span><span>${state.sessionId}</span></div>
      <div class="mini-row"><span>기준 계약서</span><span>${state.contractFile}</span></div>
      <div class="mini-row"><span>계약서 상태</span><span>원본 해시 생성 완료</span></div>
    </div>
    <div class="status-card-grid">
      ${statusCard("계약 설명을 듣는 사람", "contractor", state.contractor)}
      ${statusCard("계약 내용을 설명하는 사람", "explainer", state.explainer)}
    </div>
    ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
    ${rejected ? `<div class="bottom-actions"><button class="danger-action" data-action="go-failure">거부 상태 확인하기</button></div>` : `
      <div class="bottom-actions">
        <button class="big-action" data-action="start-recording" ${ready ? "" : "disabled"}>녹취 시작하기</button>
        <button class="secondary-action" data-action="go-invite">이전</button>
      </div>
    `}
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
      <p class="screen-desc">동의 거부 기록은 세션에 남지만, 녹취는 생성되지 않습니다.</p>
      ${participantStatusCard(role, person, opposite)}
    `);
  }
  if (!person.verified) {
    return wrap(`
      <div class="screen-kicker">${roleLabel}</div>
      <h2 class="screen-title">본인확인이 필요합니다.</h2>
      <p class="screen-desc">누가 설명했고, 누가 들었는지 확인하기 위한 단계입니다.</p>
      <div class="info-card">
        <h3>오늘 설명할 계약서</h3>
        <div class="mini-row"><span>계약명</span><span>${state.contractName}</span></div>
        <div class="mini-row"><span>문서</span><span>${state.contractFile}</span></div>
      </div>
      <div class="bottom-actions">
        <button class="big-action" data-action="verify-${role}">모바일 신분증으로 본인확인하기</button>
      </div>
    `);
  }
  if (!person.consent) {
    return wrap(`
      <div class="screen-kicker">${roleLabel}</div>
      <h2 class="screen-title compact">계약 설명 기록에 동의해주세요.</h2>
      <p class="screen-desc">이 계약서를 기준으로 설명을 녹음하고, AI가 계약서와 다른 부분을 찾습니다.</p>
      <div class="legal-consent-list" aria-label="계약 설명 검증 동의 항목">
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>모바일 신분증 기반 본인확인에 동의합니다.</strong><p>누가 설명했고 누가 들었는지 확인하기 위한 단계입니다.</p></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>계약 설명 녹취에 동의합니다.</strong><p>계약 전 설명 내용을 사후 확인 가능한 기록으로 남깁니다.</p></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>계약서와 녹취 내용의 AI 분석에 동의합니다.</strong><p>AI가 계약서 조항과 다른 설명을 위험 후보로 표시합니다.</p></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>계약서·녹취·분석 리포트의 검증 기록 생성에 동의합니다.</strong><p>나중에 같은 세션 기록인지 확인할 수 있도록 해시 기준값을 생성합니다.</p></div></div>
        <div class="legal-consent-item"><span class="consent-box">✓</span><div><strong>AI 분석은 법률 판단이 아닌 위험 탐지 보조 수단임을 확인했습니다.</strong><p>최종 법률 판단은 전문가 검토가 필요합니다.</p></div></div>
      </div>
      <div class="bottom-actions">
        <button class="big-action" data-action="consent-${role}">모바일 신분증으로 확인하고 동의하기</button>
        <button class="danger-action" data-action="reject-${role}">동의하지 않음</button>
      </div>
    `);
  }
  return wrap(`
    <div class="screen-kicker">${roleLabel}</div>
    <h2 class="screen-title">참여 준비가 완료되었습니다.</h2>
    <p class="screen-desc">${oppositeLabel}도 준비를 완료하면 녹취를 시작할 수 있습니다.</p>
    ${participantStatusCard(role, person, opposite)}
    <div class="safe-notice">이 화면은 닫아도 됩니다. 계약 설명 세션에는 준비 완료 상태가 표시됩니다.</div>
  `);
}

function recordingScreen() {
  return wrap(`
    <div class="screen-kicker">녹취 중</div>
    <h2 class="screen-title">계약 설명을 기록 중입니다.</h2>
    <div class="recording-indicator"><span class="pulse-dot"></span><span>REC</span></div>
    <div class="timer-label">녹취 길이</div>
    <div class="timer">03:20</div>
    <div class="info-card">
      <h3>기록 기준</h3>
      <div class="mini-row"><span>기준 계약서</span><span>${state.contractFile}</span></div>
      <div class="mini-row"><span>참여자</span><span>${state.contractor.name} · ${state.explainer.name}</span></div>
    </div>
    <p class="disclaimer">설명이 끝났을 때만 눌러주세요. 종료 후 계약서와 설명을 비교합니다.</p>
    <div class="bottom-actions">
      <button class="big-action" data-action="stop-recording">녹취 종료하기</button>
    </div>
  `);
}

const processingSteps = [
  "설명 내용을 정리하는 중",
  "계약서 내용을 확인하는 중",
  "서로 다른 부분을 찾는 중",
  "결과를 쉽게 정리하는 중",
  "검증 카드와 리포트 해시를 만드는 중"
];

function processingScreen() {
  const list = processingSteps.map((label, idx) => {
    const cls = idx < state.processingIndex ? "done" : idx === state.processingIndex ? "active" : "";
    return `<div class="processing-card ${cls}"><span class="num">${idx + 1}</span><strong>${label}</strong></div>`;
  }).join("");
  return wrap(`
    <div class="screen-kicker">AI 분석 중</div>
    <h2 class="screen-title compact">AI가 계약서와 녹취를 대조하고 있습니다.</h2>
    <p class="screen-desc">15페이지 계약서와 3분 20초 녹취를 기준으로 불일치 후보를 찾는 중입니다.</p>
    <div class="progress-bar"><div class="progress-fill" style="width:${state.progress}%"></div></div>
    <div class="processing-list">${list}</div>
    ${state.progress >= 100 ? `
      <div class="strong-notice success">분석이 완료되었습니다. 결과 화면에서 다른 부분과 근거를 확인할 수 있습니다.</div>
      <div class="bottom-actions">
        <button class="big-action" data-action="go-report">분석 결과 보기</button>
        ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
      </div>
    ` : `
      ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
    `}
  `);
}

function riskBadge(mismatch) {
  return `<span class="risk-badge ${mismatch.riskClass}">위험도 ${mismatch.risk}</span>`;
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
          <blockquote>“${mismatch.transcript}”</blockquote>
        </section>
        <section class="quote-panel contract">
          <span>계약서 조항</span>
          <blockquote>“${mismatch.contract}”</blockquote>
        </section>
      </div>
      <div class="ai-reason"><strong>AI 판단 이유</strong><p>${mismatch.reason}</p></div>
    </article>
  `;
}

function reportScreen() {
  const cards = state.mismatches.map(mismatchCard).join("");
  return wrap(`
    <div class="desktop-evidence-layout">
      <section class="evidence-main-column">
        <div class="screen-kicker">AI 불일치 분석 결과</div>
        <div class="evidence-hero">
          <div>
            <span class="risk-badge high">최고 위험도 높음</span>
            <h2>계약 설명과 계약서 조항이 서로 다르게 해석될 수 있는 고위험 항목이 발견되었습니다.</h2>
            <p>녹취 발언과 계약서 조항을 나란히 비교해, 어떤 부분이 충돌하는지 확인하세요.</p>
          </div>
          <div class="evidence-score">
            <strong>3</strong>
            <span>건 탐지</span>
          </div>
        </div>
        <div class="mismatch-list">${cards}</div>
      </section>
      <aside class="evidence-side-column">
        <div class="audit-card sticky-card">
          <h3>분석 리포트 요약</h3>
          <div class="audit-row"><span>세션 ID</span><strong>${state.sessionId}</strong></div>
          <div class="audit-row"><span>기준 계약서</span><strong>${state.contractFile}</strong></div>
          <div class="audit-row"><span>녹취 길이</span><strong>03:20</strong></div>
          <div class="audit-row"><span>최고 위험도</span><strong class="danger-text">높음</strong></div>
          <div class="audit-row"><span>분석 리포트 해시</span><strong>생성 완료</strong></div>
          <div class="audit-row"><span>검증 카드</span><strong>생성 준비 완료</strong></div>
          <p class="audit-note">계약미러는 법률 판단을 대신하지 않습니다. 서명 전 확인해야 할 설명·조항 불일치 후보를 먼저 제시합니다.</p>
          <div class="bottom-actions evidence-actions result-actions-v6">
            <button class="big-action" data-action="go-verify">검증 카드 생성하기</button>
            <button class="secondary-action" data-action="save-report">검증 리포트 저장하기</button>
            <button class="secondary-action" data-action="request-reexplain">재설명 요청하기</button>
            ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
          </div>
        </div>
      </aside>
    </div>
  `);
}

function verifyScreen() {
  return wrap(`
    <div class="verify-audit-layout trust-seal-verify">
      <section class="verify-audit-main">
        <div class="screen-kicker">검증 카드 생성 완료</div>
        <div class="verify-card-hero trust-seal-hero">
          <div>
            <span class="risk-badge verified">기록 무결성 정상</span>
            <h2>계약 설명 검증 카드 생성 완료</h2>
            <p>계약서 원본, 설명 녹취, AI 분석 리포트, 양측 동의 기록이 하나의 검증 카드로 묶였습니다.</p>
          </div>
        </div>
        <section class="verify-status-card audit-strong trust-seal-card">
          <h3>계약 설명 세션 증거 패키지</h3>
          <div class="verify-row"><span>계약 ID</span><strong>${state.sessionId}</strong></div>
          <div class="verify-row"><span>계약자 본인확인</span><strong>완료</strong></div>
          <div class="verify-row"><span>설명자 본인확인</span><strong>완료</strong></div>
          <div class="verify-row"><span>계약 내용 위험 탐지</span><strong class="danger-text">높음 1건 / 중간 2건</strong></div>
          <div class="verify-row"><span>계약서 해시</span><strong>생성 완료</strong></div>
          <div class="verify-row"><span>녹취 해시</span><strong>생성 완료</strong></div>
          <div class="verify-row"><span>리포트 해시</span><strong>생성 완료</strong></div>
          <div class="verify-row"><span>기록 무결성</span><strong>정상</strong></div>
          <div class="verify-row"><span>QR 검증</span><strong>가능</strong></div>
          <div class="verify-row"><span>검증 데이터 구조</span><strong>구성 완료</strong></div>
        </section>
        <section class="verify-status-card hash-view judge-only-inline">
          <h3>기술 검증 정보</h3>
          <div class="hash-line"><span>contract_hash</span><code>${state.contractHash}</code></div>
          <div class="hash-line"><span>recording_hash</span><code>${state.recordingHash}</code></div>
          <div class="hash-line"><span>report_hash</span><code>${state.reportHash}</code></div>
          <div class="hash-line"><span>Demo Tx Hash</span><code>0x7a91...c4e2 · data structure validated</code></div>
        </section>
        <div class="safe-notice">이 QR은 계약서·녹취·AI 분석 리포트가 같은 세션에 연결되어 있음을 확인하기 위한 검증 카드입니다.</div>
      </section>
      <aside class="verify-qr-column">
        <div class="qr-large real-qr" aria-label="사후 검증용 QR 코드"><span>CM</span></div>
        <div class="qr-small-label">사후 검증용 QR</div>
        <div class="qr-url">contract-mirror.kr/verify/CM-20260601-001</div>
        <div class="qr-caption">검증 카드 확인하기</div>
        <div class="bottom-actions evidence-actions">
          ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
          <button class="secondary-action" data-action="go-start">처음으로</button>
        </div>
      </aside>
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
      render();
    }
    if (state.progress >= 100 || state.processingIndex >= processingSteps.length) {
      clearInterval(state.processingTimer);
      state.processingTimer = null;
      state.progress = 100;
      render();
    }
  }, 850);
}

function handleAction(e) {
  const action = e.currentTarget.dataset.action;
  const roleAction = (prefix) => action.startsWith(prefix) ? action.replace(prefix, "") : null;
  const route = {
    "go-start": () => setStep("start"),
    "go-create": () => setStep("create"),
    "go-upload": () => setStep("upload"),
    "go-lock": () => setStep("lock"),
    "go-invite": () => setStep("invite"),
    "join-contractor": () => { state.device = "contractor"; setStep("identity"); },
    "go-waiting": () => setStep("waiting"),
    "go-failure": () => setStep("failure"),
    "go-report": () => { addEvent("REPORT_VIEWED", `report_hash=${state.reportHash}`); setStep("report"); },
    "go-verify": () => { addEvent("VERIFY_URL_CREATED", `/verify/${state.sessionId}`); setStep("verify"); },
    "save-report": () => { addEvent("REPORT_SAVE_REQUESTED", `report_hash=${state.reportHash}`); render(); },
    "request-reexplain": () => { addEvent("RE_EXPLANATION_REQUESTED", `session_id=${state.sessionId}`); render(); },
    "view-host": () => { state.device = "host"; setStep(hasRejection() ? "failure" : "waiting"); },
    "view-contractor": () => { state.device = "contractor"; render(); },
    "view-explainer": () => { state.device = "explainer"; render(); },
    "create-session": () => { addEvent("SESSION_CREATED", `session_id=${state.sessionId}`); setStep("upload"); },
    "upload-contract": () => { addEvent("CONTRACT_UPLOADED", `file=${state.contractFile}`); setStep("lock"); },
    "lock-contract": () => { addEvent("CONTRACT_HASH_CREATED", `contract_hash=${state.contractHash}`); addEvent("CONTRACT_STATUS", "locked_before_recording"); setStep("invite"); },
    "toggle-contract-record": () => { state.contractRecordOpen = !state.contractRecordOpen; render(); },
    "start-recording": () => { if (readyToRecord()) { addEvent("RECORDING_STARTED", "all_identity_and_consent_completed=true"); state.recording = true; setStep("recording"); } },
    "stop-recording": () => { addEvent("RECORDING_HASH_CREATED", `recording_hash=${state.recordingHash}, duration=03:20`); state.recording = false; setStep("processing"); },
    "open-trust": () => openTrust(),
    "reset-consents": () => { state.contractor.consent = false; state.explainer.consent = false; state.contractor.rejected = false; state.explainer.rejected = false; addEvent("SESSION_RESET", "consent_status=reset"); setStep("waiting"); }
  };
  if (route[action]) return route[action]();

  const verifyRole = roleAction("verify-");
  if (verifyRole) {
    state[verifyRole].verified = true;
    addEvent("PARTICIPANT_VERIFIED", `${verifyRole}=Demo Verified`);
    render();
    return;
  }
  const consentRole = roleAction("consent-");
  if (consentRole) {
    state[consentRole].consent = true;
    state[consentRole].rejected = false;
    addEvent("CONSENT_COMPLETED", `${consentRole}_recording=true, ai_analysis=true, hash_record=true`);
    render();
    return;
  }
  const rejectRole = roleAction("reject-");
  if (rejectRole) {
    state[rejectRole].consent = false;
    state[rejectRole].rejected = true;
    addEvent("CONSENT_REJECTED", `${rejectRole}_recording=false, ai_analysis=false`);
    render();
  }
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
    ["VERIFY CARD", [`session_id=${state.sessionId}`, "contract_hash=matched", "recording_hash=created", "report_hash=created", "qr_status=created"]],
    ["CHAIN", ["anchor_status=simulated", "integration_status=ready_for_chain_anchor"]],
    ["EVENTS", state.events.map(([k, v]) => `${k} :: ${v}`).slice(-14)]
  ];
  panel.innerHTML = blocks.map(([title, lines]) => `
    <div class="log-block"><strong>${title}</strong>${lines.map((line) => `<div class="log-line ${logLineClass(line)}"><span>›</span> ${line}</div>`).join("")}</div>
  `).join("");
}

function setupControls() {
  $("#workspace").classList.add("trust-closed");
  $("#trustToggleTop").addEventListener("click", () => state.trustOpen ? closeTrust() : openTrust());
  $("#trustClose").addEventListener("click", closeTrust);
  $("#controlToggle").addEventListener("click", () => $("#controlPanel").hidden = false);
  $("#controlClose").addEventListener("click", () => $("#controlPanel").hidden = true);
  document.querySelectorAll("[data-control]").forEach((btn) => btn.addEventListener("click", () => {
    const c = btn.dataset.control;
    if (c === "view-host") { state.device = "host"; setStep(hasRejection() ? "failure" : "waiting"); }
    if (c === "view-contractor") setDevice("contractor");
    if (c === "view-explainer") setDevice("explainer");
    if (c === "complete-contractor-id") { state.contractor.verified = true; addEvent("PARTICIPANT_VERIFIED", "contractor=Demo Verified"); render(); }
    if (c === "complete-explainer-id") { state.explainer.verified = true; addEvent("PARTICIPANT_VERIFIED", "explainer=Demo Verified"); render(); }
    if (c === "complete-contractor-consent") { state.contractor.consent = true; state.contractor.rejected = false; addEvent("CONSENT_COMPLETED", "contractor_recording=true"); render(); }
    if (c === "complete-explainer-consent") { state.explainer.consent = true; state.explainer.rejected = false; addEvent("CONSENT_COMPLETED", "explainer_recording=true"); render(); }
    if (c === "reject-explainer") { state.explainer.consent = false; state.explainer.rejected = true; addEvent("CONSENT_REJECTED", "explainer_recording=false, ai_analysis=false"); state.device = "host"; setStep("failure"); }
    if (c === "processing-done") {
      if (state.processingTimer) { clearInterval(state.processingTimer); state.processingTimer = null; }
      state.progress = 100;
      state.processingIndex = processingSteps.length;
      addEvent("PROCESSING_COMPLETED", "presenter_control=true");
      if (state.step !== "processing") state.step = "processing";
      render();
    }
    if (c === "reset-all") {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = isJudge() ? "/judge?v=61" : "/?v=61";
    }
  }));
}

setupControls();
if (isJudge()) {
  state.trustOpen = true;
}
render();
