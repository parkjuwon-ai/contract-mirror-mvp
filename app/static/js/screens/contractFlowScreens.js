// Contract Mirror contract flow screen renderers.
// Extracted from app.js without changing runtime behavior.

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

