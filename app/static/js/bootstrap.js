// Contract Mirror frontend bootstrap
// Initializes controls and performs the first render.
// Extracted from app.js without changing runtime behavior.

function setupControls() {
  $("#workspace").classList.add("trust-closed");
  $("#trustToggleTop").addEventListener("click", () => state.trustOpen ? closeTrust() : openTrust());
  $("#trustClose").addEventListener("click", closeTrust);
  $("#controlToggle").addEventListener("click", () => $("#controlPanel").hidden = false);
  $("#controlClose").addEventListener("click", () => $("#controlPanel").hidden = true);
  document.querySelectorAll("[data-control]").forEach((btn) => btn.addEventListener("click", () => {
    const c = btn.dataset.control;
    if (c === "view-host") { state.device = "host"; goTo(hasRejection() ? NAVIGATION_TARGETS.FAILURE : NAVIGATION_TARGETS.WAITING); }
    if (c === "view-contractor") setDevice("contractor");
    if (c === "view-explainer") setDevice("explainer");
    if (c === "complete-contractor-id") { state.contractor.verified = true; addEvent("PARTICIPANT_VERIFIED", "contractor=Demo Verified"); render(); }
    if (c === "complete-explainer-id") { state.explainer.verified = true; addEvent("PARTICIPANT_VERIFIED", "explainer=Demo Verified"); render(); }
    if (c === "complete-contractor-consent") { state.contractor.consent = true; state.contractor.rejected = false; addEvent("CONSENT_COMPLETED", "contractor_recording=true"); render(); }
    if (c === "complete-explainer-consent") { state.explainer.consent = true; state.explainer.rejected = false; addEvent("CONSENT_COMPLETED", "explainer_recording=true"); render(); }
    if (c === "reject-explainer") { state.explainer.consent = false; state.explainer.rejected = true; addEvent("CONSENT_REJECTED", "explainer_recording=false, ai_analysis=false"); state.device = "host"; goTo(NAVIGATION_TARGETS.FAILURE); }
    if (c === "processing-done") {
      if (state.processingTimer) { clearInterval(state.processingTimer); state.processingTimer = null; }
      state.progress = 100;
      state.processingIndex = processingSteps.length;
      addEvent("PROCESSING_COMPLETED", "presenter_control=true");
      if (state.step !== NAVIGATION_TARGETS.PROCESSING) {
        goTo(NAVIGATION_TARGETS.PROCESSING, { startProcessing: false });
      } else {
        render({ forceScrollToTop: false });
      }
    }
    if (c === "reset-all") {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = isJudge() ? `/judge?v=${APP_VERSION}` : `/?v=${APP_VERSION}`;
    }
  }));
}

setupControls();
if (isJudge()) {
  state.trustOpen = true;
}


render();
