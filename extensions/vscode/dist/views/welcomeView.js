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
exports.WelcomeViewProvider = void 0;
const vscode = __importStar(require("vscode"));
class WelcomeViewProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    availability = { kind: "missing" };
    setAvailability(a) {
        this.availability = a;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        if (this.availability.kind === "missing") {
            return [
                new WelcomeItem("zzza CLI not found", "info"),
                new WelcomeItem("Install CLI (recommended: local devDependency)", "action", "zzza.installLocal"),
                new WelcomeItem("Install CLI (fallback: global)", "action", "zzza.installGlobal"),
                new WelcomeItem("Refresh", "action", "zzza.refresh")
            ];
        }
        const label = this.availability.kind === "local"
            ? "zzza CLI ready (local)"
            : "zzza CLI ready (global)";
        return [
            new WelcomeItem(label, "info"),
            new WelcomeItem("Build context (slice_context.md)", "action", "zzza.buildAll"),
            new WelcomeItem("Refresh", "action", "zzza.refresh")
        ];
    }
}
exports.WelcomeViewProvider = WelcomeViewProvider;
class WelcomeItem extends vscode.TreeItem {
    constructor(label, kind, commandId) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = kind;
        if (commandId)
            this.command = { command: commandId, title: label };
        this.iconPath = kind === "action" ? new vscode.ThemeIcon("play") : new vscode.ThemeIcon("info");
    }
}
