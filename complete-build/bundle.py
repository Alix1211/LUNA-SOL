"""Build the offline release from the split game files."""
import base64
import json
import mimetypes
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def data_url(path):
    mime = mimetypes.guess_type(path)[0]
    if not mime:
        raise ValueError(f"Unknown media type: {path}")
    data = base64.b64encode((ROOT / path).read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"

def embed_script(match):
    path = match[1]
    script = (ROOT / path).read_text(encoding="utf-8")
    for declaration in ("globalThis.LUNA_ASSETS", "const LUNA_SOUND"):
        pattern = re.compile(re.escape(declaration) + r"=(\{.*?\});")
        def embed_map(binding):
            values = json.loads(binding[1])
            return declaration + "=" + json.dumps(
                {key: data_url(value) for key, value in values.items()},
                separators=(",", ":"),
            ) + ";"
        script = pattern.sub(embed_map, script, count=1)
    if re.search(r"</script\b", script, re.IGNORECASE):
        raise ValueError(f"Script contains an inline closing tag: {path}")
    return "<script>" + script + "</script>"

def main():
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("LUNA_SOL_COMPLETE_V6.html")
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="style.css">', "<style>" + css + "</style>")
    html = re.sub(r'<script src="([^"]+)"></script>', embed_script, html)
    output.write_text(html, encoding="utf-8")
    print(f"{output} ({output.stat().st_size:,} bytes)")

if __name__ == "__main__":
    main()
