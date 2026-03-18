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
exports.detectSliceza = detectSliceza;
exports.runSliceza = runSliceza;
exports.installLocalInTerminal = installLocalInTerminal;
exports.installGlobalInTerminal = installGlobalInTerminal;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const vscode = __importStar(require("vscode"));
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
function shellQuote(arg) {
    // POSIX-safe single-quote escaping:  abc'd -> 'abc'"'"'d'
    return `'${arg.replace(/'/g, `'\"'\"'`)}'`;
}
async function detectGlobalSlicezaViaShell() {
    const shell = vscode.env.shell || "/bin/zsh";
    try {
        const { stdout } = await execFileAsync(shell, [
            "-lc",
            "command -v zzza",
        ]);
        const resolved = stdout?.trim();
        return resolved ? resolved : null;
    }
    catch {
        return null;
    }
}
async function detectSliceza(workspaceRoot) {
    if (workspaceRoot) {
        const localBin = path.join(workspaceRoot, "node_modules", ".bin", "zzza");
        if (fs.existsSync(localBin))
            return { kind: "local", binPath: localBin };
    }
    const globalPath = await detectGlobalSlicezaViaShell();
    if (globalPath) {
        return { kind: "global", cmd: "zzza" };
    }
    return { kind: "missing" };
}
async function runSliceza(availability, args, workspaceRoot) {
    const cwd = workspaceRoot ?? process.cwd();
    if (availability.kind === "missing") {
        throw new Error("zzza CLI not found.");
    }
    if (availability.kind === "local") {
        return execFileAsync(availability.binPath, args, { cwd, timeout: 30_000 });
    }
    const shell = vscode.env.shell || "/bin/zsh";
    const cmd = ["zzza", ...args.map(shellQuote)].join(" ");
    return execFileAsync(shell, ["-lc", cmd], { cwd, timeout: 60_000 });
}
function installLocalInTerminal() {
    const term = vscode.window.createTerminal({ name: "zzza Install (local)" });
    term.show(true);
    term.sendText("npm i --save-dev zzza", true);
}
function installGlobalInTerminal() {
    const term = vscode.window.createTerminal({ name: "zzza Install (global)" });
    term.show(true);
    term.sendText("npm i -g zzza", true);
}
