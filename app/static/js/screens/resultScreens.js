// Contract Mirror result-related screen renderers.
// Extracted from app.js without changing runtime behavior.

function reportScreen() {
  const questions = confirmationQuestions.map(questionCard).join("");
  return wrap(`
    <div class="report-workspace-v612 workspace-shell report-workspace-v12 report-workspace-v13 report-workspace-v15 report-workspace-v25 report-workspace-v26">
      <header class="report-header-v612 report-header-v12 report-header-v13 report-header-v15 report-header-v25 report-header-v26">
        <div>
          <span class="screen-kicker">Step 4 / 4 · 상세 검증 리포트</span>
          <h2>계약 전 확인할 설명-계약서 충돌 3건</h2>
          <p>AI가 녹취 설명과 계약서 조항을 비교해, 서명 전 확인할 질문을 정리했습니다.</p>
        </div>
        <div class="report-meta-v611 report-meta-v25 report-meta-v26">
          <span>검증 기록 ID</span>
          <strong>${state.sessionId}</strong>
          <em>${state.contractFile}</em>
        </div>
      </header>
      <section class="report-priority-banner-v8 report-priority-banner-v12 report-priority-banner-v13 report-priority-banner-v15 report-priority-banner-v25 report-priority-banner-v26 report-priority-banner-v27">
        <span>가장 먼저 확인할 충돌 지점</span>
        <div class="priority-collision-mini-v27" aria-label="대표 충돌 요약">
          <p><span>녹취</span><strong>“월 수익은 거의 보장”</strong></p>
          <p><span>계약서</span><strong>“수익률은 보장하지 않는다”</strong></p>
        </div>
        <strong>“월 300만 원은 보장 수익인가요, 예상 수익인가요?”</strong>
        <em>말과 조항이 다르게 읽히는 지점에서 바로 확인할 질문입니다.</em>
      </section>
      <div class="report-grid-v612 workspace-grid">
        <section class="report-main-v612 workspace-main">
          <section class="precontract-question-card priority-question-card v612-question-panel report-question-panel-v25 report-question-panel-v26">
            <span class="screen-kicker">설명-계약서 충돌 지점</span>
            <h3>AI가 찾은 설명-계약서 충돌 3건</h3>
            <p class="question-help-v611">대표 충돌은 바로 확인하고, 나머지는 필요한 근거만 펼쳐 확인하세요.</p>
            <div class="question-card-list-v611 v612-question-list report-question-list-v25 report-question-list-v26">${questions}</div>
          </section>
        </section>
        <aside class="report-action-panel-v612 workspace-side">
          <div class="audit-card report-side-card-v612 report-side-card-v12 report-side-card-v13 report-side-card-v15 report-side-card-v25">
            <h3>다음 행동</h3>
            <div class="next-step-stack-v612 next-step-stack-v12">
              <div class="next-step-item-v612"><span>1</span><div><strong>충돌 지점 확인</strong><em>녹취 발언과 계약서 조항이 어떻게 다른지 먼저 확인하세요.</em></div></div>
              <div class="next-step-item-v612"><span>2</span><div><strong>추가 문서 첨부</strong><em>답변서·확약서가 있다면 근거로 추가할 수 있습니다.</em></div></div>
              <div class="next-step-item-v612"><span>3</span><div><strong>확인 카드 만들기</strong><em>현재 리포트를 검증 가능한 기록 카드로 남깁니다.</em></div></div>
            </div>
            ${state.addendumUploaded ? `<em class="request-state done">사후 확인 문서 첨부: ${state.addendumName}</em>` : ""}
            <div class="report-record-mini-v12 report-record-mini-v25">
              <span>검증 기록 ID</span><strong>${state.sessionId}</strong>
            </div>
            <div class="bottom-actions report-side-actions-v612 report-side-actions-v12 one-primary-actions report-actions-v19 report-actions-v25">
              <button class="big-action primary-result-action" data-action="go-verify">이 리포트로 확인 카드 만들기</button>
              <button class="secondary-action secondary-result-action" data-action="go-addendum">추가확인문서 첨부하기</button>
              <button class="ghost-inline-action report-question-copy-v19" data-action="copy-all-questions" type="button">질문 3개 복사하기</button>
            </div>
          </div>
        </aside>
      </div>
      <nav class="mobile-report-sticky-v25" aria-label="리포트 다음 행동">
        <button class="big-action" data-action="go-verify" type="button">이 리포트로 확인 카드 만들기</button>
        <div>
          <button data-action="go-addendum" type="button">추가 문서 첨부</button>
          <button data-action="copy-all-questions" type="button">질문 복사</button>
        </div>
      </nav>
    </div>
  `);

}

