import * as vscode from "vscode";
import type { SlicezaAvailability } from "../cli";

type ItemKind = "info" | "action";

export class WelcomeViewProvider implements vscode.TreeDataProvider<WelcomeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private availability: SlicezaAvailability = { kind: "missing" };

  setAvailability(a: SlicezaAvailability) {
    this.availability = a;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: WelcomeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): WelcomeItem[] {
    if (this.availability.kind === "missing") {
      return [
        new WelcomeItem("zzza CLI not found", "info"),
        new WelcomeItem("Install CLI (recommended: local devDependency)", "action", "zzza.installLocal"),
        new WelcomeItem("Install CLI (fallback: global)", "action", "zzza.installGlobal"),
        new WelcomeItem("Refresh", "action", "zzza.refresh")
      ];
    }

    const label =
      this.availability.kind === "local"
        ? "zzza CLI ready (local)"
        : "zzza CLI ready (global)";

    return [
      new WelcomeItem(label, "info"),
      new WelcomeItem("Build context (slice_context.md)", "action", "zzza.buildAll"),
      new WelcomeItem("Refresh", "action", "zzza.refresh")
    ];
  }
}

class WelcomeItem extends vscode.TreeItem {
  constructor(label: string, kind: ItemKind, commandId?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = kind;
    if (commandId) this.command = { command: commandId, title: label };
    this.iconPath = kind === "action" ? new vscode.ThemeIcon("play") : new vscode.ThemeIcon("info");
  }
}