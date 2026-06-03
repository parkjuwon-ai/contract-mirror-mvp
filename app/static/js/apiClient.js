// Contract Mirror API client boundary
// Service-ready API wrapper for FastAPI endpoints.

(function () {
  const API_BASE = "/api";

  function buildUrl(path) {
    return `${API_BASE}${path}`;
  }

  function normalizeError(payload, response) {
    if (payload && typeof payload === "object") {
      if (payload.error && payload.error.message) {
        return payload.error.message;
      }

      if (payload.detail) {
        return payload.detail;
      }

      if (payload.message) {
        return payload.message;
      }
    }

    return `API request failed: ${response.status}`;
  }

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const body = options.body;
    const isFormData = body instanceof FormData;

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    let requestBody = body;

    if (body !== undefined && body !== null && !isFormData) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (typeof body !== "string") {
        requestBody = JSON.stringify(body);
      }
    }

    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
      body: requestBody
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");
    const payload = hasJson ? await response.json() : await response.text();

    if (!response.ok || (payload && typeof payload === "object" && payload.ok === false)) {
      const error = new Error(normalizeError(payload, response));
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function getData(payload) {
    if (!payload || typeof payload !== "object") return null;
    return payload.data || null;
  }

  function getSessionFromPayload(payload) {
    const data = getData(payload);
    return data ? data.session : null;
  }

  function getReportFromPayload(payload) {
    const data = getData(payload);
    return data ? data.report : null;
  }

  function getVerificationFromPayload(payload) {
    const data = getData(payload);
    return data ? data.verification : null;
  }

  function getAnalysisFromPayload(payload) {
    const data = getData(payload);
    return data ? data.analysis : null;
  }

  async function createSession(payload = {}) {
    const response = await request("/sessions", {
      method: "POST",
      body: payload
    });

    return getSessionFromPayload(response);
  }

  async function getSession(sessionId) {
    const response = await request(`/sessions/${encodeURIComponent(sessionId)}`);
    return getSessionFromPayload(response);
  }

  async function uploadContract(sessionId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await request(`/sessions/${encodeURIComponent(sessionId)}/contract`, {
      method: "POST",
      body: formData
    });

    return getSessionFromPayload(response);
  }

  async function lockContract(sessionId) {
    const response = await request(`/sessions/${encodeURIComponent(sessionId)}/contract/lock`, {
      method: "POST"
    });

    return getSessionFromPayload(response);
  }

  async function updateParticipant(sessionId, role, payload = {}) {
    const response = await request(
      `/sessions/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(role)}`,
      {
        method: "PATCH",
        body: payload
      }
    );

    return getSessionFromPayload(response);
  }

  async function uploadRecording(sessionId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await request(`/sessions/${encodeURIComponent(sessionId)}/recording`, {
      method: "POST",
      body: formData
    });

    return getSessionFromPayload(response);
  }

  async function analyzeSession(sessionId) {
    const response = await request(`/sessions/${encodeURIComponent(sessionId)}/analysis`, {
      method: "POST"
    });

    return getSessionFromPayload(response);
  }

  async function getAnalysisStatus(sessionId) {
    const response = await request(`/sessions/${encodeURIComponent(sessionId)}/analysis/status`);
    return getAnalysisFromPayload(response);
  }

  async function getReport(reportId) {
    const response = await request(`/reports/${encodeURIComponent(reportId)}`);
    return getReportFromPayload(response);
  }

  async function getVerification(verificationId) {
    const response = await request(`/verifications/${encodeURIComponent(verificationId)}`);
    return getVerificationFromPayload(response);
  }

  window.ContractMirrorApi = Object.freeze({
    request,
    createSession,
    getSession,
    uploadContract,
    lockContract,
    updateParticipant,
    uploadRecording,
    analyzeSession,
    getAnalysisStatus,
    getReport,
    getVerification
  });
})();