function verifyScreen() {
  const leadQuestion = confirmationQuestions[0];
  return wrap(`
    <div class="verify-workspace-v612 workspace-shell cm-verify-workspace-v10 verify-workspace-v13 verify-workspace-v15 verify-workspace-v28">
      <section class="verify-audit-main workspace-main">
        <div class="screen-kicker cm-verify-title-kicker-v10">최종 확인 카드</div>
        <div class="verify-card-hero trust-seal-hero verify-hero-v65 v69-verify-hero v611-verify-hero no-stamp-v612 verify-hero-v15 verify-hero-v28">
          <div>
            <span class="risk-badge verified">검증 기록 생성</span>
            <h2>최종 확인 카드가 생성되었습니다.</h2>
            <p>계약 설명과 계약서 비교 기록을 나중에 다시 검증할 수 있도록 정리했습니다.</p>
            <div class="verify-inline-summary-v612" aria-label="확인 카드 상태">
              <span>검증 기록 생성</span>
              <span>사후 확인 QR 생성</span>
            </div>
          </div>
        </div>
        <section class="mobile-verify-qr-entry-v28" aria-label="모바일 QR 진입점">
          <div>
            <strong>사후 확인 QR 생성 완료</strong>
            <span>검증 기록 ID ${state.sessionId}</span>
          </div>
          <button type="button" data-action="scroll-verify-qr">QR 보기</button>
        </section>
        <section class="verify-status-card audit-strong trust-seal-card evidence-package-table v611-vault-summary-card verify-summary-v15 verify-summary-v28">
          <h3>확인 기록 요약</h3>
          <div class="verify-row"><span>검증 기록 ID</span><strong>${state.sessionId}</strong></div>
          <div class="verify-row"><span>생성 시각</span><strong>2026.06.02 19:42</strong></div>
          <div class="verify-row danger-row"><span>위험 항목 수</span><strong class="danger-text">높음 1건 · 중간 2건</strong></div>
          <div class="verify-row"><span>확인 질문</span><strong>3건</strong></div>
          <div class="verify-row addendum-row"><span>사후 확인 문서</span><strong>${state.addendumUploaded ? state.addendumName : "첨부 없음"}</strong></div>
        </section>
        <section class="verify-status-card representative-point-v28">
          <h3>대표 확인 지점</h3>
          <div class="representative-contrast-v28" aria-label="대표 확인 지점 요약">
            <div><span>녹취</span><strong>“월 수익은 거의 보장”</strong></div>
            <div><span>계약서</span><strong>“수익률은 보장하지 않는다”</strong></div>
          </div>
          <div class="representative-question-v28">
            <span>확인 질문</span>
            <strong>“${leadQuestion.text}”</strong>
          </div>
        </section>
        <section class="vault-ready-card-v611 vault-legal-note-v13 verify-plain-note-v15">
          <strong>안내</strong>
          <p>이 카드는 법적 판단을 대신하지 않습니다. 계약서·녹취·질문·답변의 맥락을 정리해 분쟁 대비 참고 자료로 활용할 수 있습니다.</p>
        </section>
        <details class="advanced-verify-link-v28">
          <summary>고급 검증 정보 보기</summary>
          <p>문서 해시, 녹취 해시, QR 검증 경로를 확인할 수 있습니다.</p>
          <div class="hash-line"><span>contract_hash</span><code>${state.contractHash}</code></div>
          <div class="hash-line"><span>recording_hash</span><code>${state.recordingHash}</code></div>
          <div class="hash-line"><span>report_hash</span><code>${state.reportHash}</code></div>
          ${state.addendumUploaded ? `<div class="hash-line"><span>addendum_hash</span><code>${state.addendumHash}</code></div>` : ""}
          <div class="hash-line"><span>Chain Anchor</span><code>Demo Tx Hash · data structure validated</code></div>
        </details>
      </section>
      <aside class="verify-qr-column verify-side-v65 workspace-side verify-side-v15 verify-side-v28" id="verifyQrPanel">
        <div class="qr-side-head qr-side-head-v28">
          <span>사후 확인 QR</span>
          <strong><em>검증 기록 ID</em>${state.sessionId}</strong>
        </div>
        <div class="qr-large real-qr" aria-label="사후 확인 QR 코드"><span>CM</span></div>
        <div class="qr-url">contract-mirror.kr/verify/${state.sessionId}</div>
        <div class="qr-caption">검증 기록 확인 링크</div>
        <div class="verify-side-divider"></div>
        <div class="mini-verify-summary">
          <div><span>기록 확인</span><strong>가능</strong></div>
          <div><span>위험 항목</span><strong class="danger-text">3건</strong></div>
          <div><span>사후 문서</span><strong>${state.addendumUploaded ? "포함" : "없음"}</strong></div>
          <div><span>보관 상태</span><strong>보관 완료</strong></div>
        </div>
        <div class="bottom-actions evidence-actions verify-actions-v65 one-primary-actions v611-verify-actions verify-actions-v15 verify-actions-v28">
          <button class="big-action primary-result-action" data-action="copy-share-link">확인 링크 복사</button>
          <button class="secondary-action" data-action="go-report">리포트로 돌아가기</button>
          <button class="ghost-inline-action" data-action="new-contract">새 계약 검증하기</button>
          ${isJudge() ? `<button class="secondary-action" data-action="open-trust">신뢰 로그 보기</button>` : ""}
        </div>
      </aside>
    </div>
  `);
}

