#!/usr/bin/env python3
"""Home meal planner server. Stdlib only — no pip, no venv.

Serves static/ and a tiny JSON API backed by data/db.json.
Binds 0.0.0.0 so any device on the home wifi can open it.
"""
import json
import os
import socket
import sys
import threading
import urllib.request
from html import escape
from html.parser import HTMLParser
from urllib.parse import parse_qs, unquote, urlencode, urlparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")
DATA = os.path.join(ROOT, "data")
DB = os.path.join(DATA, "db.json")
RECIPES = os.path.join(DATA, "recipes.json")
PORT = int(os.environ.get("PORT", "8080"))
REPO = os.path.join(ROOT, "vendor", "HowToCook")
AMAP = os.path.join(DATA, "aiursoft.json")
TCACHE = os.path.join(DATA, "translations")
AIUR = "https://howtocook.aiursoft.com"
WORDS = os.path.join(DATA, "words.json")
CJK = __import__("re").compile(r"[\u4e00-\u9fff]")
# MyMemory sometimes answers in traditional characters; recipes use simplified.
T2S = str.maketrans("針麵雞豬魚蝦蔥薑蘿蔔醬蘋筍紅黃綠湯餅糧檸鳳貝鴨鵝塊條絲顆醃燒滷餃餛飩蠔煉乾鮮蘆荳腸鹹葉蓮藍莧蕎續隨欖麥處頭雜種類層與帶鹽釀蠣鮭鱈鰻鱸鯖鮪歐義豐濃煙燻臘雙雲櫻實糰粿甕菸鍋骨麩蘭莓漿凍熱涼醃腎臟雜蛋鮑參魷螺蛤鱗鯉鯽鵪鶉蘿",
                   "针面鸡猪鱼虾葱姜萝卜酱苹笋红黄绿汤饼粮柠凤贝鸭鹅块条丝颗腌烧卤饺馄饨蚝炼干鲜芦豆肠咸叶莲蓝苋荞续随榄麦处头杂种类层与带盐酿蛎鲑鳕鳗鲈鲭鲔欧义丰浓烟熏腊双云樱实团粿瓮烟锅骨麸兰莓浆冻热凉腌肾脏杂蛋鲍参鱿螺蛤鳞鲤鲫鹌鹑萝")
LANGS = {"en-US", "en-GB", "zh-CN", "zh-TW", "zh-HK", "ja-JP", "ko-KR", "vi-VN", "th-TH", "de-DE", "fr-FR", "es-ES",
         "ru-RU", "it-IT", "pt-PT", "pt-BR", "ar-SA", "nl-NL", "sv-SE", "pl-PL", "tr-TR", "ro-RO", "da-DK", "uk-UA",
         "id-ID", "fi-FI", "hi-IN", "el-GR"}
IMG_TYPES = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"}
ALLOWED = {"h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "br", "code", "blockquote",
           "table", "thead", "tbody", "tr", "td", "th", "img", "a"}


