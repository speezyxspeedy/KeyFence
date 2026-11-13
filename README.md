# KeyFence

### Find exposed secrets before they reach your repository.
*Find It. Fix It. Secure It.*

KeyFence is a local-first, privacy-preserving developer security scanner that inspects user-selected project folders, ZIP archives, and individual source files directly in the browser to detect potentially exposed credentials, API keys, database connection URIs, private-key material, and suspicious high-entropy tokens before code is committed or shared.

---

## Problem Statement

Accidental secret commits (`.env` files, hardcoded API tokens, database URLs, and private keys) remain one of the most common causes of credential leaks in software projects. Developers often hesitate to upload unreleased proprietary source code to third-party web scanners. KeyFence solves this by performing all file parsing, pattern analysis, entropy scoring, and masking **100% locally inside the user's browser**.

---

## Features

- **Local Project Ingestion**:
  - **Folder Selection** (`webkitdirectory`, preserving relative paths)
  - **ZIP Archive Upload** (extracted locally in browser memory with JSZip, path-traversal protection, and expansion limits)
  - **Individual Multi-File Upload & Drag-and-Drop**
- **Modular Secret Detection Engine**:
  - Built-in rules across 8 categories: Cloud Credentials, API Authentication, Database Credentials, Private Key Exposure, Generic Password Assignment, Webhook Credentials, Configuration Secrets, and High Entropy Values.
  - Custom local regex rules with syntax and catastrophic-backtracking (ReDoS) validation.
- **Contextual Confidence Scoring**:
  - Combines rule specificity, Shannon entropy, placeholder detection, and file path context (`High`, `Medium`, `Low`).
- **Privacy-First Redaction**:
  - Matched secrets are masked by default (`sk-****...****91`), surrounding code lines are sanitized, and raw secrets are never persisted to `localStorage`, `IndexedDB`, logs, URLs, or exported reports.
- **Findings Explorer & Safely Escaped Code Context Viewer**:
  - Filter by severity, category, confidence, extension, triage status (`OPEN`, `REVIEWED`, `FALSE POSITIVE`, `ACCEPTED RISK`, `RESOLVED`), or search query.
  - Renders source lines as safely escaped text (never executable HTML), with category-specific remediation guidance.
- **`.gitignore` Coverage Analyzer**:
  - Inspects selected `.gitignore` rules against sensitive file candidates (`.env`, `*.pem`, `credentials.json`, etc.) and generates copyable ignore suggestions.
- **Browser-Local Scan History & Sanitized Reports**:
  - Stores metadata-only summaries locally for side-by-side comparison.
  - Exports masked **JSON**, formula-injection-sanitized **CSV**, and escaped **Printable HTML** reports.
- **Demo Mode**:
  - Includes a clearly labeled fictional demo project (`LOAD DEMO PROJECT` / `RESET DEMO`) that runs through the actual scanning engine.

---

## Technology Stack

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide React**
- **JSZip** (local browser ZIP extraction)
- **Web Workers** (off-main-thread scanning with chunked main-thread fallback)
- **Vitest** (automated test suite)

---

## Architecture

```
src/
├── context/ScannerContext.tsx      # Workspace state, staging, ephemeral in-memory reveal map
├── services/
│   ├── fileService.ts              # Extension filtering, binary buffer checks, exclusion matching
│   ├── zipService.ts               # JSZip extraction, ZIP-slip protection, memory size caps
│   ├── detectionRules.ts           # Built-in rule definitions & custom regex ReDoS validation
│   ├── entropyAnalyzer.ts          # Shannon entropy calculation & benign token filtering
│   ├── confidenceEngine.ts         # Contextual confidence scoring (High / Medium / Low)
│   ├── redactionService.ts         # Credential masking & surrounding context sanitization
│   ├── scannerEngine.ts            # Orchestrates Web Worker / main-thread fallback scanning
│   ├── gitignoreAnalyzer.ts        # Local .gitignore pattern parsing & coverage checks
│   ├── findingsService.ts          # Filtering, sorting, and dashboard aggregations
│   ├── reportService.ts            # JSON, formula-safe CSV, and escaped HTML generation
│   ├── historyService.ts           # Metadata-only browser localStorage scan history
│   └── demoProjectService.ts       # Fictional placeholder demo project generator
├── workers/scannerWorker.ts        # Web Worker executing line-by-line detection
├── components/                     # Modular UI views (Dashboard, Scanner, Explorer, Rules, etc.)
└── tests/                          # Automated unit & integration tests
```

