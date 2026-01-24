#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || dirname "$SCRIPT_DIR")"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
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

printf "\033[1;36m"
echo "========================================"
printf "        %s Script Console\n" "$PROJECT_NAME"
echo "========================================"
echo
printf "\033[0m"
printf "\033[1;37m"
log "Available scripts"
printf "\033[0m"
echo

for i in "${!scripts[@]}"; do
  name="$(basename "${scripts[$i]}")"
  desc="$(grep -m 1 '^# Description:' "${scripts[$i]}" | sed 's/^# Description: //')"
  if [ -n "$desc" ]; then
    printf "\033[1;37m  %d) %s\033[0m \033[2;37m— %s\033[0m\n" "$((i + 1))" "$name" "$desc"
  else
    printf "\033[1;37m  %d) %s\033[0m\n" "$((i + 1))" "$name"
  fi
done

echo
printf "\033[1;33m"
read -r -p "Select a script to run (1-${#scripts[@]}): " selection
printf "\033[0m"

if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
  printf "\033[1;31m"
  log "Invalid selection."
  printf "\033[0m"
  exit 1
fi

index=$((selection - 1))
if [ "$index" -lt 0 ] || [ "$index" -ge "${#scripts[@]}" ]; then
  printf "\033[1;31m"
  log "Selection out of range."
  printf "\033[0m"
  exit 1
fi

chosen="${scripts[$index]}"
printf "\033[1;32m"
log "Running: $(basename "$chosen")"
printf "\033[0m"
exec "$chosen"
