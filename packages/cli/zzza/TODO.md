For V1

TODO: Expanded listing

Add an opt-in mode to zzza list to show files expanded from directory entries, respecting dirInclude, dirExclude, and ignore rules.

Possible forms:
	•	zzza list core --expanded
	•	zzza list core --tree
	•	zzza list core --build-view


# TODO for v1

## CLI

### Listing & inspection
- [ ] **Expanded listing (dirs → files)**  
  Add an opt-in mode to `zzza list` to expand directory entries into the files they currently match, respecting `dirInclude`, `dirExclude`, and `ignore` rules.  
  Possible forms:
  - `zzza list core --expanded`
  - `zzza list core --tree`
  - `zzza list core --build-view`
- [ ] **List shows dir contents (optional)**  
  When listing a slice, optionally show what a `dir` entry would currently include (same rules as build), so users can sanity-check without running `build`.

### Build quality & diagnostics
- [x] **Token/size estimator (opt-in)**  
  Add a rough token estimate for `slice_context.md` (and/or total characters), and warn when approaching a configurable threshold.
  - Add to `doctor`: `Current context size: X chars (~Y tokens)`
  - Add to `build`: warn if estimate exceeds threshold
- [x] **Doctor: validate spec + glob-lite status**  
  Expand `zzza doctor` to validate settings and warn clearly when ignore patterns are present but not fully supported (until glob-lite is complete).

### Manifest / operations
- [ ] **removeFromSlice removes dirs too**  
  Ensure `zzza remove <slice> <path...>` removes matching entries regardless of kind (`file` or `dir`).
- [ ] **Folder add is stable & well-documented**  
  Confirm `add-dir` behavior, edge cases, and messaging (especially relative paths, missing folders, and ignore/include/exclude interactions).

## zzza — V1.5 TODO (Cloud)

### CLI Commands
- [ ] `zzza grab`  
  Grab a slice from the current context (cwd / active file / selection).

- [ ] `zzza slice add`  
  Add a slice explicitly (path, URL, or stdin).

### Groups
- [ ] `zzza group create <name>`  
  Create a new group (group) for organizing slices.

- [ ] `zzza group use <name>`  
  Set the default group for subsequent `grab` / `slice add` commands.

## Insights (optional artifacts)

- [ ] **Hot paths report**  
  Add a command to generate a repo “hot paths” report based on git history (recency + churn + size), writing `hot-paths.json` (and optional `hot-paths.md`).
  - `zzza hotpaths --days 180 --top 25`
  - `zzza hotpaths --md`
  - (stretch) `zzza hotpaths --slice <name>` / `--group <name>`
  - Keep out of `slice_context.md` by default; include only a small summary if explicitly requested.
- [ ] **Code map (re-orientation artifact)**  
  Generate an onboarding/re-orientation map (tree + largest files + active areas) as a separate artifact (e.g., `code-map.md`), designed for humans first.

## VS Code Extension (zzza Code)

- [ ] **Welcome view: CLI detection + install helpers**  
  Ensure the welcome panel reliably detects local/global zzza and offers install actions.
- [ ] **Slices panel: active slices + one-click build**  
  Add a view listing slices/groups and a “Build” action that runs the CLI and shows output in an OutputChannel.
- [ ] **Explorer integration (optional)**  
  Context menu items like “Add to slice…” / “Add folder to slice…” from the file explorer (keep this lightweight).

## Future (v2+)

### V2 Backlog

- [ ] Add slice tags (multi-label classification)
  - `tags: string[]` on slice
  - `zzza tag add <slice> <tag>`
  - `zzza tag remove <slice> <tag>`
  - `zzza list tags`
  - `zzza list tag <tag>`

- [ ] Allow build filtering by tag
  - `zzza build tag <tag>`

- [ ] Tag-aware extension UI (visual chips / filters)

- [ ] **Reverse patch mode (apply edits back to files)**  
  Explore a workflow where the generated context (or a patch/diff derived from it) can be applied back to the working tree, likely via git patch application.
- [ ] **Dependency graph / import graph**  
  A later-stage “what imports what” graph (probably v3), kept separate from the core zzza flow.