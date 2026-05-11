import nbformat as nbf


def create_notebook(content: dict) -> bytes:
    nb = nbf.v4.new_notebook()

    nb.metadata = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.10.0",
            "mimetype": "text/x-python",
            "file_extension": ".py",
        },
        "colab": {
            "provenance": [],
            "collapsed_sections": [],
            "toc_visible": True,
        },
    }

    cells = []
    for cell_data in content.get("cells", []):
        cell_type = cell_data.get("cell_type", "").lower()
        source = cell_data.get("source", "")

        if not isinstance(source, str):
            source = "\n".join(source) if isinstance(source, list) else str(source)

        if cell_type == "markdown":
            cells.append(nbf.v4.new_markdown_cell(source))
        elif cell_type == "code":
            cells.append(nbf.v4.new_code_cell(source))

    nb.cells = cells
    return nbf.writes(nb).encode("utf-8")


def sanitize_filename(title: str) -> str:
    safe = "".join(c if c.isalnum() or c in " _-" else "_" for c in title)
    safe = safe.replace(" ", "_").strip("_")
    return safe[:80] or "tutorial"
