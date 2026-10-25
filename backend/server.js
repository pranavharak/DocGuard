const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

require("dotenv").config();

const auth = require("./middleware/auth");
const { analyzeDocument } = require("./services/aiService");

const {
  insertUserData,
  fetchData,
  insert_document_data,
  fetch_documents,
  fetch_document,
  update_document_status,
  update_document_analysis,
  delete_document,
  classifyVerdict,
  calculateUserStats
} = require("./modules/db");

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to format document objects with full HTTP fileUrl for frontend rendering
const formatDocumentResponse = (doc) => {
  if (!doc) return doc;
  const docObj = doc.toObject ? doc.toObject() : { ...doc };
  if (docObj.filePath) {
    const filenameOnDisk = path.basename(docObj.filePath);
    docObj.fileUrl = `http://localhost:5000/uploads/${filenameOnDisk}`;
  }
  return docObj;
};

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, JPEG, PNG are allowed."));
    }
  }
});

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookie());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check Route
app.get("/api/health", (req, res) => {
  res.json({ message: "DocuGuard AI Server is running" });
});

// Authentication Routes
app.post("/register", async (req, res) => {
  try {
    const username = req.body.username || req.body.user_name;
    const email = req.body.email || req.body.user_email;
    const password = req.body.password || req.body.user_password;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields (username, email, password) are required" });
    }

    const existingUser = await fetchData(email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const success = await insertUserData(username, email, hashedPassword);

    if (success) {
      res.status(201).json({ message: "success" });
    } else {
      res.status(500).json({ message: "Error registering user" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email || req.body.user_email;
    const password = req.body.password || req.body.user_password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await fetchData(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "success",
      token,
      nm: user.username
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Document Upload Route
app.post("/dashboard/upload", auth, (req, res) => {
  upload.single("document")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please select a file to upload" });
    }

    try {
      const docData = {
        filename: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        dateOfUpload: new Date(),
        uploadStatus: "completed",
        analysisStatus: "pending",
        riskScore: null,
        confidence: null,
        result: "pending",
        analysis: null
      };

      const savedDoc = await insert_document_data(req.user.email, docData);

      if (savedDoc) {
        res.status(201).json({
          message: "success",
          document: formatDocumentResponse(savedDoc)
        });
      } else {
        res.status(500).json({ message: "Error saving document metadata" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error processing upload" });
    }
  });
});

// Document Fetching Routes
app.get("/dashboard/upload", auth, async (req, res) => {
  try {
    const documents = await fetch_documents(req.user.email);
    res.json({ message: "success", documents: (documents || []).map(formatDocumentResponse) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching documents" });
  }
});

app.get("/dashboard/documents", auth, async (req, res) => {
  try {
    const documents = await fetch_documents(req.user.email);
    res.json({ message: "success", documents: (documents || []).map(formatDocumentResponse) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching documents" });
  }
});

app.get("/dashboard/document/:id", auth, async (req, res) => {
  try {
    const document = await fetch_document(req.user.email, req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json({ message: "success", document: formatDocumentResponse(document) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching document" });
  }
});

// Dashboard Statistics Routes: GET /dashboard/stats & GET /api/dashboard/stats
const handleGetStats = async (req, res) => {
  try {
    const documents = await fetch_documents(req.user.email);
    const statsResult = calculateUserStats(documents);

    if (statsResult.criticalAlert && statsResult.criticalAlert.docRef) {
      statsResult.criticalAlert.document = formatDocumentResponse(statsResult.criticalAlert.docRef);
      delete statsResult.criticalAlert.docRef;
    }
    delete statsResult.distinctDocs;

    res.json({
      message: "success",
      stats: {
        totalAnalyzed: statsResult.totalAnalyzed,
        likelyAuthentic: statsResult.likelyAuthentic,
        suspicious: statsResult.suspicious,
        potentiallyTampered: statsResult.potentiallyTampered,
        unclassified: statsResult.unclassified,
        percentages: statsResult.percentages
      },
      criticalAlert: statsResult.criticalAlert
    });
  } catch (err) {
    console.error("Error calculating dashboard stats:", err);
    res.status(500).json({ message: "Error calculating dashboard statistics: " + err.message });
  }
};

app.get("/dashboard/stats", auth, handleGetStats);
app.get("/api/dashboard/stats", auth, handleGetStats);

// Document Deletion Routes: DELETE /dashboard/document/:id & DELETE /api/dashboard/document/:id
const handleDeleteDocument = async (req, res) => {
  try {
    const deleted = await delete_document(req.user.email, req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (deleted.filePath && fs.existsSync(deleted.filePath)) {
      try {
        fs.unlinkSync(deleted.filePath);
      } catch (e) {
        console.warn("Could not delete file from disk:", e.message);
      }
    }
    res.json({ message: "success", document: formatDocumentResponse(deleted) });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ message: "Error deleting document: " + err.message });
  }
};

app.delete("/dashboard/document/:id", auth, handleDeleteDocument);
app.delete("/api/dashboard/document/:id", auth, handleDeleteDocument);

// Document Analysis Route: POST /dashboard/analyze/:id
app.post("/dashboard/analyze/:id", auth, async (req, res) => {
  const docId = req.params.id;
  const userEmail = req.user.email;

  try {
    const document = await fetch_document(userEmail, docId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // 1. Update status to processing
    await update_document_status(userEmail, docId, "processing");

    // 2. Generate analysis data via Python engine or mock service
    const analysisData = await analyzeDocument(document.filePath, document.filename);

    // 3. Save analysis result in MongoDB and set status to completed
    const updatedDoc = await update_document_analysis(userEmail, docId, analysisData);

    if (updatedDoc) {
      res.json({
        message: "success",
        document: formatDocumentResponse(updatedDoc),
        analysis: analysisData
      });
    } else {
      await update_document_status(userEmail, docId, "failed");
      res.status(500).json({ message: "Failed to store document analysis" });
    }
  } catch (err) {
    console.log(err);
    await update_document_status(userEmail, docId, "failed");
    res.status(500).json({ message: "Error running document analysis: " + err.message });
  }
});

// Get Analysis Result Route: GET /dashboard/analysis/:id
app.get("/dashboard/analysis/:id", auth, async (req, res) => {
  try {
    const document = await fetch_document(req.user.email, req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      message: "success",
      document: formatDocumentResponse(document),
      analysis: document.analysis || {}
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error retrieving document analysis" });
  }
});

// Download Forensic PDF Report Route: GET /dashboard/document/:id/report
app.get("/dashboard/document/:id/report", auth, async (req, res) => {
  try {
    const document = await fetch_document(req.user.email, req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const docName = document.filename || "Document.pdf";
    const reportId = `FRNS-${(document._id ? document._id.toString() : Date.now().toString()).slice(-8).toUpperCase()}`;
    const result = document.result || "pending";
    const riskScore = document.riskScore ?? 0;
    const confidence = document.confidence ?? 0;
    const suspiciousRegions = document.suspiciousRegions || [];
    const ocrList = document.ocr || [];
    const metadata = document.metadata || {};
    const explanation = document.explanation || "No explanation recorded.";
    const recommendation = document.recommendation || "Review document against official source records.";

    const pdf = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    const safeFilename = docName.replace(/[^a-zA-Z0-9._-]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="DocuGuard_Forensic_Report_${safeFilename}.pdf"`
    );

    pdf.pipe(res);

    // Header styling
    pdf.fillColor("#0f172a").fontSize(20).font("Helvetica-Bold").text("DOCUGUARD AI FORENSIC AUDIT REPORT", { align: "left" });
    pdf.fillColor("#6366f1").fontSize(10).font("Helvetica-Bold").text("DIGITAL DOCUMENT INTEGRITY & AUTHENTICITY ASSESSMENT", { align: "left" });
    pdf.moveDown(0.5);

    // Meta bar
    pdf.fillColor("#64748b").fontSize(8).font("Helvetica").text(
      `Report ID: ${reportId}   |   Generated: ${new Date().toUTCString()}   |   Auditor: DocuGuard Automated Engine`,
      { align: "left" }
    );
    pdf.strokeColor("#e2e8f0").lineWidth(1).moveTo(40, pdf.y + 4).lineTo(555, pdf.y + 4).stroke();
    pdf.moveDown(1);

    // Section 1: Overview
    pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("1. DOCUMENT SPECIFICATIONS");
    pdf.moveDown(0.3);
    pdf.fontSize(9).font("Helvetica").fillColor("#334155");
    pdf.text(`Filename: ${docName}`);
    pdf.text(`MIME Type: ${document.fileType || metadata.fileType || "application/octet-stream"}`);
    pdf.text(`File Size: ${metadata.fileSize || "N/A"}`);
    pdf.text(`Uploaded On: ${document.dateOfUpload ? new Date(document.dateOfUpload).toLocaleString() : "N/A"}`);
    pdf.text(`SHA-256 Digest: ${metadata.sha256 || "N/A"}`);
    pdf.moveDown(1);

    // Section 2: Executive Verdict
    pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("2. EXECUTIVE VERDICT & RISK ASSESSMENT");
    pdf.moveDown(0.3);

    const isHigh = riskScore >= 55 || (result && result.toLowerCase().includes("tampered"));
    const isMedium = riskScore >= 35 && riskScore < 55;
    const verdictColor = isHigh ? "#e11d48" : isMedium ? "#d97706" : "#059669";
    const verdictTitle = isHigh ? "POTENTIALLY TAMPERED (HIGH RISK)" : isMedium ? "SUSPICIOUS / INCONCLUSIVE (MEDIUM RISK)" : "LIKELY AUTHENTIC (LOW RISK)";

    pdf.fillColor(verdictColor).fontSize(11).font("Helvetica-Bold").text(`Verdict: ${verdictTitle}`);
    pdf.fillColor("#334155").fontSize(9).font("Helvetica");
    pdf.text(`Calculated Risk Score: ${riskScore} / 100   |   Model Reliability Confidence: ${confidence}%`);
    pdf.moveDown(0.3);
    pdf.fillColor("#1e293b").font("Helvetica-Oblique").text(`Summary: ${explanation}`);
    pdf.moveDown(1);

    // Section 3: Forensic Findings
    pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`3. IDENTIFIED IRREGULARITIES (${suspiciousRegions.length} FLAGGED)`);
    pdf.moveDown(0.3);

    if (suspiciousRegions.length === 0) {
      pdf.fillColor("#059669").fontSize(9).font("Helvetica").text("No localized anomalies exceeded detection thresholds. Visual edge sharpness and text formatting conform to standard baseline patterns.");
      pdf.moveDown(1);
    } else {
      suspiciousRegions.forEach((reg, i) => {
        const num = i + 1;
        pdf.fillColor("#e11d48").fontSize(10).font("Helvetica-Bold").text(`Finding 0${num}: ${reg.label || `Suspicious Region ${num}`}`);
        pdf.fillColor("#334155").fontSize(8.5).font("Helvetica");
        pdf.text(`• What was detected: ${reg.issue || reg.detail || "Visual pattern inconsistency"}`);
        if (reg.whyItMatters) {
          pdf.text(`• Why it matters: ${reg.whyItMatters}`);
        }
        if (reg.evidence) {
          pdf.text(`• Evidence: ${reg.evidence}`);
        }
        if (reg.recommendedAction) {
          pdf.text(`• Action to take: ${reg.recommendedAction}`);
        }
        pdf.text(`• Region coordinates: [x: ${reg.x}, y: ${reg.y}, w: ${reg.width}, h: ${reg.height}] on Page ${reg.page || 1}`);
        pdf.moveDown(0.5);
      });
      pdf.moveDown(0.5);
    }

    // Section 4: Metadata Analysis
    pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("4. STRUCTURAL & METADATA FORENSICS");
    pdf.moveDown(0.3);
    pdf.fontSize(8.5).font("Helvetica").fillColor("#334155");
    pdf.text(`PDF Producer / Tool: ${metadata.pdfProducer || "Not present in the file"}`);
    pdf.text(`Creation Date: ${metadata.creationDate || "Not present in the file"}`);
    pdf.text(`Modification Date: ${metadata.modificationDate || "Not present in the file"}`);
    pdf.text(`PDF Version: ${metadata.pdfVersion || "N/A"}`);
    pdf.text(`Dimensions: ${metadata.dimensions || "N/A"}`);
    pdf.text(`Color Mode: ${metadata.colorMode || "N/A"}`);
    if (metadata.observations && metadata.observations.length > 0) {
      pdf.moveDown(0.3);
      pdf.font("Helvetica-Bold").text("Forensic Observations:");
      pdf.font("Helvetica");
      metadata.observations.forEach((obs) => {
        pdf.text(`- ${obs}`);
      });
    }
    pdf.moveDown(1);

    // Section 5: Extracted Text Excerpts
    if (ocrList && ocrList.length > 0) {
      pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(`5. TEXT PARSING & OCR SUMMARY (${ocrList.length} ELEMENTS EXTRACTED)`);
      pdf.moveDown(0.3);
      pdf.fontSize(8).font("Helvetica").fillColor("#334155");
      const sampleItems = ocrList.slice(0, 15);
      sampleItems.forEach((item) => {
        const flagText = item.suspicious ? " [FLAGGED]" : "";
        pdf.text(`[${item.engine || "OCR"}] ${item.field || "Text"}: "${item.value}" (Conf: ${item.confidence}%)${flagText}`);
      });
      if (ocrList.length > 15) {
        pdf.fillColor("#64748b").text(`... and ${ocrList.length - 15} additional text elements verified.`);
      }
      pdf.moveDown(1);
    }

    // Section 6: Recommended Actions & Disclaimer
    pdf.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("6. AUDITOR RECOMMENDATIONS & DISCLAIMER");
    pdf.moveDown(0.3);
    pdf.fontSize(8.5).font("Helvetica").fillColor("#334155");
    pdf.text(`Recommendation: ${recommendation}`);
    pdf.moveDown(0.5);
    pdf.fillColor("#64748b").fontSize(7.5).font("Helvetica-Oblique").text(
      "DISCLAIMER: DocuGuard AI is an automated digital document risk screening tool. Results are produced by deep learning visual anomaly detection models and multi-engine OCR extraction. Scores represent probabilistic risk assessments and do not replace legal, forensic handwriting, or administrative document certification. All flagged irregularities should be verified with the official issuing institution."
    );

    // Add page numbers on all pages
    const pages = pdf.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      pdf.switchToPage(i);
      pdf.fillColor("#94a3b8").fontSize(7).font("Helvetica").text(
        `Page ${i + 1} of ${pages.count} — DocuGuard AI Confidential Forensic Report`,
        40,
        pdf.page.height - 30,
        { align: "center", width: 515 }
      );
    }

    pdf.end();
  } catch (err) {
    console.error("Error generating forensic PDF report:", err);
    res.status(500).json({ message: "Failed to generate forensic PDF report: " + err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
