import os
import tempfile
import io
from typing import List, Tuple, Dict, Any
import numpy as np
import cv2
from PIL import Image
import fitz  # PyMuPDF

from config import (
    MAX_FILE_SIZE_BYTES,
    MAX_PDF_PAGES,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    PDF_RENDER_DPI
)

class DocumentValidationError(Exception):
    pass

def validate_file_input(filename: str, content_type: str, file_bytes: bytes) -> str:
    """
    Validates file extension, MIME type, size, and header signature.
    Returns normalized extension.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise DocumentValidationError("File is empty (0 bytes).")
    
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise DocumentValidationError(f"File size ({len(file_bytes)} bytes) exceeds max limit of {MAX_FILE_SIZE_BYTES} bytes.")

    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise DocumentValidationError(f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Check magic numbers / signature
    if ext == ".pdf":
        if not file_bytes.startswith(b"%PDF"):
            raise DocumentValidationError("File has .pdf extension but invalid PDF signature.")
    elif ext in [".jpg", ".jpeg"]:
        if not (file_bytes.startswith(b"\xff\xd8\xff")):
            raise DocumentValidationError("Invalid JPEG image signature.")
    elif ext == ".png":
        if not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise DocumentValidationError("Invalid PNG image signature.")
    elif ext == ".webp":
        if not (file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP"):
            raise DocumentValidationError("Invalid WebP image signature.")
    
    return ext

def load_document_pages(file_bytes: bytes, ext: str) -> Tuple[List[np.ndarray], Dict[str, Any]]:
    """
    Converts image or PDF into normalized BGR OpenCV numpy image arrays.
    Returns (page_images, metadata).
    """
    page_images: List[np.ndarray] = []
    metadata = {
        "pageCount": 1,
        "pdfProducer": None,
        "creationDate": None,
        "modificationDate": None,
        "dimensions": None,
        "fileType": ext.replace(".", "").upper()
    }

    if ext == ".pdf":
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            metadata["pageCount"] = len(doc)
            
            if len(doc) > MAX_PDF_PAGES:
                doc.close()
                raise DocumentValidationError(f"PDF page count ({len(doc)}) exceeds max limit of {MAX_PDF_PAGES} pages.")
            
            pdf_meta = doc.metadata or {}
            metadata["pdfProducer"] = pdf_meta.get("producer") or pdf_meta.get("creator")
            metadata["creationDate"] = pdf_meta.get("creationDate")
            metadata["modificationDate"] = pdf_meta.get("modDate")

            zoom = PDF_RENDER_DPI / 72.0
            mat = fitz.Matrix(zoom, zoom)

            for page_idx in range(len(doc)):
                page = doc.load_page(page_idx)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                bgr_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                page_images.append(bgr_img)

            doc.close()
            if page_images:
                h, w = page_images[0].shape[:2]
                metadata["dimensions"] = f"{w}x{h}"
        except Exception as e:
            if isinstance(e, DocumentValidationError):
                raise e
            raise DocumentValidationError(f"Failed to process or render PDF document: {str(e)}")
    else:
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))
            pil_img.verify()  # verify integrity
            
            # Re-open after verify
            pil_img = Image.open(io.BytesIO(file_bytes))
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
            
            bgr_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            page_images.append(bgr_img)
            h, w = bgr_img.shape[:2]
            metadata["dimensions"] = f"{w}x{h}"
        except Exception as e:
            raise DocumentValidationError(f"Corrupt or unreadable image file: {str(e)}")

    return page_images, metadata
