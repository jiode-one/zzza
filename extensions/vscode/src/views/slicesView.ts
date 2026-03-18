  // extensions/vscode/src/views/slicesView.ts
  import * as vscode from "vscode";
  import { readFileSync, existsSync, readdirSync } from "node:fs";
  import * as path from "node:path";
  import { join } from "node:path";
  import { parse } from "jsonc-parser";

  type SliceItem = {
    path: string;
    kind?: "file" | "dir";
  };

  type Slice = {
    // Some manifest shapes store the name inside each slice (array form).
    name?: string;
    group?: string;
    items?: SliceItem[];
  };

  type SliceManifest = {
    // Canonical shape: { slices: { [sliceName]: { group, items } } }
    // But we also support legacy/alternate: { slices: Array<{ name, group, items }> }
    slices?: Record<string, Slice> | Slice[];
  };

  function getWorkspaceRoot(): string | null {
    const ws = vscode.workspace.workspaceFolders?.[0];
    return ws?.uri.fsPath ?? null;
  }

  function readSliceJsonc(root: string): SliceManifest | null {
    const manifestPath = join(root, "slice.jsonc");
    if (!existsSync(manifestPath)) return null;

    const raw = readFileSync(manifestPath, "utf8");
    // jsonc-parser handles comments/trailing commas
    const data = parse(raw) as SliceManifest;
    return data ?? null;
  }

  function getSliceEntries(manifest: SliceManifest): Array<[string, Slice]> {
    const raw = (manifest as any)?.slices;
    if (!raw) return [];

    // If slices is an array, TreeData would otherwise show 0,1,2... from Object.entries(array)
    if (Array.isArray(raw)) {
      return raw
        .map((s: any, idx: number) => {
          const name = (s?.name ?? s?.sliceName ?? s?.id ?? `slice-${idx + 1}`).toString();
          const slice: Slice = {
            group: s?.group,
            items: s?.items,
          };
          return [name, slice] as [string, Slice];
        })
        .filter(([name]) => !!name);
    }

    // Object map (preferred)
    return Object.entries(raw as Record<string, Slice>);
  }

  export class SlicesViewProvider implements vscode.TreeDataProvider<SliceNode> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SliceNode | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh() {
      this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SliceNode): vscode.TreeItem {
      return element;
    }

    getChildren(element?: SliceNode): Thenable<SliceNode[]> {
      const root = getWorkspaceRoot();
      if (!root) {
        return Promise.resolve([
          new SliceNode("Open a folder/workspace to use zzza.", vscode.TreeItemCollapsibleState.None, {
            contextValue: "zzza.info",
          }),
        ]);
      }

      const manifest = readSliceJsonc(root);
      if (!manifest?.slices) {
        return Promise.resolve([
          new SliceNode("No slice.jsonc found.", vscode.TreeItemCollapsibleState.None, {
            contextValue: "zzza.missingManifest",
            tooltip: "Run `zzza init` to create slice.jsonc, then `zzza build` to generate slice_context.md",
          }),
        ]);
      }

      // Top-level: slices
      if (!element) {
        const entries = getSliceEntries(manifest);
        if (!entries.length) {
          return Promise.resolve([
            new SliceNode("Click the + to add a Slice.", vscode.TreeItemCollapsibleState.None, {
              contextValue: "zzza.empty",
            }),
          ]);
        }

        const nodes = entries
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([sliceName, slice]) => {
            const count = slice.items?.length ?? 0;
            const rawChannel = (slice.group ?? "default").toString();
            const group = rawChannel.trim();
            const channelLower = group.toLowerCase();

            const showChannel = channelLower.length > 0 && channelLower !== "default";
            const label = `${sliceName}`;
            const desc = showChannel ? channelLower : "";
            const tooltip = showChannel
              ? `${sliceName} • ${channelLower} • ${count} item(s)`
              : `${sliceName} • ${count} item(s)`;

            const node = new SliceNode(label, vscode.TreeItemCollapsibleState.Collapsed, {
              description: desc,
              tooltip,
              contextValue: "slicezaSlice",
              sliceName,
            });
            (node as any).zzza = { slice: sliceName, group: channelLower };

            // Color hint (best-effort). Unknown groups fall back to a neutral icon.
            const colorMap: Record<string, string> = {
              red: "charts.red",
              green: "charts.green",
              blue: "charts.blue",
              yellow: "charts.yellow",
              orange: "charts.orange",
              purple: "charts.purple",
              pink: "charts.pink",
              cyan: "charts.cyan",
            };

            if (showChannel && colorMap[channelLower]) {
              node.iconPath = new vscode.ThemeIcon(
                "circle-filled",
                new vscode.ThemeColor(colorMap[channelLower])
              );
            } else {
              node.iconPath = new vscode.ThemeIcon("circle-filled");
            }

            return node;
          });

        return Promise.resolve(nodes);
      }

      // Expand directory slice items to show files inside.
      // Convention (v1): a dir item is "live". We display the files currently inside it.
      // We do NOT allow per-file overrides inside a dir (yet).
      if (element.contextValue === "slicezaDir" && element.resourceUri) {
        const sliceName = element.sliceName;
        const dirAbs = element.resourceUri.fsPath;

        // Defensive: without a slice name, we can't support remove actions.
        if (!sliceName) return Promise.resolve([]);

        const MAX_FILES = 200;

        const walk = (dir: string, relBase: string, out: Array<{ abs: string; rel: string }>) => {
          if (out.length >= MAX_FILES) return;
          let entries: string[] = [];
          try {
            entries = readdirSync(dir);
          } catch {
            return;
          }

          for (const name of entries) {
            if (out.length >= MAX_FILES) break;

            // Skip common heavy dirs when browsing live folders.
            if (name === "node_modules" || name === ".git" || name === "dist") continue;

            const abs = path.join(dir, name);
            const rel = relBase ? `${relBase}/${name}` : name;

            // Use VS Code FS API so we don't need statSync and stay resilient.
            // But for speed, we use a lightweight try/catch around workspace.fs.stat.
            // (We can't await here, so we use a synchronous fallback pattern.)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let isDir = false as any;
            try {
              // Node's fs doesn't give us a sync directory-entry type here (we're using readdirSync).
              // So we best-effort detect directory by attempting to list it.
              readdirSync(abs);
              isDir = true;
            } catch {
              isDir = false;
            }

            if (isDir) {
              walk(abs, rel, out);
            } else {
              out.push({ abs, rel });
            }
          }
        };

        // Compute a stable root-relative path for remove actions.
        const root = getWorkspaceRoot();
        const dirRelFromRoot = root ? path.relative(root, dirAbs).replaceAll("\\", "/") : "";

        const files: Array<{ abs: string; rel: string }> = [];
        walk(dirAbs, "", files);

        if (!files.length) {
          return Promise.resolve([
            new SliceNode("(empty)", vscode.TreeItemCollapsibleState.None, {
              contextValue: "zzza.info",
              tooltip: `No files found in ${dirRelFromRoot || element.label}`,
            }),
          ]);
        }

        const children: SliceNode[] = files.map(({ abs, rel }) => {
          const uri = vscode.Uri.file(abs);
          const relPathFromRoot = dirRelFromRoot ? `${dirRelFromRoot}/${rel}` : rel;

          const node = new SliceNode(rel, vscode.TreeItemCollapsibleState.None, {
            contextValue: "slicezaFile",
            tooltip: relPathFromRoot,
            resourceUri: uri,
            command: {
              command: "vscode.open",
              title: "Open File",
              arguments: [uri],
            },
          });
          return node;
        });

        // If we hit the cap, show a small hint at the bottom.
        if (children.length >= MAX_FILES) {
          children.push(
            new SliceNode(`(showing first ${MAX_FILES} files)`, vscode.TreeItemCollapsibleState.None, {
              contextValue: "zzza.info",
              tooltip: `Folder contains more than ${MAX_FILES} files. Increase MAX_FILES in slicesView.ts if needed.`,
            })
          );
        }

        return Promise.resolve(children);
      }

      // Child: slice items
      if (element.contextValue === "slicezaSlice" && element.sliceName) {
        const entries = getSliceEntries(manifest);
        const slice = entries.find(([name]) => name === element.sliceName)?.[1];
        const items = slice?.items ?? [];
        const nodes: SliceNode[] = [];

        for (const it of items) {
          const isDir = it.kind === "dir";
          const fullPath = join(root, it.path);
          const uri = vscode.Uri.file(fullPath);

          if (isDir) {
            const dirNode = new SliceNode(
              it.path,
              vscode.TreeItemCollapsibleState.Collapsed,
              {
                contextValue: "slicezaDir",
                resourceUri: uri,
                sliceName: element.sliceName,
              }
            );
            (dirNode as any).zzza = { slice: element.sliceName, path: it.path };
            dirNode.iconPath = new vscode.ThemeIcon("folder");
            nodes.push(dirNode);
          } else {
            const fileNode = new SliceNode(
              it.path,
              vscode.TreeItemCollapsibleState.None,
              {
                contextValue: "slicezaSliceFile",
                resourceUri: uri,
                command: {
                  command: "vscode.open",
                  title: "Open File",
                  arguments: [uri],
                },
              }
            );
            (fileNode as any).zzza = { slice: element.sliceName, path: it.path };
            fileNode.iconPath = new vscode.ThemeIcon("file-code");
            nodes.push(fileNode);
          }
        }

        return Promise.resolve(nodes);
      }

      return Promise.resolve([]);
    }
  }

  class SliceNode extends vscode.TreeItem {
    sliceName?: string;

    constructor(
      label: string,
      collapsibleState: vscode.TreeItemCollapsibleState,
      opts?: {
        description?: string;
        tooltip?: string;
        contextValue?: string;
        resourceUri?: vscode.Uri;
        command?: vscode.Command;
        sliceName?: string;
      }
    ) {
      super(label, collapsibleState);
      if (opts?.description) this.description = opts.description;
      if (opts?.tooltip) this.tooltip = opts.tooltip;
      if (opts?.contextValue) this.contextValue = opts.contextValue;
      if (opts?.resourceUri) this.resourceUri = opts.resourceUri;
      if (opts?.command) this.command = opts.command;
      if (opts?.sliceName) this.sliceName = opts.sliceName;
    }
  }