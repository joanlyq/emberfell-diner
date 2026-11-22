# Emberfell Diner

Home meal planner on the home wifi. Fridge/pantry → weekly dinner plan (2–4 serves, leftovers = lunch) → shopping list. Recipes from [HowToCook](https://github.com/Anduin2017/HowToCook). Pet batch cooking for cat + dog.

No installs. Uses macOS built-in `python3` (stdlib only — no pip, no venv).

## Set up (first time)

Needs macOS/Linux with `python3` (3.9+) and `git`. No packages to install.

```bash
git clone https://github.com/joanlyq/emberfell-diner.git
cd emberfell-diner
./update_recipes.sh   # downloads HowToCook (~200 MB, for photos) and builds the recipe index
./start.sh
```

Your own data (`data/db.json`, `data/words.json`, translation cache, logs) is created on first use and is git-ignored.

## Run

```bash
./start.sh
```

Prints two addresses:
- `http://localhost:8080` — this Mac
- `http://192.168.x.x:8080` — any phone/laptop on the same wifi

First run: macOS may ask "Allow python3 to accept incoming connections?" → **Allow**.
Other port: `PORT=9000 ./start.sh`.

## Auto-start (installed)

A macOS launch agent (`~/Library/LaunchAgents/com.emberfell.diner.plist`) starts the server at login and restarts it if it crashes. Log: `logs/server.log`. No need to run `./start.sh` any more (it would clash on port 8080).

- Restart after a `server.py` change: `launchctl kickstart -k gui/$(id -u)/com.emberfell.diner`
- Stop + turn off auto-start: `launchctl bootout gui/$(id -u)/com.emberfell.diner`
- Turn back on: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.emberfell.diner.plist`

Away from home: Tailscale on the Mac + phones, then `http://<mac-tailscale-name>:8080`. Mac must be awake.

## Files

| Path | What |
| --- | --- |
| `server.py` | Tiny web server + JSON API |
| `importer.py` | Link / video / text → recipe draft |
| `static/` | The website (app.js, pets.js, style.css) |
| `data/db.json` | Your data: pantry, plan, recipe notes, pets. Back this up. |
| `data/recipes.json` | Built from HowToCook |
| `build_index.py` | Parses HowToCook markdown → recipes.json (steps, photos, amounts) |
| `build_aiursoft_map.py` | One-time: links each recipe to its translated page on howtocook.aiursoft.com |
| `data/img/` | Photos saved by recipe import |
| `data/words.json` | Ingredient translations (auto + your fixes) |
| `data/translations/` | Cached translations, fetched the first time you open a recipe in that language |
| `update_recipes.sh` | Pull newest HowToCook, refresh translation links, rebuild |

## How it thinks

- **Suggestions** score each recipe by: share of main ingredients you have, bonus for items expiring in ≤3 days, your ratings, penalty if cooked in last 14 days or same protein twice in a week. Seasonings in Settings → "Always in the cupboard" are assumed.
- **Update a recipe** = short interview after cooking: followed as written? swaps? additions? timing? servings made? taste? leftovers? rating? again? used-up pantry items? Answers become *your version*: swaps change future ingredient matching, tips show on the recipe, "no" hides it, servings learned scale amounts.
- **Recipes tab rail**: filter by quick picks (♥ favorites, can make now, cooked before), category, main protein, difficulty, calories, or one fridge item ("uses what I have"). Kitchen tips link to the translated guides. On phones tap ☰ Filters.
- **Auto place**: your own habits first (every time you move an item with the 🧊/❄️/🥫 dropdown, or pick a spot by hand, it remembers that name). Then word rules: herbs (basil, bay leaves, spring onion, rosemary, mint, 葱, 香菜…) → 🌿 Herbs & garden; raw meat, fish, prawns → freezer (fridge if use-by is ≤4 days away); "frozen", dumplings → freezer; dairy, eggs, tofu, fresh veg, herbs → fridge; rice, pasta, sauces, tins, onion, garlic, potato → pantry. Unknown → fridge. Spots you chose by hand before this existed are learned once on first load.
- **Translations**: every fridge/pantry item shows English · 中文. Built-in list first; unknown words are translated once by MyMemory (free, only the word is sent) and saved in `data/words.json`. Wrong? Tap edit → fix the translation; yours always wins and is used for recipe matching.
- **Herbs & garden**: own section. Never offered as "used up" after cooking, since you grow them.
- **Shopping tab**: add anything (toilet paper, cat litter…), comma-separated. Grouped by shop (Settings → Where you shop: add/rename/reorder shops and choose which shop gets fruit & veg, meat, seafood, pet stuff, hardware & garden; everything else → first shop). Change an item's shop once and it remembers. "Shopping at" chips show one shop's list while you're there.
- **Planned dinners** feed the list automatically from planned dinners from today on: from today on — this week and any week you planned ahead. "This shop covers" chips pick which days this trip is for. Each line: what's missing from fridge/pantry, ≈ amount scaled to that day's servings (combined across dishes), which dinner needs it, grouped by aisle. Changing the plan or pantry updates it; your own lines and ticked lines are never touched; ✕ on a plan line keeps it off (↻ Refresh brings it back). "⚖️ Check you have enough" lists things you have that several dinners use. "Bought → pantry" moves ticked items into the pantry. Copy = grouped text for notes/messages.
- **Thaw reminder**: if today's or tomorrow's dish needs something that is only in the freezer, "This week" shows a banner to move it to the fridge.
- **Add a recipe** (Recipes → + Add recipe): paste a recipe website link, a video link, or plain text. You get a one-page draft (English + 中文 name, category, protein, difficulty, serves, photo, ingredients with amounts, steps) to check, then save. Imported recipes behave like HowToCook ones: suggestions, planner, shopping amounts, cooking interview. Your own recipes have an **Edit** button.
  - Recipe websites: read from the page's built-in recipe data (schema.org) — works even without AI.
  - Videos (YouTube, Bilibili, TikTok, Instagram…): `yt-dlp` reads title, description and captions only (nothing downloaded). If the description links to a written recipe, that page is used instead.
  - Pasted text / captions / pages without recipe data: tidied by a local AI model.
  - Music-only videos with no captions or recipe in the description can't be read — use "Type it myself".
  - Photos are saved on the Mac in `data/img/`. Home-network addresses are refused (the server only fetches public sites).
- **Favorites**: tap ♡ on any card or recipe. Favorites get a pink border, ♥ in the week plan, and a small boost in suggestions. Shared by everyone on the wifi.
- **Languages**: picker top-right, default English. 中文 = original from GitHub with local photos. Other languages come from howtocook.aiursoft.com (same recipes, translated, public domain), fetched once then cached.
- **Pets**: daily kcal = 70 × kg^0.75 × life-stage factor (or vet's number). Grams per ingredient for a 7- or 14-day batch. Recipes are templates — complete only with a vitamin–mineral premix made for home-cooked pet food (taurine for cats). Have your vet check. Batches due this week show on "This week"; "From plan" adds their grams (combined across pets, minus what you have) to the shopping list. After each batch, the next recipe switches protein and prefers what's already in your fridge.

## Recipe import helpers (optional)

Recipe websites work out of the box. Videos and pasted text need two free tools (Homebrew):

```bash
brew install yt-dlp ollama
brew services start ollama          # runs in the background, starts at login
ollama pull qwen2.5:14b             # ~9 GB, one time; needs ~16 GB RAM
```

Different model: set `RECIPE_MODEL` in the launch agent (e.g. `qwen2.5:7b` for smaller Macs). Everything runs on the Mac — no account, no cost.

### iPhone: Share → Emberfell

Shortcuts app → **+** → name it "Emberfell":
1. Tap ⓘ → turn on **Show in Share Sheet**, accept **URLs** and **Text**.
2. Add action **URL Encode** (input: Shortcut Input).
3. Add action **Text**: `http://<mac-name>:8080/?add=` then insert the *URL Encoded Text* variable.
4. Add action **Open URLs**.

Now in YouTube, Safari, Bilibili etc.: Share → Emberfell → the import box opens and starts reading.

## Credits

- Recipes and photos: [HowToCook](https://github.com/Anduin2017/HowToCook) by Anduin2017 and contributors (Unlicense). Not included in this repo — downloaded by `update_recipes.sh`.
- Translated recipe pages: [howtocook.aiursoft.com](https://howtocook.aiursoft.com) (same content, public domain).
- Ingredient word translation: [MyMemory](https://mymemory.translated.net) free API.
- Recipe import: [yt-dlp](https://github.com/yt-dlp/yt-dlp), [Ollama](https://ollama.com) with [Qwen2.5](https://github.com/QwenLM/Qwen2.5).
- Pet nutrition numbers are rough guidance only — have your vet check any home-cooked diet.
