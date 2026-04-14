# 🍕 zzza

**Focus on just a slice of your code when working with AI.**  
Or take the whole pie when you need it.

zzza helps you create **explicit, human-curated context** for AI-assisted development by generating a single, inspectable context file from the files *you* choose.

Context you can trust.

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

## How zzza Works (In Plain English)

zzza is built around a few simple ideas:

- A **slice** is a named collection of files and/or folders you choose
- A **group** is a single label (often a color or theme) that a slice belongs to
- zzza generates **one clear context file** from those choices

There are a few important rules that keep things predictable and calm:

**The current rules are:**
- **One group per slice** — slices are intentionally simple
- **Groups are assigned explicitly** — nothing is inferred or automatic
- **The CLI and the VS Code UI always stay in sync** — no hidden state

These rules are deliberate. They keep your context:
- easy to reason about
- easy to review
- safe to share with AI tools

---

## Getting Started (5 Minutes)

### 1. Initialize zzza

In the root of your project:

```bash
zzza init
```

This creates a `slice.jsonc` file. This is the *source of truth* for everything zzza does.
It is safe to commit to Git and safe to edit by hand.

---

### 2. Create your first slice

Think of a slice as answering the question:

> *“What part of this codebase do I want the AI to focus on?”*

Add one or more files:

```bash
zzza add core src/index.ts src/text.ts
```

Or add a whole folder (expanded at build time):

```bash
zzza add-dir core src/app
```

If this is a new slice, it will be created automatically.

---

### 3. Assign the slice to a group

Groups help you organize slices at a higher level (for example: `green`, `design`, `docs`).

```bash
zzza group core green
```

Remember:
- each slice belongs to **one group**
- changing a group is always explicit

---

### 4. Inspect what you have

List all slices:

```bash
zzza list slices
```

See what files are in a slice:

```bash
zzza list slice core
```

See which group a slice belongs to:

```bash
zzza list group core
```

List all groups:

```bash
zzza list groups
```

---

### 5. Build the context

```bash
zzza build
```

This generates `slice_context.md` — a single, inspectable file you can paste into ChatGPT, Claude, or other AI tools.

---

## Installation

```bash
npm install -g zzza
```

Recommended for most projects:

```bash
npm install -D zzza
# then run via npx
npx zzza init
```

Strongly recommended alias (much easier to type):

```bash
alias sli="zzza"
```

Add that to your `~/.zshrc` or `~/.bashrc`.

---

## slice.jsonc (Human-Editable)

zzza uses JSONC (JSON with comments) so you can understand and edit it comfortably.

```jsonc
{
  "settings": {
    "contextFile": "slice_context.md",

    // Paths to ignore everywhere
    "ignore": ["node_modules/**", "dist/**", ".git/**"],

    // Directory expansion rules (glob‑lite)
    "dirInclude": ["**/*.ts", "**/*.html", "**/*.css", "**/*.scss", "**/*.md"],
    "dirExclude": ["**/*.map", "**/*.min.*"],

    // Optional orientation tree
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
      "group": "default",
      "items": [
        { "kind": "file", "path": "src/index.ts" },
        { "kind": "dir", "path": "src/app" }
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

## Using zzza from VS Code

zzza includes a VS Code extension that mirrors the CLI.

From the sidebar you can:
- create new slices
- add files or folders
- assign groups
- remove files, folders, or entire slices
- build context files

The UI does **not** introduce new behavior.
Every action maps directly to a CLI command.

If you ever wonder *“what did the UI do?”* — you can always reproduce it in the terminal.

---

## Build Warnings

If a file is missing or unreadable:
- the build still succeeds
- a warning is printed in the CLI
- a warning block is added to `slice_context.md`

Missing files are treated as **signals**, not silent failures.

---

## Directory Expansion (Glob‑Lite)

When a slice contains a directory, zzza expands it at build time using simple, predictable rules:

- `dirInclude` — which file types are allowed
- `dirExclude` — which patterns are filtered out
- `ignore` — global exclusions applied everywhere

This keeps slices:
- deterministic
- token‑efficient
- honest about what is included

No background watching or hidden state — every build re-evaluates the directory.

---

## Commands

```txt
zzza init
zzza add <slice> <path...> [--group <group>]
zzza add-dir <slice> <path...> [--group <group>]
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

zzza is designed to feel stable over time. If something changes, it is because *you* changed it.

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
- Build slices directly from the sidebar
- Add files or folders to slices from the Explorer

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
