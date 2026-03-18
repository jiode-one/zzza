import * as vscode from "vscode";
import { parse as parseJsonc } from "jsonc-parser";

type SliceItem = {
  path: string;
  kind?: "file" | "dir";
};

type Slice = {
  name?: string;
  group?: string;
  items?: SliceItem[];
};

type SliceManifest = {
  // Canonical: Record<string, Slice> (older/alternate: Slice[])
  slices?: Record<string, Slice> | Slice[];
};

function getSliceEntries(manifest: SliceManifest): Array<[string, Slice]> {
  const raw = (manifest as any)?.slices;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((s: any, idx: number) => {
        const name = (s?.name ?? s?.sliceName ?? s?.id ?? `slice-${idx + 1}`).toString();
        const slice: Slice = { group: s?.group, items: s?.items };
        return [name, slice] as [string, Slice];
      })
      .filter(([name]) => !!name);
  }

  return Object.entries(raw as Record<string, Slice>);
}

function normChannel(ch: unknown): string {
  const s = (typeof ch === "string" ? ch : "default").trim().toLowerCase();
  return s.length ? s : "default";
}

async function readSliceJsonc(): Promise<{ uri: vscode.Uri; manifest: SliceManifest } | null> {
  const files = await vscode.workspace.findFiles(
    "**/slice.jsonc",
    "**/{node_modules,dist,.git}/**",
    1
  );

  const uri = files?.[0];
  if (!uri) return null;

  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const raw = Buffer.from(bytes).toString("utf8");
    const parsed = parseJsonc(raw) as any;
    return { uri, manifest: (parsed ?? {}) as SliceManifest };
  } catch {
    return { uri, manifest: {} };
  }
}

class ChannelNode extends vscode.TreeItem {
  constructor(public readonly group: string, public readonly sliceCount: number) {
    super(group, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${sliceCount}`;
    this.contextValue = "slicezaGroup";
    this.iconPath = new vscode.ThemeIcon("layers");
    this.command = {
      command: "zzza.ui.buildGroup",
      title: "Build Group",
      arguments: [{ group }],
    };
  }
}

class SliceNode extends vscode.TreeItem {
  constructor(
    public readonly sliceName: string,
    public readonly group: string,
    public readonly itemCount: number
  ) {
    super(sliceName, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${itemCount}`;
    this.tooltip = `${sliceName} • ${group} • ${itemCount} item(s)`;
    this.contextValue = "slicezaGroupSlice";
    this.iconPath = new vscode.ThemeIcon("library");
  }
}

class ItemNode extends vscode.TreeItem {
  constructor(public readonly item: SliceItem) {
    super(item.path, vscode.TreeItemCollapsibleState.None);
    const kind = item.kind ?? "file";
    this.contextValue = kind === "dir" ? "slicezaGroupItemDir" : "slicezaGroupItemFile";
    this.iconPath = new vscode.ThemeIcon(kind === "dir" ? "folder" : "file");
  }
}

export class GroupsViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private cache:
    | {
        groups: Map<string, Array<[string, Slice]>>;
      }
    | null = null;

  refresh() {
    this.cache = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  private async ensureCache(): Promise<Map<string, Array<[string, Slice]>>> {
    if (this.cache) return this.cache.groups;

    const result = await readSliceJsonc();
    const manifest = result?.manifest ?? {};
    const entries = getSliceEntries(manifest);

    const grouped = new Map<string, Array<[string, Slice]>>();
    for (const [sliceName, slice] of entries) {
      const group = normChannel(slice?.group);
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push([sliceName, slice]);
    }

    const sorted = new Map(
      [...grouped.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ch, list]) => [
          ch,
          list.sort(([a], [b]) => a.localeCompare(b)),
        ])
    );

    this.cache = { groups: sorted };
    return sorted;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const grouped = await this.ensureCache();

    if (grouped.size === 0) {
      return [
        new vscode.TreeItem(
          "No groups yet (add slices in slice.jsonc)",
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    }

    if (!element) {
      return [...grouped.entries()].map(
        ([group, slices]) => new ChannelNode(group, slices.length)
      );
    }

    if (element instanceof ChannelNode) {
      const slices = grouped.get(element.group) ?? [];
      return slices.map(([sliceName, slice]) =>
        new SliceNode(sliceName, element.group, slice.items?.length ?? 0)
      );
    }

    if (element instanceof SliceNode) {
      const slices = grouped.get(element.group) ?? [];
      const slice = slices.find(([name]) => name === element.sliceName)?.[1];
      const items = slice?.items ?? [];

      const sorted = [...items].sort((a, b) => {
        const ak = a.kind ?? "file";
        const bk = b.kind ?? "file";
        if (ak !== bk) return ak === "dir" ? -1 : 1;
        return a.path.localeCompare(b.path);
      });

      return sorted.map((it) => new ItemNode(it));
    }

    return [];
  }
}