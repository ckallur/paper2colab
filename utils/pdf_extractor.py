import re
import pdfplumber


def extract_text(pdf_path: str) -> str:
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if text:
                pages.append(text)

    full_text = "\n\n".join(pages)
    return _clean_text(full_text)


def _clean_text(text: str) -> str:
    # Rejoin hyphenated line breaks (e.g., "algo-\nrithm" → "algorithm")
    text = re.sub(r"-\n(\w)", r"\1", text)
    # Collapse single newlines within paragraphs; keep double newlines as paragraph breaks
    text = re.sub(r"(?<!\n)\n(?!\n)", " ", text)
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace per line
    text = "\n".join(line.strip() for line in text.splitlines())
    # Collapse multiple spaces
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


MAX_CHARS = 120_000  # ~30k tokens, well within Gemini 2.0 Flash context window


def truncate_for_api(text: str) -> str:
    if len(text) <= MAX_CHARS:
        return text
    cutoff = MAX_CHARS
    # Try to cut before the references section to save tokens on less useful content
    ref_match = re.search(r"\n(References|REFERENCES|Bibliography)\n", text)
    if ref_match and ref_match.start() > MAX_CHARS // 2:
        cutoff = ref_match.start()
    return text[:cutoff] + "\n\n[... paper truncated for length ...]"
