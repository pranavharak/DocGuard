from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SuspiciousRegion(BaseModel):
    id: int
    page: int = 1
    label: str
    x: int
    y: int
    width: int
    height: int
    confidence: Optional[int] = None
    issue: str
    detail: str
    evidenceSource: str = "forensic_ela"  # "model", "forensic_ela", "ocr", "metadata"

class OCRItem(BaseModel):
    field: str
    value: str
    x: int
    y: int
    width: int
    height: int
    suspicious: bool = False
    confidence: Optional[float] = None
    page: int = 1

class DocumentMetadata(BaseModel):
    pdfProducer: Optional[str] = None
    creationDate: Optional[str] = None
    modificationDate: Optional[str] = None
    sha256: str
    pageCount: int = 1
    dimensions: Optional[str] = None
    fileType: Optional[str] = None
    status: str = "analyzed"

class AnalysisResponse(BaseModel):
    result: str  # "likely_authentic", "suspicious", "potentially_tampered", "inconclusive"
    riskScore: Optional[int] = None
    confidence: Optional[int] = None
    analysisMethod: List[str] = Field(default_factory=list)
    manipulationTypes: List[str] = Field(default_factory=list)
    suspiciousRegions: List[SuspiciousRegion] = Field(default_factory=list)
    ocr: List[OCRItem] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    explanation: str
    recommendation: str
    pageResults: List[Dict[str, Any]] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
