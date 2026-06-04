// Contract Mirror frontend state helpers
// Extracted from app.js without changing runtime behavior.

function deepClone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createDefaultState() {
  const defaults = deepClone(BASE_STATE);
  defaults.mode = bootMode;
  defaults.device = bootDevice;
  defaults.step = bootStep;
  return defaults;
}

function normalizeParticipant(participant, fallback) {
  const source = participant && typeof participant === "object" ? participant : {};
  return {
    verified: Boolean(source.verified),
    consent: Boolean(source.consent),
    rejected: Boolean(source.rejected),
    name: typeof source.name === "string" && source.name.trim() ? source.name : fallback.name
  };
}

function normalizeSavedState(savedState) {
  const defaults = createDefaultState();
  if (!savedState || typeof savedState !== "object") return defaults;

  PERSISTED_STATE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(savedState, key)) {
      defaults[key] = savedState[key];
    }
  });

  defaults.mode = bootMode;
  defaults.device = bootDevice;
  // UI step is route/tab-local. Do not trust localStorage step from another participant tab.
  defaults.step = SCREEN_STEPS.includes(bootStep) ? bootStep : NAVIGATION_TARGETS.START;

  defaults.contractor = normalizeParticipant(defaults.contractor, BASE_STATE.contractor);
  defaults.explainer = normalizeParticipant(defaults.explainer, BASE_STATE.explainer);
  defaults.mismatches = deepClone(BASE_STATE.mismatches);
  defaults.processingTimer = null;
  defaults.toastText = "";
  defaults.vaultSheet = null;
  defaults.trustOpen = false;
  defaults.processingIndex = Number.isFinite(Number(defaults.processingIndex)) ? Number(defaults.processingIndex) : 0;
  defaults.progress = Number.isFinite(Number(defaults.progress)) ? Number(defaults.progress) : 0;
  defaults.events = Array.isArray(defaults.events) && defaults.events.length ? defaults.events : deepClone(BASE_STATE.events);
  return defaults;
}


function getApiContractType() {
  if (state.contractType === "부동산 분양") return "real_estate_sale";
  return state.contractType || "real_estate_sale";
}

function applyServiceSession(session) {
  if (!session || typeof session !== "object") return;

  state.serviceSession = deepClone(session);

  if (session.id) {
    state.sessionId = session.id;
  }

  if (session.contract && typeof session.contract === "object") {
    if (session.contract.fileName) state.contractFile = session.contract.fileName;
    if (session.contract.hash) state.contractHash = session.contract.hash;
    if ("locked" in session.contract) state.contractLocked = Boolean(session.contract.locked);
  }

  if (session.recording && typeof session.recording === "object") {
    if (session.recording.hash) state.recordingHash = session.recording.hash;
  }

  if (session.participants && typeof session.participants === "object") {
    ["contractor", "explainer"].forEach((role) => {
      const participant = session.participants[role];
      if (!participant || typeof participant !== "object") return;

      state[role] = {
        ...state[role],
        verified: Boolean(participant.verified),
        consent: Boolean(participant.consent),
        rejected: Boolean(participant.rejected),
        name: participant.name || state[role].name
      };
    });
  }

  if (session.report && typeof session.report === "object") {
    if (session.report.id) state.reportId = session.report.id;
    if (session.report.hash) state.reportHash = session.report.hash;
    state.serviceReport = deepClone(session.report);
  }

  if (session.verification && typeof session.verification === "object") {
    if (session.verification.id) state.verificationId = session.verification.id;
    state.serviceVerification = deepClone(session.verification);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedSnapshot()));
  } catch (error) {
    console.warn("Failed to persist service session", error);
  }
}



async function ensureServiceSession() {
  if (state.serviceSession && state.serviceSession.id) {
    return state.serviceSession;
  }

  if (state.sessionId) {
    try {
      const existingSession = await ContractMirrorApi.getSession(state.sessionId);
      if (existingSession && existingSession.id) {
        applyServiceSession(existingSession);
        return existingSession;
      }
    } catch (error) {
      console.warn("Failed to restore service session from server", error);
    }
  }

  const session = await ContractMirrorApi.createSession({
    contractType: getApiContractType()
  });

  applyServiceSession(session);
  return session;
}


function createPersistedSnapshot() {
  const snapshot = {};
  PERSISTED_STATE_KEYS.forEach((key) => {
    snapshot[key] = deepClone(state[key]);
  });
  return snapshot;
}

function replaceState(nextState) {
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, normalizeSavedState(nextState));
}

function resetDemoState(targetStep = NAVIGATION_TARGETS.START) {
  localStorage.removeItem(STORAGE_KEY);
  replaceState(null);
  state.mode = bootMode;
  state.device = bootDevice;
  state.step = isKnownStep(targetStep) ? targetStep : NAVIGATION_TARGETS.START;
  addEvent("STATE_RESET", `target_step=${state.step}`);
  goTo(state.step);
}

const state = normalizeSavedState(null);

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  replaceState(saved);
} catch (error) {
  console.warn("Contract Mirror state restore skipped", error);
  replaceState(null);
}

if (bootMode === "judge") {
  state.trustOpen = true;
}

let suppressPersist = false;
const $ = (selector) => document.querySelector(selector);

function persistState() {
  if (suppressPersist) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedSnapshot()));
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    const incoming = JSON.parse(event.newValue);
    const currentDevice = state.device;
    const currentMode = state.mode;
    const currentStep = state.step;
    replaceState(incoming);
    state.device = currentDevice;
    state.mode = currentMode;
    state.step = currentStep;
    suppressPersist = true;
    render({ forceScrollToTop: false });
    suppressPersist = false;
  } catch (error) {
    console.warn("Contract Mirror state sync skipped", error);
  }
});

function now() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}
