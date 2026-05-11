# Paper2Colab

Turn any research paper PDF into a runnable Google Colab tutorial — powered by GPT-4o.

Upload a PDF, paste your OpenAI API key, and download a fully structured `.ipynb` notebook ready to open in Google Colab or Jupyter.

---

## Features

- Drag-and-drop PDF upload (up to 50 MB)
- Extracts and cleans text from text-based PDFs using pdfplumber
- Generates a complete, multi-section Colab notebook via GPT-4o
- Notebook structure: Introduction, Setup, Background & Theory, Core Implementation, Experiments, Results & Visualisation, Summary & Next Steps
- All generated code runs in Colab with no external file dependencies
- Sanitized filename derived from the paper title
- Your API key is never stored server-side

---

## Requirements

- Python 3.9 or later
- An [OpenAI API key](https://platform.openai.com/account/api-keys) with access to `gpt-4o`

---

## Quick Start (Windows)

```
start.bat
```

The script installs dependencies and starts the server. Open **http://localhost:5000** in your browser.

---

## Manual Setup

```bash
pip install -r requirements.txt
python app.py
```

Server runs on **http://localhost:5000**.

---

## Usage

1. Paste your OpenAI API key (`sk-...`) into the key field.
2. Upload or drag-and-drop a research paper PDF.
3. Click **Convert to Colab Tutorial**.
4. Download the generated `.ipynb` file.
5. Open it in [Google Colab](https://colab.research.google.com/) or Jupyter and run the cells.

> **Note:** Only text-based PDFs are supported. Scanned image PDFs will not extract correctly.

---

## Project Structure

```
paper2colab/
├── app.py                   # Flask app and /convert endpoint
├── requirements.txt
├── start.bat                # One-click launcher for Windows
├── static/
│   ├── index.html           # Single-page UI
│   ├── script.js            # Form handling and progress UX
│   └── style.css
└── utils/
    ├── openai_client.py     # GPT-4o notebook content generation
    ├── notebook_generator.py # Builds the .ipynb file with nbformat
    └── pdf_extractor.py     # PDF text extraction and cleanup
```

---

## Dependencies

| Package | Purpose |
|---|---|
| Flask + flask-cors | Web server and API |
| pdfplumber | PDF text extraction |
| openai | GPT-4o API client |
| nbformat | `.ipynb` notebook creation |

---

## Limitations

- Scanned / image-only PDFs are not supported.
- Papers are truncated at ~120,000 characters (~30k tokens) before being sent to the API; the references section is dropped first to preserve the most useful content.
- Generation cost and quality depend on your OpenAI plan and the complexity of the paper.
