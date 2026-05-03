<div align="center">

# 🧜‍♀️ MermaidDoc

**Markdown + Mermaid diagram viewer with Notion-style formal rendering and print support**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#-docker-deployment)
[![Mermaid](https://img.shields.io/badge/Mermaid-v11-FF3670?logo=mermaid&logoColor=white)](https://mermaid.js.org/)

Drop your Markdown files (or entire folders) and instantly view beautifully rendered documents with **clean, formal Mermaid diagrams** — straight orthogonal lines, neutral palettes, and Inter typography — just like Notion.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **Markdown Rendering** | Full GFM support via `markdown-it` — headings, tables, code blocks, blockquotes, task lists |
| 🧜 **Mermaid Diagrams** | Auto-detects `mermaid` code blocks and renders as inline SVG with formal styling |
| 📐 **Straight-Line Style** | Orthogonal (90°) connections via `stepAfter` curve — clean and professional |
| 📁 **Folder Drop** | Drag entire folders — recursively scans for `.md` files with `webkitGetAsEntry` API |
| 📋 **File Queue Sidebar** | Navigate between multiple files with sidebar list, prev/next buttons, keyboard shortcuts |
| 🖨️ **Print / PDF Export** | Optimized `@media print` stylesheet — diagrams won't split across pages |
| 🌙 **Dark Mode** | System-aware dark/light toggle with separate Mermaid theme variables |
| ⬇️ **SVG Download** | Export individual diagrams as `.svg` files |
| 💻 **Syntax Highlighting** | Non-mermaid code blocks highlighted via `highlight.js` |
| 🐳 **Docker Ready** | One-command deployment with `docker-compose` (Node.js + Nginx) |

---

## 🖼️ Screenshots

<div align="center">

| Light Mode | Dark Mode |
|:---:|:---:|
| *Clean, Notion-inspired typography* | *Full dark theme with adjusted diagram colors* |

</div>

---

## 🚀 Quick Start

### Option 1: npm

```bash
git clone https://github.com/hongvincent/mermaiddoc.git
cd mermaiddoc
npm install
npm start
# → http://localhost:3000
```

### Option 2: Docker

```bash
git clone https://github.com/hongvincent/mermaiddoc.git
cd mermaiddoc
docker-compose up -d
# → http://localhost (port 80 via Nginx)
```

---

## 📁 Project Structure

```
mermaiddoc/
├── server.js                 # Express server (static + upload API)
├── package.json
├── Dockerfile                # Node 20 Alpine image
├── docker-compose.yml        # App + Nginx reverse proxy
├── nginx/
│   └── default.conf          # Gzip, caching, proxy config
├── public/
│   ├── index.html            # SPA entry point
│   ├── css/
│   │   ├── index.css         # Design system (tokens, layout, sidebar)
│   │   ├── markdown.css      # GFM typography
│   │   ├── mermaid-formal.css # Diagram container styling
│   │   └── print.css         # @media print optimization
│   └── js/
│       ├── app.js            # Entry point, theme toggle, shortcuts
│       ├── uploader.js       # Drag-drop, folder traversal, file queue
│       ├── renderer.js       # markdown-it + Mermaid pipeline
│       └── printer.js        # Print with SVG readiness check
└── uploads/                  # (Docker volume, gitignored)
```

---

## 🎨 Design Philosophy

MermaidDoc's visual style is directly inspired by **Notion's** document and diagram rendering:

- **Typography**: Inter font family with tight letter-spacing and generous line-height
- **Color Palette**: Notion's signature neutrals (`#37352F` text, `#F7F7F8` surfaces, `#E3E3E0` borders)
- **Diagram Lines**: `stepAfter` curve for 90° orthogonal connections — no curves, no diagonals
- **Diagram Nodes**: Light fill (`#FFFFFF`) with subtle borders — formal and readable
- **Dark Mode**: Independently tuned Mermaid `themeVariables` for each mode

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + ↑` | Previous file in queue |
| `Alt + ↓` | Next file in queue |
| `Ctrl + P` | Print current document |

---

## 🐳 Docker Deployment

The Docker setup includes two services:

| Service | Image | Port | Role |
|---------|-------|------|------|
| `app` | Custom (Node 20 Alpine) | 3000 | Express server |
| `nginx` | nginx:alpine | 80 | Reverse proxy, gzip, caching |

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

**Production tips:**
- File uploads are stored in a Docker volume (`uploads`)
- Nginx adds `Cache-Control: public, immutable` for static assets (7d expiry)
- Max upload size: 10MB
- App runs as non-root `node` user

---

## 🔧 Supported Diagram Types

MermaidDoc renders all diagram types supported by Mermaid v11:

- ✅ Flowchart (`flowchart TD/LR`)
- ✅ Sequence Diagram (`sequenceDiagram`)
- ✅ Class Diagram (`classDiagram`)
- ✅ State Diagram (`stateDiagram-v2`)
- ✅ Entity Relationship (`erDiagram`)
- ✅ Gantt Chart (`gantt`)
- ✅ Pie Chart (`pie`)
- ✅ Git Graph (`gitGraph`)
- ✅ Mindmap (`mindmap`)
- ✅ Timeline (`timeline`)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ☕ and 🧜‍♀️

**[⬆ Back to Top](#-mermaiddoc)**

</div>
