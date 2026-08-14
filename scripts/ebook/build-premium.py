# Build premium ebook HTML from antiword-extracted manuscript.
# Usage: python3 scripts/ebook/build-premium.py
import re, html

SRC = "scripts/ebook/kas-merah-full.txt"
OUT = "scripts/ebook/premium-ebook.html"

raw = open(SRC, "rb").read()
import re as _re
def _cesu(m):
    s = m.group(0)
    hi = ((s[0]&0x0f)<<12)|((s[1]&0x3f)<<6)|(s[2]&0x3f)
    lo = ((s[3]&0x0f)<<12)|((s[4]&0x3f)<<6)|(s[5]&0x3f)
    return chr(0x10000 + ((hi-0xD800)<<10) + (lo-0xDC00)).encode("utf-8")
raw = _re.sub(rb"\xed[\xa0-\xaf][\x80-\xbf]\xed[\xb0-\xbf][\x80-\xbf]", _cesu, raw)
lines = raw.decode("utf-8", errors="replace").split("\n")[:2622]  # book only; duplicates start after

# strip embedded chat notes
clean = []
skip = False
for ln in lines:
    if "STATUS:" in ln and ("✅" in ln or "RAMPUNG" in ln):
        skip = True
        continue
    if skip:
        if ln.strip() in ("ya lanjut", "Thinking completed") or "Bos" in ln or ln.strip():
            if ln.strip() in ("ya lanjut", "Thinking completed"):
                skip = False
            continue
        else:
            skip = False
            continue
    clean.append(ln)
lines = clean

def esc(s):
    s = s.replace("Oleh [Nama Penulis]", "Oleh Tim CASHFLOW-PBJ \u2014 Gustafta")
    s = html.escape(s)
    s = s.replace("✅", '<span class="ok">✓</span>').replace("🔴", '<span class="bad">●</span>')
    s = s.replace("❌", '<span class="bad">✕</span>').replace("🔒", '<b>[TERKUNCI]</b>')
    s = s.replace("⬛", "■")
    for ch, css in (("🟥", "#C8102E"), ("🔴", "#C8102E"), ("🟨", "#e0a800"), ("🟡", "#e0a800"), ("🟩", "#1a7f4e"), ("🟢", "#1a7f4e")):
        s = s.replace(ch, f'<span style="color:{css}">■</span>')
    s = "".join(c for c in s if ord(c) < 0x1F000)
    return s

# group into blocks
blocks = []  # (type, payload)
i = 0
n = len(lines)
while i < n:
    ln = lines[i]
    s = ln.strip()
    if not s:
        i += 1; continue
    if s == "[pic]":
        blocks.append(("rule", None)); i += 1; continue
    if s.startswith("|"):
        rows = []
        while i < n and lines[i].strip().startswith("|"):
            cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
            rows.append(cells)
            i += 1
        # merge continuation rows (all-but-one empty pattern OR first cell empty)
        merged = []
        for cells in rows:
            if merged and (cells[0] == "" or all(c == "" for c in cells[:1])) and any(c for c in cells):
                for j, c in enumerate(cells):
                    if c and j < len(merged[-1]):
                        merged[-1][j] = (merged[-1][j] + " " + c).strip()
            elif merged and all(c == "" for c in cells):
                continue
            else:
                merged.append(cells)
        blocks.append(("table", merged)); continue
    if re.match(r"^(BAGIAN|BAB|APPENDIX)\s+[IVX0-9A-Z]+$", s):
        # heading: collect following non-empty short lines as title/subtitle
        kind = s.split()[0]
        title_lines = []
        i += 1
        while i < n and lines[i].strip() and lines[i].strip() != "[pic]" and not lines[i].strip().startswith("|"):
            title_lines.append(lines[i].strip())
            i += 1
            if len(title_lines) >= 3: break
        blocks.append(("part" if kind == "BAGIAN" else "chapter", (s, title_lines)))
        continue
    if s == "APPENDICES":
        title_lines = []
        i += 1
        while i < n and lines[i].strip() and lines[i].strip() != "[pic]":
            title_lines.append(lines[i].strip()); i += 1
            if len(title_lines) >= 3: break
        blocks.append(("part", ("APPENDICES", title_lines)))
        continue
    if re.match(r"^\s*•", ln):
        items = []
        cur = None
        while i < n:
            l2 = lines[i]
            if re.match(r"^\s*•", l2):
                if cur is not None: items.append(cur)
                cur = re.sub(r"^\s*•\s*", "", l2).strip()
                i += 1
            elif l2.startswith("      ") and l2.strip() and cur is not None:
                cur += " " + l2.strip(); i += 1
            else:
                break
        if cur is not None: items.append(cur)
        blocks.append(("ul", items)); continue
    # paragraph: accumulate until blank/special
    para = []
    while i < n:
        l2 = lines[i]; s2 = l2.strip()
        if not s2 or s2 == "[pic]" or s2.startswith("|") or re.match(r"^\s*•", l2) or re.match(r"^(BAGIAN|BAB|APPENDIX)\s+[IVX0-9A-Z]+$", s2) or s2 == "APPENDICES":
            break
        para.append(s2); i += 1
    text = " ".join(para)
    if not text: continue
    if len(text) < 70 and not text.endswith((".", "?", "!", ":", '"', "”")) and blocks and blocks[-1][0] == "rule":
        blocks.append(("h3", text))
    else:
        blocks.append(("p", text))

