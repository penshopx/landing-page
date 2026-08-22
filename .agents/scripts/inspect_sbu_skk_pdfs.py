from pathlib import Path

import fitz

FILES = {
    "paid": "attached_assets/Ebook_SBU-SKK-ok_1787368451833.pdf",
    "appendix": "attached_assets/LAMPIRAN_EBOOK_1787369070797.pdf",
    "lead": "attached_assets/mini-ebook_SBU_1787369141323.pdf",
}

output = Path(".agents/outputs/sbu-skk-pdf-review")
output.mkdir(parents=True, exist_ok=True)

for label, filename in FILES.items():
    document = fitz.open(filename)
    print(f"\n[{label}] pages={document.page_count} metadata={document.metadata}")
    text = "\n".join(page.get_text() for page in document[: min(4, document.page_count)])
    (output / f"{label}-opening-text.txt").write_text(text, encoding="utf-8")
    print(text[:1500].replace("\n", " | "))

    page_numbers = sorted({0, min(1, document.page_count - 1), document.page_count - 1})
    for page_number in page_numbers:
        pixmap = document[page_number].get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pixmap.save(output / f"{label}-page-{page_number + 1}.png")