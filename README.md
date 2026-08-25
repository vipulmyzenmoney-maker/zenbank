# ZenBank — AI Question Bank Generator & Verification Engine

> Automated AI-powered question bank generator and verification studio that feeds **[My Zen Learning](https://myzenlearning.com)** with high-quality, curriculum-aligned, interactive questions.

---

## Overview

ZenBank is a dedicated content engine that:

1. **Generates** thousands of multiple-choice questions from pre-loaded curriculum packs or custom topics using **Groq AI (Llama 3.3 70B)**.
2. **Verifies** generated questions through a rapid 1-click review studio with keyboard shortcuts and AI confidence scoring.
3. **Stores** all verified questions in a robust PostgreSQL database ready for My Zen Learning to consume.

---

## Tech Stack

| Component | Technology |
|:--|:--|
| **Framework** | Next.js 15 (React 19 + TypeScript) |
| **Styling** | Tailwind CSS v4 + Lucide Icons |
| **Database** | PostgreSQL via Prisma ORM |
| **AI Engine** | Groq SDK (Llama 3.3 70B Versatile) |
| **Hosting** | Railway (Docker container) |

---

## Screens

### 1. Generator Hub (`/`)
- **1-Click Curriculum Presets**: Pre-loaded K-12 Math, Reading, Science, SAT/ACT packs.
- **Custom Topic Input**: Enter any topic and select grade/subject/count.
- AI generates questions with options, explanations, and confidence scores.

### 2. Review Studio (`/review`)
- Speed-review cards with keyboard shortcuts:
  - `Enter` → Approve & Next
  - `F` → Flag & Next
  - `E` → Inline Edit
- **Batch Approve**: 1-click approve all questions with ≥95% AI confidence.

### 3. Question Bank Explorer (`/bank`)
- Search, filter by status (Draft / Verified / Flagged), and export CSV.
- Real-time stats: Total, Verified, Pending, Flagged counts.

---

## Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database
- Groq API key ([console.groq.com](https://console.groq.com))

### Installation

```bash
git clone https://github.com/akmrsingh/zenbank.git
cd zenbank
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
GROQ_API_KEY="gsk_your_groq_api_key_here"
```

### Database Setup

```bash
npx prisma db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Production Build

```bash
npm run build
npm start
```

---

## Deployment (Railway)

1. Push to GitHub.
2. Link the repo in [Railway](https://railway.com).
3. Add environment variables (`DATABASE_URL`, `GROQ_API_KEY`).
4. Railway auto-detects the `Dockerfile` and deploys.

Or deploy via CLI:

```bash
railway up --detach
```

---

## Database Schema

```
SyllabusPack
├── id (BigInt, PK)
├── title
├── gradeLevel
├── subject
├── topics (JSON array)
└── createdAt

Question
├── id (BigInt, PK)
├── syllabusPackId (FK → SyllabusPack)
├── questionText
├── options (JSON: [{id, text, isCorrect}])
├── correctAnswer
├── explanation
├── gradeLevel, subject, topic
├── difficulty (easy | medium | hard)
├── confidence (0-100)
├── status (draft | verified | flagged)
├── flagReason
├── verifiedAt
├── createdAt, updatedAt
└── Indexes: [status], [gradeLevel, subject]
```

---

## API Endpoints

| Method | Endpoint | Description |
|:--|:--|:--|
| `POST` | `/api/generate` | Generate questions from syllabus/topics |
| `GET` | `/api/questions` | List questions with filters & stats |
| `PATCH` | `/api/questions/[id]` | Approve, flag, or edit a question |
| `DELETE` | `/api/questions/[id]` | Delete a question |
| `POST` | `/api/questions/batch-approve` | Bulk approve all ≥95% confidence drafts |

---

## License

MIT © 2026 My Zen Learning
