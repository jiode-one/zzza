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
exports.GroupsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const jsonc_parser_1 = require("jsonc-parser");
function getSliceEntries(manifest) {
    const raw = manifest?.slices;
    if (!raw)
        return [];
    if (Array.isArray(raw)) {
        return raw
            .map((s, idx) => {
            const name = (s?.name ?? s?.sliceName ?? s?.id ?? `slice-${idx + 1}`).toString();
            const slice = { group: s?.group, items: s?.items };
            return [name, slice];
        })
            .filter(([name]) => !!name);
    }
    return Object.entries(raw);
}
function normChannel(ch) {
    const s = (typeof ch === "string" ? ch : "default").trim().toLowerCase();
    return s.length ? s : "default";
}
async function readSliceJsonc() {
    const files = await vscode.workspace.findFiles("**/slice.jsonc", "**/{node_modules,dist,.git}/**", 1);
    const uri = files?.[0];
    if (!uri)
        return null;
    try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        const raw = Buffer.from(bytes).toString("utf8");
        const parsed = (0, jsonc_parser_1.parse)(raw);
        return { uri, manifest: (parsed ?? {}) };
    }
    catch {
        return { uri, manifest: {} };
    }
}
class ChannelNode extends vscode.TreeItem {
    group;
    sliceCount;
    constructor(group, sliceCount) {
        super(group, vscode.TreeItemCollapsibleState.Collapsed);
        this.group = group;
        this.sliceCount = sliceCount;
        this.description = `${sliceCount}`;
        this.contextValue = "slicezaGroup";
        this.iconPath = new vscode.ThemeIcon("layers");
    }
}
class SliceNode extends vscode.TreeItem {
    sliceName;
    group;
    itemCount;
    constructor(sliceName, group, itemCount) {
        super(sliceName, vscode.TreeItemCollapsibleState.Collapsed);
        this.sliceName = sliceName;
        this.group = group;
        this.itemCount = itemCount;
        this.description = `${itemCount}`;
        this.tooltip = `${sliceName} • ${group} • ${itemCount} item(s)`;
        this.contextValue = "slicezaGroupSlice";
        this.iconPath = new vscode.ThemeIcon("library");
    }
}
class ItemNode extends vscode.TreeItem {
    item;
    constructor(item) {
        super(item.path, vscode.TreeItemCollapsibleState.None);
        this.item = item;
        const kind = item.kind ?? "file";
        this.contextValue = kind === "dir" ? "slicezaGroupItemDir" : "slicezaGroupItemFile";
        this.iconPath = new vscode.ThemeIcon(kind === "dir" ? "folder" : "file");
    }
}
class GroupsViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    cache = null;
    refresh() {
        this.cache = null;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async ensureCache() {
        if (this.cache)
            return this.cache.groups;
        const result = await readSliceJsonc();
        const manifest = result?.manifest ?? {};
        const entries = getSliceEntries(manifest);
        const grouped = new Map();
        for (const [sliceName, slice] of entries) {
            const group = normChannel(slice?.group);
            if (!grouped.has(group))
                grouped.set(group, []);
            grouped.get(group).push([sliceName, slice]);
        }
        const sorted = new Map([...grouped.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([ch, list]) => [
            ch,
            list.sort(([a], [b]) => a.localeCompare(b)),
        ]));
        this.cache = { groups: sorted };
        return sorted;
    }
    async getChildren(element) {
        const grouped = await this.ensureCache();
        if (grouped.size === 0) {
            return [
                new vscode.TreeItem("No groups yet (add slices in slice.jsonc)", vscode.TreeItemCollapsibleState.None),
            ];
        }
        if (!element) {
            return [...grouped.entries()].map(([group, slices]) => new ChannelNode(group, slices.length));
        }
        if (element instanceof ChannelNode) {
            const slices = grouped.get(element.group) ?? [];
            return slices.map(([sliceName, slice]) => new SliceNode(sliceName, element.group, slice.items?.length ?? 0));
        }
        if (element instanceof SliceNode) {
            const slices = grouped.get(element.group) ?? [];
            const slice = slices.find(([name]) => name === element.sliceName)?.[1];
            const items = slice?.items ?? [];
            const sorted = [...items].sort((a, b) => {
                const ak = a.kind ?? "file";
                const bk = b.kind ?? "file";
                if (ak !== bk)
                    return ak === "dir" ? -1 : 1;
                return a.path.localeCompare(b.path);
            });
            return sorted.map((it) => new ItemNode(it));
        }
        return [];
    }
}
exports.GroupsViewProvider = GroupsViewProvider;
