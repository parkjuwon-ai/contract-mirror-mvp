from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import tempfile
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = PROJECT_ROOT / "storage" / "contract_mirror.sqlite3"


def request_json(
    *,
    method: str,
    url: str,
    payload: dict | None = None,
    headers: dict | None = None,
) -> dict:
    data = None
    request_headers = headers.copy() if headers else {}

    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = Request(
        url,
        data=data,
        headers=request_headers,
        method=method,
    )

    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} {method} {url}: {body}") from exc
    except URLError as exc:
        raise RuntimeError(f"Failed to connect to {url}. Is the server running?") from exc

    return json.loads(raw)


def multipart_upload(
    *,
    url: str,
    field_name: str,
    file_path: Path,
    mime_type: str,
) -> dict:
    boundary = f"----ContractMirrorBoundary{uuid.uuid4().hex}"

    file_bytes = file_path.read_bytes()
    file_name = file_path.name

    body = b"".join(
        [
            f"--{boundary}\r\n".encode("utf-8"),
            (
                f'Content-Disposition: form-data; name="{field_name}"; '
                f'filename="{file_name}"\r\n'
            ).encode("utf-8"),
            f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"),
            file_bytes,
            b"\r\n",
            f"--{boundary}--\r\n".encode("utf-8"),
        ]
    )

    req = Request(
        url,
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        body_text = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} POST {url}: {body_text}") from exc
    except URLError as exc:
        raise RuntimeError(f"Failed to connect to {url}. Is the server running?") from exc

    return json.loads(raw)


def unwrap(payload: dict, key: str) -> dict:
    if payload.get("ok") is not True:
        raise RuntimeError(f"API returned not ok: {payload}")

    data = payload.get("data") or {}

    if key not in data:
        raise RuntimeError(f"Missing data.{key}: {payload}")

    return data[key]


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def assert_truthy(value, label: str) -> None:
    if not value:
        raise AssertionError(f"{label}: expected truthy value, got {value!r}")


