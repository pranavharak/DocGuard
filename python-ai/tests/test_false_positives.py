import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import io
from PIL import Image, ImageDraw, ImageFont
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_synthetic_clean_document() -> bytes:
    """Creates a clean synthetic white document with crisp black text (simulating an authentic certificate/Aadhaar PDF)."""
    img = Image.new("RGB", (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw clean header & text
    draw.text((50, 50), "GOVERNMENT OF INDIA", fill=(0, 0, 0))
    draw.text((50, 100), "AADHAAR - UNIQUE IDENTIFICATION AUTHORITY OF INDIA", fill=(0, 0, 0))
    draw.text((50, 150), "Name: Rahul Sharma", fill=(0, 0, 0))
    draw.text((50, 200), "DOB: 15/08/1998", fill=(0, 0, 0))
    draw.text((50, 250), "Aadhaar No: 1234 5678 9012", fill=(0, 0, 0))
    draw.rectangle([50, 300, 550, 600], outline=(0, 0, 0), width=2)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()

def test_genuine_document_not_suspicious():
    doc_bytes = create_synthetic_clean_document()
    files = {"file": ("aadhaar_clean.jpg", doc_bytes, "image/jpeg")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    
    # Genuine document MUST be classified as likely_authentic with low risk score
    assert data["result"] == "likely_authentic"
    assert data["riskScore"] is not None and data["riskScore"] < 25
    assert len(data["suspiciousRegions"]) == 0
