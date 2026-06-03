// Contract Mirror frontend constants
// Extracted from app.js without changing runtime behavior.

const APP_VERSION = "v34_route_render_bugfix";
const STORAGE_KEY = "contractMirrorV34RouteRenderBugfix";

const DEVICE_TYPES = Object.freeze(["host", "contractor", "explainer"]);
const MODE_TYPES = Object.freeze(["user", "judge"]);
const SCREEN_STEPS = Object.freeze([
  "start",
  "create",
  "upload",
  "lock",
  "invite",
  "waiting",
  "identity",
  "consent",
  "recording",
  "processing",
  "report",
  "addendum",
  "verify",
  "failure",
  "invite-code",
  "participant-consent",
  "participant-ready",
  "participant-recording",
  "participant-done"
]);
const NAVIGATION_TARGETS = Object.freeze({
  START: "start",
  CREATE: "create",
  UPLOAD: "upload",
  LOCK: "lock",
  INVITE: "invite",
  WAITING: "waiting",
  IDENTITY: "identity",
  CONSENT: "consent",
  RECORDING: "recording",
  PROCESSING: "processing",
  REPORT: "report",
  ADDENDUM: "addendum",
  VERIFY: "verify",
  FAILURE: "failure",
  INVITE_CODE: "invite-code",
  PARTICIPANT_CONSENT: "participant-consent",
  PARTICIPANT_READY: "participant-ready",
  PARTICIPANT_RECORDING: "participant-recording",
  PARTICIPANT_DONE: "participant-done"
});
const CONTRACT_PHASE_STEPS = Object.freeze(["start", "create", "upload", "lock"]);
const CONSENT_PHASE_STEPS = Object.freeze(["invite", "waiting", "identity", "consent", "failure", "recording"]);
const WORKSPACE_STEPS = Object.freeze(["report", "addendum", "verify"]);

const boot = window.CONTRACT_MIRROR_BOOT || {};
const bootDevice = DEVICE_TYPES.includes(boot.initialDevice) ? boot.initialDevice : "host";
const bootStep = SCREEN_STEPS.includes(boot.initialStep) ? boot.initialStep : "start";
const bootMode = MODE_TYPES.includes(boot.initialMode) ? boot.initialMode : "user";

const confirmationQuestions = Object.freeze([
  {
    id: 1,
    short: "수익 보장 여부",
    text: "월 300만 원은 보장 수익인가요, 예상 수익인가요?",
    basis: "녹취 00:01:24 · 계약서 제5조 2항",
    mismatchId: 1
  },
  {
    id: 2,
    short: "중도해지 비용",
    text: "중도해지 시 위약금이나 정산 비용이 발생하나요?",
    basis: "녹취 00:02:07 · 계약서 제8조 1항",
    mismatchId: 2
  },
  {
    id: 3,
    short: "별도 비용 부담",
    text: "관리비·부대비용·제세공과금 등 별도 비용은 누가 부담하나요?",
    basis: "녹취 00:02:46 · 계약서 제11조 3항",
    mismatchId: 3
  }
]);

const BASE_STATE = Object.freeze({
  mode: "user",
  step: "start",
  device: "host",
  sessionId: "CM-20260601-001",
  contractName: "평택 오션 센트럴 비즈 분양 상담",
  contractType: "부동산 분양",
  contractFile: "오션센트럴비즈_분양계약서.pdf",
  addendumName: "답변_확약서_수익조건.pdf",
  addendumHash: "sha256:d4f7a9b2e18c6f0a34b91d6c2a7e51b9f0d3c8a5e67b4c2d19a0f83e6c7b2a91",
  addendumUploaded: false,
  addendumRequested: false,
  vaultSaved: false,
  vaultSheet: null,
  toastText: "",
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
    ["UI_VERSION", APP_VERSION],
    ["FLOW", "contract_locked_before_recording"]
  ]
});

const PERSISTED_STATE_KEYS = Object.freeze([
  "sessionId",
  "contractName",
  "contractType",
  "contractFile",
  "addendumName",
  "addendumHash",
  "addendumUploaded",
  "addendumRequested",
  "vaultSaved",
  "contractHash",
  "transcriptHash",
  "recordingHash",
  "reportHash",
  "inviteCode",
  "contractor",
  "explainer",
  "recording",
  "processingIndex",
  "progress",
  "contractRecordOpen",
  "events",
  "serviceSession",
  "serviceReport",
  "serviceVerification",
  "contractLocked",
  "reportId",
  "verificationId",
]);
