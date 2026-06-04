// Contract Mirror recording / analysis screen renderers.
// Extracted from app.js without changing runtime behavior.

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

