# 📘 ZEN PLATFORM — UNIFIED SYSTEM SPECIFICATION & KNOWLEDGE BASE
**The Complete Technical, Architectural, Operational, and Database Reference for ZenBank & My Zen Learning**

*Target Environment: Google Docs / Atlassian Confluence / Notion Enterprise*  
*Classification: Internal Engineering, Operations & Curriculum Knowledge Base*  
*Version: 2.2.0 (Production Master)*  
*Last Updated: September 2026*  

---

## 📑 Master Table of Contents
1. [Platform Overview & Dual-Service Paradigm](#1-platform-overview--dual-service-paradigm)
2. [Global Architecture & Network Topology](#2-global-architecture--network-topology)
3. [Complete Database Dictionaries & Schemas](#3-complete-database-dictionaries--schemas)
   - 3.1 ZenBank Database Schema (PostgreSQL 16)
   - 3.2 My Zen Learning Database Schema (PostgreSQL / SQLite)
   - 3.3 Unified Tickets & Complaints Schema (`data/tickets.json`)
4. [ZenBank: Curriculum Intelligence Engine (Port 3001)](#4-zenbank-curriculum-intelligence-engine-port-3001)
   - 4.1 AI Generation Engine (Groq LLaMA 3.3 70B Versatile)
   - 4.2 Deduplication, Math Normalization & Structural Skeleton Engine
   - 4.3 Fisher-Yates Uniform MCQ Shuffler & Distractor Synthesizer
   - 4.4 Emergency Curriculum Fallback Engine (Parameterized Template Generator)
   - 4.5 Editorial Review Studio: Question & Option Editing (`/review`)
   - 4.6 Question Bank Repository (`/bank`)
5. [My Zen Learning: Student Experience & Operations Portal (Port 3000)](#5-my-zen-learning-student-experience--operations-portal-port-3000)
   - 5.1 Interactive Quiz Runner & Drawing Scratchpad
   - 5.2 In-Quiz Student Issue Reporting Modal & Cross-Service Auto-Flagging
   - 5.3 Dynamic Deck Sync Engine (`lib/zenbankClient.ts`)
   - 5.4 Unified Multi-Color Ticket Command Center (`/admin`)
   - 5.5 Contact & Curriculum Request Portal (`/contact`)
   - 5.6 Gamification, Diagnostic Assessment, Flashcards & Pomodoro
6. [Comprehensive REST API Catalog](#6-comprehensive-rest-api-catalog)
   - 6.1 ZenBank REST Endpoints
   - 6.2 My Zen Learning REST Endpoints
7. [End-to-End Operational Workflows](#7-end-to-end-operational-workflows)
   - Workflow 1: AI Prompt Synthesis -> Quality Review -> Student Deployment
   - Workflow 2: Student Issue Flag -> Auto-Flagging -> ZenBank Option Edit -> Resolution
   - Workflow 3: Public Topic Request -> Ticket Generation -> Curriculum Production
8. [Infrastructure, Deployment & Operational Runbook](#8-infrastructure-deployment--operational-runbook)
   - 8.1 Complete Repository Directory Tree
   - 8.2 Docker Compose Architecture
   - 8.3 PM2 Native Process Execution
   - 8.4 Tailscale Cross-Border Remote Networking
   - 8.5 Environment Variables Reference Dictionary
   - 8.6 Database Backup, Disaster Recovery & High-Availability Runbook
9. [Standard Operating Procedures (SOPs) & User Guides](#9-standard-operating-procedures-sops--user-guides)
   - SOP-01: Content Creators & AI Curriculum Generation
   - SOP-02: Reviewers & Option/Answer Key Correction
   - SOP-03: Platform Administrators & Ticket Resolution
   - SOP-04: Student & Parent Onboarding Guide
10. [Troubleshooting, Edge Cases & FAQ](#10-troubleshooting-edge-cases--faq)

---

## 1. Platform Overview & Dual-Service Paradigm

The **Zen Learning Platform** is an enterprise-grade EdTech ecosystem engineered to deliver adaptive, gamified learning for K-12 students while equipping educators with autonomous AI-assisted curriculum authoring tools.

The platform separates concerns into two decoupled microservices:

```
+---------------------------------------------------------------------------------------------------+
|                                      THE ZEN PLATFORM ECOSYSTEM                                   |
|                                                                                                   |
|   +---------------------------------------+       +-------------------------------------------+   |
|   |          MY ZEN LEARNING              |       |                 ZENBANK                   |   |
|   |            (Port 3000)                |       |               (Port 3001)                 |   |
|   |                                       |       |                                           |   |
|   |  * Student Quiz Runner                |       |  * Groq LLaMA 3.3 70B AI Generator        |   |
|   |  * Interactive Drawing Scratchpad     |       |  * Deduplication & Semantic Filtering     |   |
|   |  * In-Quiz Question Flagging Modal    |       |  * Fisher-Yates 4-Option MCQ Shuffler     |   |
|   |  * Multi-Color Ticket Command Center  |       |  * Emergency Curriculum Fallback Engine   |   |
|   |  * Dynamic ZenBank Deck Ingestion     |       |  * Editorial Review & MCQ Option Editor   |   |
|   |  * Diagnostic Assessment Engine       |       |  * Question Bank Repository               |   |
|   |  * Flashcards, Pomodoro & Games       |       |  * Verified Question Export API           |   |
|   |                                       |       |                                           |   |
|   |  Database: SQLite / PostgreSQL        |       |  Database: PostgreSQL 16 (zenbank_db)     |   |
|   +-------------------+-------------------+       +---------------------+---------------------+   |
|                       |                                                 |                         |
|                       +========= HTTP/REST Cross-Service API ===========+                         |
|                                 - Verified Quizzes Sync                                           |
|                                 - Real-Time Question Flagging                                     |
+---------------------------------------------------------------------------------------------------+
```

### Core Tenets of the Architecture
1. **Strict 4-Option MCQ Standard**: No multiple-choice question in the platform is permitted to have fewer or more than 4 choices (A, B, C, D). Both AI prompt validation and runtime fallback shufflers guarantee exactly 4 choices.
2. **Editorial Verification Gate**: AI never pushes directly to students. Content generated by LLMs lands in a `draft` state and must be vetted, edited, and approved in the Review Studio.
3. **Closed-Loop Feedback Loop**: In-quiz student complaints immediately auto-flag the affected item in ZenBank, present the complaint reason directly to editors, and populate a color-coded ticket on the Admin Dashboard.
4. **Self-Hosting Independence**: Operates fully on local server machines (e.g. Apple Silicon Mac, Linux mini-PC) via Docker or PM2, with zero ongoing cloud hosting fees.

---

## 2. Global Architecture & Network Topology

### Service Topology Table
| Property | My Zen Learning | ZenBank | Database Tier |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 15.5+ (App Router) | Next.js 15.5+ (App Router) | PostgreSQL 16.x |
| **Runtime** | Node.js 20 LTS | Node.js 20 LTS | Native / Docker |
| **Port** | `3000` | `3001` | `5432` |
| **Styling** | TailwindCSS 3.4, Lucide Icons | TailwindCSS 3.4, Lucide Icons | N/A |
| **ORM** | Prisma Client 6.x | Prisma Client 6.x | Native SQL |
| **Primary Consumer** | Students, Parents, Admins | Teachers, Curriculum Editors | Internal Microservices |
| **External AI** | None (pure client & ingest) | Groq Cloud API (LLaMA 3.3 70B) | None |

### Cross-Service Communication
* **Sync Direction (ZenBank $\rightarrow$ My Zen Learning)**: My Zen Learning calls `GET http://localhost:3001/api/questions/export?status=APPROVED` to build dynamic quiz decks.
* **Feedback Direction (My Zen Learning $\rightarrow$ ZenBank)**: When a student reports a question with ID `zb-XXX`, My Zen Learning issues `PATCH http://localhost:3001/api/questions/XXX` with `{ status: "flagged", flagReason: "..." }`.

---

## 3. Complete Database Dictionaries & Schemas

### 3.1 ZenBank Database Schema (PostgreSQL 16)
The ZenBank relational database is defined in `zenbank/prisma/schema.prisma`.

#### Table 1: `syllabus_packs`
Stores curriculum syllabus groupings, grade targets, and course topics.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Unique internal pack identifier |
| `title` | `VarChar(255)` | Not Null | N/A | Title of syllabus (e.g. "Grade 5 Fractions & Decimals") |
| `grade_level` | `VarChar(50)` | Not Null | N/A | Target grade (e.g. "Grade 5", "Middle School") |
| `subject` | `VarChar(100)` | Not Null | N/A | Primary subject (e.g. "Mathematics", "Science") |
| `topics` | `Json` | Not Null | `'[]'` | JSON array of topics and subtopics covered |
| `created_at` | `Timestamptz` | Not Null | `now()` | Creation timestamp |

#### Table 2: `questions`
Primary store for all generated, reviewed, and approved curriculum questions.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Canonical question ID (mapped as `zb-[id]` in My Zen Learning) |
| `syllabus_pack_id`| `BigInt` | Nullable, FK $\rightarrow$ `syllabus_packs.id` | `NULL` | Optional link to syllabus container |
| `question_text` | `Text` | Not Null | N/A | Question stem / prompt presented to students |
| `options` | `Json` | Not Null | N/A | Array of 4 choices: `[{"id":"A","text":"...","isCorrect":bool}, ...]` |
| `correct_answer` | `Text` | Not Null | N/A | Canonical text or ID matching the correct option |
| `explanation` | `Text` | Not Null | N/A | Pedagogical step-by-step reasoning explaining the answer |
| `grade_level` | `VarChar(50)` | Not Null | N/A | Grade level target (e.g. "Grade 5", "8th Grade") |
| `subject` | `VarChar(100)` | Not Null | N/A | Academic subject (e.g. "Mathematics", "Social Studies") |
| `topic` | `VarChar(255)` | Not Null | `""` | Specific subtopic (e.g. "Photosynthesis", "Linear Equations") |
| `difficulty` | `VarChar(20)` | Not Null | `'medium'` | Difficulty rating: `'easy'`, `'medium'`, `'hard'` |
| `confidence` | `Integer` | Not Null | `95` | AI confidence score (0–100) |
| `status` | `VarChar(30)` | Not Null, Indexed | `'draft'` | Lifecycle status: `'draft'`, `'reviewed'`, `'approved'`, `'rejected'`, `'flagged'` |
| `flag_reason` | `Text` | Nullable | `NULL` | Feedback text explaining why a question was flagged by a student/reviewer |
| `verified_at` | `Timestamptz` | Nullable | `NULL` | Timestamp when question was approved |
| `verified_by` | `VarChar(100)` | Nullable | `NULL` | Username of reviewer who approved question |
| `created_at` | `Timestamptz` | Not Null | `now()` | Record creation timestamp |
| `updated_at` | `Timestamptz` | Not Null | `now()` | Auto-updating record modification timestamp |

**Indexes**:
* `idx_questions_status` on (`status`)
* `idx_questions_grade_subj_topic` on (`grade_level`, `subject`, `topic`)
* `idx_questions_grade_status` on (`grade_level`, `status`)

#### Table 3: `question_analytics`
Tracks student performance telemetry per question.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `question_id` | `BigInt` | PK, FK $\rightarrow$ `questions.id` (Cascade) | N/A | Associated question ID |
| `times_served` | `Integer` | Not Null | `0` | Cumulative times presented to learners |
| `times_correct` | `Integer` | Not Null | `0` | Cumulative correct responses |
| `times_incorrect`| `Integer` | Not Null | `0` | Cumulative incorrect responses |
| `accuracy_rate` | `Decimal(5,2)` | Not Null | `0.00` | Percentage of correct answers (`0.00` to `100.00`) |
| `avg_time_seconds`|`Decimal(6,2)` | Not Null | `0.00` | Average time in seconds spent by students on this question |
| `is_auto_flagged`| `Boolean` | Not Null | `false` | True if question auto-flagged due to abnormally low accuracy |
| `last_served_at` | `Timestamptz` | Nullable | `NULL` | Timestamp of most recent quiz session attempt |

---

### 3.2 My Zen Learning Database Schema (PostgreSQL / SQLite)
Defined in `myzenlearning/prisma/schema.prisma`.

#### Table 1: `users`
Student, teacher, and administrator accounts.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Unique user account ID |
| `username` | `VarChar(100)` | Unique, Not Null | N/A | Unique handle |
| `email` | `VarChar(255)` | Unique, Nullable | `NULL` | Contact email |
| `password_hash` | `VarChar(255)` | Nullable | `NULL` | Salted bcrypt hash |
| `role` | `VarChar(20)` | Not Null | `'student'` | Roles: `'student'`, `'teacher'`, `'admin'` |
| `is_guest` | `Boolean` | Not Null | `false` | True for guest practice sessions |
| `preferences` | `Json` | Nullable | `{...}` | UI theme, audio toggles, Pomodoro intervals |
| `stats` | `Json` | Nullable | `{...}` | Study minutes, quizzes taken, streak metrics |
| `created_at` | `Timestamptz` | Not Null | `now()` | Registration timestamp |
| `updated_at` | `Timestamptz` | Not Null | `now()` | Last profile update |

#### Table 2: `content`
Custom quizzes, assignments, and local deck definitions.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Content item ID |
| `owner_id` | `BigInt` | FK $\rightarrow$ `users.id` (Cascade) | N/A | Creator account ID |
| `content_type` | `VarChar(20)` | Not Null | N/A | Types: `'quiz'`, `'deck'`, `'assignment'` |
| `title` | `VarChar(500)` | Not Null | N/A | Content display title |
| `description` | `Text` | Nullable | `NULL` | Summary description |
| `metadata` | `Json` | Nullable | `{...}` | Subject, grade level, category, tags |
| `items` | `Json` | Nullable | `'[]'` | Embedded array of questions or flashcard cards |
| `settings` | `Json` | Nullable | `{...}` | Public visibility, time limits |

#### Table 3: `attempts`
Audit records of student quiz and assignment completions.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Unique attempt ID |
| `user_id` | `BigInt` | FK $\rightarrow$ `users.id` (Cascade) | N/A | Student who completed attempt |
| `content_id` | `BigInt` | FK $\rightarrow$ `content.id` (Cascade) | N/A | Target quiz or deck ID |
| `attempt_type` | `VarChar(20)` | Not Null | N/A | Types: `'quiz'`, `'flashcard_session'` |
| `score` | `Decimal(6,2)` | Nullable | `NULL` | Points earned |
| `total_points` | `Decimal(6,2)` | Nullable | `NULL` | Total available points |
| `percentage` | `Decimal(5,2)` | Nullable | `NULL` | Score percentage (`0.00` to `100.00`) |
| `duration_seconds`| `Integer` | Nullable | `NULL` | Elapsed time in seconds |
| `details` | `Json` | Nullable | `{...}` | JSON map of submitted answers vs correct answers |
| `completed_at` | `Timestamptz` | Not Null | `now()` | Timestamp of completion |

#### Table 4: `student_mastery`
Topic-level competency tracking across grade levels.
| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigInt` | Primary Key, Autoincrement | Auto | Unique record ID |
| `user_id` | `BigInt` | FK $\rightarrow$ `users.id` (Cascade) | N/A | Student ID |
| `grade_level` | `VarChar(50)` | Not Null | N/A | Grade level (e.g. "Grade 5") |
| `subject` | `VarChar(100)` | Not Null | N/A | Subject domain (e.g. "math") |
| `topic` | `VarChar(255)` | Not Null | N/A | Granular skill (e.g. "Prime Numbers") |
| `mastery_score` | `Integer` | Not Null | `0` | Score (0 to 100) |
| `total_attempts`| `Integer` | Not Null | `0` | Number of times practiced |
| `correct_count` | `Integer` | Not Null | `0` | Number of correct responses |
| `streak_correct`| `Integer` | Not Null | `0` | Current consecutive correct answers |
| `last_practiced_at`| `Timestamptz`| Not Null | `now()` | Last attempt timestamp |

---

### 3.3 Unified Tickets & Complaints Schema (`data/tickets.json`)
Persistent support, complaint, and topic-request store located at `myzenlearning/data/tickets.json`.

```typescript
export type TicketType = 
  | "question_error"   // 🔴 Red / Rose: Student reports incorrect question, wrong options, bad key
  | "topic_request"    // 🟣 Purple: Student/parent requests new curriculum chapter or topic
  | "general_support"  // 🔵 Blue: General support, help or parent questions
  | "tech_issue"       // 🟠 Orange: Glitch, audio bug, or loading problem
  | "billing";         // 🟢 Emerald: Billing or subscription inquiry

export interface Ticket {
  id: string;                 // e.g. "tck-1725960000000-0"
  ticketNumber: string;       // e.g. "TCK-101"
  type: TicketType;           // Categorical classification
  title: string;              // High-level summary
  description: string;        // Full details or student notes
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  submitterName: string;      // Name or username of reporter
  submitterEmail?: string;    // Contact email
  questionId?: string;        // e.g. "zb-14" (present if question_error)
  quizId?: string;            // Quiz context
  quizTitle?: string;         // Name of quiz where issue arose
  selectedAnswer?: string;    // Student's chosen option
  correctAnswer?: string;     // Platform's asserted correct answer
  gradeLevel?: string;        // Associated grade
  subject?: string;           // Associated subject
  syncedToZenBank?: boolean;  // True if PATCH was forwarded to ZenBank
  resolutionNote?: string;    // Admin notes entered upon resolution
  createdAt: string;          // ISO 8601 timestamp
  resolvedAt?: string;        // ISO 8601 timestamp
}
```

---

## 4. ZenBank: Curriculum Intelligence Engine (Port 3001)

### 4.1 AI Generation Engine (Groq LLaMA 3.3 70B Versatile)
Located in `zenbank/lib/groq.ts`:
* **API Host**: `https://api.groq.com/openai/v1/chat/completions`
* **Model**: `llama-3.3-70b-versatile`
* **Temperature**: `0.3` (intentionally constrained for academic accuracy)
* **Response Format**: Strictly enforced JSON mode via system prompt constraints:
  ```json
  {
    "questions": [
      {
        "questionText": "What is the primary function of the cell mitochondria?",
        "options": [
          { "id": "A", "text": "Producing ATP energy for cellular processes", "isCorrect": true },
          { "id": "B", "text": "Synthesizing ribosomal RNA proteins", "isCorrect": false },
          { "id": "C", "text": "Regulating passage of ions across lipid membrane", "isCorrect": false },
          { "id": "D", "text": "Storing genetic instruction codes in chromosomes", "isCorrect": false }
        ],
        "correctAnswer": "A",
        "explanation": "Mitochondria are often referred to as the powerhouses of the cell because they generate most of the chemical energy needed to power the cell's biochemical reactions, stored in ATP.",
        "difficulty": "medium",
        "gradeLevel": "Grade 8",
        "subject": "Biology",
        "topic": "Cell Structure"
      }
    ]
  }
  ```

### 4.2 Deduplication, Math Normalization & Structural Skeleton Engine
Located in `zenbank/lib/deduplication.ts`:
To guarantee that 1,000 generated questions contain zero duplicates or repetitive drills, ZenBank passes all candidate questions through a multi-stage deduplication pipeline:

1. **Text Normalization (`normalizeQuestionText`)**:
   * Lowercases and trims all whitespace.
   * Standardizes mathematical operators: `×`, `*` $\rightarrow$ `x`; `÷` $\rightarrow$ `/`; `−`, `–`, `—` $\rightarrow$ `-`.
   * Strips non-alphanumeric punctuation.
   * Strips generic question prefixes that do not alter pedagogical semantics:
     * `"What is"`, `"Which of the following"`, `"Calculate"`, `"Find the"`, `"Determine the"`, `"Solve for"`, `"Evaluate"`.
2. **Structural Skeleton Extraction (`getStructuralSkeleton`)**:
   * Replaces numbers and fractions with canonical tokens: `14 * 9` $\rightarrow$ `<NUM> x <NUM>`.
   * Replaces diverse student names with `<NAME>`:
     * Names like Aarav, Priya, Maya, Lucas, Elena, Rohan, Chloe, Zayn, Ananya, Liam $\rightarrow$ `<NAME>`.
   * If two questions share an identical structural skeleton and are under 75 characters, the candidate is rejected as a formulaic duplicate.
3. **Token Jaccard & Character Levenshtein Similarity**:
   * Computes word-level Jaccard intersection over union.
   * If similarity against any existing question exceeds `0.78`, the candidate is rejected and re-prompted.

### 4.3 Fisher-Yates Uniform MCQ Shuffler & Distractor Synthesizer
Located in `zenbank/lib/shuffle.ts`:
* **Uniform Randomness**: AI models frequently exhibit bias by placing correct answers on choice A or C. The Fisher-Yates algorithm randomizes option orders uniformly ($O(n)$ complexity).
* **Guaranteed 4-Option Output**:
  * If a candidate question has only 2 or 3 options, the engine synthesizes realistic distractors from its `GENERAL_PLAUSIBLE_DISTRACTORS` corpus to complete exactly 4 options.
  * If a candidate has > 4 options, it preserves the correct answer and randomly trims down to exactly 3 distractors.

### 4.4 Emergency Curriculum Fallback Engine
Located in `zenbank/lib/fallbackGenerator.ts`:
* **Over 1,060 lines of parameterized code** covering:
  * **Social Studies & Civics**: US Constitution, Separation of Powers, Bill of Rights, Colonial Era, Ancient Civilizations, Geography.
  * **Science**: Cell Biology, Chemical Bonding, States of Matter, Newton's Laws of Motion, Ecosystems.
  * **Reading & Language Arts**: Figurative Language, Context Clues, Main Idea, Text Structures, Grammar.
  * **Mathematics**: Fraction operations, decimals, algebraic word problems, geometry perimeters and areas.
* **Manual Trigger Policy**: The emergency engine is strictly manual. If Groq encounters rate limits, ZenBank displays a countdown timer. The fallback engine only engages when explicitly selected by an administrator.

### 4.5 Editorial Review Studio: Question & Option Editing (`/review`)
Reviewers have granular control over question content:
* **MCQ Option Inputs**: All 4 options (A, B, C, D) are individually editable text inputs.
* **1-Click "Mark Correct"**: Each option features a button that immediately reassigns the correct answer in the database.
* **Complaint View**: Flagged questions display the student's exact complaint in an alert banner.

### 4.6 Question Bank Repository (`/bank`)
A central repository of approved questions. Supports searching by keyword, filtering by subject/grade, viewing detailed stats, and deleting obsolete questions.

---

## 5. My Zen Learning: Student Experience & Operations Portal (Port 3000)

### 5.1 Interactive Quiz Runner & Drawing Scratchpad
Located in `myzenlearning/app/quizzes/[id]/page.tsx`:
* **Dynamic Quiz Ingestion**: Automatically detects whether a quiz is a static built-in deck or a dynamic ZenBank deck (prefixed with `zenbank-`).
* **Interactive Drawing Board (`DrawingBoard.tsx`)**: Built-in canvas allowing students to write out math problems directly on screen.
* **Scoring & Gamification**:
  * 10 points awarded per correct answer.
  * Streak tracking with visual multipliers.
  * Confetti animation (`canvas-confetti`) on high completion scores.

### 5.2 In-Quiz Student Issue Reporting Modal & Cross-Service Auto-Flagging
* Located directly in the quiz header via the **"Report Issue"** button.
* When submitted, it calls `/api/tickets` with:
  * `type: "question_error"`
  * `questionId: "zb-XXX"`
  * Selected answer, correct answer, and custom notes.
* The API forwards the complaint to ZenBank via `PATCH /api/questions/XXX` setting status to `flagged`.

### 5.3 Dynamic Deck Sync Engine (`lib/zenbankClient.ts`)
* **Endpoint Proxying**: Queries `GET /api/zenbank-sync` (internal proxy) with fallback to direct URL.
* **Grouping**: Groups raw questions into decks by `Grade_Subject_Topic`.
* **Deck Structure**: Automatically calculates estimated completion time and total points.

### 5.4 Unified Multi-Color Ticket Command Center (`/admin`)
Located at `/admin` (protected by PIN, default `1234`):

#### Ticket Color Coding:
```
+-------------------------------------------------------------------------------------------------+
| 🔴 RED / ROSE: Question Bugs (#TCK-101)        | Action: [ ⚡ Fix in ZenBank ] -> /review       |
| 🟣 PURPLE: Topic Requests (#TCK-102)           | Action: [ 🚀 Generate in ZenBank ] -> /        |
| 🔵 BLUE: General Support (#TCK-103)            | Action: Status Toggle & Direct Reply           |
| 🟠 AMBER: Technical Issues (#TCK-104)          | Action: System Health Investigation            |
| 🟢 EMERALD: Billing & Resolved Tickets         | Action: [ Reopen Ticket ]                      |
+-------------------------------------------------------------------------------------------------+
```

### 5.5 Contact & Curriculum Request Portal (`/contact`)
Allows parents and students to request new curriculum topics. Submissions automatically create a `topic_request` ticket in the Admin Hub.

### 5.6 Gamification, Diagnostic Assessment, Flashcards & Pomodoro
* **Diagnostic Assessment (`/assessment`)**: Baseline diagnostic testing across grade levels.
* **Flashcards (`/flashcards`)**: Auto-generates active-recall decks from verified ZenBank questions.
* **Pomodoro Timer (`/pomodoro`)**: Focus sessions with customizable intervals.
* **Games (`/games`)**: Educational mini-games (math speed runs, word scrambles, memory match).

---

## 6. Comprehensive REST API Catalog

### 6.1 ZenBank REST Endpoints (Port 3001)

#### 1. Export Verified Questions
* **Method**: `GET`
* **Path**: `/api/questions/export`
* **Query Parameters**:
  * `status` (string, optional): Filter by status (`APPROVED`, `verified`). Defaults to `APPROVED`.
  * `limit` (number, optional): Maximum items to return (default: `500`).
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 45,
    "questions": [
      {
        "id": 14,
        "questionText": "What is 15% of 80?",
        "options": [
          { "id": "A", "text": "12", "isCorrect": true },
          { "id": "B", "text": "10", "isCorrect": false },
          { "id": "C", "text": "14", "isCorrect": false },
          { "id": "D", "text": "16", "isCorrect": false }
        ],
        "correctAnswer": "12",
        "explanation": "To find 15% of 80, multiply 0.15 by 80: 0.15 * 80 = 12.",
        "gradeLevel": "Grade 6",
        "subject": "Mathematics",
        "topic": "Percentages",
        "difficulty": "medium",
        "status": "APPROVED"
      }
    ]
  }
  ```

#### 2. Update Question / Edit Options / Flag Question
* **Method**: `PATCH`
* **Path**: `/api/questions/[id]`
* **Request Body**:
  ```json
  {
    "status": "APPROVED",
    "questionText": "Updated question prompt...",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "Option B text",
    "explanation": "Updated step-by-step reasoning...",
    "flagReason": null
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Question updated successfully",
    "question": { "id": 14, "status": "APPROVED" }
  }
  ```

---

### 6.2 My Zen Learning REST Endpoints (Port 3000)

#### 1. Unified Tickets API
* **Method**: `GET`
* **Path**: `/api/tickets`
* **Query Parameters**:
  * `type` (optional): Filter by ticket type.
  * `status` (optional): Filter by status (`open`, `resolved`).
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "tickets": [ ... ],
    "counts": { "total": 12, "open": 4, "resolved": 8, "questionErrors": 2, "topicRequests": 1, "general": 1 }
  }
  ```

* **Method**: `POST`
* **Path**: `/api/tickets`
* **Request Body**:
  ```json
  {
    "type": "question_error",
    "title": "Question Issue: Option choices incorrect",
    "description": "Student reports option C is correct, not A",
    "questionId": "zb-14",
    "quizId": "zenbank-grade-6-math",
    "submitterName": "Alex",
    "priority": "high"
  }
  ```
* **Behavior**: Saves ticket to `data/tickets.json` and automatically forwards `PATCH` to ZenBank setting `status: "flagged"`.

---

## 7. End-to-End Operational Workflows

### Workflow 1: AI Prompt Synthesis -> Quality Review -> Student Deployment
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Educator
    participant ZB as ZenBank Generator (:3001)
    participant Groq as Groq LLaMA 3.3 70B
    participant Dedup as Dedup & Shuffler
    participant PG as PostgreSQL
    participant MZL as My Zen Learning (:3000)
    actor Student as Student

    Admin->>ZB: Input Topic ("Photosynthesis"), Grade ("7th"), Count (10)
    ZB->>Groq: Generate strict 4-option MCQs in structured JSON
    Groq-->>ZB: Return candidate questions
    ZB->>Dedup: Normalize math, extract skeleton, check similarity
    Dedup-->>ZB: Approved candidate list (0 duplicates)
    ZB->>PG: Save records with status = 'draft'
    Admin->>ZB: Open Review Studio (/review) -> Edit options -> Click Approve
    ZB->>PG: Update status to 'APPROVED'
    Admin->>MZL: Open /admin -> Click "Sync from ZenBank"
    MZL->>ZB: GET /api/questions/export?status=APPROVED
    ZB-->>MZL: Return verified questions
    MZL->>MZL: Assemble dynamic quiz deck
    Student->>MZL: Takes quiz with newly approved questions
```

---

### Workflow 2: Student Issue Flag -> Auto-Flagging -> ZenBank Option Edit -> Resolution
```mermaid
sequenceDiagram
    autonumber
    actor Student as Student in Quiz
    participant MZL as My Zen Learning Quiz Runner
    participant Tck as Tickets API (/api/tickets)
    participant ZB as ZenBank API
    participant PG as PostgreSQL
    actor Admin as Admin / Reviewer

    Student->>MZL: Clicks "Report Issue" on Question zb-14
    Student->>MZL: Selects "Wrong Answer Marked" -> Types: "Answer is 12, not 15"
    MZL->>Tck: POST /api/tickets (type: question_error, questionId: zb-14)
    Tck->>Tck: Append to data/tickets.json (Creates 🔴 Ticket #TCK-104)
    Tck->>ZB: PATCH /api/questions/14 { status: "flagged", flagReason: "..." }
    ZB->>PG: Set status = 'flagged', flag_reason = 'Answer is 12, not 15'
    Admin->>MZL: Opens /admin -> Sees 🔴 Ticket #TCK-104
    Admin->>MZL: Clicks "⚡ Fix in ZenBank"
    MZL-->>Admin: Jumps directly to ZenBank /review (Flagged tab)
    Admin->>ZB: Sees student complaint in red banner -> Edits Option A -> Clicks "Mark Correct" -> "Save & Approve"
    ZB->>PG: Persists updated option and correct answer key
    Admin->>MZL: Returns to Admin Hub -> Clicks "Mark Resolved"
    MZL->>Tck: PATCH /api/tickets (status: "resolved")
```

---

## 8. Infrastructure, Deployment & Operational Runbook

### 8.1 Repository Directory Tree
```
scratch/
├── docker-compose.yml              # Multi-container orchestration (ZenBank, MZL, Postgres)
├── ecosystem.config.js             # PM2 production process supervisor
├── setup-local-server.sh           # Automated initialization & health-check script
├── LOCAL_SERVER_DEPLOYMENT.md      # Deployment runbook
├── zenbank/                        # ZenBank service root
│   ├── app/
│   │   ├── api/questions/          # Question CRUD, export, and status endpoints
│   │   ├── bank/page.tsx           # Searchable Question Bank UI
│   │   ├── review/page.tsx         # Review Studio with option & answer key editor
│   │   └── page.tsx                # AI Generator UI with Groq & emergency fallback
│   ├── lib/
│   │   ├── deduplication.ts        # Text normalization & skeleton deduplication
│   │   ├── fallbackGenerator.ts    # 1,060-line parameterized emergency fallback
│   │   ├── groq.ts                 # Groq LLaMA 3.3 client
│   │   └── shuffle.ts              # Fisher-Yates 4-option shuffler
│   ├── prisma/schema.prisma        # PostgreSQL database definition
│   └── package.json
└── myzenlearning/                  # My Zen Learning service root
    ├── app/
    │   ├── admin/page.tsx          # Multi-Color Ticket Command Center & Sync Engine
    │   ├── api/tickets/route.ts    # Unified ticketing engine & auto-flag forwarder
    │   ├── contact/page.tsx        # Topic request & support contact portal
    │   └── quizzes/[id]/page.tsx   # Quiz Runner with drawing board & flag modal
    ├── data/tickets.json           # Persistent ticket store
    ├── lib/zenbankClient.ts        # Cross-service client & dynamic deck builder
    ├── prisma/schema.prisma        # User, Attempt, and Mastery database definition
    └── package.json
```

### 8.2 Docker Compose Architecture
To run the entire platform via Docker:
```bash
# Launch ZenBank, My Zen Learning, and PostgreSQL in isolated containers
docker compose up -d

# Check container status
docker compose ps

# View application logs
docker compose logs -f
```

### 8.3 PM2 Native Process Execution
To run natively without containers (e.g. on macOS):
```bash
# Install PM2 globally
npm install -g pm2

# Launch both microservices
pm2 start ecosystem.config.js

# Check status
pm2 status

# Configure PM2 to start on system boot
pm2 startup
pm2 save
```

### 8.4 Tailscale Cross-Border Remote Networking
To access your local server securely from anywhere in the world:
1. Install Tailscale on the server machine: `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`
2. Install Tailscale on your laptop/phone.
3. Access services directly via the server's Tailscale IP:
   * **My Zen Learning**: `http://100.x.y.z:3000`
   * **ZenBank**: `http://100.x.y.z:3001`

### 8.5 Environment Variables Reference Dictionary

#### ZenBank (`zenbank/.env`):
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | HTTP listening port |
| `NODE_ENV` | `production` | Node execution environment |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/zenbank_db?schema=public` | PostgreSQL connection string |
| `GROQ_API_KEY` | `gsk_...` | Groq API authentication key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | LLM model identifier |
| `ALLOWED_ORIGIN`| `http://localhost:3000` | CORS whitelist for cross-service calls |

#### My Zen Learning (`myzenlearning/.env`):
| Variable | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP listening port |
| `NODE_ENV` | `production` | Node execution environment |
| `DATABASE_URL` | `file:./myzenlearning.db` | Database connection string |
| `NEXT_PUBLIC_ZENBANK_URL` | `http://localhost:3001` | Public client URL for ZenBank |
| `ZENBANK_INTERNAL_URL` | `http://localhost:3001` | Internal Docker / LAN URL for server-side fetches |
| `ADMIN_PIN` | `1234` | Master passcode for `/admin` access |

### 8.6 Database Backup Runbook
* **ZenBank (PostgreSQL)**:
  ```bash
  pg_dump -U postgres zenbank_db > zenbank_backup_$(date +%F_%H%M%S).sql
  ```
* **My Zen Learning (SQLite)**:
  ```bash
  cp myzenlearning/data/myzenlearning.db myzenlearning_backup_$(date +%F_%H%M%S).db
  cp myzenlearning/data/tickets.json tickets_backup_$(date +%F_%H%M%S).json
  ```

---

## 9. Standard Operating Procedures (SOPs) & User Guides

### SOP-01: Content Creators & AI Curriculum Generation
1. Navigate to ZenBank (`http://<server-ip>:3001`).
2. In the **Generator**, select:
   * **Grade Level**: Kindergarten through High School.
   * **Subject**: Mathematics, Science, Reading, Social Studies, Coding.
   * **Topic**: Enter specific curriculum chapter.
   * **Question Count**: 5 to 50 questions.
3. Click **"Generate Questions"**.
4. Questions are automatically generated, deduplicated, and placed into **Draft** status.

### SOP-02: Reviewers & Option/Answer Key Correction
1. Open ZenBank **Review Studio (`/review`)**.
2. Review pending questions.
3. To edit any option: Click directly into the text box for Option A, B, C, or D.
4. To change the correct answer: Click **"Mark Correct"** on the proper option.
5. Click **"Approve"** to stage for live sync.

### SOP-03: Platform Administrators & Ticket Resolution
1. Open My Zen Learning Admin Portal (`http://<server-ip>:3000/admin`) -> Enter PIN (`1234`).
2. Under **Sync Engine**, click **"Sync from ZenBank"** to pull all newly approved questions into live student decks.
3. Review incoming tickets:
   * 🔴 **Question Bugs**: Click **"⚡ Fix in ZenBank"** to open the question in the Review Studio. After fixing, click **"Mark Resolved"**.
   * 🟣 **Topic Requests**: Click **"🚀 Generate in ZenBank"** to open the generator pre-populated with the requested topic.
   * 🔵 **General Support**: Review notes, follow up if email provided, and mark resolved.

### SOP-04: Student & Parent Onboarding Guide
1. Go to `http://<server-ip>:3000`.
2. Select any subject deck to begin practicing.
3. Use the on-screen **Scratchpad** to write out math problems.
4. If an answer key seems wrong, click **"Report Issue"** in the top bar to alert the curriculum team.
5. Request new subjects or chapters anytime via the **Contact Us** page.

---

## 10. Troubleshooting, Edge Cases & FAQ

* **Q: A question generated only 2 MCQ choices instead of 4.**  
  *A: The system enforces 4 options. In the rare event of a legacy question with fewer than 4 choices, open ZenBank Review Studio (`/review`), type in the missing options, mark the correct answer, and click "Save & Approve".*

* **Q: The Groq API hit a rate limit.**  
  *A: ZenBank will display a countdown timer until the rate limit resets. If questions are needed urgently during an outage, check the **Curriculum Fallback Engine** box on the Generator page to produce questions offline.*

* **Q: Questions were approved in ZenBank but don't show up in quizzes.**  
  *A: Open `http://<server-ip>:3000/admin` and click **"Sync from ZenBank"**. This refreshes the dynamic quiz decks immediately.*

---
*End of Master Technical Specification — Zen Platform Unified Architecture*