class Clean(HTMLParser):
    """Keep only simple formatting tags; images/links made absolute. Drops scripts, styles, attributes."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if self.skip or tag not in ALLOWED:
            return
        a = dict(attrs)
        if tag == "img":
            src = a.get("src") or ""
            if src.startswith("/"):
                src = AIUR + src
            if src.startswith("https://"):
                self.out.append(f'<img src="{escape(src)}" alt="" loading="lazy">')
            return
        if tag == "a":
            href = a.get("href") or ""
            if href.startswith("/"):
                href = AIUR + href
            if not href.startswith("https://"):
                href = "#"
            self.out.append(f'<a href="{escape(href)}" target="_blank" rel="noopener">')
            return
        self.out.append(f"<{tag}>")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        if not self.skip and tag in ALLOWED and tag not in ("img", "br"):
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        if not self.skip:
            self.out.append(escape(data))


def translated(aid, lang):
    """Fetch the translated recipe from howtocook.aiursoft.com once, cache on disk."""
    path = os.path.join(TCACHE, lang, f"{aid}.html")
    if os.path.exists(path):
        return open(path, encoding="utf-8").read()
    req = urllib.request.Request(f"{AIUR}/Recipes/Detail/{aid}", headers={
        "User-Agent": "Mozilla/5.0 (home meal planner)",
        "Cookie": f".AspNetCore.Culture=c%3D{lang}%7Cuic%3D{lang}"})
    with urllib.request.urlopen(req, timeout=20) as r:
        page = r.read().decode("utf-8", "replace")
    start = page.find("<h1>")
    if start < 0:
        raise ValueError("no recipe body")
    end = page.find("</div>", start)
    c = Clean()
    c.feed(page[start:end])
    body = "".join(c.out)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body)
    return body

def load_words():
    return json.load(open(WORDS, encoding="utf-8")) if os.path.exists(WORDS) else {}


def save_words(w):
    tmp = WORDS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(w, fh, ensure_ascii=False, indent=0)
    os.replace(tmp, WORDS)


def auto_word(q):
    """Translate one food word en<->zh via MyMemory (free, no key). Only the word is sent."""
    key = q.strip().lower()
    with LOCK:
        w = load_words()
    if key in w:
        return w[key]
    pair = "zh-CN|en" if CJK.search(q) else "en|zh-CN"
    url = "https://api.mymemory.translated.net/get?" + urlencode({"q": q.strip(), "langpair": pair})
    req = urllib.request.Request(url, headers={"User-Agent": "home-meal-planner"})
    with urllib.request.urlopen(req, timeout=10) as r:
        d = json.load(r)
    to_zh = pair.startswith("en")
    # first answer is sometimes junk (pinyin, wrong word); take the best candidate in the right script
    cands = [d["responseData"]["translatedText"]] + [m["translation"] for m in sorted(d.get("matches", []), key=lambda m: -float(m.get("match", 0)))]
    t = ""
    for c in cands:
        c = (c or "").strip().strip("：:。.,，;；!！").strip()
        if not c or len(c) > 40 or "MYMEMORY" in c.upper() or c.lower() == key:
            continue
        if to_zh and CJK.search(c) and not __import__("re").search(r"[a-zA-Z]", c):
            t = c.translate(T2S)
            break
        if not to_zh and not CJK.search(c):
            t = c.lower()
            break
    entry = {"t": t, "by": "auto"}
    with LOCK:
        w = load_words()
        w[key] = entry
        save_words(w)
    return entry


SECTIONS = {"pantry": [], "plan": {}, "notes": {}, "custom": [], "pets": [],
            "petLog": [], "settings": {}, "shopping": []}
LOCK = threading.Lock()


def load_db():
    if not os.path.exists(DB):
        return {k: (v.copy() if hasattr(v, "copy") else v) for k, v in SECTIONS.items()}
    with open(DB, encoding="utf-8") as fh:
        db = json.load(fh)
    for k, v in SECTIONS.items():
        db.setdefault(k, v.copy())
    return db


def save_db(db):
    tmp = DB + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(db, fh, ensure_ascii=False, indent=1)
    os.replace(tmp, DB)  # atomic: never half-written


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=STATIC, **kw)

    def end_headers(self):
        # app files: always revalidate so phones pick up updates
        if not self.path.startswith(("/repo/", "/api/")):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # quiet

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/repo/"):
            return self.send_repo_file(unquote(u.path[len("/repo/"):]))
        if u.path == "/api/translate":
            q = parse_qs(u.query)
            rid, lang = q.get("id", [""])[0], q.get("lang", [""])[0]
            amap = json.load(open(AMAP, encoding="utf-8")) if os.path.exists(AMAP) else {}
            if lang not in LANGS or rid not in amap:
                return self.send_json({"error": "no translation"}, 404)
            try:
                return self.send_json({"html": translated(int(amap[rid]["id"]), lang), "aid": amap[rid]["id"]})
            except Exception as e:
                return self.send_json({"error": f"fetch failed: {e}"}, 502)
        if u.path == "/api/words":
            with LOCK:
                return self.send_json(load_words())
        if u.path == "/api/word":
            q = parse_qs(u.query).get("q", [""])[0]
            if not q.strip() or len(q) > 60:
                return self.send_json({"error": "bad word"}, 400)
            try:
                return self.send_json(auto_word(q))
            except Exception as e:
                return self.send_json({"error": f"translate failed: {e}"}, 502)
        if self.path == "/api/db":
            with LOCK:
                return self.send_json(load_db())
        if self.path == "/api/recipes":
            with open(RECIPES, "rb") as fh:
                body = fh.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return self.wfile.write(body)
        return super().do_GET()

    def send_repo_file(self, rel):
        full = os.path.realpath(os.path.join(REPO, rel))
        ext = os.path.splitext(full)[1].lower()
        if not full.startswith(os.path.realpath(os.path.join(REPO, "dishes")) + os.sep) or ext not in IMG_TYPES or not os.path.isfile(full):
            return self.send_json({"error": "not found"}, 404)
        with open(full, "rb") as fh:
            body = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", IMG_TYPES[ext])
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "max-age=86400")
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self):
        if self.path == "/api/word":  # your own translation: {"q": "chicken maryland", "t": "鸡腿"}
            n = int(self.headers.get("Content-Length", "0"))
            try:
                body = json.loads(self.rfile.read(min(n, 10000)).decode("utf-8"))
                q, t = str(body["q"]).strip().lower(), str(body.get("t", "")).strip()
            except (ValueError, KeyError):
                return self.send_json({"error": "bad json"}, 400)
            if not q or len(q) > 60 or len(t) > 60:
                return self.send_json({"error": "bad word"}, 400)
            with LOCK:
                w = load_words()
                w[q] = {"t": t, "by": "you"}
                save_words(w)
            return self.send_json({"ok": True})
        # PUT /api/db/<section>  body = full new value of that section
        parts = self.path.strip("/").split("/")
        if len(parts) != 3 or parts[:2] != ["api", "db"] or parts[2] not in SECTIONS:
            return self.send_json({"error": "bad path"}, 404)
        n = int(self.headers.get("Content-Length", "0"))
        if n > 5_000_000:
            return self.send_json({"error": "too big"}, 413)
        try:
            value = json.loads(self.rfile.read(n).decode("utf-8"))
        except ValueError:
            return self.send_json({"error": "bad json"}, 400)
        if type(value) is not type(SECTIONS[parts[2]]):
            return self.send_json({"error": "wrong type"}, 400)
        with LOCK:
            db = load_db()
            db[parts[2]] = value
            save_db(db)
        return self.send_json({"ok": True})


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def main():
    if not os.path.exists(RECIPES):
        sys.exit("data/recipes.json missing — run: python3 build_index.py")
    os.makedirs(DATA, exist_ok=True)
    srv = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    host = socket.gethostname()
    print("Emberfell Diner running:")
    print(f"  this Mac:     http://localhost:{PORT}")
    print(f"  home wifi:    http://{lan_ip()}:{PORT}")
    if host.endswith(".local"):
        print(f"  by name:      http://{host}:{PORT}")
    print("Ctrl+C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
