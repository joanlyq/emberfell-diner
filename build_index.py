#!/usr/bin/env python3
"""Parse HowToCook markdown recipes into data/recipes.json (stdlib only)."""
import json
import os
import re
import sys
from urllib.parse import quote

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(ROOT, "vendor", "HowToCook")
OUT = os.path.join(ROOT, "data", "recipes.json")
GH = "https://github.com/Anduin2017/HowToCook/blob/master/"

CATEGORIES = {
    "meat_dish": "Meat", "vegetable_dish": "Veg", "aquatic": "Seafood",
    "soup": "Soup", "staple": "Staple", "breakfast": "Breakfast",
    "dessert": "Dessert", "drink": "Drink", "condiment": "Sauce",
    "semi-finished": "Semi-prepared",
}
TOOL_WORDS = ["锅", "刀", "碗", "盘", "烤箱", "微波炉", "铲", "筷", "盆", "模具", "保鲜膜",
              "锡纸", "油纸", "机", "砧板", "量杯", "温度计", "漏勺", "蒸笼", "签", "手套",
              "容器", "厨房纸", "吸油纸", "电子秤", "杯", "瓶", "袋", "架", "喷枪", "盒", "罐"]
PROTEIN_KEYS = [
    ("Seafood", ["鱼", "虾", "蟹", "贝", "鱿", "蛤", "蚝", "螺", "海参", "带鱼", "三文鱼", "花甲", "扇贝", "墨鱼", "鲍"]),
    ("Beef", ["牛肉", "牛腩", "牛排", "肥牛", "牛腱", "牛里脊", "牛尾", "牛"]),
    ("Lamb", ["羊肉", "羊排", "羊"]),
    ("Chicken", ["鸡腿", "鸡胸", "鸡翅", "鸡肉", "鸡块", "鸡爪", "整鸡", "三黄鸡", "鸭", "鹅", "鸡"]),
    ("Pork", ["猪", "五花", "排骨", "肉末", "肉馅", "里脊", "腊肠", "香肠", "培根", "火腿", "肘", "瘦肉", "梅花肉", "腊肉", "肉"]),
    ("Tofu/Egg", ["豆腐", "鸡蛋", "蛋"]),
]
NOT_PROTEIN = ["鸡精", "鸡粉", "蚝油", "鱼露", "鱼香", "牛奶", "牛油果", "肉桂", "肉豆蔻", "鸡汤", "高汤", "蛋黄酱", "鸡蛋"]


def detect_protein(name, ings):
    def hit(text, skip_egg):
        for prot, keys in PROTEIN_KEYS:
            if skip_egg and prot == "Tofu/Egg":
                continue
            if any(k in text for k in keys):
                return prot
        return None
    nm = name
    for w in NOT_PROTEIN:
        nm = nm.replace(w, "")
    p = hit(nm, True)
    if p:
        return p
    for i in ings:
        if any(w in i for w in NOT_PROTEIN):
            continue
        p = hit(i, True)
        if p:
            return p
    return "Tofu/Egg" if any(("豆腐" in i or "鸡蛋" in i) for i in ings + [name]) else "Veg"


PROTEINS = [("Seafood", "鱼虾蟹贝鱿蛤蚝螺海参带鱼三文鱼"), ("Beef", "牛"), ("Lamb", "羊"),
            ("Chicken", "鸡鸭鹅"), ("Pork", "猪五花排骨肉末肉馅里脊腊肠香肠培根火腿"),
            ("Tofu/Egg", "豆腐蛋")]


def clean_ing(s):
    s = re.sub(r"[（(][^）)]*[）)]", "", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)  # md links
    s = s.replace("*", "").replace("`", "")
    s = re.sub(r"^(可选|选用|可选的)[:：]?", "", s.strip())
    parts = re.split(r"[、/，,；;]|或者|或|和|及", s)
    out = []
    for p in parts:
        p = re.split(r"[:：]", p)[0]
        p = re.split(r"\s*[0-9０-９一二两三四五六七八九十半适少若]+\s*", p)[0]
        p = re.sub(r"[^一-鿿A-Za-z]", "", p).strip()
        if not p or len(p) > 10:
            continue
        if any(w in p for w in TOOL_WORDS) and not p.endswith(("肉", "菜", "菇")):
            continue
        out.append(p)
    return out


