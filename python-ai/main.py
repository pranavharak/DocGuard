"""
DocuGuard AI — Python Forensic Microservice
============================================
This is the RESET state of the Python AI microservice.

The /analyze endpoint currently returns an explicit "not_configured" response.
No ELA analysis, evidence fusion, or heuristic scoring is performed.
This prevents fabricated verdicts from being presented as real AI analysis.

The health endpoint is fully operational and reports the service status honestly.

To restore AI analysis:
  1. Implement and validate each forensic module.
  2. Re-integrate them into the /analyze endpoint step by step.
  3. Test each module independently before combining outputs.
  4. Never return a verdict unless evidence actually supports it.
"""

import os
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from config import ALLOWED_EXTENSIONS
from services.document_service import validate_file_input, DocumentValidationError

app = FastAPI(
    title="DocuGuard AI — Document Tampering Microservice",
    description="Forensic document analysis service. Currently in reset/configuration state.",
    version="2.0.0-reset"
)


@app.get("/health")
def health_check():
    """
    Returns service health status.
    Reports which components are available without running any analysis.
    """
    # Check OCR availability without importing the full service
    ocr_available = False
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        ocr_available = True
    except Exception:
        pass

    # Check if model weights exist (does not load them)
    from config import MODEL_WEIGHTS_PATH
    model_weights_present = os.path.exists(MODEL_WEIGHTS_PATH)

    return {
        "status": "ok",
        "service": "DocuGuard AI Python Engine",
        "ai_analysis": "not_configured",
        "components": {
            "file_validation": True,
            "pdf_rendering": True,
            "ocr": ocr_available,
            "model_weights_present": model_weights_present,
            "ela_analysis": False,
            "evidence_fusion": False
        },
        "supported_extensions": list(ALLOWED_EXTENSIONS),
        "note": (
            "AI analysis is in reset state. "
            "The /analyze endpoint will return result='not_configured' until "
            "the forensic pipeline is re-implemented and validated."
        )
    }


@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    """
    Document analysis endpoint.

    Currently in reset state — returns an explicit 'not_configured' response
    after validating the uploaded file. No forensic analysis is performed.
    No verdict, risk score, or confidence value is fabricated.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided in the request."
        )

    filename = file.filename
    content_type = file.content_type or ""

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # Validate extension, size, and magic bytes — this still runs even in reset state
    try:
        validate_file_input(filename, content_type, file_bytes)
    except DocumentValidationError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    # Return an explicit not_configured response — no fabricated analysis
    return JSONResponse(
        status_code=200,
        content={
            "result": "not_configured",
            "riskScore": None,
            "confidence": None,
            "analysisMethod": [],
            "manipulationTypes": [],
            "suspiciousRegions": [],
            "ocr": [],
            "metadata": {
                "pdfProducer": "N/A",
                "creationDate": "N/A",
                "modificationDate": "N/A",
                "sha256": "N/A",
                "pageCount": 1,
                "dimensions": "N/A",
                "fileType": os.path.splitext(filename.lower())[1].replace(".", "").upper(),
                "status": "not_analyzed"
            },
            "explanation": (
                "AI forensic analysis is currently in reset state. "
                "File validation passed, but no forensic pipeline has been configured. "
                "No verdict has been generated."
            ),
            "recommendation": (
                "The AI analysis pipeline is being rebuilt. "
                "Do not interpret this response as evidence of authenticity or tampering."
            ),
            "pageResults": [],
            "limitations": [
                "AI forensic analysis pipeline is not configured (reset state).",
                "ELA analysis: disabled.",
                "Evidence fusion: disabled.",
                "Neural model inference: disabled."
            ]
        }
    )
