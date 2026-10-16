import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_empty_file_upload():
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "empty" in data["detail"].lower()

def test_unsupported_file_extension():
    files = {"file": ("script.exe", b"MZ123456789", "application/x-msdownload")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "unsupported" in data["detail"].lower()

def test_corrupt_pdf_signature():
    files = {"file": ("fake.pdf", b"NOT_A_REAL_PDF_HEADER", "application/pdf")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "signature" in data["detail"].lower()