UNITS = r"(ml|mL|ML|g|kg|克|千克|毫升|升|L|个|片|根|颗|瓣|盒|枚|勺|汤匙|茶匙|杯|只|条|块|cups?|tbsp|tsp|斤|两|粒|把|张|包|袋|cm|厘米)"


def split_top(item):
    """Split on 、 ； ; outside brackets, only when every piece carries its own amount."""
    parts, buf, depth = [], "", 0
    for ch in item:
        depth += ch in "（(" 
        depth -= ch in "）)" and depth > 0
        if ch in "、；;" and depth == 0:
            parts.append(buf); buf = ""
        else:
            buf += ch
    parts.append(buf)
    parts = [p.strip() for p in parts if p.strip()]
    has_amt = lambda p: re.search(r"[0-9]|(?:^|\s)[半一两二三四五六七八九十]\s*\S", p)
    return parts if len(parts) > 1 and all(has_amt(p) for p in parts) else [item]


def parse_amount(item):
    """'鸡腿肉 400g' or '125ml 淡奶油' or '两瓣大蒜' -> [name, qty, unit]."""
    if "=" in item or re.search(r"[°℃]", item):
        return None
    item = re.sub(r"\*\*", "", item)
    m = re.match(r"^([0-9][0-9.\-–~/]*)\s*" + UNITS + r"?\s*(.+)$", item)
    if m:
        return [m.group(3).strip(), m.group(1), m.group(2) or ""]
    # "包菜 半 颗", "鸡蛋 两 个" → number words as digits
    m = re.match(r"^(.+?)\s+(半|一|两|二|三|四|五|六|七|八|九|十)\s*([^\s0-9]{1,3})(.*)$", item)
    if m:
        n = {"半": "0.5", "一": "1", "两": "2", "二": "2", "三": "3", "四": "4", "五": "5", "六": "6", "七": "7", "八": "8", "九": "9", "十": "10"}[m.group(2)]
        return [m.group(1).strip(" ：:"), n, (m.group(3) + m.group(4)).strip()]
    m = re.match(r"^([^0-9].*?)\s*([0-9][0-9.\-–~/]*)\s*(\S*)(.*)$", item)
    if m:
        return [m.group(1).strip(" ：:"), m.group(2), (m.group(3) + m.group(4)).strip()]
    return [item, "", ""]


def resolve(src, rel, prefix):
    if re.match(r"^[a-z]+://", src):
        return src
    parts = rel.split("/")[:-1]
    for seg in src.split("/"):
        if seg in ("", "."):
            continue
        if seg == "..":
            parts = parts[:-1]
        else:
            parts.append(seg)
    return prefix + quote("/".join(parts))


def fix_links(line, rel):
    line = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", lambda m: f"![{m.group(1)}]({resolve(m.group(2), rel, '/repo/')})", line)
    return re.sub(r"(?<!!)\[([^\]]*)\]\(([^)\s]+)\)", lambda m: f"[{m.group(1)}]({resolve(m.group(2), rel, GH)})", line)


def num_or_none(m):
    return int(m.group(1)) if m else None


