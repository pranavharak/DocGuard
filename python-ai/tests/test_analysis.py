import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import io
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_synthetic_image_bytes(format="JPEG", size=(400, 300), color=(255, 255, 255)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_analyze_valid_jpeg():
    img_bytes = create_synthetic_image_bytes("JPEG")
    files = {"file": ("test_doc.jpg", img_bytes, "image/jpeg")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "result" in data
    assert data["result"] in ["likely_authentic", "suspicious", "potentially_tampered", "inconclusive"]
    assert "riskScore" in data
    assert "suspiciousRegions" in data
    assert "metadata" in data

def test_analyze_valid_png():
    img_bytes = create_synthetic_image_bytes("PNG")
    files = {"file": ("test_doc.png", img_bytes, "image/png")}
    response = client.post("/analyze", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "limitations" in data
    assert any("lossless" in lim.lower() for lim in data["limitations"])
