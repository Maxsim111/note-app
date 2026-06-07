# Note App

Self-hosted web note-taking application. Single binary, dark theme, three-column layout.

## Features

- **Three-column UI**: Settings panel | Folder tree | Content grid with colored blocks
- **Hierarchical folders**: Tree navigation, breadcrumb path, hover-to-see siblings
- **Colored cards**: Each note and folder gets a color (auto-assigned or manual)
- **File uploads**: Images (with thumbnails), PDF, DOC, TXT, Markdown
- **Self-contained**: Single binary with embedded frontend, no external dependencies
- **Dark theme**: GitHub-style dark color scheme

## Quick Start

### Build from source

```bash
# Prerequisites: Go 1.26+, Node.js 20+
make build          # macOS/Linux binary
make build-linux    # cross-compile for Linux amd64
```

### Run

```bash
./note-app
# => Note App running on http://0.0.0.0:8080
```

Custom port:
```bash
PORT=8888 ./note-app
```

### Deploy as systemd user service

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/note-app.service << 'EOF'
[Unit]
Description=Note App
After=network.target

[Service]
Type=simple
ExecStart=/home/%u/bin/note-app
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now note-app
loginctl enable-linger $USER
```

## Data & Portability

All data is stored in a single directory, separate from the application binary:

```
~/.config/note-app/          # Default data directory
├── note-app.db              # SQLite database (folders, notes, settings)
├── uploads/                 # Uploaded files organized by note UUID
│   └── <uuid>/
│       └── <filename>
└── thumbnails/              # Generated image thumbnails
    └── <uuid>.jpg
```

**Migrate to another machine:**

```bash
# On source machine — copy the entire data directory
scp -r ~/.config/note-app/ user@target:~/.config/note-app/

# Start note-app on target — all notes, folders, and files are restored
./note-app
```

Override data directory location:

```bash
NOTE_APP_DATA_DIR=/mnt/data/notes ./note-app
```

The binary and data are completely independent — upgrade the binary without touching your notes, or back up the data directory alone.

## Supported File Types

| Type | Extension | Behavior |
|------|-----------|----------|
| Image | jpg, png, gif, webp, bmp, svg | Thumbnail generated, inline preview |
| PDF | pdf | Stored as note with file-type icon |
| Word | doc, docx | Stored as note with file-type icon |
| Text | txt, log, csv | Content loaded into note editor |
| Markdown | md, markdown | Content loaded into note editor |

## Tech Stack

- **Backend**: Go + Gin + SQLite (modernc.org/sqlite — pure Go, no CGO)
- **Frontend**: React 19 + TypeScript + Vite
- **Packaging**: Go `embed` for single-binary deployment

## Development

```bash
make dev     # Runs Go backend (:8080) + Vite HMR (:5173)
make build   # Production build
make clean   # Remove build artifacts
```

## Known Issues

- **Bookmark icon not updating in real-time**: After adding/removing a bookmark, the bookmark icon (🔖) in the grid and tree may not immediately reflect the change. Navigating to another folder and back shows the correct state. The backend API correctly returns `bookmarked` status in note/tree responses; the issue is in the React rendering pipeline — child components do not always re-render after `refreshTree()`/`handleRefresh()` completes.
