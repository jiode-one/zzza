import { readManifest } from "./manifest.js";

type SliceItem = { kind: "file" | "dir"; path: string };
type Slice = { id: string; name: string; group?: string; items: SliceItem[] };

type ManifestData = { slices: Slice[] };
type ReadManifestResult = { data: ManifestData };

function norm(p: string): string {
  return (p ?? "").toString().replace(/\\/g, "/");
}

function getSlices(manifestFile: string): Slice[] {
  const res = readManifest(manifestFile) as unknown as ReadManifestResult;
  return (res?.data?.slices ?? []) as Slice[];
}

function findSlice(slices: Slice[], sliceName: string): Slice | undefined {
  const needle = (sliceName ?? "").trim().toLowerCase();
  return slices.find((s) => (s.id ?? "").toLowerCase() === needle) ??
    slices.find((s) => (s.name ?? "").toLowerCase() === needle);
}

function sliceGroup(s: Slice): string {
  return ((s.group ?? "default") as string).toString().toLowerCase();
}

export function listSlicesCmd(manifestFile: string): void {
  const slices = getSlices(manifestFile);
  if (slices.length === 0) return;

  const maxName = Math.max(...slices.map((s) => (s.name ?? s.id ?? "").length));
  for (const s of slices) {
    const name = s.name ?? s.id;
    const g = sliceGroup(s);
    console.log(`${name.padEnd(maxName, " ")} (${g})`);
  }
}

export function listSliceCmd(manifestFile: string, sliceName: string): void {
  const slices = getSlices(manifestFile);
  const s = findSlice(slices, sliceName);
  if (!s) {
    console.log(`Slice not found: ${sliceName}`);
    process.exitCode = 1;
    return;
  }

  for (const it of s.items ?? []) {
    const p = norm(it.path);
    if (!p) continue;
    if (it.kind === "dir") console.log(p.endsWith("/") ? p : `${p}/`);
    else console.log(p);
  }
}

export function listGroupCmd(manifestFile: string, sliceName: string): void {
  const slices = getSlices(manifestFile);
  const s = findSlice(slices, sliceName);
  if (!s) {
    console.log(`Slice not found: ${sliceName}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${s.name ?? s.id} → ${sliceGroup(s)}`);
}

export function listGroupsCmd(manifestFile: string): void {
  const slices = getSlices(manifestFile);
  if (slices.length === 0) return;

  const groups = new Map<string, string[]>();
  for (const s of slices) {
    const g = sliceGroup(s);
    const arr = groups.get(g) ?? [];
    arr.push(s.name ?? s.id);
    groups.set(g, arr);
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  let first = true;
  for (const g of groupNames) {
    const names = (groups.get(g) ?? []).slice().sort((a, b) => a.localeCompare(b));
    if (!first) console.log("");
    first = false;

    console.log(`${g}:`);
    for (const name of names) {
      console.log(`  - ${name}`);
    }
  }
}

// Back-compat: keep the old entrypoint if other code imports it.
// Old behavior:
// - no arg => list grouped slices
// - arg => list group/slice
// New behavior: default to `list slices`.
export function listCmd(manifestFile: string, _arg?: string): void {
  listSlicesCmd(manifestFile);
}