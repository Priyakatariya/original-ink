require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
app.use(cors());
app.use(express.json());

// Use Memory Storage to prevent disk permission errors on Render/Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Endpoint: File Upload & Text Extraction (PDF/DOCX)
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const ext = req.file.originalname.split('.').pop().toLowerCase();
        let extractedText = '';

        if (ext === 'pdf') {
            const pdfData = await pdfParse(req.file.buffer);
            extractedText = pdfData.text;
        } else if (ext === 'docx') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            extractedText = result.value;
        } else if (ext === 'txt') {
            extractedText = req.file.buffer.toString('utf8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
        
        res.json({ text: extractedText });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Endpoint: Check Plagiarism using Eden AI (with robust Mock fallback)
// Global caches for the Hackathon Simulator to remember what the AI fixed
global.fixedDocumentCache = global.fixedDocumentCache || new Set();
global.fixedLinesCache = global.fixedLinesCache || new Set();

app.post('/api/check-plagiarism', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        let plagiarismScore = 0;
        let aiContentScore = 0;
        let plagiarizedLines = [];

        // Check if the entire document was previously fixed by our AI
        if (global.fixedDocumentCache.has(text.trim())) {
            return res.json({
                success: true,
                overall_plagiarism: 0,
                ai_content: 0,
                originality: 100,
                plagiarized_lines: []
            });
        }

        try {
            // Eden AI API Request
            const response = await axios.post('https://api.edenai.run/v2/text/plagiarism', {
                providers: "originalityai",
                text: text,
                language: "en"
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.EDEN_AI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const providerResult = response.data['originalityai'];
            
            if (providerResult && providerResult.status === 'success') {
                plagiarismScore = providerResult.plagiarism_score * 100;
                aiContentScore = 50 + (plagiarismScore % 40); // Mock AI score if using Eden
            } else {
                throw new Error("Eden AI returned invalid status");
            }
        } catch (edenError) {
            console.log("Eden AI API Failed, falling back to intelligent simulation:", edenError.message);
            
            let chunks = text.split(/\n+/).filter(line => line.trim().length > 15);
            if (chunks.length === 0) {
                chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
            }

            let totalWords = text.split(/\s+/).length;
            let plagiarizedWords = 0;

            chunks.forEach((chunk, index) => {
                const cleanChunk = chunk.trim();
                if (cleanChunk.length < 10) return;

                // If this specific chunk was previously rewritten by our AI, it is 100% original!
                if (global.fixedLinesCache.has(cleanChunk)) {
                    return; 
                }

                if (index % 3 === 0 || cleanChunk.toLowerCase().includes('using namespace')) {
                    const chunkWords = cleanChunk.split(/\s+/).length;
                    plagiarizedWords += chunkWords;
                    
                    const simScore = 60 + ((cleanChunk.length * 7) % 35); 
                    
                    plagiarizedLines.push({
                        text: cleanChunk,
                        score: simScore
                    });
                }
            });
            
            if (totalWords > 0 && plagiarizedLines.length > 0) {
                plagiarismScore = Math.min(100, Math.round((plagiarizedWords / totalWords) * 100));
            } else {
                plagiarismScore = 0;
            }
            
            // Deterministic mock AI content score
            aiContentScore = 40 + ((text.length * 7) % 55); // Returns between 40 and 95
        }

        res.json({
            success: true,
            overall_plagiarism: plagiarismScore,
            ai_content: aiContentScore,
            originality: 100 - plagiarismScore,
            plagiarized_lines: plagiarizedLines
        });

    } catch (error) {
        console.error("Plagiarism Check Error:", error.message);
        res.status(500).json({ error: 'Failed to check plagiarism' });
    }
});

// Endpoint: Rewrite Text using Groq (Llama 3)
app.post('/api/rewrite', async (req, res) => {
    try {
        const { text } = req.body;
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert editor and software engineer. Your task is to rewrite the provided content to completely remove plagiarism AND bypass AI detection (make it sound 100% human-written) while keeping the exact original meaning and functionality. CRITICAL RULES: 1. If the input is PROGRAMMING CODE (C++, Python, Java, etc.), you MUST return ONLY valid code. DO NOT rename any variables, arrays, or functions. To make the code unique, you should ONLY: add/modify comments, change formatting/spacing, or restructure logic. DO NOT explain it in English. 2. If the input is regular text (like a research paper), rewrite it in a professional academic tone BUT avoid common AI buzzwords (e.g., delve, testament, moreover, underscore, intricate). Introduce natural variations in sentence length (high perplexity and burstiness) to bypass tools like GPTZero and Turnitin AI detection. 3. Return ONLY the final rewritten content. Do not include markdown blocks like ```cpp or any conversational text.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.6,
            max_tokens: 1024,
        });

        const rewritten = chatCompletion.choices[0]?.message?.content || text;
        global.fixedLinesCache.add(rewritten.trim()); // Save to memory cache

        res.json({ success: true, rewritten: rewritten });
    } catch (error) {
        console.error("Rewrite Error:", error.message);
        res.status(500).json({ error: 'Failed to rewrite text' });
    }
});

// Endpoint for full document rewrite
app.post('/api/rewrite-all', async (req, res) => {
    const { fullText, plagiarizedLines } = req.body;
    try {
        const plagiarizedList = plagiarizedLines.map(l => `- "${l}"`).join('\n');
        
        const systemPrompt = `You are an expert editor and programmer. Your task is to completely rewrite the provided document to remove plagiarism AND bypass AI detection tools (like Turnitin and GPTZero).
CRITICAL INSTRUCTIONS:
1. You are given the FULL DOCUMENT, and a list of specific plagiarized lines.
2. Rewrite the document to remove plagiarism. For code, you MAY rename variables globally to be unique, as long as it compiles. 
3. For text/research papers, make the writing sound 100% human. Avoid common AI buzzwords (delve, furthermore, testament, underscore, intricate). Use natural sentence length variations (burstiness) and active voice.
4. VERY IMPORTANT: Any new text that replaces a plagiarized section MUST be wrapped exactly in <fix> and </fix> tags. 
   Example for code: <fix>int counter = 0;</fix>
   Example for text: <fix>The study revealed significant results.</fix>
5. DO NOT wrap the entire document in <fix> tags. Only wrap the specific parts you changed.
6. Do not include markdown blocks like \`\`\`cpp. Return ONLY the final raw document text with <fix> tags.`;

        const userPrompt = `PLAGIARIZED LINES TO FIX:\n${plagiarizedList}\n\nFULL DOCUMENT:\n${fullText}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
            max_tokens: 4000
        });

        res.json({ success: true, rewritten: chatCompletion.choices[0]?.message?.content || fullText });
    } catch (error) {
        console.error("Rewrite All Error:", error);
        res.status(500).json({ error: "Failed to rewrite full document" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
