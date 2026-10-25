const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('DOCUGUARD AI — DASHBOARD STATISTICS TEST SUITE');
  console.log('====================================================\n');

  // Connect to DB for direct ground truth comparison
  await mongoose.connect(process.env.MONGO_URI);

  const testUserEmail = `stats_audit_${Date.now()}@docguard.ai`;
  const password = 'TestSecurePassword123!';
  const username = 'DynamicStatsAuditor';

  // 1. Create a fresh test user
  console.log(`[Test Setup] Creating fresh test user: ${testUserEmail}`);
  await axios.post(`${BASE_URL}/register`, { username, email: testUserEmail, password });
  const loginRes = await axios.post(`${BASE_URL}/login`, { email: testUserEmail, password });
  const token = loginRes.data.token;
  console.log(`[Test Setup] Logged in successfully. Token generated.\n`);

  // ----------------------------------------------------------------
  // Test 11: User with no analyzed documents
  // ----------------------------------------------------------------
  console.log('--- Test 11: User with no analyzed documents ---');
  const zeroStatsRes = await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const zeroStats = zeroStatsRes.data.stats;
  console.log('Initial stats for empty user:', zeroStats);
  console.log('Percentages with zero docs:', zeroStats.percentages);
  console.log('Critical alert for empty user:', zeroStatsRes.data.criticalAlert);
  
  if (zeroStats.totalAnalyzed === 0 &&
      zeroStats.percentages.likelyAuthentic === 0 &&
      zeroStats.percentages.suspicious === 0 &&
      zeroStats.percentages.potentiallyTampered === 0 &&
      !isNaN(zeroStats.percentages.likelyAuthentic) &&
      zeroStatsRes.data.criticalAlert.hasAlert === false) {
    console.log('✅ PASS Test 11: Zero analyzed documents handled cleanly with 0% (no NaN/Infinity) and no alert.\n');
  } else {
    throw new Error('Test 11 Failed');
  }

  // ----------------------------------------------------------------
  // Test 5 & 7: Upload without analysis -> should remain 0 analyzed
  // ----------------------------------------------------------------
  console.log('--- Test 5 & 7: Upload without analysis (pending/failed exclusion) ---');
  const testSample1 = 'E:/Final Year/DocGuard/dataset/validation/genuine/DOC_014_marksheet_genuine.png';
  const form1 = new FormData();
  form1.append('document', fs.createReadStream(testSample1), { filename: 'Sample_Document_01.png' });

  const uploadRes1 = await axios.post(`${BASE_URL}/dashboard/upload`, form1, {
    headers: { ...form1.getHeaders(), Authorization: `Bearer ${token}` }
  });
  const doc1 = uploadRes1.data.document;
  console.log('Uploaded document 1 (pending analysis): ID =', doc1._id);

  const statsAfterUpload = (await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })).data.stats;

  console.log('Stats after upload (before analysis): totalAnalyzed =', statsAfterUpload.totalAnalyzed);
  if (statsAfterUpload.totalAnalyzed === 0) {
    console.log('✅ PASS Test 7: Uploaded pending document is correctly EXCLUDED from totalAnalyzed.\n');
  } else {
    throw new Error('Test 7 Failed: Pending document was counted in totalAnalyzed');
  }

  // ----------------------------------------------------------------
  // Test 5 (cont): Analyze Document 1
  // ----------------------------------------------------------------
  console.log('--- Test 5: Analyze Document 1 ---');
  console.log('Triggering analysis for Document 1...');
  const analyzeRes1 = await axios.post(`${BASE_URL}/dashboard/analyze/${doc1._id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Document 1 analyzed! Verdict =', analyzeRes1.data.document.result, '| Risk =', analyzeRes1.data.document.riskScore);

  const statsAfterAnalyze1 = (await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })).data.stats;
  console.log('Stats after Document 1 analysis:', statsAfterAnalyze1);

  if (statsAfterAnalyze1.totalAnalyzed === 1) {
    console.log('✅ PASS Test 5: Total changed to 1 only AFTER analysis completed successfully.\n');
  } else {
    throw new Error('Test 5 Failed: totalAnalyzed did not increment to 1 after completion');
  }

  // ----------------------------------------------------------------
  // Test 6: Reanalyzing the same document -> should NOT increase count
  // ----------------------------------------------------------------
  console.log('--- Test 6: Reanalyzing the same document (deduplication) ---');
  console.log('Reanalyzing Document 1...');
  await axios.post(`${BASE_URL}/dashboard/analyze/${doc1._id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const statsAfterReanalyze = (await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })).data.stats;
  console.log('Stats after re-analyzing Document 1: totalAnalyzed =', statsAfterReanalyze.totalAnalyzed);

  if (statsAfterReanalyze.totalAnalyzed === 1) {
    console.log('✅ PASS Test 6: Reanalyzing the same document did NOT increase total count (remains 1).\n');
  } else {
    throw new Error('Test 6 Failed: Reanalyzed document caused duplicate counting');
  }

  // ----------------------------------------------------------------
  // Upload and analyze Document 2 (high risk tampered sample)
  // ----------------------------------------------------------------
  console.log('--- Testing High Risk Document Analysis ---');
  const testSample2 = 'E:/Final Year/DocGuard/dataset/validation/tampered/DOC_115_certificate_tampered.png';
  const form2 = new FormData();
  form2.append('document', fs.createReadStream(testSample2), { filename: 'Tampered_Certificate_02.png' });

  const uploadRes2 = await axios.post(`${BASE_URL}/dashboard/upload`, form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${token}` }
  });
  const doc2 = uploadRes2.data.document;
  console.log('Uploaded Document 2. Triggering analysis...');

  const analyzeRes2 = await axios.post(`${BASE_URL}/dashboard/analyze/${doc2._id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Document 2 analyzed! Verdict =', analyzeRes2.data.document.result, '| Risk =', analyzeRes2.data.document.riskScore);

  const statsAfterAnalyze2Res = await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsAfterAnalyze2 = statsAfterAnalyze2Res.data.stats;
  const alertAfter2 = statsAfterAnalyze2Res.data.criticalAlert;

  console.log('Stats after Document 2 analysis:', statsAfterAnalyze2);
  console.log('Critical Alert:', alertAfter2);

  // ----------------------------------------------------------------
  // Test 1, 2, 3, 4: Reconcile categories and percentages
  // ----------------------------------------------------------------
  console.log('\n--- Test 1, 2, 3, 4: Reconcile counts and percentages ---');
  const sumCategories = statsAfterAnalyze2.likelyAuthentic + statsAfterAnalyze2.suspicious + statsAfterAnalyze2.potentiallyTampered + statsAfterAnalyze2.unclassified;
  console.log(`Sum of categories: ${sumCategories} === totalAnalyzed: ${statsAfterAnalyze2.totalAnalyzed}`);
  console.log(`Percentages: Likely Authentic: ${statsAfterAnalyze2.percentages.likelyAuthentic}%, Suspicious: ${statsAfterAnalyze2.percentages.suspicious}%, Tampered: ${statsAfterAnalyze2.percentages.potentiallyTampered}%`);

  const sumPct = statsAfterAnalyze2.percentages.likelyAuthentic + statsAfterAnalyze2.percentages.suspicious + statsAfterAnalyze2.percentages.potentiallyTampered;
  console.log(`Sum of percentages: ${sumPct}% (approximately 100%)`);

  if (sumCategories === statsAfterAnalyze2.totalAnalyzed && Math.abs(sumPct - 100) <= 0.2) {
    console.log('✅ PASS Tests 1-4: Category counts reconcile with total, percentages use same denominator and sum to 100%.\n');
  } else {
    throw new Error('Tests 1-4 Failed: Categories or percentages did not reconcile');
  }

  // ----------------------------------------------------------------
  // Test 9: High-risk alert displays real document and real findings
  // ----------------------------------------------------------------
  console.log('--- Test 9: Verify dynamic Critical Alert Banner data ---');
  if (alertAfter2.hasAlert && alertAfter2.filename === 'Tampered_Certificate_02.png' && alertAfter2.riskScore >= 55) {
    console.log(`✅ PASS Test 9: Critical Alert properly detected real high-risk document: ${alertAfter2.filename} (${alertAfter2.riskScore}%) with finding: "${alertAfter2.issue.slice(0, 50)}..."\n`);
  } else {
    throw new Error('Test 9 Failed: Critical alert data did not match the analyzed document');
  }

  // ----------------------------------------------------------------
  // Test 8: Deleting a document updates statistics
  // ----------------------------------------------------------------
  console.log('--- Test 8: Deleting a document updates statistics ---');
  console.log(`Deleting Document 2 (ID: ${doc2._id})...`);
  const delRes = await axios.delete(`${BASE_URL}/dashboard/document/${doc2._id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Delete response:', delRes.data.message);

  const statsAfterDelete = (await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })).data.stats;
  console.log('Stats after deleting Document 2:', statsAfterDelete);

  if (statsAfterDelete.totalAnalyzed === 1 && statsAfterDelete.potentiallyTampered === 0) {
    console.log('✅ PASS Test 8: Deleting document properly reduced totalAnalyzed back to 1 and updated categories.\n');
  } else {
    throw new Error('Test 8 Failed: Statistics did not update after deletion');
  }

  // ----------------------------------------------------------------
  // Test 13: User isolation (user A cannot see user B's stats)
  // ----------------------------------------------------------------
  console.log('--- Test 13: User isolation check ---');
  const intruderEmail = `intruder_${Date.now()}@docguard.ai`;
  await axios.post(`${BASE_URL}/register`, { username: 'Intruder', email: intruderEmail, password });
  const intruderLogin = await axios.post(`${BASE_URL}/login`, { email: intruderEmail, password });
  const intruderToken = intruderLogin.data.token;

  const intruderStats = (await axios.get(`${BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${intruderToken}` }
  })).data.stats;
  console.log('Intruder stats (fresh user):', intruderStats);

  if (intruderStats.totalAnalyzed === 0 && statsAfterDelete.totalAnalyzed === 1) {
    console.log('✅ PASS Test 13: Complete user isolation verified. User B cannot see User A\'s statistics.\n');
  } else {
    throw new Error('Test 13 Failed: User data leaked across accounts');
  }

  // ----------------------------------------------------------------
  // Test 12: Unauthenticated / Invalid Token API failure handling
  // ----------------------------------------------------------------
  console.log('--- Test 12: API auth failure handling ---');
  try {
    await axios.get(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: 'Bearer invalid_or_expired_token' }
    });
    throw new Error('Test 12 Failed: Expected 401/403 for invalid token');
  } catch (err) {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      console.log(`✅ PASS Test 12: API properly rejected unauthorized request with HTTP ${err.response.status}.\n`);
    } else {
      throw err;
    }
  }

  console.log('====================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🎯');
  console.log('====================================================');

  await mongoose.disconnect();
}

runTestSuite().catch(e => {
  console.error('\n❌ TEST SUITE FAILED:', e.message);
  process.exit(1);
});
