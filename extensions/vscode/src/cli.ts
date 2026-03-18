import * as path from "node:path";
import * as fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";


const execFileAsync = promisify(execFile);

function shellQuote(arg: string): string {
  // POSIX-safe single-quote escaping:  abc'd -> 'abc'"'"'d'
  return `'${arg.replace(/'/g, `'\"'\"'`)}'`;
}

export type SlicezaAvailability =
  | { kind: "local"; binPath: string }
  | { kind: "global"; cmd: "zzza" }
  | { kind: "missing" };

async function detectGlobalSlicezaViaShell(): Promise<string | null> {
  const shell = vscode.env.shell || "/bin/zsh";

  try {
    const { stdout } = await execFileAsync(shell, [
      "-lc",
      "command -v zzza",
    ]);

    const resolved = stdout?.trim();
    return resolved ? resolved : null;
  } catch {
    return null;
  }
}

export async function detectSliceza(workspaceRoot: string | undefined): Promise<SlicezaAvailability> {
  
  
  if (workspaceRoot) {
    const localBin = path.join(workspaceRoot, "node_modules", ".bin", "zzza");
    if (fs.existsSync(localBin)) return { kind: "local", binPath: localBin };
  }  

  const globalPath = await detectGlobalSlicezaViaShell();
  if (globalPath) {
    return { kind: "global", cmd: "zzza" };
  }

  return { kind: "missing" };
}

export async function runSliceza(
  availability: SlicezaAvailability,
  args: string[],
  workspaceRoot?: string
): Promise<{ stdout: string; stderr: string }> {
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

export function installLocalInTerminal() {
  const term = vscode.window.createTerminal({ name: "zzza Install (local)" });
  term.show(true);
  term.sendText("npm i --save-dev zzza", true);
}

export function installGlobalInTerminal() {
  const term = vscode.window.createTerminal({ name: "zzza Install (global)" });
  term.show(true);
  term.sendText("npm i -g zzza", true);
}