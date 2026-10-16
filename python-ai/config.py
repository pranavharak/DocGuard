import os

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_PDF_PAGES = 10
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "application/pdf"
}

# Forensic Parameters
ELA_JPEG_QUALITY = 92
PDF_RENDER_DPI = 150

# Model Paths & Execution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(BASE_DIR, "weights")
MODEL_WEIGHTS_PATH = os.path.join(WEIGHTS_DIR, "doc_tampering_model.pth")
DEVICE = os.getenv("DEVICE", "cpu")

# System Tesseract Path Check
TESSERACT_CMD = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
