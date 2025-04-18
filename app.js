const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Check if API key is available
if (!process.env.GOOGLE_API_KEY) {
  console.error('ERROR: GOOGLE_API_KEY is not set in .env file');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, language = 'darija' } = req.body;
    
    // Create a system prompt based on the selected language
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
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Extract the last user message
    const lastUserMessage = messages[messages.length - 1];
    
    // Prepare the chat history
    const history = [];
    
    // Add previous messages to history (excluding the last user message)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      
      if (msg.image) {
        // If message has an image, we need to handle it differently
        const imageParts = [
          {
            text: msg.content || ''
          },
          {
            inlineData: {
              mimeType: msg.image.type,
              data: msg.image.data.split(',')[1] // Remove the data:image/jpeg;base64, part
            }
          }
        ];
        
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: imageParts
        });
      } else {
        // Text-only message
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Create a chat session
    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });
    
    // Prepare the last user message with image if present
    let userMessageParts = [];
    
    if (lastUserMessage.image) {
      // Add text content if any
      if (lastUserMessage.content) {
        userMessageParts.push({ text: lastUserMessage.content });
      }
      
      // Add image content
      userMessageParts.push({
        inlineData: {
          mimeType: lastUserMessage.image.type,
          data: lastUserMessage.image.data.split(',')[1] // Remove the data:image/jpeg;base64, part
        }
      });
    }
    
    // If no image, just use the text content
    if (userMessageParts.length === 0) {
      userMessageParts.push({ text: `${systemPrompt}\n\nUser: ${lastUserMessage.content}` });
    } else {
      // If we have image parts, prepend the system prompt to the first text part
      if (userMessageParts[0].text) {
        userMessageParts[0].text = `${systemPrompt}\n\nUser: ${userMessageParts[0].text}`;
      } else {
        // If first part is not text, add a text part with the system prompt
        userMessageParts.unshift({ text: `${systemPrompt}\n\nUser: ` });
      }
    }
    
    // Send the message with all parts
    const result = await chat.sendMessage(userMessageParts);
    const response = await result.response;
    const text = response.text();
    
    // Return the response
    res.json({
      role: 'assistant',
      content: text,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Return a more detailed error response
    res.status(500).json({
      error: 'Failed to process chat request',
      details: error.message || 'Unknown error',
    });
  }
});

// Add a test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running correctly' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});