# Contract Mirror UI v5 Integration Guide

## 핵심 변경 사항

v5는 사용자 화면과 심사위원 화면을 분리합니다.

- 사용자 화면: 기술 용어를 숨기고, 지금 해야 할 행동만 보여줍니다.
- 심사위원 화면: Trust Log, 해시, mock/simulated 상태, 시연 제어를 확인합니다.

## 주요 URL

- 일반 사용자 화면: `/`
- 심사위원 기술 검증 모드: `/judge`
- 계약자 본인확인/동의 화면: `/participant/contractor`
- 설명자 본인확인/동의 화면: `/participant/explainer`
- QR 검증 화면 예시: `/verify/report_001`

## 사용자용 화면에서 숨긴 요소

- Trust Log / 신뢰 로그
- sha256 해시값 기본 노출
- mock / simulated
- 진행자 화면
- 시연 제어
- 내부 상태값

## 심사위원 모드에서 확인 가능한 요소

- `contract_hash`
- `locked_before_recording`
- `contractor=verified_mock`
- `explainer=verified_mock`
- `recording_hash`
- `report_hash`
- `anchor_status=simulated`
- `integration_status=ready_for_chain_anchor`

## 발표 시 추천 멘트

> 실제 사용자는 복잡한 DID나 블록체인 용어를 보지 않습니다. 사용자는 계약서를 확인하고, 각자 본인확인과 동의를 한 뒤, AI 분석 결과와 기록 변경 여부만 확인합니다. 심사위원용 기술 검증 모드에서는 같은 세션의 내부 신뢰 로그를 열어 계약서 해시, 참여자 동의 상태, 녹취 해시, 리포트 해시, 체인 연동 준비 상태를 확인할 수 있습니다.
