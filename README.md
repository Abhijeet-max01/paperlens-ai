# PaperLens-AI 🔬

> **A Multi-Paper Scientific Research Analysis and Contradiction Detection Platform featuring Dense Vector Retrieval, Linguistic Claim Mining, DeBERTa NLI Cross-Encoder Inference, and Verifiable Citation Provenance.**

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. What PaperLens-AI Does & The Problem It Solves

Researchers, academics, and graduate students routinely read dozens of scientific papers to synthesize literature:
- *What has already been researched across this literature?*
- *Which findings agree across independent studies, and which contradict each other?*
- *Why do different studies report divergent numerical results or metrics?*
- *Which baseline architectures and benchmark datasets were evaluated?*
- *What limitations are acknowledged by the authors vs what potential research gaps remain unexplored?*
- *What balanced, grounded conclusions can be drawn with strict, page-verifiable citations?*

**PaperLens-AI** is **not** a basic PDF summarizer or a generic chatbot. Its central differentiator is **cross-paper scientific intelligence**: it parses multi-paper academic corpora, isolates verbatim empirical findings with character-level page coordinates, runs cross-encoder Natural Language Inference (NLI) to uncover supporting and contradicting claims, and provides evidence-grounded comparative synthesis with **verifiable citation provenance and zero hallucinations**.

All AI/NLP models run **100% locally on standard Windows hardware (CPU by default, with optional CUDA GPU acceleration)** without requiring external paid cloud APIs.

---

## 2. Major User-Facing Features

### A. Main Dashboard & Guided 7-Step Workflow
- **Live Corpus Statistics**: Real-time counts of indexed papers, searchable passages (chunks), extracted candidate claims, research gaps, NLI comparisons, and FAISS vectors.
- **Visual Scientific Workflow**: Plain-language guide through the 7-step synthesis methodology.
- **Interactive Sample Queries**: 1-click prompt dispatch into the Cross-Paper Q&A engine.
- **Corpus Overview & Research Ingestion**: Clear status cards and drag-and-drop PDF upload with duplicate hash detection.

### B. Dedicated 5-Tab Individual Paper Analysis Workspace
Selecting **"Open Analysis"** on any paper card opens a dedicated document intelligence workspace:
- **Tab 1: Paper Overview**: Extracted abstract, core problem statements, primary objectives, author contributions, and conclusion.
- **Tab 2: Methodology & Results**: Evaluated models, architectures, benchmark datasets, evaluation metrics, and extracted empirical findings.
- **Tab 3: Scientific Claims Explorer**: Candidate vs verified claims with normalized statements, original verbatim quotes, confidence scores, extracted epistemic verbs, and page provenance.
- **Tab 4: Limitations & Opportunities**:
  - *Tier 1*: Author-stated explicit limitations with section provenance.
  - *Tier 2*: AI-inferred methodological constraints and caveats.
  - *Tier 3*: Open research gaps and future research questions.
- **Tab 5: Evidence & PDF Split-View**: Embedded PDF viewer on the left; searchable passages on the right. Clicking any passage automatically jumps the PDF viewer to that exact page.

### C. Cross-Paper Evidence-Grounded Q&A Centerpiece
- **Flexible Scope Selection**: Query either the entire indexed corpus or select an explicit subset of papers.
- **Scope Transparency**: Clearly distinguishes between *Papers Searched in Scope* and *Evidence-Providing Papers*.
- **Structured Synthesis Output**:
  1. *Direct Response*: Precise, question-conditioned synthesis.
  2. *Summary of Evidence*: Multi-study findings summary.
  3. *Supporting Findings*: Mutual consensus across independent papers.
  4. *Contradicting Findings*: Opposing or divergent results with context comparison notes.
  5. *Methodology & Dataset Differences*: Clarifies how metric variations reflect dataset/baseline choices rather than direct empirical refutation.
  6. *Inconclusive Evidence & Literature Gaps*: Explicitly identifies unaddressed questions.
  7. *Balanced Scientific Interpretation*: Objective academic takeaway.
- **Verifiable Citation Provenance**: Every citation links to the exact PDF page, section header, and verbatim text quote matched against SQLite chunk coordinates.

### D. Pairwise Inter-Paper NLI Contradiction Matrix
- **Two-Stage Efficiency**: Dense vector pre-filtering prunes unrelated claim pairs ($\ge 0.60$ cosine) before running `cross-encoder/nli-deberta-v3-small` inference.
- **Pairwise Paper Relationship Table**: Summary grid displaying support, contradiction, and neutral frequencies between pairs of papers.
- **Context Comparison Notes**: Highlights dataset variations, baseline discrepancies, and metric variations for each evaluated claim pair.
- **Epistemic Disclaimer**: Clarifies that NLI evaluates textual inferential consistency and that differing metrics across distinct benchmarks do not constitute absolute scientific refutation.

