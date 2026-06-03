# Contract Mirror Home v14 Role Restore

이 패치는 **v13을 메인 기준**으로 유지하면서, v5.3에서 고정했던 역할 분리 구조가 사라지지 않도록 확인한 버전입니다.

## 유지 기준

- v13 최신 홈/플로우/문구/확인 카드 UX 유지
- v5.3의 `/judge` 심사위원 콘솔 유지
- v5.3의 `/participant/contractor` 계약자 페이지 유지
- v5.3의 `/participant/explainer` 설명자 페이지 유지
- 계약자/설명자 본인확인 및 녹취 동의 Mock 유지

## 확인 URL

```bash
http://127.0.0.1:8000/
http://127.0.0.1:8000/judge
http://127.0.0.1:8000/participant/contractor
http://127.0.0.1:8000/participant/explainer
```

## 적용 이유

최근 홈/리포트 UX를 개선하는 과정에서 v5.3 기준으로 고정했던 심사위원 콘솔과 참여자 역할 분리 구조가 기준에서 빠지지 않도록 다시 명시했습니다.

이번 버전의 원칙은 다음과 같습니다.

```text
v13 = 메인 기준 코드
v5.3 = 심사위원 콘솔과 참여자 역할 구조의 복구 기준
```
