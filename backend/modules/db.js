const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");
  } catch (err) {
    console.log("DB Connection Error:", err);
  }
};

connectDB();

// Document Schema inside User
const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, required: true },
  dateOfUpload: { type: Date, default: Date.now },
  uploadStatus: { type: String, default: "completed" },
  analysisStatus: { type: String, default: "pending" }, // "pending" | "processing" | "completed" | "failed"
  riskScore: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  result: { type: String, default: "Inconclusive" },
  manipulationTypes: { type: [String], default: [] },
  suspiciousRegions: { type: Array, default: [] },
  ocr: { type: Array, default: [] },
  metadata: { type: Object, default: {} },
  explanation: { type: String, default: "" },
  recommendation: { type: String, default: "" },
  analysis: { type: Object, default: {} }
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  documents: [documentSchema]
});

const User = mongoose.model("User", userSchema);

// Database Functions

const insertUserData = async (uname, uemail, upassword) => {
  try {
    const user = new User({
      username: uname,
      email: uemail,
      password: upassword
    });

    await user.save();
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const fetchData = async (uemail) => {
  try {
    const user = await User.findOne({ email: uemail });
    return user;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const insert_document_data = async (uemail, docData) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return false;

    user.documents.push(docData);
    await user.save();

    return user.documents[user.documents.length - 1];
  } catch (err) {
    console.log(err);
    return false;
  }
};

const fetch_documents = async (uemail) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return [];
    return user.documents;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const fetch_document = async (uemail, docIdentifier) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return null;

    const doc = user.documents.find(
      (d) => d._id.toString() === docIdentifier || d.filename === docIdentifier
    );
    return doc || null;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const update_document_status = async (uemail, docIdentifier, status) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return false;

    const doc = user.documents.find(
      (d) => d._id.toString() === docIdentifier || d.filename === docIdentifier
    );
    if (!doc) return false;

    doc.analysisStatus = status;
    await user.save();
    return doc;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const update_document_analysis = async (uemail, docIdentifier, analysisData) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return false;

    const doc = user.documents.find(
      (d) => d._id.toString() === docIdentifier || d.filename === docIdentifier
    );
    if (!doc) return false;

    doc.analysisStatus = "completed";
    doc.result = analysisData.result || "Potentially tampered";
    doc.riskScore = analysisData.riskScore || 0;
    doc.confidence = analysisData.confidence || 0;
    doc.manipulationTypes = analysisData.manipulationTypes || [];
    doc.suspiciousRegions = analysisData.suspiciousRegions || [];
    doc.ocr = analysisData.ocr || [];
    doc.metadata = analysisData.metadata || {};
    doc.explanation = analysisData.explanation || "";
    doc.recommendation = analysisData.recommendation || "";
    doc.analysis = analysisData;

    await user.save();
    return doc;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = {
  insertUserData,
  fetchData,
  insert_document_data,
  fetch_documents,
  fetch_document,
  update_document_status,
  update_document_analysis
};
