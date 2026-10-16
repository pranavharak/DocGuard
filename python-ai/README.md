# DocuGuard AI — Python AI & Forensics Microservice

This microservice provides automated document tampering detection using error level analysis (ELA), OCR baseline alignment checks, PDF metadata inspection, and a deep learning model adapter interface.

## 1. System Requirements & Installation

### Python Environment
- Python 3.10+
- Virtual environment in `python-ai/venv`

### System Dependencies
- **Tesseract OCR** (Optional but recommended):
  - Windows: Download installer from `https://github.com/UB-Mannheim/tesseract/wiki` and install to `C:\Program Files\Tesseract-OCR\tesseract.exe`. Add to system PATH.
  - Linux/Mac: `apt-get install tesseract-ocr` or `brew install tesseract`.
  - *Note:* If Tesseract is not found on PATH, the service bypasses OCR gracefully and returns empty OCR results with an explicit limitation warning without crashing.
- **PyMuPDF (`fitz`)**: Installed automatically via `requirements.txt` for high-resolution PDF rendering.

### Quick Setup Commands
```bash
# 1. Navigate to python-ai directory
cd python-ai

# 2. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Linux/Mac

# 3. Install requirements
pip install -r requirements.txt
```

---

## 2. Running the Microservice

To start the FastAPI service on port 8000:

```bash
python-ai\venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### API Endpoints
- `GET /health` — Service health check & component availability.
- `POST /analyze` — Accepts `multipart/form-data` with `file` field. Returns validated JSON document analysis response.

---

## 3. Pretrained Model Adapter

The neural network model adapter (`services/model_service.py`) checks for PyTorch model weights at `python-ai/weights/doc_tampering_model.pth`.
- If model weights are present, neural tampering localization is executed.
- If model weights are absent, model inference is reported as unavailable, and the engine relies on ELA forensics, OCR structure, and metadata analysis without fabricating model predictions.

Refer to `DATASET_AND_MODEL_GUIDE.md` for complete model training, fine-tuning, and dataset preparation instructions.

---

## 4. Running Automated Tests

```bash
python-ai\venv\Scripts\pytest python-ai/tests
```
