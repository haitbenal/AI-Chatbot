# 🌍 Multilingual AI Chat Assistant

An AI-powered chatbot built with **Node.js**, **Express**, and **Google's Gemini Pro API**.  
It supports **Moroccan Darija**, **French**, and **Modern Standard Arabic (MSA)**, allowing text and image inputs.  
Users can chat, upload images, and interact with the assistant in their preferred language.

## ✨ Features

- 🔄 Dynamic language support: Darija (Moroccan), French, and Arabic
- 🖼️ Upload and preview image inputs
- 💬 Message history saved in `localStorage`
- ⚡ Fast and responsive UI
- 📆 Easy to deploy and configure
- 🌐 Mobile-friendly and accessible interface


## 📁 Folder Structure

```
AI-Chatbot/
├── public/              # Frontend assets (HTML, CSS, JS, images)
│   ├── index.html
│   ├── chat.html
│   ├── css/ 
│   │   ├── app.css
│   │   └── chat.css
│   ├── img/
│   └── js/ 
│       └── script.js
├── .env.example         # Example environment template
├── .env                 # API key and configuration (git-ignored)
├── .gitignore           # Git ignore file
├── app.js               # Express server
├── package.json
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/haitbenal/AI-Chatbot.git
cd AI-Chatbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=3000
```

### 4. Run the Server

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

## 🌐 Languages Supported

| Language | Code    | Details |
|----------|---------|---------|
| Darija   | `darija`| Moroccan Arabic in **Latin script** |
| French   | `french`| Standard French with Moroccan touch |
| MSA      | `msa`   | Modern Standard Arabic (Arabic script) |

## 🧐 How It Works

- Frontend collects messages + optional image
- Backend sends data to Gemini Pro via Google's Generative AI SDK
- System prompt is set dynamically based on selected language
- Messages with images are sent using `inlineData` with base64 encoding
- Responses are streamed back to the frontend and rendered in the chat interface

## 📌 Example Prompts

- **Darija**: "Kifach ndir CV mzyan?"
- **French**: "Peux-tu m'aider à préparer un entretien d'embauche ?"
- **MSA**: "كيف أكتب رسالة تحفيزية؟"

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Vanilla JS, Lucide icons
- **Backend**: Node.js, Express
- **AI Engine**: Gemini Pro (`@google/generative-ai`)
- **Storage**: Browser `localStorage` for history

## 📦 Deployment

You can deploy this app easily on platforms like:

- **Render**
- **Vercel** (with a Node backend)
- **Heroku**
- **Railway**

Make sure to set the `GOOGLE_API_KEY` as an environment variable on your host.

## 🙌 Credits

- [Google Generative AI](https://ai.google.dev/)
- [Lucide Icons](https://lucide.dev/)
- Inspired by real-world multilingual needs

## 📝 License

MIT License — Feel free to use and modify!
