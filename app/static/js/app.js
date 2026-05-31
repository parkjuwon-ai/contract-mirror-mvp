const boot = window.CONTRACT_MIRROR_BOOT || {};
const bootDevice = ["host", "contractor", "explainer"].includes(boot.initialDevice) ? boot.initialDevice : "host";
const bootStep = ["start", "create", "upload", "lock", "invite", "waiting", "identity", "consent", "recording", "processing", "report", "verify", "failure"].includes(boot.initialStep) ? boot.initialStep : "start";
const bootMode = boot.initialMode === "judge" ? "judge" : "user";

const state = {
  mode: bootMode,
  step: bootStep,
  device: bootDevice,
  sessionId: "CM-2026-000012",
  contractName: "평택 오션 센트럴 비즈 분양 상담",
  contractType: "부동산 분양",
  contractFile: "분양계약서_초안.pdf",
  contractHash: "sha256:9ab4c7e2f41d8c63...",
  transcriptHash: "sha256:1b72fbc9401a2d11...",
  recordingHash: "sha256:8f2a92c1d41b03f8...",
  reportHash: "sha256:a91c77d03ac9e0b4...",
  inviteCode: "482 913",
  contractor: { verified: false, consent: false, rejected: false, name: "박○원" },
  explainer: { verified: false, consent: false, rejected: false, name: "김○수" },
  recording: false,
  processingIndex: 0,
  progress: 0,
  processingTimer: null,
  trustOpen: false,
  contractRecordOpen: false,
  events: [
    ["UI_VERSION", "contract_mirror_ui_v5_user_judge_separated"],
    ["FLOW", "contract_locked_before_recording"]
  ]
};

