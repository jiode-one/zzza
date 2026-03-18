import fs from "node:fs";
import path from "node:path";
import { ensureManifest, readManifest, Manifest } from "./manifest.js";

type Severity = "ok" | "info" | "warn";
type Finding = { severity: Severity; message: string; detail?: string[] };

function fmt(sev: Severity) {
  if (sev === "ok") return "✓";
  if (sev === "warn") return "⚠️ ";
  return "ℹ️ ";
}

function push(findings: Finding[], severity: Severity, message: string, detail?: string[]) {
  findings.push({ severity, message, detail });
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function normPosix(p: string) {
  return p.replaceAll("\\", "/");
}

function absFromCwd(relOrAbs: string) {
  const p = relOrAbs;
  if (path.isAbsolute(p)) return p;
  return path.resolve(process.cwd(), p);
}

function existsAndReadable(absPath: string) {
  try {
    fs.accessSync(absPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function estimateTokensFromChars(charCount: number) {
  // Same heuristic as build.ts (keep consistent)
  return Math.ceil(charCount / 4);
}

function safeStat(absPath: string): fs.Stats | null {
  try {
    return fs.statSync(absPath);
  } catch {
    return null;
  }
}

export function doctorCmd() {
  const { file, created } = ensureManifest(process.cwd());
  console.log(`Manifest: ${file} ${created ? "(created)" : "(found)"}`);

  let data: Manifest | null = null;

  try {
    const parsed = readManifest(file);
    data = parsed.data;
  } catch (e) {
    console.log("");
    console.log("⚠️  Could not read manifest.");
    console.log(`   ${String(e)}`);
    console.log("");
    console.log("Tip: Open slice.jsonc and ensure it is valid JSONC.");
    return;
  }

  const findings: Finding[] = [];

  // -----------------------
  // 1) Manifest shape sanity
  // -----------------------
  const settings: any = (data as any)?.settings;

  if (!settings || typeof settings !== "object") {
    push(findings, "warn", "Missing or invalid settings object", [
      'Expected: "settings": { ... }',
    ]);
  } else {
    if (typeof settings.contextFile !== "string" || settings.contextFile.trim() === "") {
      push(findings, "warn", "settings.contextFile is missing or not a string", [
        'Expected: "contextFile": "slice_context.md"',
      ]);
    } else {
      push(findings, "ok", `contextFile: ${settings.contextFile}`);
    }

    if (!isStringArray(settings.ignore)) {
      push(findings, "warn", "settings.ignore is missing or not an array of strings", [
        'Expected: "ignore": ["node_modules/**", "dist/**", ".git/**"]',
      ]);
    } else {
      push(findings, "ok", `ignore rules: ${settings.ignore.length}`);
    }

    // Tree settings sanity
    const tree = settings.tree;
    if (tree !== undefined && tree !== null && typeof tree !== "object") {
      push(findings, "warn", "settings.tree exists but is not an object");
    } else if (tree) {
      const mode = tree.mode;
      if (mode !== undefined && mode !== "dirs-only" && mode !== "dirs-and-files") {
        push(findings, "warn", `Invalid tree.mode: "${String(mode)}"`, [
          'Expected: "dirs-only" or "dirs-and-files"',
        ]);
      } else if (mode) {
        push(findings, "ok", `tree.mode: ${mode}`);
      }

      if (tree.roots !== undefined && !isStringArray(tree.roots)) {
        push(findings, "warn", "settings.tree.roots is not an array of strings");
      } else if (Array.isArray(tree.roots)) {
        push(findings, "ok", `tree.roots: ${tree.roots.length}`);
      }

      if (tree.maxDepth !== undefined && typeof tree.maxDepth !== "number") {
        push(findings, "warn", "settings.tree.maxDepth is not a number");
      }
      if (tree.maxEntries !== undefined && typeof tree.maxEntries !== "number") {
        push(findings, "warn", "settings.tree.maxEntries is not a number");
      }
    }
  }

  // -----------------------
  // 2) Ignore list smell checks (advisory)
  // -----------------------
  const ignore: string[] = isStringArray(settings?.ignore) ? settings.ignore : [];
  const hasNodeModules = ignore.some((x) => normPosix(x).startsWith("node_modules"));
  const hasDist = ignore.some((x) => normPosix(x).startsWith("dist"));
  const hasGit = ignore.some((x) => normPosix(x).startsWith(".git"));

  if (ignore.length === 0) {
    push(findings, "warn", "No ignore rules configured", [
      "Common defaults:",
      '  "node_modules/**", "dist/**", ".git/**"',
    ]);
  } else {
    if (!hasNodeModules) {
      push(findings, "info", "node_modules is not ignored", [
        'Consider adding: "node_modules/**" (recommended for sane builds)',
      ]);
    }
    if (!hasDist) {
      push(findings, "info", "dist is not ignored", [
        'Consider adding: "dist/**" (recommended to avoid build artifacts)',
      ]);
    }
    if (!hasGit) {
      push(findings, "info", ".git is not ignored", [
        'Consider adding: ".git/**" (recommended to avoid repository metadata)',
      ]);
    }
  }

  // -----------------------
  // 3) Slice references vs filesystem
  // -----------------------
  const slices: any[] = Array.isArray((data as any)?.slices) ? (data as any).slices : [];
  if (!Array.isArray((data as any)?.slices)) {
    push(findings, "warn", "Missing or invalid slices array", ['Expected: "slices": []']);
  } else {
    push(findings, "ok", `slices: ${slices.length}`);
  }

  let missingCount = 0;
  let unreadableCount = 0;
  let totalFiles = 0;

  for (const s of slices) {
    const sliceName = typeof s?.name === "string" ? s.name : String(s?.id ?? "unknown");
    const items: any[] = Array.isArray(s?.items) ? s.items : [];

    for (const it of items) {
      if (it?.kind !== "file" || typeof it?.path !== "string") continue;

      totalFiles++;
      const rel = normPosix(it.path);
      const abs = absFromCwd(rel);
      const st = safeStat(abs);

      if (!st) {
        missingCount++;
        push(findings, "warn", `Missing file referenced by slice "${sliceName}"`, [rel]);
        continue;
      }

      if (!existsAndReadable(abs)) {
        unreadableCount++;
        push(findings, "warn", `Unreadable file referenced by slice "${sliceName}"`, [rel]);
      }
    }
  }

  if (totalFiles > 0) {
    push(findings, "ok", `slice file references: ${totalFiles}`);
  }
  if (missingCount === 0 && unreadableCount === 0 && totalFiles > 0) {
    push(findings, "ok", "All referenced slice files are readable");
  }

  // -----------------------
  // 4) Tree roots consistency checks
  // -----------------------
  const tree = settings?.tree;
  const roots: string[] = isStringArray(tree?.roots) ? tree.roots : [];

  if (roots.length > 0) {
    for (const r of roots) {
      const rel = normPosix(r);
      const abs = absFromCwd(rel);
      const st = safeStat(abs);
      if (!st) {
        push(findings, "warn", `Tree root does not exist`, [rel]);
      } else if (!st.isDirectory()) {
        push(findings, "info", `Tree root is not a directory`, [rel]);
      } else if (!existsAndReadable(abs)) {
        push(findings, "warn", `Tree root is not readable`, [rel]);
      }
    }
  } else {
    push(findings, "info", "No tree.roots configured (Context Tree will fall back to included files)");
  }

  // -----------------------
// 5) Context size info (advisory)
// -----------------------
const contextFile =
  typeof settings?.contextFile === "string"
    ? settings.contextFile
    : "slice_context.md";

const contextAbs = absFromCwd(contextFile);

if (safeStat(contextAbs)) {
  try {
    const txt = fs.readFileSync(contextAbs, "utf8");
    const charCount = txt.length;
    const estimatedTokens = estimateTokensFromChars(charCount);

    push(findings, "info", "Estimated context size (last build)", [
      `~${estimatedTokens.toLocaleString()} tokens`,
      `~${Math.ceil(charCount / 1024)} KB`,
    ]);

    const tw = settings?.tokenWarn;
    if (tw?.modelMaxTokens) {
      push(findings, "info", "Token warning configuration", [
        `modelMaxTokens: ${tw.modelMaxTokens.toLocaleString()}`,
        `warnAt: ${((tw.warnAt ?? 0.85) * 100).toFixed(0)}%`,
      ]);
    }
  } catch {
    push(findings, "info", "Context file exists but could not be read");
  }
} else {
  push(findings, "info", "No context file found", [
    "Run `zzza build` to generate slice_context.md",
  ]);
}

  // -----------------------
  // Print results
  // -----------------------
  console.log("");

  const oks = findings.filter((f) => f.severity === "ok");
  const infos = findings.filter((f) => f.severity === "info");
  const warns = findings.filter((f) => f.severity === "warn");

  // Print WARN first, then INFO, then OK (so problems are visible)
  const ordered = [...warns, ...infos, ...oks];

  for (const f of ordered) {
    console.log(`${fmt(f.severity)} ${f.message}`);
    if (f.detail && f.detail.length) {
      for (const line of f.detail) console.log(`   ${line}`);
    }
  }

  console.log("");
  console.log(
    warns.length > 0
      ? `Summary: ${warns.length} warning(s), ${infos.length} info`
      : `Summary: ✓ no warnings (${infos.length} info)`
  );

  console.log("");
  console.log("Typing tip (strongly recommended):");
  console.log('  alias sli="zzza"');
  console.log("");
  console.log("Docs:");
  console.log("  https://jiode.one/oss/slice");
}