# render
out = []
part_count = 0
chapter_count = 0
toc = []

def close_flow():
    if out and out[-1] == "<!--flow-->":
        return
    pass

out.append("<!--COVER-->")
for typ, payload in blocks[: len(blocks)]:
    if typ == "rule":
        out.append('<div class="orule"></div>')
    elif typ == "part":
        label, tl = payload
        part_count += 1
        title = tl[0] if tl else ""
        sub = " ".join(tl[1:])
        toc.append(("part", label, title))
        out.append(f'</div><div class="page dark partpage"><div class="pcenter"><div class="plabel">{esc(label)}</div><h1>{esc(title)}</h1><p class="psub">{esc(sub)}</p></div><div class="footerbrand">KAS MERAH, RAB HIJAU</div></div><div class="flow">')
    elif typ == "chapter":
        label, tl = payload
        chapter_count += 1
        title = tl[0] if tl else ""
        sub = " ".join(tl[1:])
        toc.append(("ch", label, title))
        out.append(f'</div><div class="chaphead"><div class="clabel">{esc(label)}</div><h2>{esc(title)}</h2><p class="csub">{esc(sub)}</p><div class="rule"></div></div><div class="flow">')
    elif typ == "h3":
        out.append(f"<h3>{esc(payload)}</h3>")
    elif typ == "p":
        out.append(f"<p>{esc(payload)}</p>")
    elif typ == "ul":
        out.append("<ul>" + "".join(f"<li>{esc(x)}</li>" for x in payload) + "</ul>")
    elif typ == "table":
        rows = payload
        if not rows: continue
        thead = rows[0]; body = rows[1:]
        t = ["<table><tr>" + "".join(f"<th>{esc(c)}</th>" for c in thead) + "</tr>"]
        for r in body:
            neg = any("–Rp" in c or "-Rp" in c for c in r)
            t.append(f'<tr class="{"neg" if neg else ""}">' + "".join(f"<td>{esc(c)}</td>" for c in r) + "</tr>")
        t.append("</table>")
        out.append("".join(t))

body_html = "\n".join(out)

toc_html = "".join(
    (f'<div class="tocpart">{html.escape(lbl)} — {html.escape(t)}</div>' if k == "part"
     else f'<div class="tocch"><span>{html.escape(lbl)}</span> {html.escape(t)}</div>')
    for k, lbl, t in toc)

page_tpl = open("scripts/ebook/premium-template.html", encoding="utf-8").read()
final = page_tpl.replace("<!--TOC-->", toc_html).replace("<!--BODY-->", body_html)
open(OUT, "w", encoding="utf-8").write(final)
print("blocks:", len(blocks), "chapters:", chapter_count, "parts:", part_count)
print("written", OUT)
