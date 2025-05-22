const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only text files, PDFs, and Word documents
        const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only .txt, .pdf, .doc, and .docx files are allowed.'));
        }
    }
});

// Helper function to read file content
const readFileContent = (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
};

// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read file content
        const fileContent = readFileContent(req.file.path);
        if (!fileContent) {
            // Clean up the uploaded file if we can't read it
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Could not read file content' });
        }

        res.json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                path: req.file.path,
                content: fileContent
            }
        });
    } catch (error) {
        // Clean up uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Summarization endpoint
router.post('/summarize', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        if (!process.env.HUGGINGFACE_API_KEY) {
            return res.status(500).json({ error: 'Hugging Face API key not configured' });
        }

        // Using Hugging Face Inference API for summarization
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
            { inputs: text },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data || !response.data[0] || !response.data[0].summary_text) {
            throw new Error('Invalid response from Hugging Face API');
        }

        res.json({ summary: response.data[0].summary_text });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ 
            error: 'Failed to summarize text',
            details: error.message 
        });
    }
});

// Translation endpoint
router.post('/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Helper function for fallback translation
    async function robustTranslate(text, targetLanguage) {
        // 1. Try LibreTranslate (primary)
        try {
            const response = await axios.post('https://libretranslate.de/translate', {
                q: text,
                source: 'auto',
                target: targetLanguage,
                format: 'text'
            }, { timeout: 7000 });
            if (response.data && response.data.translatedText) {
                return response.data.translatedText;
            }
        } catch (err) {
            console.error('LibreTranslate primary failed:', err.message);
        }
        // 2. Try LibreTranslate (mirror)
        try {
            const response = await axios.post('https://lt.blitzw.in/translate', {
                q: text,
                source: 'auto',
                target: targetLanguage,
                format: 'text'
            }, { timeout: 7000 });
            if (response.data && response.data.translatedText) {
                return response.data.translatedText;
            }
        } catch (err) {
            console.error('LibreTranslate mirror failed:', err.message);
        }
        // 3. Try MyMemory API
        try {
            const langMap = { hi: 'HI', kn: 'KN' };
            const langCode = langMap[targetLanguage] || targetLanguage.toUpperCase();
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;
            const response = await axios.get(url, { timeout: 7000 });
            if (response.data && response.data.responseData && response.data.responseData.translatedText) {
                return response.data.responseData.translatedText;
            }
        } catch (err) {
            console.error('MyMemory translation failed:', err.message);
        }
        throw new Error('All translation services failed');
    }

    try {
        const translatedText = await robustTranslate(text, targetLanguage);
        res.json({ translatedText });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            error: 'Failed to translate text',
            details: error.message
        });
    }
});

module.exports = router; 