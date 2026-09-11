# Zen Platform — Local Server Deployment & Migration Guide

This comprehensive guide covers transferring and running the entire **Zen Platform** (**ZenBank** + **My Zen Learning** + **PostgreSQL**) on any local machine (macOS, Linux, or Windows with WSL) in any country.

---

## 🏗️ Architecture Overview

The platform runs as a coordinated local ecosystem:

| Service | Port | Description |
| :--- | :--- | :--- |
| **My Zen Learning** | `http://localhost:3000` | Student portal, multi-subject assessments, gamified quizzes, tickets |
| **ZenBank Studio** | `http://localhost:3001` | Question Bank management, Review Studio, Support Hub, Groq AI Generator |
| **PostgreSQL 16** | `localhost:5432` | Self-hosted relational database (`zenlearning` & `zenbank` databases) |

```
Browser / Student (localhost:3000) ──> [ My Zen Learning ] ──┐
Browser / Teacher (localhost:3001) ──> [ ZenBank Studio  ] ──┼──> [ Local PostgreSQL 16 ]
                                             ▲               │     (zenbank & zenlearning)
                                             └───────────────┘
                                           Internal Docker Network
```

---

## 📦 Part 1: GitHub Repository Setup (Shift to `akmrsingh`)

Both repositories are consolidated under the GitHub account **`akmrsingh`**:

1. **ZenBank**: `https://github.com/akmrsingh/zenbank.git`
2. **My Zen Learning**: `https://github.com/akmrsingh/myzenlearning.git`

### To complete the transfer of `zenbank` to `akmrsingh`:
1. Log into GitHub as **`akmrsingh`**.
2. Visit **[https://github.com/vipulmyzenmoney-maker/zenbank](https://github.com/vipulmyzenmoney-maker/zenbank)**.
3. Click the green **"Accept transfer"** banner.
4. GitHub immediately updates the URL to `https://github.com/akmrsingh/zenbank.git` with all commit history, Dockerfiles, and Makefiles.

---

## 🚀 Part 2: Deployment on the Destination Machine

### Prerequisites on Destination Machine
- **Git** ([Download](https://git-scm.com/))
- **Docker Desktop** ([Download Docker](https://www.docker.com/products/docker-desktop/)) — *Must be running.*

---

### Step-by-Step Commands

#### Step 1: Create a Workspace Directory and Clone Both Repositories
Open your terminal on the new machine:

```bash
# 1. Create a platform folder
mkdir zen-platform && cd zen-platform

# 2. Clone both projects side-by-side
git clone https://github.com/akmrsingh/zenbank.git
git clone https://github.com/akmrsingh/myzenlearning.git
```

Your folder structure must look like:
```text
zen-platform/
├── myzenlearning/
└── zenbank/
```

---

#### Step 2: One-Click Deploy via `make deploy`
Navigate into `zenbank` and execute:

```bash
cd zenbank
make deploy
```

*(You can also run `cd ../myzenlearning && make deploy` — both Makefiles automatically detect the sibling repository and launch the full platform).*

---

### ⚙️ What `make deploy` Automatically Executes:
1. **Detects Full Platform**: Recognizes that both `zenbank` and `myzenlearning` are present.
2. **Auto-Generates `.env`**: Creates `.env` from `.env.example` if not already present.
3. **Boots PostgreSQL 16**: Automatically initializes **two isolated databases** (`zenbank` and `zenlearning`) with health checks.
4. **Applies Prisma Migrations**: Pushes database schemas (`prisma db push`) to both databases.
5. **Seeds Question Bank**: Automatically inserts the **100 verified curriculum questions** and syllabus packs into PostgreSQL.
6. **Starts Web Services**:
   - 🎓 **My Zen Learning**: `http://localhost:3000`
   - 🏦 **ZenBank Studio**: `http://localhost:3001`
   - 🗄️ **Local PostgreSQL**: `localhost:5432`

---

## 🤖 Part 3: Will Groq AI ("Grok") Work Automatically?

### 1. Existing Questions, Quizzes & Assessments: **100% Offline & Independent**
- All curriculum quizzes (Math, Science, Social Studies, English, Typing, Coding) and the **100 verified questions** are stored in the local PostgreSQL database and application code.
- **They do NOT depend on Groq or any internet API.** Students can take quizzes, earn points, track achievements, and submit support tickets completely offline or with zero API keys.

---

### 2. AI Question Generation & Syllabus Vision Scanning
Because `.env` files are ignored by git (to protect secrets), a newly cloned repo will not have your Groq API key by default.

To enable Groq AI generation on the new machine, use **either** of these two methods:

#### Method A: Set Key in `.env` (Permanent)
1. Open `zenbank/.env` in any text editor:
   ```bash
   nano .env   # or open in VS Code / Notepad
   ```
2. Set your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```
3. Restart containers:
   ```bash
   make restart
   ```

#### Method B: Instant Browser UI Setup (No Terminal / No Restart Required)
1. Open ZenBank in your browser at **`http://localhost:3001`**.
2. Click the **Key icon (🔑)** in the top right navbar.
3. Select **Groq** as provider, paste your Groq API key (`gsk_...`), and click **"Test Connection"**.
4. Once verified, click **"Save Key"**.
5. Groq AI generation will activate immediately for your browser session without touching any files or restarting Docker!

> 🛡️ **Safety Fallback**: If no Groq API key is provided, ZenBank's built-in **Curriculum Offline Generator** automatically handles requests using pre-built syllabus packs, preventing errors or crashes.

---

## 🛠️ Management & Operation Commands

Run these inside `zen-platform/zenbank` (or `zen-platform/myzenlearning`):

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Deploy / Start** | `make deploy` | Build and start all services in background |
| **Live Logs** | `make logs` | Stream logs from Next.js, Prisma, and Postgres |
| **Status Check** | `make status` | View running containers and open ports |
| **Restart** | `make restart` | Gracefully restart containers |
| **Stop** | `make stop` | Stop all platform containers |
| **Clean** | `make clean` | Remove unused images and build caches |

---

## 🩺 Zero-Breakage Verification Checklist

After running `make deploy`, verify the following:

- [ ] Visit `http://localhost:3000`: My Zen Learning home page loads cleanly.
- [ ] Visit `http://localhost:3001`: ZenBank Question Studio loads cleanly.
- [ ] In My Zen Learning, go to **Quizzes** or **Assessments**: Verify questions and scratchpad load.
- [ ] In ZenBank, go to **Bank**: Verify 100 questions are visible and searchable.
- [ ] In ZenBank, go to **Support**: Verify the Support Hub loads without errors.
- [ ] Test resolving an item in Support Hub: Changes persist across reloads.
