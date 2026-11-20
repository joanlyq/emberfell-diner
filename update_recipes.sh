#!/bin/sh
# Pull latest HowToCook recipes and rebuild the index. Your notes/pantry are untouched.
set -e
cd "$(dirname "$0")"
if [ -d vendor/HowToCook/.git ]; then
  git -C vendor/HowToCook pull --ff-only --depth 1
else
  mkdir -p vendor && git clone --depth 1 https://github.com/Anduin2017/HowToCook.git vendor/HowToCook
fi
python3 build_aiursoft_map.py || echo "translation map skipped (offline?)"
python3 build_index.py
