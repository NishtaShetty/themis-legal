// server/digilockerSimulator.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, 'digilocker-data.json');

function readData() {
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Upload a new document for a user
router.post('/upload', (req, res) => {
  const { uid, content, metadata } = req.body;
  if (!uid || !content) return res.status(400).json({ error: 'UID and content required' });

  const data = readData();
  if (!data[uid]) data[uid] = { documents: [] };

  const docId = Date.now().toString();
  data[uid].documents.push({
    docId,
    content,
    metadata: metadata || {},
    generatedAt: new Date().toISOString(),
    signed: false,
  });

  writeData(data);
  res.json({ success: true, docId });
});

// Get all documents for a user
router.get('/documents/:uid', (req, res) => {
  const uid = req.params.uid;
  const data = readData();

  if (!data[uid]) return res.status(404).json({ error: 'User not found' });

  res.json({ documents: data[uid].documents });
});

// Get a specific document content
router.get('/document/:uid/:docId', (req, res) => {
  const { uid, docId } = req.params;
  const data = readData();

  if (!data[uid]) return res.status(404).json({ error: 'User not found' });

  const doc = data[uid].documents.find(d => d.docId === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  res.json(doc);
});

// eSign a document
router.post('/esign', (req, res) => {
  const { uid, docId } = req.body;
  if (!uid || !docId) return res.status(400).json({ error: 'UID and docId required' });

  const data = readData();
  if (!data[uid]) return res.status(404).json({ error: 'User not found' });

  const doc = data[uid].documents.find(d => d.docId === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (doc.signed) {
    return res.status(400).json({ error: 'Document already signed' });
  }

  doc.signed = true;
  doc.signedAt = new Date().toISOString();
  doc.signature = "Simulated DigiLocker eSign";

  writeData(data);
  res.json({ success: true, message: 'Document signed' });
});

module.exports = router;
