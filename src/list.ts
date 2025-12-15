import { readManifest } from "./manifest.js";

function commonPrefixDir(paths: string[]): string | null {
  if (paths.length === 0) return null;
  const parts = paths.map((p) => p.split("/"));
  const minLen = Math.min(...parts.map((a) => a.length));
  let i = 0;
  for (; i < minLen; i++) {
    const seg = parts[0][i];
    if (!parts.every((a) => a[i] === seg)) break;
  }
  const prefix = parts[0].slice(0, Math.max(0, i)).join("/");
  return prefix ? prefix + "/" : null;
}

export function listCmd(manifestFile: string, arg?: string) {
  const { data } = readManifest(manifestFile);

  const byChannel = new Map<string, typeof data.slices>();
  for (const s of data.slices) {
    const k = s.channel || "unsorted";
    const arr = byChannel.get(k) ?? [];
    arr.push(s);
    byChannel.set(k, arr);
  }

  // No arg => grouped list
  if (!arg) {
    const channels = [...byChannel.keys()].sort();
    console.log("Slices:");
    for (const ch of channels) {
      const slices = byChannel.get(ch)!;
      // derive a “path hint” for each slice
      for (const s of slices) {
        const filePaths = s.items.filter(i => i.kind === "file").map(i => i.path);
        const hint = commonPrefixDir(filePaths) ?? "(mixed paths)";
        console.log(`  ${s.id}  \\ ${ch}  \\ ${hint} (${s.items.length})`);
      }
    }
    return;
  }

  const needle = arg.trim().toLowerCase();

  // If arg matches a channel => list slices in channel
  const channelMatch = [...byChannel.keys()].find((k) => k.toLowerCase() === needle);
  if (channelMatch) {
    console.log(channelMatch);
    const slices = byChannel.get(channelMatch)!;
    for (const s of slices) {
      console.log(`  - ${s.id} (${s.items.length})`);
    }
    return;
  }

  // Else if matches a slice id => show items
  const slice = data.slices.find((s) => s.id.toLowerCase() === needle) ??
                data.slices.find((s) => s.name.toLowerCase() === needle);
  if (!slice) {
    console.log(`No channel or slice found for: ${arg}`);
    return;
  }

  console.log(`Slice: ${slice.id}  (channel: ${slice.channel})  (${slice.items.length} items)`);
  for (const it of slice.items) {
    console.log(`  - ${it.path}`);
  }
}