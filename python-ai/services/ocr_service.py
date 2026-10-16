import os
from typing import List, Dict, Any, Tuple
import numpy as np
import pytesseract
from pytesseract import Output, TesseractNotFoundError

from config import TESSERACT_CMD

# Configure tesseract cmd if specified in env or Windows default
if os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

def check_ocr_availability() -> bool:
    """Checks if Tesseract binary is accessible on the system."""
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False

def extract_ocr_data(image_bgr: np.ndarray, page_num: int = 1) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
    """
    Extracts text, bounding boxes, and baseline alignment metrics using Tesseract.
    Returns (ocr_items, ocr_available, limitations).
    """
    limitations = []
    if not check_ocr_availability():
        limitations.append("Tesseract OCR engine is not installed or not found on system PATH. OCR analysis bypassed.")
        return [], False, limitations

    try:
        # Convert BGR to RGB for pytesseract
        rgb_img = image_bgr[:, :, ::-1]
        data = pytesseract.image_to_data(rgb_img, output_type=Output.DICT)

        ocr_items: List[Dict[str, Any]] = []
        n_boxes = len(data["text"])

        for i in range(n_boxes):
            text = data["text"][i].strip()
            conf = float(data["conf"][i])

            if text and conf > 30:  # Filter empty & low-confidence noise
                x = int(data["left"][i])
                y = int(data["top"][i])
                w = int(data["width"][i])
                h = int(data["height"][i])

                # Basic heuristic check for suspicious low-confidence text or text displacement
                suspicious = conf < 55

                ocr_items.append({
                    "field": text[:20],
                    "value": text,
                    "x": x,
                    "y": y,
                    "width": w,
                    "height": h,
                    "suspicious": suspicious,
                    "confidence": conf,
                    "page": page_num
                })

        return ocr_items, True, limitations
    except Exception as e:
        limitations.append(f"OCR processing failed: {str(e)}")
        return [], False, limitations
