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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("node:path"));
const node_fs_1 = require("node:fs");
const jsonc_parser_1 = require("jsonc-parser");
const cli_1 = require("./cli");
const welcomeView_1 = require("./views/welcomeView");
const slicesView_1 = require("./views/slicesView");
const groupsView_1 = require("./views/groupsView");
function getWorkspaceRoot() {
    const folder = vscode.workspace.workspaceFolders?.[0];
    return folder?.uri.fsPath;
}
async function activate(context) {
    const welcome = new welcomeView_1.WelcomeViewProvider();
    const slices = new slicesView_1.SlicesViewProvider();
    const groups = new groupsView_1.GroupsViewProvider();
    // Generated output files we should never encourage users to add as slice inputs.
    const GENERATED_CONTEXT_FILES = new Set(["slice_context.md"]);
    // Debounced refresh to avoid refresh storms on macOS / multi-fire watchers.
    let refreshTimer;
    function refreshSoon(ms = 150) {
        if (refreshTimer)
            clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            void refreshAll();
        }, ms);
    }
    // Small toast throttle so file watchers don't spam.
    let lastToastAt = 0;
    let lastToastMsg = "";
    function toast(msg, cooldownMs = 1200) {
        const now = Date.now();
        if (msg === lastToastMsg && now - lastToastAt < cooldownMs)
            return;
        lastToastAt = now;
        lastToastMsg = msg;
        void vscode.window.showInformationMessage(msg);
    }
    const out = vscode.window.createOutputChannel("zzza");
    context.subscriptions.push(out);
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    status.text = "🍕 Build zzza";
    status.tooltip = "Run: zzza build";
    status.command = "zzza.buildAll";
    status.show();
    context.subscriptions.push(status);
    context.subscriptions.push(vscode.window.registerTreeDataProvider("zzza.welcome", welcome), vscode.window.registerTreeDataProvider("zzza.slices", slices), vscode.window.registerTreeDataProvider("zzza.groups", groups));
    async function refreshAll() {
        const root = getWorkspaceRoot();
        const availability = await (0, cli_1.detectSliceza)(root);
        // Hide the welcome panel once zzza is detected.
        await vscode.commands.executeCommand("setContext", "zzza.showWelcome", availability.kind === "missing");
        await vscode.commands.executeCommand("setContext", "zzza.cliDetected", availability.kind !== "missing");
        welcome.setAvailability(availability);
        slices.refresh();
        groups.refresh();
    }
    async function promptSlice() {
        const slice = await vscode.window.showInputBox({
            prompt: "Slice name (e.g. core, nav, overlay)",
            ignoreFocusOut: true,
        });
        if (!slice)
            return undefined;
        return slice;
    }
    async function promptGroup(defaultValue = "green") {
        const group = await vscode.window.showInputBox({
            prompt: "Group (e.g. green, blue, red)",
            value: defaultValue,
            ignoreFocusOut: true,
        });
        if (!group)
            return undefined;
        return group.trim().toLowerCase();
    }
    function getSliceFromArg(arg) {
        if (arg && typeof arg === "object" && typeof arg.slice === "string")
            return arg.slice;
        if (arg && typeof arg === "object" && typeof arg.zzza?.slice === "string")
            return arg.zzza.slice;
        if (arg && typeof arg.sliceName === "string")
            return arg.sliceName;
        return undefined;
    }
    function collectGroupsFromManifest(manifest) {
        const groupsSet = new Set();
        groupsSet.add("default");
        const slicesArr = manifest?.slices;
        if (Array.isArray(slicesArr)) {
            for (const s of slicesArr) {
                const g = (s?.group ?? "default").toString().trim().toLowerCase();
                if (g)
                    groupsSet.add(g);
            }
        }
        return Array.from(groupsSet).sort((a, b) => a.localeCompare(b));
    }
    context.subscriptions.push(vscode.commands.registerCommand("zzza.refresh", refreshAll), vscode.commands.registerCommand("zzza.installLocal", () => (0, cli_1.installLocalInTerminal)()), vscode.commands.registerCommand("zzza.installGlobal", () => (0, cli_1.installGlobalInTerminal)()), vscode.commands.registerCommand("zzza.setGroupForSlice", async (arg) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to set groups.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)")
                (0, cli_1.installLocalInTerminal)();
            if (pick === "Install global")
                (0, cli_1.installGlobalInTerminal)();
            return;
        }
        const sliceName = getSliceFromArg(arg) ?? (await promptSlice());
        if (!sliceName)
            return;
        const manifestFile = path.join(root, "slice.jsonc");
        if (!(0, node_fs_1.existsSync)(manifestFile)) {
            vscode.window.showErrorMessage("No slice.jsonc found. Run `zzza init` first.");
            return;
        }
        let manifest = null;
        try {
            manifest = (0, jsonc_parser_1.parse)((0, node_fs_1.readFileSync)(manifestFile, "utf8"));
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to parse slice.jsonc: ${e?.message ?? String(e)}`);
            return;
        }
        const groups = collectGroupsFromManifest(manifest);
        const picked = await vscode.window.showQuickPick([
            ...groups.map((g) => ({ label: g })),
            { label: "+ Create new group…" },
        ], {
            title: `Set group for ${sliceName}`,
            placeHolder: "Choose a group",
        });
        if (!picked)
            return;
        let group = picked.label;
        if (group.startsWith("+")) {
            const created = await promptGroup("green");
            if (!created)
                return;
            group = created;
        }
        try {
            const args = ["group", sliceName, group];
            const res = await (0, cli_1.runSliceza)(availability, args, root);
            out.clear();
            out.appendLine(`$ zzza ${args.join(" ")}`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            toast(`Group set: ${sliceName} → ${group}`);
            refreshSoon();
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza group failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.ui.buildSlice", async (arg) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to build context.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)")
                (0, cli_1.installLocalInTerminal)();
            if (pick === "Install global")
                (0, cli_1.installGlobalInTerminal)();
            return;
        }
        let slice;
        if (arg && typeof arg === "object" && typeof arg.slice === "string") {
            slice = arg.slice;
        }
        else if (arg && typeof arg === "object" && typeof arg.zzza?.slice === "string") {
            slice = arg.zzza.slice;
        }
        if (!slice) {
            const picked = await vscode.window.showInputBox({
                prompt: "Slice name to build (e.g. core)",
                ignoreFocusOut: true,
            });
            if (!picked)
                return;
            slice = picked;
        }
        try {
            const args = ["build", slice];
            const res = await (0, cli_1.runSliceza)(availability, args, root);
            out.clear();
            out.appendLine(`$ zzza ${args.join(" ")}`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            refreshSoon();
            toast("Context rebuilt");
            if (res.stderr?.trim()) {
                vscode.window.showWarningMessage(`zzza build warnings:\n${res.stderr.trim()}`);
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza build failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.ui.buildGroup", async (arg) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            vscode.window.showErrorMessage("zzza CLI not found.");
            return;
        }
        const group = arg?.group;
        if (!group) {
            vscode.window.showErrorMessage("No group specified.");
            return;
        }
        out.clear();
        out.appendLine(`$ zzza build ${group}`);
        try {
            const res = await (0, cli_1.runSliceza)(availability, ["build", group], root);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            toast(`Built group: ${group}`);
            refreshSoon();
        }
        catch (err) {
            vscode.window.showErrorMessage(err?.message ?? String(err));
        }
        out.show(true);
    }), vscode.commands.registerCommand("zzza.buildAll", async () => {
        const root = getWorkspaceRoot();
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to build context.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)")
                (0, cli_1.installLocalInTerminal)();
            if (pick === "Install global")
                (0, cli_1.installGlobalInTerminal)();
            return;
        }
        try {
            const res = await (0, cli_1.runSliceza)(availability, ["build"], root);
            out.clear();
            out.appendLine(`$ zzza build`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            refreshSoon();
            if (res.stderr?.trim()) {
                vscode.window.showWarningMessage(`zzza build warnings:\n${res.stderr.trim()}`);
            }
            else {
                vscode.window.showInformationMessage("✓ zzza built slice_context.md");
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza build failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.init", async () => {
        const root = getWorkspaceRoot();
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to init slice context.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)") {
                (0, cli_1.installLocalInTerminal)();
            }
            else if (pick === "Install global") {
                (0, cli_1.installGlobalInTerminal)();
            }
            return;
        }
        try {
            const res = await (0, cli_1.runSliceza)(availability, ["init"], root);
            out.clear();
            out.appendLine(`$ zzza init`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            refreshSoon();
            if (res.stderr?.trim()) {
                vscode.window.showWarningMessage(`zzza init warnings:\n${res.stderr.trim()}`);
            }
            else {
                vscode.window.showInformationMessage("✓ zzza initialized slice context");
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza init failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.addPath", async (uri) => {
        const root = getWorkspaceRoot();
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to add paths.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)") {
                (0, cli_1.installLocalInTerminal)();
            }
            else if (pick === "Install global") {
                (0, cli_1.installGlobalInTerminal)();
            }
            return;
        }
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const rel = path.relative(root, uri.fsPath).replaceAll("\\", "/");
        // Don't let users accidentally slice the generated output back into inputs.
        if (GENERATED_CONTEXT_FILES.has(path.posix.basename(rel))) {
            vscode.window.showWarningMessage(`Skipping generated file: ${rel}.\nTip: add source files (ts/html/css/etc), not slice_context.md.`);
            return;
        }
        let stat;
        try {
            stat = await vscode.workspace.fs.stat(uri);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to stat path: ${err}`);
            return;
        }
        const isDir = stat.type === vscode.FileType.Directory;
        const slice = await promptSlice();
        if (!slice)
            return;
        const group = await promptGroup("green");
        if (!group)
            return;
        try {
            const addArgs = isDir ? ["add-dir", slice, rel] : ["add", slice, rel];
            const addRes = await (0, cli_1.runSliceza)(availability, addArgs, root);
            const groupArgs = ["group", slice, group];
            const groupRes = await (0, cli_1.runSliceza)(availability, groupArgs, root);
            out.clear();
            out.appendLine(`$ zzza ${addArgs.join(" ")}`);
            if (addRes.stdout?.trim())
                out.appendLine(addRes.stdout.trim());
            if (addRes.stderr?.trim())
                out.appendLine(addRes.stderr.trim());
            out.appendLine(`$ zzza ${groupArgs.join(" ")}`);
            if (groupRes.stdout?.trim())
                out.appendLine(groupRes.stdout.trim());
            if (groupRes.stderr?.trim())
                out.appendLine(groupRes.stderr.trim());
            out.show(true);
            vscode.window.showInformationMessage(`✓ Added to ${slice} (${group}): ${rel}`);
            refreshSoon();
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza addPath failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.ui.addToSlice", async (arg, uris) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to add to slice.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)") {
                (0, cli_1.installLocalInTerminal)();
            }
            else if (pick === "Install global") {
                (0, cli_1.installGlobalInTerminal)();
            }
            return;
        }
        let slice;
        if (arg && typeof arg === "object" && arg.slice) {
            slice = arg.slice;
        }
        else if (arg && typeof arg === "object" && arg.zzza?.slice) {
            slice = arg.zzza.slice;
        }
        if (!slice) {
            slice = await promptSlice();
            if (!slice)
                return;
        }
        if (!uris || uris.length === 0) {
            uris = await vscode.window.showOpenDialog({
                title: `Add files/folders to ${slice}`,
                defaultUri: vscode.Uri.file(root),
                canSelectMany: true,
                canSelectFiles: true,
                canSelectFolders: true,
                openLabel: "Add to slice",
            });
        }
        if (!uris || uris.length === 0)
            return;
        for (const uri of uris) {
            const rel = path.relative(root, uri.fsPath).replaceAll("\\", "/");
            if (GENERATED_CONTEXT_FILES.has(path.posix.basename(rel))) {
                vscode.window.showWarningMessage(`Skipping generated file: ${rel}.\nTip: add source files (ts/html/css/etc), not slice_context.md.`);
                continue;
            }
            let stat;
            try {
                stat = await vscode.workspace.fs.stat(uri);
            }
            catch (err) {
                vscode.window.showErrorMessage(`Failed to stat path: ${err}`);
                continue;
            }
            const isDir = stat.type === vscode.FileType.Directory;
            try {
                const args = isDir ? ["add-dir", slice, rel] : ["add", slice, rel];
                const res = await (0, cli_1.runSliceza)(availability, args, root);
                out.appendLine(`$ zzza ${args.join(" ")}`);
                if (res.stdout?.trim())
                    out.appendLine(res.stdout.trim());
                if (res.stderr?.trim())
                    out.appendLine(res.stderr.trim());
            }
            catch (err) {
                vscode.window.showErrorMessage(`zzza addToSlice failed: ${err?.message ?? String(err)}`);
            }
        }
        out.show(true);
        toast("Slice updated");
        refreshSoon();
    }), vscode.commands.registerCommand("zzza.ui.removeFromSlice", async (arg) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const payload = (arg && typeof arg === "object" && arg.slice && arg.path)
            ? { slice: arg.slice, path: arg.path }
            : (arg && typeof arg === "object" && arg.zzza?.slice && arg.zzza?.path)
                ? { slice: arg.zzza.slice, path: arg.zzza.path }
                : null;
        if (!payload) {
            vscode.window.showErrorMessage("Missing slice/path for removal");
            return;
        }
        const slice = payload.slice;
        const relPath = payload.path;
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to remove from slice.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)") {
                (0, cli_1.installLocalInTerminal)();
            }
            else if (pick === "Install global") {
                (0, cli_1.installGlobalInTerminal)();
            }
            return;
        }
        try {
            const args = ["remove", slice, relPath];
            const res = await (0, cli_1.runSliceza)(availability, args, root);
            out.clear();
            out.appendLine(`$ zzza ${args.join(" ")}`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            toast("Slice updated");
            refreshSoon();
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza removeFromSlice failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.ui.rmSlice", async (arg) => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to remove slices.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)")
                (0, cli_1.installLocalInTerminal)();
            if (pick === "Install global")
                (0, cli_1.installGlobalInTerminal)();
            return;
        }
        const sliceName = (arg && typeof arg === "object" && typeof arg.slice === "string" && arg.slice) ||
            (arg && typeof arg === "object" && typeof arg.zzza?.slice === "string" && arg.zzza.slice) ||
            (arg && typeof arg === "object" && typeof arg.sliceName === "string" && arg.sliceName) ||
            undefined;
        const slice = sliceName ??
            (await vscode.window.showInputBox({
                prompt: "Slice name to remove",
                ignoreFocusOut: true,
            }));
        if (!slice)
            return;
        const confirm = await vscode.window.showWarningMessage(`Remove slice "${slice}"? This will delete the slice from slice.jsonc.`, { modal: true }, "Remove");
        if (confirm !== "Remove")
            return;
        try {
            const args = ["rmslice", slice];
            const res = await (0, cli_1.runSliceza)(availability, args, root);
            out.clear();
            out.appendLine(`$ zzza ${args.join(" ")}`);
            if (res.stdout?.trim())
                out.appendLine(res.stdout.trim());
            if (res.stderr?.trim())
                out.appendLine(res.stderr.trim());
            out.show(true);
            toast(`Removed slice: ${slice}`);
            refreshSoon();
        }
        catch (err) {
            vscode.window.showErrorMessage(`zzza rmslice failed: ${err?.message ?? String(err)}`);
        }
    }), vscode.commands.registerCommand("zzza.ui.newSlice", async () => {
        const root = getWorkspaceRoot();
        if (!root) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }
        const availability = await (0, cli_1.detectSliceza)(root);
        if (availability.kind === "missing") {
            const pick = await vscode.window.showWarningMessage("zzza CLI not found. Install it to create slices.", "Install local (recommended)", "Install global");
            if (pick === "Install local (recommended)")
                (0, cli_1.installLocalInTerminal)();
            if (pick === "Install global")
                (0, cli_1.installGlobalInTerminal)();
            return;
        }
        // Ensure slice.jsonc exists (safe to run multiple times)
        try {
            await (0, cli_1.runSliceza)(availability, ["init"], root);
        }
        catch {
            // ignore
        }
        const slice = await vscode.window.showInputBox({
            prompt: "New slice name (e.g. core, ui, docs)",
            ignoreFocusOut: true,
        });
        if (!slice)
            return;
        const uris = await vscode.window.showOpenDialog({
            title: `Add files/folders to ${slice}`,
            defaultUri: vscode.Uri.file(root),
            canSelectMany: true,
            canSelectFiles: true,
            canSelectFolders: true,
            openLabel: "Create Slice",
        });
        if (!uris || uris.length === 0)
            return;
        out.clear();
        for (const uri of uris) {
            const rel = path.relative(root, uri.fsPath).replaceAll("\\", "/");
            if (GENERATED_CONTEXT_FILES.has(path.posix.basename(rel))) {
                vscode.window.showWarningMessage(`Skipping generated file: ${rel}.\nTip: add source files (ts/html/css/etc), not slice_context.md.`);
                continue;
            }
            let stat;
            try {
                stat = await vscode.workspace.fs.stat(uri);
            }
            catch (err) {
                vscode.window.showErrorMessage(`Failed to stat path: ${err}`);
                continue;
            }
            const isDir = stat.type === vscode.FileType.Directory;
            try {
                const args = isDir ? ["add-dir", slice, rel] : ["add", slice, rel];
                const res = await (0, cli_1.runSliceza)(availability, args, root);
                out.appendLine(`$ zzza ${args.join(" ")}`);
                if (res.stdout?.trim())
                    out.appendLine(res.stdout.trim());
                if (res.stderr?.trim())
                    out.appendLine(res.stderr.trim());
            }
            catch (err) {
                vscode.window.showErrorMessage(`zzza newSlice failed: ${err?.message ?? String(err)}`);
            }
        }
        out.show(true);
        toast(`Created slice: ${slice}`);
        refreshSoon();
    }));
    // Auto-refresh + feedback loop when slice.jsonc changes
    const watcher = vscode.workspace.createFileSystemWatcher("**/slice.jsonc");
    watcher.onDidChange(() => {
        refreshSoon();
        toast("Slice updated");
    });
    watcher.onDidCreate(() => {
        refreshSoon();
        toast("Slice updated");
    });
    watcher.onDidDelete(() => {
        refreshSoon();
        toast("Slice updated");
    });
    context.subscriptions.push(watcher);
    // Auto-refresh + feedback loop when slice_context.md changes (e.g., after build)
    const contextWatcher = vscode.workspace.createFileSystemWatcher("**/slice_context.md");
    contextWatcher.onDidChange(() => {
        refreshSoon();
        toast("Context rebuilt");
    });
    contextWatcher.onDidCreate(() => {
        refreshSoon();
        toast("Context rebuilt");
    });
    contextWatcher.onDidDelete(() => {
        refreshSoon();
    });
    context.subscriptions.push(contextWatcher);
    await refreshAll();
}
function deactivate() { }
