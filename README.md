
# Contract Mirror MVP

Contract Mirror is an AI and DID-based MVP for verifying inconsistencies between pre-contract verbal explanations and actual contract clauses.

## Overview

Contract Mirror helps users identify potential inconsistencies between verbal explanations given before signing a contract and the actual written contract clauses.

This MVP focuses on a trusted contract explanation session where the identities of both the contractor and the explainer are verified, the explanation record is preserved, and AI analyzes possible mismatches between the explanation and the contract.

## Problem

In many high-risk contracts, users often rely on verbal explanations before signing. However, these explanations may differ from the actual contract clauses.

After disputes occur, it is difficult to prove:

* who explained the contract,
* what was explained,
* whether the explanation matched the written contract,
* and whether the record was tampered with.

## Solution

Contract Mirror converts the pre-contract explanation process into a verifiable session.

The system provides:

* identity verification for both parties,
* contract document registration,
* transcript or recording-based explanation analysis,
* AI-based inconsistency detection,
* session hash generation,
* and QR-based verification concept.

## Key Features

* Mock mobile ID / DID verification
* Contract explanation session creation
* Contract document upload and hash generation
* Transcript input for verbal explanation
* AI-based inconsistency detection
* Risk report generation
* QR verification concept

## MVP Scope

This repository is designed for a hackathon MVP.

The goal is not to provide legal judgment, but to demonstrate a feasible prototype for detecting and verifying contract explanation risks.

## Tech Stack

* Python
* FastAPI
* Jinja2
* SQLite
* HTML / CSS
* AI analysis mock or API-based analysis
* DID / blockchain verification mock

## Repository Structure

```text
contract-mirror-mvp/
├── README.md
├── docs/
│   ├── architecture.md
│   └── mvp_scope.md
├── app/
│   ├── main.py
│   ├── templates/
│   └── static/
├── data/
│   └── sample_case.md
└── roadmap.md
```

## Demo Scenario

A user receives a verbal explanation before signing a contract.

The explainer says:

> "This product guarantees stable profit and there is almost no risk."

However, the written contract states:

> "The company does not guarantee profit, and the investor is responsible for all losses."

Contract Mirror detects this inconsistency and generates a risk report.

## Status

This project is currently in MVP planning and prototype development stage.