def check_db_rows(session_id: str, report_id: str, verification_id: str) -> dict:
    if not DB_PATH.exists():
        raise AssertionError(f"DB file does not exist: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)

    try:
        session_row = conn.execute(
            "SELECT id, status FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()

        contract_files = conn.execute(
            """
            SELECT id, file_type, original_name, sha256_hash
            FROM files
            WHERE session_id = ?
              AND file_type = 'contract'
            """,
            (session_id,),
        ).fetchall()

        recording_files = conn.execute(
            """
            SELECT id, file_type, original_name, sha256_hash
            FROM files
            WHERE session_id = ?
              AND file_type = 'recording'
            """,
            (session_id,),
        ).fetchall()

        analysis_row = conn.execute(
            """
            SELECT id, status, progress
            FROM analysis_jobs
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()

        report_row = conn.execute(
            "SELECT id, session_id, risk_level FROM reports WHERE id = ?",
            (report_id,),
        ).fetchone()

        verification_row = conn.execute(
            "SELECT id, session_id, status FROM verifications WHERE id = ?",
            (verification_id,),
        ).fetchone()

    finally:
        conn.close()

    if session_row is None:
        raise AssertionError("DB sessions row not found")

    if len(contract_files) != 1:
        raise AssertionError(f"Expected 1 contract file row, got {len(contract_files)}")

    if len(recording_files) != 1:
        raise AssertionError(f"Expected 1 recording file row, got {len(recording_files)}")

    if analysis_row is None:
        raise AssertionError("DB analysis_jobs row not found")

    if report_row is None:
        raise AssertionError("DB reports row not found")

    if verification_row is None:
        raise AssertionError("DB verifications row not found")

    return {
        "sessionRow": session_row,
        "contractFileRows": contract_files,
        "recordingFileRows": recording_files,
        "analysisRow": analysis_row,
        "reportRow": report_row,
        "verificationRow": verification_row,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="Running Contract Mirror server URL",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/") + "/"

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)

        contract_file = tmp_path / "smoke_contract.txt"
        recording_file = tmp_path / "smoke_recording.txt"

        contract_file.write_text("sample contract text", encoding="utf-8")
        recording_file.write_text("sample recording text", encoding="utf-8")

        session_payload = request_json(
            method="POST",
            url=urljoin(base_url, "api/sessions"),
            payload={"contractType": "real_estate_sale"},
        )
        session = unwrap(session_payload, "session")
        session_id = session["id"]

        assert_equal(session["status"], "created", "created session status")

        upload_contract_payload = multipart_upload(
            url=urljoin(base_url, f"api/sessions/{session_id}/contract"),
            field_name="file",
            file_path=contract_file,
            mime_type="text/plain",
        )
        session = unwrap(upload_contract_payload, "session")

        assert_equal(session["status"], "contract_uploaded", "contract uploaded status")
        assert_equal(session["contract"]["fileName"], "smoke_contract.txt", "contract fileName")
        assert_equal(session["contract"]["locked"], False, "contract locked before lock")
        assert_truthy(session["contract"]["hash"], "contract hash")

        lock_payload = request_json(
            method="POST",
            url=urljoin(base_url, f"api/sessions/{session_id}/contract/lock"),
        )
        session = unwrap(lock_payload, "session")

        assert_equal(session["status"], "contract_locked", "contract locked status")
        assert_equal(session["contract"]["locked"], True, "contract locked after lock")

        contractor_payload = request_json(
            method="PATCH",
            url=urljoin(base_url, f"api/sessions/{session_id}/participants/contractor"),
            payload={"verified": True, "consent": True},
        )
        session = unwrap(contractor_payload, "session")

        assert_equal(session["status"], "participants_pending", "contractor-only participant status")
        assert_equal(session["participants"]["contractor"]["verified"], True, "contractor verified")
        assert_equal(session["participants"]["contractor"]["consent"], True, "contractor consent")

        explainer_payload = request_json(
            method="PATCH",
            url=urljoin(base_url, f"api/sessions/{session_id}/participants/explainer"),
            payload={"verified": True, "consent": True},
        )
        session = unwrap(explainer_payload, "session")

        assert_equal(session["status"], "participants_ready", "participants ready status")
        assert_equal(session["participants"]["explainer"]["verified"], True, "explainer verified")
        assert_equal(session["participants"]["explainer"]["consent"], True, "explainer consent")

        upload_recording_payload = multipart_upload(
            url=urljoin(base_url, f"api/sessions/{session_id}/recording"),
            field_name="file",
            file_path=recording_file,
            mime_type="text/plain",
        )
        session = unwrap(upload_recording_payload, "session")

        assert_equal(session["status"], "recording_uploaded", "recording uploaded status")
        assert_equal(session["recording"]["fileName"], "smoke_recording.txt", "recording fileName")
        assert_equal(session["recording"]["status"], "uploaded", "recording status")
        assert_truthy(session["recording"]["hash"], "recording hash")

        analysis_payload = request_json(
            method="POST",
            url=urljoin(base_url, f"api/sessions/{session_id}/analysis"),
        )
        session = unwrap(analysis_payload, "session")

        assert_equal(session["status"], "report_ready", "report ready status")
        assert_equal(session["analysis"]["status"], "completed", "analysis status")
        assert_equal(session["analysis"]["progress"], 100, "analysis progress")

        report_id = session["report"]["id"]
        verification_id = session["verification"]["id"]

        assert_truthy(report_id, "report id")
        assert_truthy(verification_id, "verification id")

        analysis_status_payload = request_json(
            method="GET",
            url=urljoin(base_url, f"api/sessions/{session_id}/analysis/status"),
        )
        analysis = unwrap(analysis_status_payload, "analysis")

        assert_equal(analysis["status"], "completed", "analysis status endpoint")

        report_payload = request_json(
            method="GET",
            url=urljoin(base_url, f"api/reports/{report_id}"),
        )
        report = unwrap(report_payload, "report")

        assert_equal(report["id"], report_id, "report endpoint id")
        assert_truthy(report["mismatches"], "report mismatches")
        assert_truthy(report["questions"], "report questions")

        verification_payload = request_json(
            method="GET",
            url=urljoin(base_url, f"api/verifications/{verification_id}"),
        )
        verification = unwrap(verification_payload, "verification")

        assert_equal(verification["id"], verification_id, "verification endpoint id")
        assert_equal(verification["status"], "valid", "verification status")
        assert_equal(verification["contractHash"], session["contract"]["hash"], "verification contract hash")
        assert_equal(verification["recordingHash"], session["recording"]["hash"], "verification recording hash")
        assert_equal(verification["reportHash"], session["report"]["hash"], "verification report hash")

        db_result = check_db_rows(
            session_id=session_id,
            report_id=report_id,
            verification_id=verification_id,
        )

    result = {
        "ok": True,
        "sessionId": session_id,
        "reportId": report_id,
        "verificationId": verification_id,
        "apiStatus": {
            "session": "report_ready",
            "analysis": "completed",
            "verification": "valid",
        },
        "dbStatus": {
            "sessionRow": db_result["sessionRow"],
            "contractFileCount": len(db_result["contractFileRows"]),
            "recordingFileCount": len(db_result["recordingFileRows"]),
            "analysisRow": db_result["analysisRow"],
            "reportRow": db_result["reportRow"],
            "verificationRow": db_result["verificationRow"],
        },
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"SMOKE TEST FAILED: {exc}", file=sys.stderr)
        raise
