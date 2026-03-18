# zzza

![zzza logo](resources/zzza.png)

<p align="center">
  <img src="resources/zzza.png" width="160" />
</p>

<h1 align="center">zzza 🍕</h1>

<p align="center">
  Slice your context. Build faster.
</p>

Native VS Code companion for the `zzza` CLI.

Zzza helps you save, organize, and share focused slices of project
context so you can feed AI just the right slice.

## Features

-   View slices directly in the VS Code sidebar\
-   View groups/channels for slices\
-   Create new slices from files or folders\
-   Add files or folders to existing slices\
-   Remove files from slices\
-   Set a group for a slice\
-   Build context for:
    -   all slices
    -   a single slice
    -   a single group\
-   Detects local `zzza` installs first, then falls back to global CLI

## Requirements

Install the CLI:

``` bash
npm i --save-dev zzza
```

or

``` bash
npm i -g zzza
```

## Getting Started

``` bash
zzza init
zzza add core src/index.ts
zzza group core green
zzza build
```

This generates:

    slice_context.md

## VS Code Workflow

Open the **zzza sidebar** and: - create slices\
- add files/folders\
- assign groups\
- build slices or groups

## Commands

-   zzza: Refresh\
-   zzza: Install CLI (local/global)\
-   zzza: Build Context\
-   zzza: Init\
-   zzza: Add Path\
-   zzza: Add/Remove Slice Items\
-   zzza: Build Slice\
-   zzza: Build Group\
-   zzza: New Slice

## Release Notes

### 0.0.1

Initial release.
