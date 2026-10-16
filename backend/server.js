const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookie = require("cookie-parser");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

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
  update_document_analysis
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