const STORAGE_KEY = "contractMirrorV5State";

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved && typeof saved === "object") {
    Object.assign(state, saved);
    state.processingTimer = null;
    state.mode = bootMode;
    state.device = bootDevice;
    if (bootStep !== "start") state.step = bootStep;
  }
} catch (error) {
  console.warn("Contract Mirror state restore skipped", error);
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
    host: state.step === "start" ? "계약미러" : "계약 설명방",
    contractor: "계약 설명을 듣는 사람",
    explainer: "계약 내용을 설명하는 사람"
  };
  $("#deviceLabel").textContent = deviceLabels[state.device];

  const mini = {
    start: "시작",
    create: "방 만들기",
    upload: "계약서 등록",
    lock: "계약서 확인",
    invite: "초대",
    waiting: readyToRecord() ? "녹취 준비 완료" : "상대방 대기",
    identity: "본인확인",
    consent: "동의",
    recording: "녹취 중",
    processing: "분석 중",
    report: "결과",
    verify: "기록 확인",
    failure: "진행 불가"
  };
  $("#userStatusMini").textContent = mini[state.step] || "진행 중";

  if (isJudge()) {
    $("#trustToggleTop").hidden = false;
    $("#controlToggle").hidden = false;
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

function renderScreen() {
  const screen = $("#screen");
  if (state.device !== "host") {
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
  return `
    <div class="home-hero">
      <div>
        <div class="screen-kicker">안전한 계약의 시작</div>
        <h2 class="screen-title">계약서와 다른 설명,<br>나중에 혼자 찾기 어렵습니다.</h2>
        <p class="screen-desc">계약미러가 설명을 기록하고,<br>계약서와 다른 부분을 먼저 찾아드립니다.</p>
      </div>
      <div class="home-benefits" aria-label="계약미러 핵심 기능">
        <div class="home-benefit"><span>✓</span>계약서를 먼저 확인합니다</div>
        <div class="home-benefit"><span>✓</span>양쪽 본인확인과 동의 후 녹취합니다</div>
        <div class="home-benefit"><span>✓</span>AI가 말과 문서를 비교합니다</div>
      </div>
      <div class="bottom-actions">
        <button class="big-action" data-action="go-create">+ 새 계약 설명방 만들기</button>
        <button class="secondary-action" data-action="join-contractor">초대번호로 참여하기</button>
      </div>
      ${isJudge() ? `<div class="mode-note">심사위원 모드에서는 [신뢰 로그 보기]와 [시연 제어]로 내부 상태를 확인할 수 있습니다.</div>` : ""}
    </div>
  `;
}

function createRoomScreen() {
  return wrap(`
    <div class="screen-kicker">계약 설명방 만들기</div>
    <h2 class="screen-title">오늘 설명할 계약을 입력합니다.</h2>
    <p class="screen-desc">계약명과 유형만 먼저 정하면 됩니다.</p>
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
      <p>데모에서는 샘플 계약서를 등록합니다.</p>
      <span class="file-chip">${state.contractFile}</span>
    </div>
    <div class="bottom-actions">
      <button class="big-action" data-action="upload-contract">샘플 계약서 등록하기</button>
      <button class="secondary-action" data-action="go-create">이전</button>
    </div>
  `);
}

function contractRecordBlock() {
  if (!state.contractRecordOpen && !isJudge()) {
    return `
      <div class="record-detail">
        <div class="record-summary">변경 확인용 기록이 만들어졌습니다.<br>나중에 같은 계약서인지 확인할 때 사용됩니다.</div>
        <button class="disclosure-button" data-action="toggle-contract-record">자세한 기록 보기</button>
      </div>
    `;
  }
  return `
    <div class="record-detail">
      <div class="record-summary">변경 확인용 기록이 만들어졌습니다.</div>
      <div class="hash-chip">${state.contractHash}</div>
      <p class="screen-desc small">원문이 아니라 나중에 같은 계약서인지 확인하기 위한 기록값입니다.</p>
      ${!isJudge() ? `<button class="disclosure-button" data-action="toggle-contract-record">자세한 기록 접기</button>` : ""}
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
      <h3>변경 확인용 기록</h3>
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
    <p class="screen-desc">상대방은 자신의 휴대폰에서 본인확인과 동의를 완료합니다.</p>
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
  return `<span class="status-chip wait">기다리는 중</span>`;
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
    <div class="screen-kicker">녹취 준비</div>
    <h2 class="screen-title compact">양쪽이 모두 준비되면 녹취를 시작합니다.</h2>
    <p class="screen-desc">본인확인과 동의는 각자 휴대폰에서 완료합니다.</p>
    <div class="info-card">
      <h3>오늘 설명할 계약서</h3>
      <div class="mini-row"><span>파일명</span><span>${state.contractFile}</span></div>
      <div class="mini-row"><span>상태</span><span>계약서 확인 완료</span></div>
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
      <div class="consent-card"><span class="consent-check">1</span><div><strong>설명 내용을 녹음합니다</strong><p>계약 전 설명을 나중에 다시 확인하기 위해 녹음합니다.</p></div></div>
      <div class="consent-card"><span class="consent-check">2</span><div><strong>AI가 계약서와 비교합니다</strong><p>녹취 내용과 계약서 조항이 다른 부분이 있는지 찾습니다.</p></div></div>
      <div class="consent-card"><span class="consent-check">3</span><div><strong>변경 확인용 기록을 남깁니다</strong><p>나중에 기록이 바뀌지 않았는지 확인하기 위한 값입니다.</p></div></div>
      <p class="disclaimer">AI 분석은 법적 판단이 아니라 참고용 결과입니다.</p>
      <div class="bottom-actions">
        <button class="big-action" data-action="consent-${role}">확인했고 참여할게요</button>
        <button class="danger-action" data-action="reject-${role}">동의하지 않겠습니다</button>
      </div>
    `);
  }
  return wrap(`
    <div class="screen-kicker">${roleLabel}</div>
    <h2 class="screen-title">참여 준비가 완료되었습니다.</h2>
    <p class="screen-desc">${oppositeLabel}도 준비를 완료하면 녹취를 시작할 수 있습니다.</p>
    ${participantStatusCard(role, person, opposite)}
    <div class="safe-notice">이 화면은 닫아도 됩니다. 계약 설명방에는 준비 완료 상태가 표시됩니다.</div>
  `);
}

