# Contract Mirror UI v5.3 — Trust-Seal UX

v5.3은 기능 추가보다 화면의 신뢰감과 증거성을 강화한 버전입니다.

## 핵심 방향

- 사용자 화면(`/`): 계약 현장용 모바일 검증 플로우 유지
- 참여자 화면(`/participant/contractor`, `/participant/explainer`): 본인확인·녹취·AI 분석·검증 기록 동의 항목 강화
- 심사위원 화면(`/judge`): 모바일 미리보기가 아닌 PC형 Trust Console로 분리
- 마지막 화면: AI 분석 결과보다 “계약 설명 검증 카드 생성 완료”가 클라이맥스가 되도록 강화

## 반영 내용

1. 첫 화면 문제 중심 카피 적용
   - 말로 들은 설명과 서명할 조항이 다를 때, 계약 전에 잡아낸다는 메시지 강화
   - “수익 보장” 발언과 “수익 보장 책임 없음” 조항의 충돌 예시 추가

2. 동의 화면 신뢰성 강화
   - 모바일 신분증 본인확인 동의
   - 계약 설명 녹취 동의
   - 계약서·녹취 AI 분석 동의
   - 계약서·녹취·분석 리포트 검증 기록 생성 동의
   - AI 분석은 법률 판단이 아닌 위험 탐지 보조 수단임을 확인

3. 검증 카드 클라이맥스 강화
   - 계약 설명 검증 카드 생성 완료
   - 계약 ID, 양측 본인확인, 위험 탐지, 계약서 해시, 녹취 해시, 리포트 해시, QR 검증 가능 표시

4. Judge Trust Console 강화
   - 상단 4개 요약 카드: 본인확인 / 계약 설명 / AI 분석 / 검증성
   - 왼쪽 검증 이벤트 타임라인
   - 가운데 AI 리포트 또는 검증 카드
   - 오른쪽 Trust Summary + 접힌 Raw Trust Log

5. PoC/Mock 표현 개선
   - mock/simulated가 화면의 주인공이 되지 않도록 Demo Verified, Demo Tx Hash, 데이터 구조 검증 완료 표현 사용
   - 공식 Chain 연동 전 단계임은 하단 PoC 표시 기준에 설명

## 실행 URL

- `/` 사용자 모바일 현장 플로우
- `/judge` 심사위원 Trust Console
- `/participant/contractor` 계약자 본인확인·동의
- `/participant/explainer` 설명자 본인확인·동의
