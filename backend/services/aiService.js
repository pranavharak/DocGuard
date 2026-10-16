const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

/**
 * analyzeDocument
 *
 * Sends the uploaded document to the Python FastAPI microservice for forensic analysis.
 *
 * When USE_MOCK_AI=true  → returns an explicit "not_configured" stub (no fabricated verdicts).
 * When USE_MOCK_AI=false → calls the real Python engine at AI_SERVICE_URL.
 *
 * If the Python engine is offline, unreachable, or returns an invalid response,
 * the error is propagated to the caller — no silent fallback to mock data.
 */
const analyzeDocument = async (filePath, filename = "") => {
  const useMock = process.env.USE_MOCK_AI === "true";

  if (useMock) {
    console.log("[AI Service] USE_MOCK_AI=true — returning 'not_configured' stub. No real analysis was performed.");
    return buildNotConfiguredResponse("Mock mode is enabled (USE_MOCK_AI=true). Set USE_MOCK_AI=false and start the Python microservice to enable real forensic analysis.");
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Document file not found at path: ${absolutePath}`);
  }

  try {
    console.log(`[AI Service] Sending ${filename} to Python microservice at ${aiServiceUrl}/analyze...`);
    const form = new FormData();
    form.append("file", fs.createReadStream(absolutePath), {
      filename: filename || path.basename(absolutePath)
    });

    const response = await axios.post(`${aiServiceUrl}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
      maxContentLength: 30 * 1024 * 1024
    });

    if (response.data && response.data.result) {
      return response.data;
    } else {
      throw new Error("Python microservice returned an empty or invalid response body.");
    }
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.message;
    console.error(`[AI Service Error] Failed to analyze document via Python engine: ${errorMsg}`);

    if (err.code === "ECONNREFUSED") {
      throw new Error(
        `Python AI microservice is offline at ${aiServiceUrl}. ` +
        `Start it with: cd python-ai && .\\venv\\Scripts\\activate && uvicorn main:app --port 8000`
      );
    }

    throw new Error(`AI Analysis service failed: ${errorMsg}`);
  }
};

/**
 * buildNotConfiguredResponse
 *
 * Returns a structured response that is API-contract-compatible with AnalysisResponse
 * but explicitly indicates that AI analysis has not been configured or is unavailable.
 * Never returns a fabricated verdict, risk score, or confidence value.
 */
const buildNotConfiguredResponse = (reason = "AI analysis not configured.") => {
  return {
    result: "not_configured",
    riskScore: null,
    confidence: null,
    analysisMethod: [],
    manipulationTypes: [],
    suspiciousRegions: [],
    ocr: [],
    metadata: {
      pdfProducer: "N/A",
      creationDate: "N/A",
      modificationDate: "N/A",
      sha256: "N/A",
      status: "not_analyzed"
    },
    explanation: "AI analysis is not configured. " + reason,
    recommendation: "Configure and start the Python AI microservice to enable forensic document analysis.",
    pageResults: [],
    limitations: [reason]
  };
};

module.exports = {
  analyzeDocument,
  buildNotConfiguredResponse
};
