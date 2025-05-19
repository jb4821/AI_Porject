const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const AITool = require('../models/AITool');

const router = express.Router();

// Multer setup
const upload = multer({ dest: 'uploads/' });

// POST /api/tools/import
router.post('/tools/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Map Excel columns to schema fields
    const mappedData = rawData.map(row => ({
      name: row['name'],
      category: row['Category'],
      subtitle: row['description'],
      rating: row['rating'],
      websiteLink: row['Website'],
      imageLink: row['Image'],
      features: row['Features'],
      sharableLink: row['Sharable'],
      // Add more mappings if needed
    }))

    const inserted = await AITool.insertMany(mappedData);
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `${inserted.length} tools imported successfully.`,
      data: inserted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
