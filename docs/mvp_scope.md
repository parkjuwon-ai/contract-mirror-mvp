
# MVP Scope

## Goal

The goal of this MVP is to demonstrate how pre-contract verbal explanations can be verified and compared with actual contract clauses.

Contract Mirror does not replace legal professionals. Instead, it helps users identify possible explanation risks before or after contract signing.

## Core MVP Question

Can we create a trusted contract explanation session that records who explained what, compares it with the written contract, and leaves a verifiable evidence trail?

## Included in MVP

### 1. Mock Identity Verification

The MVP includes a mock flow for verifying:

* contractor identity,
* explainer identity,
* session participation.

This represents future integration with mobile ID or DID infrastructure.

### 2. Session Creation

Each contract explanation process is stored as a unique session.

Example session ID:

```text
CM-2026-000001
```

### 3. Contract Upload

The user can upload or register a contract document.

The MVP generates a document hash to represent tamper-evident storage.

### 4. Transcript Input

The user can input a transcript of the verbal explanation.

In the full version, this can be replaced with speech-to-text processing.

### 5. AI Inconsistency Detection

The MVP analyzes whether the verbal explanation conflicts with the written contract.

Example:

```text
Verbal explanation:
"This contract guarantees stable monthly profit."

Contract clause:
"The company does not guarantee fixed profit."

Result:
Potential inconsistency detected.
```

### 6. Risk Report

The MVP generates a simple risk report including:

* inconsistency candidate,
* risk level,
* evidence from verbal explanation,
* evidence from contract clause,
* session hash.

### 7. QR Verification Concept

The MVP includes a QR verification concept to show how third parties can later verify the session record.

## Not Included in MVP

The following are not included in the initial MVP:

* real mobile ID integration,
* real blockchain deployment,
* full legal review automation,
* production-level security,
* payment system,
* multi-user account system,
* complete contract management dashboard.

## Target Demo Scenario

A contractor receives a verbal explanation before signing a high-risk contract.

The explanation includes a profit-guarantee-like statement, but the contract contains a no-profit-guarantee clause.

Contract Mirror detects the mismatch and generates a risk report that can be verified later through a session record.

## Success Criteria

The MVP is successful if it can clearly demonstrate:

* why trusted contract explanation records are needed,
* how identity-verified explanation sessions work,
* how AI can detect explanation-contract inconsistencies,
* and how DID/blockchain-based verification can strengthen accountability.
  EOF

cat > data/sample_case.md <<'EOF'

# Sample Case

## Case Title

Profit Guarantee Explanation vs No-Profit-Guarantee Clause

## Situation

Before signing a contract, the explainer verbally states that the contract provides stable profit and almost no risk.

However, the actual contract states that profit is not guaranteed and that the contractor is responsible for losses.

## Verbal Explanation

```text
This contract guarantees stable monthly profit.
There is almost no risk of loss.
You do not need to worry about the principal.
```

## Contract Clause

```text
The company does not guarantee any fixed profit.
The contractor is responsible for all investment losses.
The final profit may vary depending on market conditions.
```

## AI Analysis Result

### Inconsistency Candidate

Profit guarantee statement vs no-profit-guarantee clause

### Risk Level

High

### Evidence

Verbal explanation:

```text
This contract guarantees stable monthly profit.
```

Contract clause:

```text
The company does not guarantee any fixed profit.
```

## Expected Output

```text
Risk Level: High

Reason:
The verbal explanation suggests guaranteed profit, while the contract explicitly states that no fixed profit is guaranteed.

Recommended Action:
The user should review this clause carefully and request written clarification before signing.
```

