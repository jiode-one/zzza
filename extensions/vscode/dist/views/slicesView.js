"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlicesViewProvider = void 0;
// extensions/vscode/src/views/slicesView.ts
const vscode = __importStar(require("vscode"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("node:path"));
const node_path_1 = require("node:path");
const jsonc_parser_1 = require("jsonc-parser");
function getWorkspaceRoot() {
    const ws = vscode.workspace.workspaceFolders?.[0];
    return ws?.uri.fsPath ?? null;
}
function readSliceJsonc(root) {
    const manifestPath = (0, node_path_1.join)(root, "slice.jsonc");
    if (!(0, node_fs_1.existsSync)(manifestPath))
        return null;
    const raw = (0, node_fs_1.readFileSync)(manifestPath, "utf8");
    // jsonc-parser handles comments/trailing commas
    const data = (0, jsonc_parser_1.parse)(raw);
    return data ?? null;
}
function getSliceEntries(manifest) {
    const raw = manifest?.slices;
    if (!raw)
        return [];
    // If slices is an array, TreeData would otherwise show 0,1,2... from Object.entries(array)
    if (Array.isArray(raw)) {
        return raw
            .map((s, idx) => {
            const name = (s?.name ?? s?.sliceName ?? s?.id ?? `slice-${idx + 1}`).toString();
            const slice = {
                group: s?.group,
                items: s?.items,
            };
            return [name, slice];
        })
            .filter(([name]) => !!name);
    }
    // Object map (preferred)
    return Object.entries(raw);
}
class SlicesViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
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
                node.zzza = { slice: sliceName, group: channelLower };
                // Color hint (best-effort). Unknown groups fall back to a neutral icon.
                const colorMap = {
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
                    node.iconPath = new vscode.ThemeIcon("circle-filled", new vscode.ThemeColor(colorMap[channelLower]));
                }
                else {
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
            if (!sliceName)
                return Promise.resolve([]);
            const MAX_FILES = 200;
            const walk = (dir, relBase, out) => {
                if (out.length >= MAX_FILES)
                    return;
                let entries = [];
                try {
                    entries = (0, node_fs_1.readdirSync)(dir);
                }
                catch {
                    return;
                }
                for (const name of entries) {
                    if (out.length >= MAX_FILES)
                        break;
                    // Skip common heavy dirs when browsing live folders.
                    if (name === "node_modules" || name === ".git" || name === "dist")
                        continue;
                    const abs = path.join(dir, name);
                    const rel = relBase ? `${relBase}/${name}` : name;
                    // Use VS Code FS API so we don't need statSync and stay resilient.
                    // But for speed, we use a lightweight try/catch around workspace.fs.stat.
                    // (We can't await here, so we use a synchronous fallback pattern.)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let isDir = false;
                    try {
                        // Node's fs doesn't give us a sync directory-entry type here (we're using readdirSync).
                        // So we best-effort detect directory by attempting to list it.
                        (0, node_fs_1.readdirSync)(abs);
                        isDir = true;
                    }
                    catch {
                        isDir = false;
                    }
                    if (isDir) {
                        walk(abs, rel, out);
                    }
                    else {
                        out.push({ abs, rel });
                    }
                }
            };
            // Compute a stable root-relative path for remove actions.
            const root = getWorkspaceRoot();
            const dirRelFromRoot = root ? path.relative(root, dirAbs).replaceAll("\\", "/") : "";
            const files = [];
            walk(dirAbs, "", files);
            if (!files.length) {
                return Promise.resolve([
                    new SliceNode("(empty)", vscode.TreeItemCollapsibleState.None, {
                        contextValue: "zzza.info",
                        tooltip: `No files found in ${dirRelFromRoot || element.label}`,
                    }),
                ]);
            }
            const children = files.map(({ abs, rel }) => {
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
                children.push(new SliceNode(`(showing first ${MAX_FILES} files)`, vscode.TreeItemCollapsibleState.None, {
                    contextValue: "zzza.info",
                    tooltip: `Folder contains more than ${MAX_FILES} files. Increase MAX_FILES in slicesView.ts if needed.`,
                }));
            }
            return Promise.resolve(children);
        }
        // Child: slice items
        if (element.contextValue === "slicezaSlice" && element.sliceName) {
            const entries = getSliceEntries(manifest);
            const slice = entries.find(([name]) => name === element.sliceName)?.[1];
            const items = slice?.items ?? [];
            const nodes = [];
            for (const it of items) {
                const isDir = it.kind === "dir";
                const fullPath = (0, node_path_1.join)(root, it.path);
                const uri = vscode.Uri.file(fullPath);
                if (isDir) {
                    const dirNode = new SliceNode(it.path, vscode.TreeItemCollapsibleState.Collapsed, {
                        contextValue: "slicezaDir",
                        resourceUri: uri,
                        sliceName: element.sliceName,
                    });
                    dirNode.zzza = { slice: element.sliceName, path: it.path };
                    dirNode.iconPath = new vscode.ThemeIcon("folder");
                    nodes.push(dirNode);
                }
                else {
                    const fileNode = new SliceNode(it.path, vscode.TreeItemCollapsibleState.None, {
                        contextValue: "slicezaSliceFile",
                        resourceUri: uri,
                        command: {
                            command: "vscode.open",
                            title: "Open File",
                            arguments: [uri],
                        },
                    });
                    fileNode.zzza = { slice: element.sliceName, path: it.path };
                    fileNode.iconPath = new vscode.ThemeIcon("file-code");
                    nodes.push(fileNode);
                }
            }
            return Promise.resolve(nodes);
        }
        return Promise.resolve([]);
    }
}
exports.SlicesViewProvider = SlicesViewProvider;
class SliceNode extends vscode.TreeItem {
    sliceName;
    constructor(label, collapsibleState, opts) {
        super(label, collapsibleState);
        if (opts?.description)
            this.description = opts.description;
        if (opts?.tooltip)
            this.tooltip = opts.tooltip;
        if (opts?.contextValue)
            this.contextValue = opts.contextValue;
        if (opts?.resourceUri)
            this.resourceUri = opts.resourceUri;
        if (opts?.command)
            this.command = opts.command;
        if (opts?.sliceName)
            this.sliceName = opts.sliceName;
    }
}
