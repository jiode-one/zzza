# Changelog

All notable changes to this project will be documented in this file.

Inspired by *Keep a Changelog*, but adapted for Sliceza’s philosophy:
changes are described in terms of **intent**, **behavior**, and **user impact**.

---

## v0.1.0 — Initial Release 🍕

**Status:** Stable  
**Theme:** Explicit context for AI-assisted work

### Added
- `sliceza init`
  - Creates a human-editable `slice.jsonc`
  - Safe to run multiple times
  - Ships with sensible defaults and comments

- Slice-based context system
  - Named slices with channel tags (often colors)
  - Explicit file inclusion (no implicit magic)

- `sliceza add` / `sliceza remove`
  - Idempotent operations
  - Paths may be added before files exist

- Directory slice support
  - `sliceza add-dir` to add entire folders to a slice
  - Directories are expanded at build time (never cached)
  - Expansion respects ignore rules and directory filters

- `sliceza list`
  - List all slices
  - Inspect a slice or channel

- `sliceza build`
  - Generates `slice_context.md`
  - Includes:
    - AI-facing header
    - Optional directory tree
    - Explicit file contents
    - Build warnings for missing/unreadable files

- Token size awareness
  - Optional estimated token warnings during `build`
  - User-configurable thresholds via `settings.tokenWarn`
  - Non-blocking and advisory by design

- Context Tree support
  - Configurable via `settings.tree`
  - `dirs-only` mode for token-efficient orientation
  - Deterministic, non-cached generation

- Ignore rules
  - Default ignores: `node_modules/**`, `dist/**`, `.git/**`
  - Fully visible and user-editable
  - Applied consistently across tree and file reads

- `sliceza doctor`
  - Advisory validation of the manifest
  - Surfaces:
    - Invalid configuration
    - Missing files
    - Suspicious ignore setups
    - Tree root issues
  - Never mutates user files

- Context size inspection in `sliceza doctor`
  - Displays estimated token count and file size for the last build
  - Shows configured token warning thresholds when present

- CLI polish
  - Custom `--version` output
  - `--tips` for onboarding
  - Helpful help footer and usage text

### Behavior Notes
- Missing files are treated as **signals**, not errors.
- Builds succeed even with warnings.
- No hidden state; all behavior is driven by `slice.jsonc`.
- Token counts are estimated heuristically and are intentionally conservative.

### Philosophy
- Explicit > implicit
- Inspectable > magical
- Advisory > authoritarian
- Widely expected behavior

---

## Planned

### v0.2.x
- Reverse patch mode (`sliceza apply`) using Git
- Safer AI-to-code workflows via diffs

### v0.3.x
- Optional dependency / import graphs
- Language-aware context expansion

---

Built with care as part of the Jiode ecosystem.  
Tools for the future.

https://jiode.one
