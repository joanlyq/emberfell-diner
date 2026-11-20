#!/bin/sh
# Start the meal planner. Open the printed "home wifi" address on any phone/laptop on the same wifi.
cd "$(dirname "$0")"
[ -f data/recipes.json ] || ./update_recipes.sh
exec python3 server.py