def parse(path, rel):
    text = open(path, encoding="utf-8").read()
    lines = text.splitlines()
    title = next((l[2:].strip() for l in lines if l.startswith("# ")), os.path.basename(path)[:-3])
    name = re.sub(r"的(做法|制作方法|制作|食谱)$", "", title).strip()
    desc = ""
    for l in lines[1:]:
        l = l.strip()
        if l and not l.startswith(("#", "!", "预估", "<", "|", "-")):
            desc = re.sub(r"!?\[[^\]]*\]\([^)]*\)", "", l)[:220]
            break
    stars = len(re.findall("★", next((l for l in lines if "难度" in l), "")))
    kcal = num_or_none(re.search(r"卡路里[：:]\s*约?\s*(\d+)", text))
    sv = re.search(r"([0-9一二两三四五六])\s*(?:个)?人(?:份|食用|的分量)", text)
    servings = None
    if sv:
        servings = {"一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6}.get(sv.group(1)) or int(sv.group(1))

    sec, ings, table, steps = None, [], [], []
    for l in lines:
        if l.startswith("## "):
            sec = l[3:].strip()
            if sec not in ("必备原料和工具", "计算"):
                steps.append(l)
            continue
        if sec == "必备原料和工具" and re.match(r"^\s*[-*]\s+", l):
            raw = re.sub(r"^\s*[-*]\s+", "", l)
            optional = "可选" in raw
            for n in clean_ing(raw):
                if n not in [i["n"] for i in ings]:
                    ings.append({"n": n, "opt": optional})
        if sec == "计算" and l.startswith("|") and not re.match(r"^\|\s*:?-", l):
            cells = [c.strip() for c in l.strip().strip("|").split("|")]
            if len(cells) >= 2 and cells[0] not in ("原料", "材料", "食材", "名称"):
                table.append(cells[:3] + [""] * (3 - len(cells[:3])))
        if sec == "计算" and re.match(r"^\s*[-*]\s+", l):
            # "盐 2 g、生抽 15 ml、老抽 10 ml" → one row each
            for part in split_top(re.sub(r"^\s*[-*]\s+", "", l).strip()):
                row = parse_amount(part.strip())
                if row and re.search(r"[（(]\s*$", row[0]):  # "猪肉 (250g)" → 猪肉 · 250 g
                    row = [re.sub(r"\s*[（(]\s*$", "", row[0]), row[1], re.sub(r"\s*[）)]\s*$", "", row[2])]
                if row and row[0]:
                    table.append(row)
        if sec not in (None, "必备原料和工具", "计算"):
            steps.append(fix_links(l, rel) if not l.startswith("## ") else l)

    img = re.search(r"!\[[^\]]*\]\(([^)\s]+)\)", text)
    img = resolve(img.group(1), rel, "/repo/") if img else ""
    cat_key = rel.split("/")[1]
    protein = detect_protein(name, [i["n"] for i in ings])
    return {
        "id": rel,
        "name": name,
        "cat": CATEGORIES.get(cat_key, cat_key),
        "url": GH + quote(rel),
        "stars": stars,
        "kcal": kcal,
        "serves": servings,
        "desc": desc,
        "protein": protein,
        "ings": ings,
        "table": table[:40],
        "img": img,
        "steps": "\n".join(steps).strip(),
    }


def main():
    if not os.path.isdir(REPO):
        sys.exit("vendor/HowToCook missing — run update_recipes.sh")
    recipes = []
    base = os.path.join(REPO, "dishes")
    for dp, _, files in os.walk(base):
        for f in files:
            if not f.endswith(".md"):
                continue
            rel = os.path.relpath(os.path.join(dp, f), REPO).replace(os.sep, "/")
            if "/template/" in rel:
                continue
            try:
                recipes.append(parse(os.path.join(dp, f), rel))
            except Exception as e:  # keep going on odd files
                print("skip", rel, e)
    amap = os.path.join(ROOT, "data", "aiursoft.json")
    amap = json.load(open(amap, encoding="utf-8")) if os.path.exists(amap) else {}
    for r in recipes:
        a = amap.get(r["id"])
        if a:
            r["aid"], r["en"] = a["id"], a["en"]
    recipes.sort(key=lambda r: (r["cat"], r["name"]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(recipes, fh, ensure_ascii=False)
    print(f"{len(recipes)} recipes -> {OUT}")


if __name__ == "__main__":
    main()