### E. 9-Stage Processing Transparency & Audit Trail
Every paper includes an audit modal detailing all 9 pipeline stages:
1. `PDF received`: File uploaded and staged.
2. `PDF validation completed`: Structural PDF check and page count validation.
3. `Text extracted`: PyMuPDF layout parsing and 2-column flow reordering.
4. `Page boundaries identified`: Page numbering and bounding coordinates saved.
5. `Text segmented into searchable passages`: 300-token chunks with 50-token overlap.
6. `Embeddings generated`: Dense 384-d vectors generated with `BAAI/bge-small-en-v1.5`.
7. `Scientific claims extracted`: spaCy syntactic dependency mining with confidence scoring.
8. `Search index created`: Inserted into persistent FAISS index (`IndexFlatIP`).
9. `Document analysis completed`: Structured paper intelligence synthesized.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | FastAPI | 0.110+ | Asynchronous REST API server & background task execution |
| **Language** | Python | 3.12 (64-bit) | Backend application and NLP runtime |
| **Database & ORM** | SQLite + SQLAlchemy | 2.0+ | ACID storage with WAL mode, foreign keys, and safe schema migrations |
| **Dense Embeddings** | Sentence Transformers | 2.5+ | `BAAI/bge-small-en-v1.5` (384-dimensional dense vectors) |
| **Vector Search** | FAISS CPU | 1.8+ | `IndexFlatIP` normalized inner product cosine similarity search |
| **NLI Cross-Encoder** | Hugging Face Transformers | 4.38+ | `cross-encoder/nli-deberta-v3-small` for claim pair classification |
| **Linguistic Parser** | spaCy | 3.7+ | `en_core_web_sm` dependency parser, epistemic verbs, & entity mining |
| **PDF Extraction** | PyMuPDF (fitz) | 1.23+ | 2-column text layout reconstruction & page bounding |
| **OCR Fallback** | Tesseract OCR / pytesseract | 0.3.10+ | Text extraction fallback for scanned/image PDFs |
| **Frontend Framework** | React | 18.2 | Component-driven user interface |
| **Language (UI)** | TypeScript | 5.2 | Strongly typed frontend application |
| **Build Tool** | Vite | 5.4+ | Fast development server & production bundler |
| **Styling** | Tailwind CSS | 3.4 | Academic dashboard styling & responsive layout |
| **Testing** | pytest | 8.1+ | 26 unit, integration, and provenance regression tests |

---

## 4. Prerequisites & Software Requirements

Before setting up PaperLens-AI, ensure your machine has:

1. **Operating System**: Windows 10 or 11 (64-bit).
2. **Python 3.12 (64-bit)**:
   - Download from [python.org/downloads](https://www.python.org/downloads/).
   - **Important**: Check the box **"Add python.exe to PATH"** on the first installer screen.
3. **Node.js LTS (v18 or v20+) & npm**:
   - Download from [nodejs.org](https://nodejs.org/) or install via winget:
     ```powershell
     winget install OpenJS.NodeJS.LTS
     ```
4. **Microsoft Visual C++ 2015–2022 Redistributable (x64)**:
   - PyTorch requires Microsoft Visual C++ runtime libraries (`VCRUNTIME140_1.dll`).
   - Download installer: [Visual Studio C++ x64 Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe).
5. **(Optional) Tesseract OCR**:
   - Needed only for scanned image PDFs.
   - Download 64-bit installer from UB-Mannheim: [tesseract-ocr-w64-setup](https://github.com/UB-Mannheim/tesseract/wiki).
   - If not installed, PaperLens-AI automatically falls back to layout text extraction without crashing.

---

## 5. Step-by-Step Installation Instructions (Windows)

Open a PowerShell terminal and navigate to the extracted project folder:

```powershell
cd PaperLens-AI
```

### Step 1: Configure Environment Variables
Copy the provided `.env.example` template:
```powershell
Copy-Item .env.example .env
```
*(The default settings in `.env.example` work out-of-the-box on standard Windows hardware without requiring any edits).*

### Step 2: Create and Activate Python Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# If PowerShell script execution is restricted, enable RemoteSigned for your user:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```
*(When active, `(venv)` will appear at the start of your command prompt).*

### Step 3: Install Backend Dependencies
```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install required Python packages
pip install -r requirements.txt

# Download the spaCy English linguistic model
python -m spacy download en_core_web_sm
```

### Step 4: Download & Cache NLP Models Locally
PaperLens-AI includes an automated caching script that downloads and verifies the Sentence-Transformer and Cross-Encoder models into your local Hugging Face cache:
```powershell
python scripts/cache_models.py
```
*(Once cached, all models run 100% offline).*

### Step 5: Install Frontend Dependencies
In the same project folder:
```powershell
cd frontend
npm install
cd ..
```

---

## 6. How to Start the Application

To run the complete application, open **two separate PowerShell terminals**:

### Terminal 1 — Backend (FastAPI Server)
```powershell
cd PaperLens-AI
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH = "backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
You will see:
```
INFO: Initializing PaperLens-AI v1.0.0 database & models...
INFO: Database & FAISS synchronization verified.
INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Terminal 2 — Frontend (Vite Development Server)
```powershell
cd PaperLens-AI\frontend
npm run dev
```
You will see:
```
  VITE v5.4.21  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 7. Application & API Documentation URLs

- **Web Application**: **[http://localhost:5173](http://localhost:5173)**
- **Interactive OpenAPI / Swagger Docs**: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
- **ReDoc Alternative Documentation**: **[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)**
- **System Health Endpoint**: **[http://127.0.0.1:8000/api/system/health](http://127.0.0.1:8000/api/system/health)**
- **System Statistics Endpoint**: **[http://127.0.0.1:8000/api/system/stats](http://127.0.0.1:8000/api/system/stats)**

---

## 8. Pre-Indexed Benchmark Dataset

The package includes **4 pre-indexed academic benchmark papers** in `backend/data/`:
1. *Go Simple and Pre-Train on Domain-Specific Corpora: On the Role of Training Data for Text Classification* (COLING)
2. *Efficient Classification of Long Documents Using Transformers* (ACL)
3. *BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding* (NAACL)
4. *Pair Programming in Agile: Benefits and Limitations* (Term Paper)

You can immediately explore the dashboard, open individual paper workspaces, query cross-paper Q&A, and inspect the NLI matrix **without having to wait for PDF ingestion**.

To upload your own papers:
1. Click **"Upload Papers"** on the dashboard.
2. Select any standard research PDF.
3. The 9-stage pipeline will automatically extract text, parse sections, generate embeddings, extract claims, and update the FAISS index.

---

## 9. Running Automated Tests

PaperLens-AI includes a comprehensive test suite covering API workflows, section detection, PDF extraction, metadata extraction, NLI pre-filtering, OCR fallback heuristics, citation validation, and cross-paper grounding.

Run the full test suite (all 26 tests):
```powershell
cd PaperLens-AI
.\venv\Scripts\Activate.ps1
$env:PYTHONPATH = "backend"
$env:PYTHONIOENCODING = "utf-8"
pytest backend/tests -v
```

Expected output:
```
====================== 26 passed in ~60s ======================
```

Verify frontend production build:
```powershell
cd PaperLens-AI\frontend
npm run build
```

---

## 10. Troubleshooting & Known Limitations

### A. PowerShell Execution Policy Restriction
- **Symptom**: `.\venv\Scripts\Activate.ps1 : File cannot be loaded because running scripts is disabled on this system.`
- **Fix**: Run in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### B. Port Already in Use (8000 or 5173)
- **Symptom**: `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`
- **Fix**: Check and terminate the existing process:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```

### C. Missing Visual C++ Runtime on Windows
- **Symptom**: `ImportError: DLL load failed while importing _multiarray_umath` or `torch` fails to import.
- **Fix**: Install the [Visual Studio C++ x64 Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) and restart PowerShell.

### D. Tesseract OCR Not Found
- **Symptom**: Warning logged: `Tesseract executable not found at specified path`.
- **Status**: Non-fatal. PaperLens-AI automatically falls back to native PyMuPDF layout extraction. If OCR is required for scanned papers, install Tesseract to `C:\Program Files\Tesseract-OCR\tesseract.exe` or update `TESSERACT_PATH` in `.env`.

### E. Offline Hugging Face Mode
- **Symptom**: `LocalEntryNotFoundError: Cannot find the requested files in the cached path`.
- **Fix**: Run `python scripts/cache_models.py` while connected to the internet to pre-populate the local cache.

### F. CPU Performance Expectations
- On CPU hardware without a dedicated GPU, initial PDF ingestion takes ~15–30 seconds per paper, and cross-paper questions take ~2–4 seconds. The system operates fully deterministically.

---

## 11. License

MIT License. Free and open source for academic, research, and educational use.