---

## Detection Engine & Confidence Scoring

1. **Pattern Matching**: Each enabled rule runs bounded JavaScript regular expressions line-by-line while preserving 1-based line numbers and column offsets. Overlapping matches on the same span are deduplicated in favor of the higher-severity/confidence rule.
2. **Shannon Entropy Heuristic**: Evaluates token randomness for quoted/assigned strings meeting the minimum length (default 20 chars) and character class diversity, while filtering UUIDs, pure commit hashes, URLs, and code identifiers. Heuristic-only matches are explicitly labeled and never elevated to `High` confidence.
3. **Confidence Scoring**: Adjusts each match's base score using entropy, placeholder indicators (`placeholder`, `example`, `changeme`), and file location (`.env`/config files boost confidence; `tests/` or `*.md` reduce confidence).

> **Important**: Pattern-based and entropy-based detection can produce false positives and false negatives. KeyFence never attempts to validate credentials against external providers and does not guarantee a project is free of secrets.

---

## Privacy Model

- **Zero Server Backend**: All scanning occurs strictly in browser memory.
- **Zero Telemetry / External Requests**: Scanned files and findings never leave your machine.
- **Zero Raw Secret Persistence**: `localStorage` stores only preferences, exclusion settings, custom rule definitions, and metadata-only scan history summaries.
- **Safe Rendering**: Source code is never injected via `dangerouslySetInnerHTML`.

---

## Limitations

### File Processing Limitations
- Default maximum individual file size is **1 MB** (configurable in Ignore Configuration).
- Default maximum extracted ZIP archive size is **100 MB** and **10,000 entries**.
- Binary files (detected via extension or null-byte/control-byte inspection) and ultra-long minified lines (> 8,000 chars) are skipped to maintain browser responsiveness.
- Folder selection (`webkitdirectory`) depends on desktop browser support (Chromium, Firefox, Safari). Use ZIP upload or multi-file selection in unsupported browsers.

### `.gitignore` Analyzer Limitations
- Inspects only the file paths and `.gitignore` contents explicitly selected by the user.
- **Does not** inspect `.git/index`, staged changes, or Git commit history, and does not claim whether a file has already been committed to a repository.

---

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Windows 11 & VS Code Instructions

1. Install **Node.js 20+** (LTS) from `nodejs.org` or via `winget install OpenJS.NodeJS.LTS`.
2. Open the `KeyFence` folder in **Visual Studio Code** (`File -> Open Folder...`).
3. Open the VS Code integrated terminal (`Ctrl + \``) using PowerShell or Git Bash.
4. Run:
   ```powershell
   npm install
   npm run dev
   ```
5. Hold `Ctrl` and click the local URL printed in the terminal to launch KeyFence in your default browser.

---

## Demo Mode

Click **LOAD DEMO PROJECT** on the Overview or New Scan page to scan a built-in fictional service containing clearly labeled placeholder credentials (`sk-test-DEMO...`, a fictional PostgreSQL URI, a placeholder RSA marker, and benign code). All demo findings are tagged `DEMO`. Use **RESET DEMO** to clear the demonstration state.

---

## Test & Build Commands

```bash
# Run automated unit and integration tests
npm test

# TypeScript type-check / lint
npm run lint

# Production build
npm run build
```

---

## Future Roadmap

- SARIF 2.1.0 report export for CI/CD integrations
- Local Git pre-commit CLI companion sharing the same rule schema
- VS Code extension packaging for real-time editor diagnostics
- Custom rule pack import/export (JSON)
