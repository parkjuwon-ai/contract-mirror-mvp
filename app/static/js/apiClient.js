// Contract Mirror API client boundary
// This file prepares backend integration without changing current mock UI behavior.

(function () {
  const API_BASE = "/api";

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const isFormData = options.body instanceof FormData;

    if (options.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type") || "";
    const hasJson = contentType.includes("application/json");

    const payload = hasJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && payload.detail
          ? payload.detail
          : `API request failed: ${response.status}`;
      throw new Error(message);
    }

    return payload;
  }

  function createSession(payload = {}) {
    return request("/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function getSession(sessionId) {
    return request(`/sessions/${encodeURIComponent(sessionId)}`);
  }

  function uploadContract(sessionId, file) {
    const formData = new FormData();
    formData.append("file", file);

    return request(`/sessions/${encodeURIComponent(sessionId)}/contract`, {
      method: "POST",
      body: formData
    });
  }

  function updateParticipant(sessionId, role, payload = {}) {
    return request(
      `/sessions/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(role)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
  }

  function uploadRecording(sessionId, file) {
    const formData = new FormData();
    formData.append("file", file);

    return request(`/sessions/${encodeURIComponent(sessionId)}/recording`, {
      method: "POST",
      body: formData
    });
  }

  function analyzeSession(sessionId) {
    return request(`/sessions/${encodeURIComponent(sessionId)}/analyze`, {
      method: "POST"
    });
  }

  function getReport(reportId) {
    return request(`/reports/${encodeURIComponent(reportId)}`);
  }

  function getVerification(verificationId) {
    return request(`/verify/${encodeURIComponent(verificationId)}`);
  }

  window.ContractMirrorApi = Object.freeze({
    request,
    createSession,
    getSession,
    uploadContract,
    updateParticipant,
    uploadRecording,
    analyzeSession,
    getReport,
    getVerification
  });
})();
