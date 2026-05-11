(() => {
  const form        = document.getElementById("convert-form");
  const apiKeyInput = document.getElementById("api-key");
  const toggleBtn   = document.getElementById("toggle-key");
  const dropZone    = document.getElementById("drop-zone");
  const pdfInput    = document.getElementById("pdf-input");
  const browseBtn   = document.getElementById("browse-btn");
  const dropContent = document.getElementById("drop-content");
  const fileSelected= document.getElementById("file-selected");
  const fileNameEl  = document.getElementById("file-name");
  const fileSizeEl  = document.getElementById("file-size");
  const removeBtn   = document.getElementById("remove-file");
  const convertBtn  = document.getElementById("convert-btn");
  const btnText     = document.getElementById("btn-text");
  const btnSpinner  = document.getElementById("btn-spinner");
  const statusBox   = document.getElementById("status-box");
  const progressBar = document.getElementById("progress-bar");
  const statusMsg   = document.getElementById("status-msg");
  const globalError = document.getElementById("global-error");
  const errorText   = document.getElementById("error-text");
  const successBox  = document.getElementById("success-box");
  const downloadLink= document.getElementById("download-link");
  const apiKeyError = document.getElementById("api-key-error");
  const pdfError    = document.getElementById("pdf-error");

  let selectedFile = null;

  // ── Toggle API key visibility ────────────────────────
  toggleBtn.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
    toggleBtn.title = isPassword ? "Hide key" : "Show key";
  });

  // ── File browse button ───────────────────────────────
  browseBtn.addEventListener("click", () => pdfInput.click());

  pdfInput.addEventListener("change", () => {
    if (pdfInput.files.length) setFile(pdfInput.files[0]);
  });

  // ── Drag & drop ──────────────────────────────────────
  dropZone.addEventListener("click", (e) => {
    if (!e.target.closest(".remove-file")) pdfInput.click();
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  ["dragleave", "dragend"].forEach((evt) =>
    dropZone.addEventListener(evt, () => dropZone.classList.remove("drag-over"))
  );

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearFile();
  });

  function setFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showPdfError("Please select a PDF file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showPdfError("File is too large (max 50 MB).");
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatSize(file.size);
    dropContent.hidden = true;
    fileSelected.hidden = false;
    clearPdfError();
  }

  function clearFile() {
    selectedFile = null;
    pdfInput.value = "";
    dropContent.hidden = false;
    fileSelected.hidden = true;
    clearPdfError();
  }

  // ── Form submit ──────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    let valid = true;

    clearApiKeyError();
    clearPdfError();
    hideError();
    hideSuccess();

    if (!apiKey) {
      showApiKeyError("Please enter your OpenAI API key.");
      valid = false;
    } else if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
      showApiKeyError("This doesn't look like a valid OpenAI API key (should start with sk-).");
      valid = false;
    }

    if (!selectedFile) {
      showPdfError("Please select a PDF file.");
      valid = false;
    }

    if (!valid) return;

    // Build form data
    const data = new FormData();
    data.append("pdf", selectedFile);
    data.append("api_key", apiKey);

    setLoading(true);
    showStatus("Reading and extracting PDF text...", 15);

    try {
      const progressSteps = [
        { pct: 30, msg: "Sending paper to Gemini AI...", delay: 1500 },
        { pct: 55, msg: "Gemini is analysing the paper...", delay: 4000 },
        { pct: 75, msg: "Generating tutorial structure...", delay: 8000 },
        { pct: 88, msg: "Writing code cells and explanations...", delay: 14000 },
        { pct: 95, msg: "Assembling the Colab notebook...", delay: 20000 },
      ];
      progressSteps.forEach(({ pct, msg, delay }) => {
        setTimeout(() => {
          if (convertBtn.disabled) showStatus(msg, pct);
        }, delay);
      });

      const response = await fetch("/convert", {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({ error: "Unknown server error." }));
        throw new Error(json.error || `Server error ${response.status}`);
      }

      // Get the filename from Content-Disposition header
      const disposition = response.headers.get("Content-Disposition") || "";
      const nameMatch = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = nameMatch ? nameMatch[1] : "tutorial.ipynb";

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      showStatus("Done!", 100);

      setTimeout(() => {
        setLoading(false);
        hideStatus();
        downloadLink.href = url;
        downloadLink.download = filename;
        showSuccess();
      }, 600);

    } catch (err) {
      setLoading(false);
      hideStatus();
      showError(err.message || "Conversion failed. Please try again.");
    }
  });

  // ── Helpers ──────────────────────────────────────────
  function setLoading(on) {
    convertBtn.disabled = on;
    btnText.textContent = on ? "Converting…" : "Convert to Colab Tutorial";
    btnSpinner.hidden = !on;
  }

  function showStatus(msg, pct) {
    statusBox.hidden = false;
    statusMsg.textContent = msg;
    progressBar.style.width = pct + "%";
  }

  function hideStatus() { statusBox.hidden = true; }

  function showError(msg) {
    errorText.textContent = msg;
    globalError.hidden = false;
    globalError.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideError() { globalError.hidden = true; }

  function showSuccess() {
    successBox.hidden = false;
    successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideSuccess() { successBox.hidden = true; }

  function showApiKeyError(msg) { apiKeyError.textContent = msg; }
  function clearApiKeyError()   { apiKeyError.textContent = ""; }
  function showPdfError(msg)    { pdfError.textContent = msg; }
  function clearPdfError()      { pdfError.textContent = ""; }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
})();
