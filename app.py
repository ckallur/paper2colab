import io
import os
import tempfile

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from utils.openai_client import generate_notebook_content
from utils.notebook_generator import create_notebook, sanitize_filename
from utils.pdf_extractor import extract_text, truncate_for_api

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/convert", methods=["POST"])
def convert():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided."}), 400

    pdf_file = request.files["pdf"]
    api_key = request.form.get("api_key", "").strip()

    if not pdf_file.filename:
        return jsonify({"error": "No file selected."}), 400
    if not api_key:
        return jsonify({"error": "OpenAI API key is required."}), 400
    if not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 400

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            pdf_file.save(tmp.name)
            tmp_path = tmp.name

        # 1. Extract text
        paper_text = extract_text(tmp_path)
        if not paper_text.strip():
            return jsonify({"error": "Could not extract text from the PDF. Make sure it is a text-based (not scanned) PDF."}), 422

        paper_text = truncate_for_api(paper_text)

        # 2. Generate notebook content via Gemini
        notebook_content = generate_notebook_content(paper_text, api_key)

        # 3. Build .ipynb bytes
        notebook_bytes = create_notebook(notebook_content)

        title = notebook_content.get("title", "tutorial")
        filename = sanitize_filename(title) + ".ipynb"

        return send_file(
            io.BytesIO(notebook_bytes),
            mimetype="application/json",
            as_attachment=True,
            download_name=filename,
        )

    except Exception as exc:
        msg = str(exc)
        # Surface friendly messages for common API errors
        if "Incorrect API key" in msg or "invalid_api_key" in msg or "No API key" in msg:
            msg = "Invalid OpenAI API key. Please check your key and try again."
        elif "quota" in msg.lower() or "rate_limit" in msg.lower() or "insufficient_quota" in msg:
            msg = "OpenAI quota or rate limit reached. Please check your usage limits and try again."
        return jsonify({"error": msg}), 500

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
