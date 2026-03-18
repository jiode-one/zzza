# Changelog

All notable changes to this project will be documented in this file.

Inspired by *Keep a Changelog*, but adapted for zzza’s philosophy:
changes are described in terms of **intent**, **behavior**, and **user impact**.

---

## v0.1.1 — Cleaner CLI groups

**Status:** Stable  
**Theme:** Symmetry and beginner-friendly defaults

### Changed
- `zzza add` / `zzza add-dir`
  - group is now an optional flag instead of a positional argument:
    - `zzza add <slice> <path...> [--group <group>]`
    - `zzza add-dir <slice> <path...> [--group <group>]`
  - If no group is provided when creating a new slice, zzza defaults to `"default"`.
  - Existing slices keep their current group unless `--group` is explicitly provided.

### Behavior Notes
- `zzza remove <slice> <path...>` remains unchanged.
- This change keeps `add` and `remove` mirrored for a cleaner workflow.
- One group per slice (multi-group tagging deferred to v2)
- CLI and Extension are guaranteed to stay in sync

### Added
- `zzza group <slice> <group>` command for explicit group assignment
- `zzza list groups` to show all groups and their slices
- `zzza list group <slice>` to show a slice’s group
- Improved list output formatting (slice → group mapping)

### Changed
- Renamed internal concept from `channel` → `group` for clarity
- Group assignment is now explicit (no longer implicit via `add` flags)

### Fixed
- Recursive directory addition bug (dirs no longer added as files)
- Toolchain / bundling issues causing stale CLI builds
- Directory guard logic now correctly promotes dirs over files

### Extension / UI
- VS Code extension now fully mirrors CLI behavior
  - Slice add / remove parity with CLI
  - Directory add/remove supported
  - Slice removal (`rmslice`) available via UI
  - New Slice button added when no slices exist
- Group assignment supported in UI
  - Explicit group per slice (one group per slice)
  - Group list and group build actions available
- Improved tree behavior
  - Directories are atomic units (files inside dirs are not individually removable)
  - UI prevents invalid removal actions
- Icon and affordance polish
  - Distinct icons for slice, dir, file, group
  - VS Code + GitHub badges added to nav

### Docs / Site
- Static site added (Home / Install / Docs)
- README doubles as initial documentation
- Onboarding-focused copy ("Feed AI the right slice")
- Animated section reveals with reduced-motion support
- Mascot introduced: **Zzza the Pizza Cat** 🍕🐱

---

## v0.1.0 — Initial Release 🍕

**Status:** Stable  
**Theme:** Explicit context for AI-assisted work

### Added
- `zzza init`
  - Creates a human-editable `slice.jsonc`
  - Safe to run multiple times
  - Ships with sensible defaults and comments

- Slice-based context system
  - Named slices with group tags (often colors)
  - Explicit file inclusion (no implicit magic)

- `zzza add` / `zzza remove`
  - Idempotent operations
  - Paths may be added before files exist

- Directory slice support
  - `zzza add-dir` to add entire folders to a slice
  - Directories are expanded at build time (never cached)
  - Expansion respects ignore rules and directory filters

- `zzza list`
  - List all slices
  - Inspect a slice or group

- `zzza build`
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

- `zzza doctor`
  - Advisory validation of the manifest
  - Surfaces:
    - Invalid configuration
    - Missing files
    - Suspicious ignore setups
    - Tree root issues
  - Never mutates user files

- Context size inspection in `zzza doctor`
  - Displays estimated token count and file size for the last build
  - Shows configured token warning thresholds when present

- CLI polish
  - Custom `--version` output
  - `--tips` for onboarding
  - Helpful help footer and usage text
  
- Foundational VS Code extension (preview)

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
- Reverse patch mode (`zzza apply`) using Git
- Safer AI-to-code workflows via diffs

### v0.3.x
- Optional dependency / import graphs
- Language-aware context expansion

---

Built with care as part of the Jiode ecosystem.  
Tools for the future.

https://jiode.one

---

## v0.1.1 — Cleaner CLI groups

### Planned (Next)
- Update VS Code extension to support group assignment
- Add group controls to extension UI (context menu / command)
- Group/tag distinction (tags as multi-label metadata)
