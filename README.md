# 🍕 Sliceza

**Focus on just a slice of your code when working with AI.**  
Or take the whole pie when you need it.

Sliceza helps you create **explicit, human-curated context** for AI-assisted development by generating a single, inspectable context file from the files *you* choose.

No magic. No hidden state. Just context you can trust.

---

## Why Sliceza?

AI tools are powerful — but they work best when the context is:
- intentional
- readable
- scoped
- honest about what’s missing

Sliceza lets you:
- group files into named *slices*
- tag them with simple *channels* (often colors)
- generate a single `slice_context.md` file for AI tools
- include a lightweight tree to orient both humans and models

You stay in control of what the AI sees.

---

## Installation

```bash
npm install -g sliceza
```

Strongly recommended alias (much easier to type):

```bash
alias sli="sliceza"
```

Add that to your `~/.zshrc` or `~/.bashrc`.

---

## Quick Start

Initialize Sliceza in your project:

```bash
sliceza init
```

This creates a `slice.jsonc` file (safe to edit by hand).

Add files to a slice:

```bash
sliceza add core green src/index.ts src/text.ts
```

List slices or inspect a channel/slice:

```bash
sliceza list
sliceza list green
sliceza list core
```

Generate the context file:

```bash
sliceza build
```

This produces `slice_context.md` — ready to paste into ChatGPT, Claude, or other AI tools.

---

## slice.jsonc (Human-Editable)

Sliceza uses JSONC (JSON with comments) so you can understand and edit it comfortably.

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
      "channel": "green",
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

Sliceza can generate a lightweight directory tree to help orient AI and humans.

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
sliceza init
sliceza add <slice> <channel> <path...>
sliceza remove <slice> <path...>
sliceza list [slice|channel]
sliceza build [slice|channel]
sliceza doctor
sliceza about
sliceza --tips
sliceza --version
```

---

## Philosophy

Sliceza follows a simple rule:

> If a human might debate the wording, it belongs in a file you can read.

There is no hidden state, no background syncing, and no AI-specific lock-in.
Everything Sliceza generates is plain text and Git-friendly.

---

## Future Path 🚀

### v2 — Reverse Patch Mode (Git-based)
- Generate and apply diffs from AI suggestions
- `sliceza apply` using `git apply` for safety
- Dry-run by default

### v3 — Dependency & Import Graphs
- Optional import/dependency visualization
- Language-aware where possible

### VS Code Integration
- GUI for managing slices and channels
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
