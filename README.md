<img width="2048" height="1172" alt="image" src="https://github.com/user-attachments/assets/a67f9d47-f737-4ab7-9382-b91116ff5026" />

<img width="2048" height="1276" alt="image" src="https://github.com/user-attachments/assets/083f5bde-b546-4959-97b7-c7f20d714230" />

<img width="1270" height="1626" alt="image" src="https://github.com/user-attachments/assets/9ee5da73-017e-4aaf-8cae-eb91b7c88e4d" />

<img width="1294" height="1360" alt="image" src="https://github.com/user-attachments/assets/7e271502-234f-4ade-9232-1fa05a4e98e0" />

<img width="1386" height="1306" alt="image" src="https://github.com/user-attachments/assets/86d74b67-49d7-4828-91e6-a8c518ee8070" />

<img width="1608" height="1168" alt="image" src="https://github.com/user-attachments/assets/00d57f2f-4914-4839-a2ca-d257558ca804" />

<img width="1938" height="1324" alt="image" src="https://github.com/user-attachments/assets/55f980e5-9c2a-4e96-b2df-264581f3a3f5" />



































# AI-Powered Mock Interview Platform

A full-stack, AI-powered mock interview platform that helps users prepare for job interviews. It simulates realistic interview experiences with dynamic question generation based on job roles and companies.

## 🚀 Key Features

- **AI-Powered Dynamic Interview Rounds**
  - Adaptive interview generation based on job role and experience
  - Multiple question types (behavioral, technical, DSA, MCQ)
  - Contextual follow-up questions based on responses

- **Comprehensive AI Feedback System**
  - Detailed performance scoring (1-10)
  - ATS resume analysis with keyword matching
  - Strengths, weaknesses, and improvement recommendations

- **End-to-End Interview Experience**
  - Seamless flow from resume upload to final feedback
  - Interactive interface with real-time tracking
  - Professional summary with actionable insights

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI
- **AI**: Google Gemini API
- **Database**: In-memory session storage
- **Containerization**: Docker

## 📋 Prerequisites

- Node.js 18+ & npm 9+
- Python 3.9+
- Google Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))
- (Optional) Docker & Docker Compose

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_MOCK_INTERVIEW
   ```

2. **Set up environment variables**
   ```bash
   cp interview-backend/.env.example interview-backend/.env
   # Edit the .env file with your Gemini API key
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development Setup

#### Backend Setup

1. **Create and activate virtual environment**
   ```bash
   cd interview-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Gemini API key
   ```

4. **Start the backend server**
   ```bash
   # Make the start script executable
   chmod +x start.sh
   ./start.sh
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd ../ai-mock-web
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 🧪 Running Tests

```bash
# Backend tests
cd interview-backend
pytest

# Frontend tests
cd ../ai-mock-web
npm test
```

## 🏗 Project Structure

```
AI_MOCK_INTERVIEW/
├── ai-mock-web/           # Frontend (Next.js)
│   ├── src/              # Source code
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
│
├── interview-backend/     # Backend (FastAPI)
│   ├── app/              # Application code
│   ├── tests/            # Test files
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Docker configuration
│
├── docker-compose.yml    # Multi-container setup
└── README.md            # This file
```

## 🔧 Environment Variables

### Backend (`.env`)
```env
GOOGLE_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key  # Optional for TTS
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- FastAPI for the blazing fast backend
- Next.js for the React framework
- All contributors who helped in development


## 📞 Support

For any issues or questions, please [open an issue](https://github.com/yourusername/ai-mock-interview/issues) on GitHub.

## 📚 Documentation

For detailed API documentation, visit the [API Docs](http://localhost:8000/docs) after starting the backend server.

## 🚀 Next Steps

We're continuously improving the platform. Here are some planned enhancements:

- **Enhanced AI Feedback**: More detailed performance analytics
- **Multi-language Support**: Interviews in multiple languages
- **Mock Interview Recordings**: Practice with video recording and playback
- **Interview Templates**: Pre-defined templates for common job roles

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
