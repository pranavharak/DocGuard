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

const delete_document = async (uemail, docIdentifier) => {
  try {
    const user = await User.findOne({ email: uemail });
    if (!user) return false;

    const docIndex = user.documents.findIndex(
      (d) => d._id.toString() === docIdentifier || d.filename === docIdentifier
    );
    if (docIndex === -1) return false;

    const [deletedDoc] = user.documents.splice(docIndex, 1);
    await user.save();
    return deletedDoc;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const classifyVerdict = (result, riskScore) => {
  const lower = (result || '').toLowerCase().trim();
  if (lower.includes('tamper')) return 'potentiallyTampered';
  if (lower.includes('suspicious')) return 'suspicious';
  if (lower.includes('authentic') || lower.includes('clean') || lower.includes('pass')) return 'likelyAuthentic';

  if (riskScore !== null && riskScore !== undefined && !isNaN(Number(riskScore))) {
    const score = Number(riskScore);
    if (score >= 55) return 'potentiallyTampered';
    if (score >= 45) return 'suspicious';
    return 'likelyAuthentic';
  }

  return 'unclassified';
};

const calculateUserStats = (documents) => {
  const completedDocs = (documents || []).filter((d) => d.analysisStatus === 'completed');
  completedDocs.sort((a, b) => new Date(b.dateOfUpload || 0) - new Date(a.dateOfUpload || 0));

  const seenKeys = new Set();
  const distinctDocs = [];

  for (const doc of completedDocs) {
    const key = (doc.metadata && doc.metadata.sha256 && doc.metadata.sha256 !== 'N/A')
      ? 'sha:' + doc.metadata.sha256
      : 'file:' + (doc.filename || doc._id.toString());
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      distinctDocs.push(doc);
    }
  }

  let likelyAuthentic = 0;
  let suspicious = 0;
  let potentiallyTampered = 0;
  let unclassified = 0;

  for (const doc of distinctDocs) {
    const category = classifyVerdict(doc.result, doc.riskScore);
    if (category === 'likelyAuthentic') likelyAuthentic++;
    else if (category === 'suspicious') suspicious++;
    else if (category === 'potentiallyTampered') potentiallyTampered++;
    else unclassified++;
  }

  const totalAnalyzed = distinctDocs.length;
  const percentages = {
    likelyAuthentic: totalAnalyzed > 0 ? Number(((likelyAuthentic / totalAnalyzed) * 100).toFixed(1)) : 0,
    suspicious: totalAnalyzed > 0 ? Number(((suspicious / totalAnalyzed) * 100).toFixed(1)) : 0,
    potentiallyTampered: totalAnalyzed > 0 ? Number(((potentiallyTampered / totalAnalyzed) * 100).toFixed(1)) : 0
  };

  const highRiskDocs = distinctDocs.filter((d) => classifyVerdict(d.result, d.riskScore) === 'potentiallyTampered');
  highRiskDocs.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0) || new Date(b.dateOfUpload || 0) - new Date(a.dateOfUpload || 0));

  let criticalAlert = null;
  if (highRiskDocs.length > 0) {
    const topDoc = highRiskDocs[0];
    criticalAlert = {
      hasAlert: true,
      documentId: topDoc._id,
      filename: topDoc.filename,
      riskScore: topDoc.riskScore,
      confidence: topDoc.confidence,
      result: topDoc.result,
      issue: topDoc.suspiciousRegions?.[0]?.issue || topDoc.explanation || 'Visual pattern inconsistency detected.',
      detail: topDoc.explanation || 'Automated analysis identified visual irregularities deviating from standard baseline parameters.',
      docRef: topDoc
    };
  } else {
    criticalAlert = {
      hasAlert: false,
      message: 'No high-risk documents detected.'
    };
  }

  return {
    totalAnalyzed,
    likelyAuthentic,
    suspicious,
    potentiallyTampered,
    unclassified,
    percentages,
    criticalAlert,
    distinctDocs
  };
};

module.exports = {
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
};