function recordingScreen() {
  return wrap(`
    <div class="screen-kicker">녹취 중</div>
    <h2 class="screen-title">계약 설명을 기록 중입니다.</h2>
    <div class="recording-indicator"><span class="pulse-dot"></span><span>REC</span></div>
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
  "변경 확인용 기록을 만드는 중"
];

function processingScreen() {
  const list = processingSteps.map((label, idx) => {
    const cls = idx < state.processingIndex ? "done" : idx === state.processingIndex ? "active" : "";
    return `<div class="processing-card ${cls}"><span class="num">${idx + 1}</span><strong>${label}</strong></div>`;
  }).join("");
  return wrap(`
    <div class="screen-kicker">AI 분석 중</div>
    <h2 class="screen-title compact">방금 들은 설명과 계약서를 비교하고 있습니다.</h2>
    <p class="screen-desc">AI가 15페이지 분량의 계약서와 3분 20초의 녹취를 확인하고 있습니다.</p>
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

function reportScreen() {
  return wrap(`
    <div class="screen-kicker">분석 결과</div>
    <div class="report-hero">
      <span class="risk">주의 필요</span>
      <h2>말로 들은 설명과 계약서 내용이 달라 보입니다.</h2>
      <p class="screen-desc small">설명에서는 수익이 보장되는 것처럼 들리지만, 계약서에는 수익을 보장하지 않는다고 되어 있습니다.</p>
    </div>
    <div class="report-grid">
      <div class="report-card"><h3>1. 녹취에서 나온 설명</h3><blockquote>“월 수익은 거의 보장된다고 보시면 됩니다.”</blockquote><p class="disclaimer">발언 위치: 03:12</p></div>
      <div class="report-card clause"><h3>2. 계약서 관련 조항</h3><blockquote>제5조: 수익률은 보장되지 않으며, 투자 결과에 대한 책임은 계약자에게 있습니다.</blockquote></div>
      <div class="report-card"><h3>3. AI가 주의 표시한 이유</h3><p class="screen-desc small">설명은 수익 보장을 암시하지만, 계약서는 수익률을 보장하지 않습니다.</p></div>
    </div>
    <p class="disclaimer">계약미러는 판결을 내리지 않습니다. 계약서와 설명이 달라 보이는 부분을 먼저 찾아주는 참고 결과입니다.</p>
    <div class="bottom-actions">
      <button class="big-action" data-action="go-verify">이 리포트가 바뀌지 않았는지 확인하기</button>
      ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
    </div>
  `);
}

function verifyScreen() {
  return wrap(`
    <div class="screen-kicker">기록 확인</div>
    <div class="verify-result">
      <div class="check">✓</div>
      <h2>이 리포트는 생성 이후 변경되지 않았습니다.</h2>
      <p>계약서, 녹취, 분석 결과의 확인용 기록이 일치합니다.</p>
    </div>
    <div class="simple-verify-list">
      <div class="simple-verify-row"><span class="check-mini">✓</span>원본 계약서 기록 일치</div>
      <div class="simple-verify-row"><span class="check-mini">✓</span>녹취 기록 일치</div>
      <div class="simple-verify-row"><span class="check-mini">✓</span>분석 리포트 기록 일치</div>
      <div class="simple-verify-row"><span class="check-mini">✓</span>생성 이후 변경 흔적 없음</div>
    </div>
    ${isJudge() ? `
      <div class="info-card">
        <h3>기술 검증 정보</h3>
        <div class="mini-row"><span>세션 ID</span><span>${state.sessionId}</span></div>
        <div class="mini-row"><span>Chain 기록 상태</span><span>simulated</span></div>
        <div class="mini-row"><span>공식 연동 상태</span><span>ready_for_chain_anchor</span></div>
      </div>
    ` : ""}
    <div class="bottom-actions">
      ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
      <button class="secondary-action" data-action="go-start">처음으로</button>
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
    ["MISMATCH_DETECTED", "type=profit_guarantee_vs_disclaimer, risk_level=high"],
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
    "go-verify": () => { addEvent("VERIFY_URL_CREATED", "/verify/report_001"); setStep("verify"); },
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
    addEvent("PARTICIPANT_VERIFIED", `${verifyRole}=verified_mock`);
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

function renderTrustLog() {
  const panel = $("#trustLog");
  if (!panel) return;
  const blocks = [
    ["SESSION", [`session_id=${state.sessionId}`, `status=${state.step}`]],
    ["CONTRACT", [`contract_hash=${state.contractHash}`, "status=locked_before_recording"]],
    ["IDENTITY", [`contractor=${state.contractor.verified ? "verified_mock" : "pending"}`, `explainer=${state.explainer.verified ? "verified_mock" : "pending"}`]],
    ["CONSENT", [`contractor_recording=${state.contractor.consent}`, `explainer_recording=${state.explainer.consent}`, `contractor_rejected=${state.contractor.rejected}`, `explainer_rejected=${state.explainer.rejected}`, `ai_analysis=${state.contractor.consent && state.explainer.consent}`, `hash_record=${state.contractor.consent && state.explainer.consent}`]],
    ["RECORDING", [`recording_hash=${state.recordingHash}`, "duration=03:20"]],
    ["AI REPORT", ["risk_level=high", `report_hash=${state.reportHash}`]],
    ["CHAIN", ["anchor_status=simulated", "integration_status=ready_for_chain_anchor"]],
    ["EVENTS", state.events.map(([k, v]) => `${k} :: ${v}`).slice(-14)]
  ];
  panel.innerHTML = blocks.map(([title, lines]) => `
    <div class="log-block"><strong>${title}</strong>${lines.map((line) => `<div class="log-line"><span>›</span> ${line}</div>`).join("")}</div>
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
    if (c === "complete-contractor-id") { state.contractor.verified = true; addEvent("PARTICIPANT_VERIFIED", "contractor=verified_mock"); render(); }
    if (c === "complete-explainer-id") { state.explainer.verified = true; addEvent("PARTICIPANT_VERIFIED", "explainer=verified_mock"); render(); }
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
      window.location.href = isJudge() ? "/judge?v=6" : "/?v=6";
    }
  }));
}

setupControls();
render();
