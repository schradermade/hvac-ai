#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="script-menu"
source "$HOME/.dotfiles/bin/script-log.sh"

scripts=()
while IFS= read -r script; do
  scripts+=("$script")
done < <(find "$SCRIPT_DIR" -maxdepth 1 -type f -name "*.sh" ! -name "menu.sh" | sort)

if [ ${#scripts[@]} -eq 0 ]; then
  echo "No scripts found in $SCRIPT_DIR"
  exit 1
fi

log "Available scripts:"
for i in "${!scripts[@]}"; do
  name="$(basename "${scripts[$i]}")"
  printf "  %d) %s\n" "$((i + 1))" "$name"
done

echo
read -r -p "Select a script to run (1-${#scripts[@]}): " selection

if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
  log "Invalid selection."
  exit 1
fi

index=$((selection - 1))
if [ "$index" -lt 0 ] || [ "$index" -ge "${#scripts[@]}" ]; then
  log "Selection out of range."
  exit 1
fi

chosen="${scripts[$index]}"
log "Running: $(basename "$chosen")"
exec "$chosen"
