# 🍕 zzza

Visit:
https://zzza.online/

**Focus on just a slice of your code when working with AI.**  
Or take the whole pie when you need it.

zzza helps you create **explicit, human-curated context** for AI-assisted development by generating a single, inspectable context file from the files *you* choose.

No magic. No hidden state. Just context you can trust.

---

## Why zzza?

AI tools are powerful — but they work best when the context is:
- intentional
- readable
- scoped
- honest about what’s missing

zzza lets you:
- group files into named *slices*
- tag them with simple *groups* (often colors)
- generate a single `slice_context.md` file for AI tools
- include a lightweight tree to orient both humans and models

You stay in control of what the AI sees.

---

## Installation

```bash
npm install -g zzza
```

Strongly recommended alias (much easier to type):

```bash
alias sli="zzza"
```

Add that to your `~/.zshrc` or `~/.bashrc`.

---

## Quick Start

Initialize zzza in your project:

```bash
zzza init
```

This creates a `slice.jsonc` file (safe to edit by hand).

Add files to a slice:

```bash
zzza add core green src/index.ts src/text.ts
```

List slices or inspect a group/slice:

```bash
zzza list
zzza list green
zzza list core
```

Generate the context file:

```bash
zzza build
```

This produces `slice_context.md` — ready to paste into ChatGPT, Claude, or other AI tools.

---

## slice.jsonc (Human-Editable)

zzza uses JSONC (JSON with comments) so you can understand and edit it comfortably.

```jsonc
{
  "settings": {
    "contextFile": "slice_context.md",
    "ignore": ["node_modules/**", "dist/**"],

    "tree": {
      "roots": ["src"],
      "mode": "dirs-only",
      "maxDepth": 6,
      "maxEntries": 500
    }
  },

  "slices": [
    {
      "id": "core",
      "name": "Core",
      "group": "green",
      "items": [
        { "kind": "file", "path": "src/index.ts" },
        { "kind": "file", "path": "src/text.ts" }
      ]
    }
  ]
}
```

---

## Context Tree

zzza can generate a lightweight directory tree to help orient AI and humans.

Modes:
- `dirs-only` (default, token-efficient)
- `dirs-and-files` (more detail)

The tree is regenerated on each build to stay honest and deterministic.

---

## Build Warnings

If a file is missing or unreadable:
- the build still succeeds
- a warning is printed in the CLI
- a warning block is added to `slice_context.md`

Missing files are treated as **signals**, not silent failures.

---

## Commands

```txt
zzza init
zzza add <slice> <group> <path...>
zzza remove <slice> <path...>
zzza list [slice|group]
zzza build [slice|group]
zzza doctor
zzza about
zzza --tips
zzza --version
```

---

## Philosophy

zzza follows a simple rule:

> If a human might debate the wording, it belongs in a file you can read.

There is no hidden state, no background syncing, and no AI-specific lock-in.
Everything zzza generates is plain text and Git-friendly.

---

## Future Path 🚀

### v2 — Reverse Patch Mode (Git-based)
- Generate and apply diffs from AI suggestions
- `zzza apply` using `git apply` for safety
- Dry-run by default

### v3 — Dependency & Import Graphs
- Optional import/dependency visualization
- Language-aware where possible

### VS Code Integration
- GUI for managing slices and groups
- Color-based slice selection

All future features will be:
- explicit
- inspectable
- reversible
- widely expected

---

## License

MIT

---

Built as part of the Jiode ecosystem.  
Tools for the future.

👉 https://jiode.one
