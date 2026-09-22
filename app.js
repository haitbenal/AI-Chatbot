const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.GOOGLE_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'YOUR APIKEY' || apiKey.includes('YOUR_API_KEY');

if (!apiKey) {
    console.warn('WARNING: GOOGLE_API_KEY is not set in .env file. Please configure a valid Gemini API key.');
} else if (isPlaceholderKey) {
    console.warn('WARNING: GOOGLE_API_KEY appears to be a placeholder. Please update it with your real key in .env file.');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(apiKey || '');

app.post('/api/chat', async (req, res) => {
    try {
        if (!apiKey || isPlaceholderKey) {
            return res.status(400).json({
                error: 'API key not configured',
                details: 'GOOGLE_API_KEY is missing or is still a placeholder. Please configure a valid Gemini API key in your .env file.',
            });
        }

        const { messages, language = 'darija' } = req.body || {};

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                details: 'The "messages" array is required and cannot be empty.',
            });
        }

        const lastUserMessage = messages[messages.length - 1];
        if (!lastUserMessage || (!lastUserMessage.content && !lastUserMessage.image)) {
            return res.status(400).json({
                error: 'Bad Request',
                details: 'Last message must contain text or an image.',
            });
        }
        
        let systemPrompt = '';
        
        if (language === 'darija') {
            systemPrompt = `
                You are a helpful assistant that speaks Moroccan Darija fluently.
                Always respond in Moroccan Darija using Latin script (not Arabic script).
                Use authentic Darija expressions, slang, and proverbs when appropriate.
                Be conversational and friendly, as if talking to a friend.
                For technical terms that don't have Darija equivalents, you can use the French term.
                
                Examples of Darija phrases to use:
                - Greetings: "Salam", "Labas", "Kif nta/nti"
                - Expressions: "Wah", "Iyeh", "Makayn mochkil", "Mzyan", "Bezzaf"
                - Questions: "Chno bghiti?", "Fin kayn?", "3lach?"
                
                Remember to use numbers for specific Arabic letters:
                - 3 for ع (ayn)
                - 7 for ح (ha)
                - 9 for ق (qaf)
                - 2 for ء (hamza)
            `;
        } else if (language === 'french') {
            systemPrompt = `
                You are a helpful assistant that speaks French fluently with a Moroccan touch.
                Always respond in French.
                Use a conversational and friendly tone.
                Occasionally incorporate Moroccan expressions or references when appropriate.
            `;
        } else if (language === 'msa') {
            systemPrompt = `
                You are a helpful assistant that speaks Modern Standard Arabic (فصحى) fluently.
                Always respond in Modern Standard Arabic using Arabic script.
                Use proper grammar and vocabulary.
                Be formal but friendly.
            `;
        }
        
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        const model = genAI.getGenerativeModel({ model: modelName });
        const history = [];
        
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            const role = msg.role === 'user' ? 'user' : 'model';
            
            if (msg.image && msg.image.data && msg.image.type) {
                const base64Data = msg.image.data.includes(',')
                    ? msg.image.data.split(',')[1]
                    : msg.image.data;

                const imageParts = [
                    {
                        text: msg.content || ''
                    },
                    {
                        inlineData: {
                            mimeType: msg.image.type,
                            data: base64Data
                        }
                    }
                ];
                
                history.push({
                    role,
                    parts: imageParts
                });
            } else if (msg.content) {
                history.push({
                    role,
                    parts: [{ text: msg.content }]
                });
            }
        }
        
        const chat = model.startChat({
            history,
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
            },
        });
        
        let userMessageParts = [];
        
        if (lastUserMessage.image && lastUserMessage.image.data && lastUserMessage.image.type) {
            if (lastUserMessage.content) {
                userMessageParts.push({ text: lastUserMessage.content });
            }
            
            const base64Data = lastUserMessage.image.data.includes(',')
                ? lastUserMessage.image.data.split(',')[1]
                : lastUserMessage.image.data;

            userMessageParts.push({
                inlineData: {
                    mimeType: lastUserMessage.image.type,
                    data: base64Data
                }
            });
        }
        
        if (userMessageParts.length === 0) {
            userMessageParts.push({ text: `${systemPrompt}\n\nUser: ${lastUserMessage.content || ''}` });
        } else {
            if (userMessageParts[0].text) {
                userMessageParts[0].text = `${systemPrompt}\n\nUser: ${userMessageParts[0].text}`;
            } else {
                userMessageParts.unshift({ text: `${systemPrompt}\n\nUser: ` });
            }
        }
        
        const result = await chat.sendMessage(userMessageParts);
        const response = await result.response;
        const text = response.text();
        
        res.json({
            role: 'assistant',
            content: text,
        });
    } catch (error) {
        console.error('Error in chat API:', error);
        res.status(500).json({
            error: 'Failed to process chat request',
            details: error.message || 'Unknown error',
        });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running correctly' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
