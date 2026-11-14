# PaperLens-AI: Windows Installation & Setup Guide

This guide provides complete, step-by-step instructions for running **PaperLens-AI** on a 64-bit Windows laptop or desktop using standard CPU processing (with optional NVIDIA CUDA GPU acceleration).

---

## 1. System Prerequisites

Ensure your Windows machine has the following tools installed:

### A. Python 3.12 (64-bit)
1. Download from [python.org/downloads](https://www.python.org/downloads/).
2. **Important**: Check the box **"Add python.exe to PATH"** on the first installer screen.
3. Verify in PowerShell:
   ```powershell
   python --version
   # Expected: Python 3.12.x
   ```

### B. Node.js & npm (LTS)
The frontend requires Node.js (v18 or v20+). You can install it via Windows Package Manager (`winget`) or the official installer:
```powershell
winget install OpenJS.NodeJS.LTS
```
*Alternatively, download the `.msi` installer from [nodejs.org](https://nodejs.org).*

After installation, verify in PowerShell:
```powershell
node --version
npm --version
```

### C. Visual C++ 2015–2022 Redistributable (x64)
PyTorch requires Microsoft Visual C++ runtime libraries (`VCRUNTIME140_1.dll` and `VCRUNTIME140_THREADS.dll`).
- Download and run the official installer: [Visual Studio C++ x64 Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe).

### D. Optional: Tesseract OCR for Scanned PDFs
PaperLens-AI includes an automatic text extraction pipeline with PyMuPDF. If you plan to ingest scanned or low-resolution image PDFs, install Tesseract OCR:
1. Download the 64-bit Windows installer from UB-Mannheim:
   [tesseract-ocr-w64-setup-5.3.3.20231005.exe](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install to the default location: `C:\Program Files\Tesseract-OCR\`.
3. *Note: If Tesseract is not installed, PaperLens-AI automatically falls back to layout text extraction without crashing.*

---

## 2. Setting Up the Backend (Python FastAPI)

Open a PowerShell terminal and navigate to the project directory:

```powershell
cd PaperLens-AI
```

### Step 1: Create and Activate Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# If PowerShell script execution is restricted, enable it for CurrentUser:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

*(When active, `(venv)` will appear at the beginning of your command prompt).*

### Step 2: Install Python Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Download spaCy Language Model
```powershell
python -m spacy download en_core_web_sm
```

### Step 4: Pre-cache Free Local Hugging Face Models
PaperLens-AI uses two free, locally runnable models that run on CPU:
1. `BAAI/bge-small-en-v1.5` (Dense passage embeddings, ~133MB)
2. `cross-encoder/nli-deberta-v3-small` (Scientific NLI cross-encoder, ~175MB)

Download and cache them to your local disk so they run offline:
```powershell
python scripts/cache_models.py
```

### Step 5: Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

---

## 3. Running Backend Tests

Verify that your local environment is functioning with 100% test coverage:

```powershell
# Run the complete test suite
$env:PYTHONPATH='backend'
.\venv\Scripts\python.exe -m pytest backend/tests -v
```

All 11 unit and integration tests should pass:
- `test_full_api_workflow`: Complete 9-stage ingestion, search, claims, Q&A, gaps, and cleanup lifecycle.
- `test_section_aware_chunker`: 2-column layout and page-boundary chunking.
- `test_citation_validator`: Strict ground-truth citation verification.
- `test_extract_scientific_claims`: Hybrid linguistic claim extraction.
- `test_nli_candidate_filtering`: Dense pre-filtering thresholding.
- `test_ocr_density_heuristics`: Low-density page heuristic detector.
- `test_ocr_graceful_handling`: Fallback when Tesseract is absent.
- `test_robustness`: Corrupted, empty, and non-existent PDF handling.

---

## 4. Setting Up the Frontend (React + TypeScript + Tailwind)

Open a second PowerShell terminal:

```powershell
cd PaperLens-AI\frontend
```

### Step 1: Install Node Dependencies
```powershell
npm install
```

### Step 2: Start the Vite Development Server
```powershell
npm run dev
```

The frontend will start at:
```text
  VITE v5.4.21  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 5. Starting the Backend API Server

In your first PowerShell terminal (with `venv` activated):

```powershell
cd PaperLens-AI
$env:PYTHONPATH='backend'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will start with SQLite in WAL mode:
```text
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Initializing PaperLens-AI v1.0.0 database & models...
INFO:     SQLite WAL mode configured successfully.
INFO:     Database initialized successfully.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Interactive OpenAPI documentation is available at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

## 6. Navigating the Upgraded Platform

1. Open your browser to **[http://localhost:5173](http://localhost:5173)**.
2. **Main Dashboard**:
   - Review live platform statistics (uploaded papers, searchable passages, extracted claims, research gaps, NLI comparisons).
   - Try the sample research question with 1 click to experience comparative synthesis.
   - Follow the 7-step visual workflow.
3. **Paper Library**:
   - Filter papers by title, status, or test document tags.
   - Click **"Open Paper Intelligence Analysis"** to launch the 5-tab deep workspace.
   - Click **"Audit"** to inspect the 9-stage processing timeline and OCR diagnostics.
4. **Paper Analysis Workspace**:
   - **Overview**: Abstract with page provenance, research problems, contributions, author conclusion.
   - **Methodology & Results**: Models, cataloged datasets, metrics, and numerical results.
   - **Claims Explorer**: Candidate vs verified claims with normalized statements.
   - **Limitations & Opportunities**: Author limitations vs AI constraints vs research gaps.
   - **Evidence Explorer**: Split view with PDF preview and instant page jumping.
5. **Cross-Paper Q&A**:
   - Select specific paper subsets or query the entire collection.
   - Receive structured answers broken down into Direct Response, Evidence Summary, Supporting Findings, Contradicting Findings, Methodology Differences, and Balanced Interpretation with verified citation anchors.
6. **Claims & NLI Matrix**:
   - Inspect the pairwise paper comparison grid.
   - Review probability distributions (Support, Contradiction, Neutral) and context comparison notes.
7. **Research Gaps**:
   - Explore author-stated limitations alongside potential gaps in your uploaded collection.
8. **Model Evaluation**:
   - Run transparent empirical benchmarks with actual precision, recall, F1, and MRR.

---

## 7. Windows Troubleshooting & FAQ

### Issue: `OSError: [WinError 126] Error loading torch\lib\shm.dll`
- **Cause**: Windows is missing Visual C++ runtime components `VCRUNTIME140_1.dll` or `VCRUNTIME140_THREADS.dll`.
- **Solution**: Install the Microsoft Visual C++ 2015–2022 Redistributable (x64) from [https://aka.ms/vs/17/release/vc_redist.x64.exe](https://aka.ms/vs/17/release/vc_redist.x64.exe).

### Issue: `ImportError: DLL load failed while importing _swigfaiss`
- **Cause**: FAISS on Windows Python 3.12 requires OpenMP runtime DLLs (`vcomp140.dll` / `libomp.dll`) initialized before FAISS SWIG wrapper loads.
- **Solution**: In PaperLens-AI, `import torch` is placed before `import faiss` in `vector_store.py`, which initializes OpenMP automatically. Ensure PyTorch is installed in the virtual environment.

### Issue: PowerShell prevents running `Activate.ps1`
- **Error**: `File ...\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Solution**: Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` in PowerShell, then retry.

### Issue: Port 8000 or 5173 is already in use
- **Solution**: Identify the process using the port and terminate it:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
  ```

### Issue: Tesseract OCR is not found
- PaperLens-AI automatically checks if `C:\Program Files\Tesseract-OCR\tesseract.exe` exists. If not found, it logs a graceful notice and uses PyMuPDF layout extraction. If installed in a custom path, update `TESSERACT_PATH` in your `.env` file.
