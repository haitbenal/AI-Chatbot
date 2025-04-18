const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GOOGLE_API_KEY) {
    console.error('ERROR: GOOGLE_API_KEY is not set in .env file');
    process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, language = 'darija' } = req.body;
        
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
        
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const lastUserMessage = messages[messages.length - 1];
        const history = [];
        
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            
            if (msg.image) {
                const imageParts = [
                    {
                        text: msg.content || ''
                    },
                    {
                        inlineData: {
                            mimeType: msg.image.type,
                            data: msg.image.data.split(',')[1]
                        }
                    }
                ];
                
                history.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: imageParts
                });
            } else {
                history.push({
                    role: msg.role === 'user' ? 'user' : 'model',
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
        
        if (lastUserMessage.image) {
            if (lastUserMessage.content) {
                userMessageParts.push({ text: lastUserMessage.content });
            }
            
            userMessageParts.push({
                inlineData: {
                    mimeType: lastUserMessage.image.type,
                    data: lastUserMessage.image.data.split(',')[1]
                }
            });
        }
        
        if (userMessageParts.length === 0) {
            userMessageParts.push({ text: `${systemPrompt}\n\nUser: ${lastUserMessage.content}` });
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
