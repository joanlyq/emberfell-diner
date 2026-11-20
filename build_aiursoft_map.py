#!/usr/bin/env python3
"""One-time: map HowToCook file paths -> howtocook.aiursoft.com recipe ids + English titles.

The aiursoft site hosts translated versions (28 languages) at /Recipes/Detail/{id}.
Writes data/aiursoft.json = {"dishes/...md": {"id": 309, "en": "Mapo Tofu"}}.
Polite: one request at a time, small delay. Re-run after update_recipes.sh to pick up new dishes.
"""
import html
import json
import os
import re
import time
import urllib.error
import urllib.request
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "data", "aiursoft.json")
BASE = "https://howtocook.aiursoft.com/Recipes/Detail/"
UA = "Mozilla/5.0 (home meal planner)"
EN = ".AspNetCore.Culture=c%3Den-US%7Cuic%3Den-US"


def fetch(i):
    req = urllib.request.Request(BASE + str(i), headers={"User-Agent": UA, "Cookie": EN})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def main():
    out = {}
    if os.path.exists(OUT):
        out = json.load(open(OUT, encoding="utf-8"))
    known = {v["id"] for v in out.values()}
    misses, i = 0, 0
    while misses < 40:
        i += 1
        if i in known:
            misses = 0
            continue
        try:
            page = fetch(i)
        except Exception as e:  # network blip: retry once
            time.sleep(2)
            try:
                page = fetch(i)
            except Exception:
                print("fail", i, e)
                continue
        time.sleep(0.25)
        if not page:
            misses += 1
            continue
        misses = 0
        m = re.search(r"HowToCook/edit/master/([^\"]+\.md)", page)
        t = re.search(r"<h1>(.*?)</h1>", page, re.S)
        if not m:
            continue
        path = unquote(html.unescape(m.group(1)))
        out[path] = {"id": i, "en": html.unescape(t.group(1)).strip() if t else ""}
        if i % 25 == 0:
            print(i, path, out[path]["en"])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print(f"{len(out)} mapped -> {OUT}")


if __name__ == "__main__":
    main()
