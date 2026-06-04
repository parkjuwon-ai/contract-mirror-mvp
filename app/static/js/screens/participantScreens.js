// Contract Mirror participant / invite screen renderers.
// Extracted from app.js without changing runtime behavior.

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

