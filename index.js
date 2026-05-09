import 'dotenv/config'; // Mengganti require('dotenv').config()
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import nama spesifik
import cors from 'cors';
import { fileURLToPath } from 'url'; // Diperlukan untuk membuat __dirname di ES Module

// Konfigurasi __dirname (Karena tidak tersedia secara default di ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Jika butuh folder public

// Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Konfigurasi Model
const generationConfig = {
    temperature: 0.7,
    topK: 1,
    topP: 1,
    maxOutputTokens: 100000,
};

const systemInstruction = {
    role: "system",
    parts: [{ text: "Kamu adalah 'Chef Rumahan', seorang asisten memasak yang ramah dan praktis. Tugasmu adalah memberikan resep makanan sederhana yang bisa dibuat di rumah dengan bahan-bahan yang mudah didapat. Jawab dengan gaya bahasa yang santai, gunakan emoji, dan berikan tips praktis. Jika user bertanya di luar masakan, arahkan kembali ke topik makanan dengan lembut." }]
};

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction,
    generationConfig: generationConfig
});

// Setup Upload File
const upload = multer({ dest: 'uploads/' });

// Helper function
function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

// 📍 Endpoint 1: Chat Teks Biasa
app.post('/chat/text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt diperlukan" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ result: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 📍 Endpoint 2: Chat dengan Gambar
app.post('/chat/image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!req.file) return res.status(400).json({ error: "Gambar diperlukan" });

        const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);
        
        const result = await model.generateContent([
            prompt || "Identifikasi bahan makanan di gambar ini dan berikan saya resep sederhana menggunakan bahan tersebut.", 
            imagePart
        ]);
        const response = await result.response;
        const text = response.text();

        fs.unlinkSync(req.file.path); // Hapus file sementara

        res.json({ result: text });
    } catch (error) {
        console.error(error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

// 📍 Endpoint 3: Chat dengan Dokumen
app.post('/chat/document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!req.file) return res.status(400).json({ error: "Dokumen diperlukan" });

        const documentPart = fileToGenerativePart(req.file.path, req.file.mimetype);

        const result = await model.generateContent([
            prompt || "Baca daftar bahan dari file ini dan berikan saya ide masakan.",
            documentPart
        ]);
        const response = await result.response;
        const text = response.text();

        fs.unlinkSync(req.file.path);
        res.json({ result: text });
    } catch (error) {
        console.error(error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

// 📍 Endpoint 4: Chat dengan Audio
app.post('/chat/audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!req.file) return res.status(400).json({ error: "Audio diperlukan" });

        const audioPart = fileToGenerativePart(req.file.path, req.file.mimetype);

        const result = await model.generateContent([
            prompt || "Dengarkan audio ini dan berikan respons terkait resep masakan.",
            audioPart
        ]);
        const response = await result.response;
        const text = response.text();

        fs.unlinkSync(req.file.path);
        res.json({ result: text });
    } catch (error) {
        console.error(error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server berjalan di http://localhost:${port}`);
});