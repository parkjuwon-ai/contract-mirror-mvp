
# Architecture

## MVP Flow

Contract Mirror follows a simple verification and analysis flow.

```text
User enters service
        ↓
Contractor identity verification
        ↓
Explainer identity verification
        ↓
Contract explanation session creation
        ↓
Contract document upload
        ↓
Transcript or recording input
        ↓
AI inconsistency analysis
        ↓
Risk report generation
        ↓
Hash and QR-based verification record
```

## System Components

### 1. Frontend

The frontend provides the user-facing MVP screens.

Main pages:

* Landing page
* Identity verification page
* Session creation page
* Contract upload page
* Transcript input page
* AI analysis result page
* QR verification page

### 2. Backend

The backend handles session creation, file registration, AI analysis requests, and report generation.

Planned backend stack:

* FastAPI
* SQLite
* Jinja2 templates

### 3. AI Analysis Layer

The AI analysis layer compares verbal explanations with written contract clauses.

Main tasks:

* extract key claims from the verbal explanation,
* extract relevant contract clauses,
* compare both sources,
* detect possible inconsistencies,
* classify risk level,
* generate explanation evidence.

### 4. Verification Layer

The verification layer creates a tamper-evident record for each contract explanation session.

MVP-level verification includes:

* session ID generation,
* document hash generation,
* analysis report hash generation,
* QR verification page mock.

### 5. DID / Blockchain Concept

In the MVP, DID and blockchain are implemented as a mock concept.

The goal is to show how the system can later connect to:

* real mobile ID,
* DID-based identity verification,
* blockchain-based hash logging,
* external verification infrastructure.

## MVP Architecture Summary

```text
FastAPI Backend
    ├── Session Management
    ├── File Upload
    ├── Transcript Input
    ├── AI Analysis
    └── Verification Record

SQLite Database
    ├── users
    ├── sessions
    ├── contracts
    ├── analysis_results
    └── verification_logs

Frontend
    ├── HTML
    ├── CSS
    └── Jinja2 Templates
```

