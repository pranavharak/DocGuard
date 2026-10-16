import hashlib
from typing import Dict, Any
from PIL import Image, ExifTags
import io

def extract_document_metadata(file_bytes: bytes, filename: str, ext: str, doc_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts SHA256 checksum, document structure metadata, and EXIF attributes.
    """
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    metadata = {
        "pdfProducer": doc_metadata.get("pdfProducer") or "Unknown / N/A",
        "creationDate": doc_metadata.get("creationDate") or "N/A",
        "modificationDate": doc_metadata.get("modificationDate") or "N/A",
        "sha256": sha256_hash,
        "pageCount": doc_metadata.get("pageCount", 1),
        "dimensions": doc_metadata.get("dimensions", "N/A"),
        "fileType": doc_metadata.get("fileType", ext.replace(".", "").upper()),
        "status": "no_major_anomaly"
    }

    # Extract EXIF tags for non-PDF image files
    if ext in [".jpg", ".jpeg", ".png", ".webp", ".tiff"]:
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))
            exif = pil_img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, tag_id)
                    if tag == "Software":
                        metadata["pdfProducer"] = str(value)
                    elif tag in ["DateTime", "DateTimeOriginal"]:
                        metadata["creationDate"] = str(value)
                    elif tag == "DateTimeDigitized":
                        metadata["modificationDate"] = str(value)
        except Exception:
            pass

    # Check for metadata anomalies (e.g., modified after export indicator)
    if metadata["creationDate"] != "N/A" and metadata["modificationDate"] != "N/A":
        if metadata["creationDate"] != metadata["modificationDate"]:
            metadata["status"] = "minor_anomaly_detected"
            metadata["modificationDate"] = f"{metadata['modificationDate']} (Modified after initial export)"

    return metadata
