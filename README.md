# AI Legal Aid Platform

A comprehensive legal assistance platform that combines a chatbot interface with LLaMA-powered legal document analysis.

## Project Structure

```
ai-legal-aid-platform/
│
├── client/                   # Frontend application
├── server/                   # Backend server
├── llama_service/           # LLaMA inference service
│   ├── main.py              # FastAPI service for LLaMA
│   └── requirements.txt     # Python dependencies
│
└── data/                    # Data directory
    └── legal-docs/          # Legal document text files
```

## Setup Instructions

### 1. Backend Setup

```bash
cd server
npm install
```

### 2. LLaMA Service Setup

```bash
cd llama_service
pip install -r requirements.txt
```

You'll need to download the LLaMA model file and place it in the `data` directory. The default expected path is `data/llama-2-7b-chat.Q4_K_M.gguf`.

### 3. Frontend Setup

```bash
cd client
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the LLaMA service:
```bash
cd llama_service
uvicorn main:app --reload
```

3. Start the frontend development server:
```bash
cd client
npm start
```

## Features

- Interactive legal chatbot interface
- LLaMA-powered legal document analysis
- Comprehensive legal document database
- Real-time legal assistance

## API Endpoints

### Backend Server
- `GET /`: Server status
- `POST /api/chat`: Send a message to the chatbot

### LLaMA Service
- `GET /`: Service status
- `POST /api/llama`: Send a question to the LLaMA model

## License

MIT 