# Script Conventions

Use these conventions for new scripts in `scripts/`.

## Template

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="my-script"
source "$HOME/.dotfiles/bin/script-log.sh"

log "Starting..."
```

## Notes

- Add a description line after the shebang so it shows in `scripts/menu.sh`:
  `# Description: One-line summary of what the script does.`
- Use `log "message"` for output (adds a colored prefix).
- Make scripts executable: `chmod +x scripts/my-script.sh`.
