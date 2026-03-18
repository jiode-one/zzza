#!/usr/bin/env node
import path from "node:path";
import { readFileSync, lstatSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  ensureManifest,
  manifestPath,
  addToSlice,
  removeFromSlice,
  removeSlice,
  DEFAULT_MANIFEST_FILE,
} from "./manifest.js";
import { listSlicesCmd, listSliceCmd, listGroupCmd, listGroupsCmd } from "./list.js";
import { buildCmd } from "./build.js";
import { doctorCmd } from "./doctor.js";
import { WELCOME, ABOUT, HELP_FOOTER, PROGRAM_DESCRIPTION, versionText } from "./text.js";

const program = new Command();

const pkgPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../package.json"
);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

program.version(versionText(pkg.version), "-v, --version", "Show version");

program
  .name("zzza")
  .description(PROGRAM_DESCRIPTION)
  .option("--tips", "Show the welcome message / tips");

program.hook("preAction", (_thisCmd: Command, _actionCmd: Command) => {
  // `commander`'s `opts()` is not generically typed in all versions.
  // Keep it strict-friendly via a cast.
  const opts = program.opts() as { tips?: boolean };
  if (opts.tips) {
    console.log(WELCOME);
    process.exit(0);
  }
});

program
  .command("about")
  .description("What zzza is and why it exists")
  .action(() => {
    console.log(ABOUT);
  });

program
  .command("init")
  .description("Create slice.jsonc (safe to run multiple times)")
  .action(() => {
    const { file, created } = ensureManifest(process.cwd());
    console.log(
      created
        ? `✓ zzza initialized (created ${path.basename(file)})`
        : `✓ zzza already initialized (${path.basename(file)} exists)`
    );
    console.log("");
    console.log(WELCOME);
  });

program
  .command("doctor")
  .description("Check your setup and print helpful tips")
  .action(() => doctorCmd());

program
  .command("add")
  .description("Add path(s) to a slice")
  .argument("<slice>", "slice name")
  .argument("<path...>", "path(s) to add")
  .option("-c, --group <group>", "group tag (advanced)")
  .action((slice: string, p: string[], opts: { group?: string }) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());

    // Detect directories up-front so `zzza add <dir>` doesn't store the dir as a file.
    const filePaths: string[] = [];
    const dirPaths: string[] = [];

    for (const raw of p) {
      const abs = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
      try {
        if (lstatSync(abs).isDirectory()) dirPaths.push(raw);
        else filePaths.push(raw);
      } catch {
        // If we can't stat it, treat as file (keeps current behavior for non-existent paths).
        filePaths.push(raw);
      }
    }

    let totalAdded = 0;
    let changed = false;
    let groupChanged = false;

    if (dirPaths.length > 0) {
      const resDir = addToSlice({
        manifestFile: file,
        sliceName: slice,
        group: opts.group,
        inputPaths: dirPaths,
        kindOverride: "dir",
      });
      totalAdded += resDir.added;
      changed ||= resDir.changed;
      groupChanged ||= resDir.groupChanged;
    }

    if (filePaths.length > 0) {
      const resFile = addToSlice({
        manifestFile: file,
        sliceName: slice,
        group: opts.group,
        inputPaths: filePaths,
      });
      totalAdded += resFile.added;
      changed ||= resFile.changed;
      groupChanged ||= resFile.groupChanged;
    }

    if (changed) {
      if (totalAdded > 0) {
        console.log(`✓ Added ${totalAdded} item(s) to "${slice}"`);
      } else if (groupChanged) {
        console.log(
          `✓ Updated "${slice}" group to "${(opts.group ?? "default").toLowerCase()}"`
        );
      } else {
        console.log(`✓ Updated "${slice}"`);
      }
    } else {
      console.log(`No changes (already in "${slice}")`);
    }
  });

program
  .command("add-dir")
  .description("Add directory path(s) to a slice (expanded at build time)")
  .argument("<slice>", "slice name")
  .argument("<path...>", "directory path(s) to add")
  .option("-c, --group <group>", "group tag (advanced)")
  .action((slice: string, p: string[], opts: { group?: string }) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    const res = addToSlice({
      manifestFile: file,
      sliceName: slice,
      group: opts.group,
      inputPaths: p,
      kindOverride: "dir",
    });
    if (res.changed) {
      if (res.added > 0) {
        console.log(`✓ Added ${res.added} dir item(s) to "${slice}"`);
      } else if (res.groupChanged) {
        console.log(
          `✓ Updated "${slice}" group to "${(opts.group ?? "default").toLowerCase()}"`
        );
      } else {
        console.log(`✓ Updated "${slice}"`);
      }
    } else {
      console.log(`No changes (already in "${slice}")`);
    }
  });

  program
  .command("group")
  .description("Assign a slice to a group")
  .argument("<slice>", "slice name")
  .argument("<group>", "group name")
  .action((slice: string, group: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());

    const res = addToSlice({
      manifestFile: file,
      sliceName: slice,
      group,
      inputPaths: [],
    });

    const g = group.trim().toLowerCase();

    if (res.groupChanged || res.channelChanged) {
      console.log(`✓ Updated "${slice}" group to "${g}"`);
    } else {
      console.log(`No changes ("${slice}" already in "${g}")`);
    }
  });

program
  .command("remove")
  .description("Remove a path from a slice")
  .argument("<slice>", "slice name")
  .argument("<path...>", "path(s) to remove")
  .action((slice: string, p: string[]) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    const res = removeFromSlice({ manifestFile: file, sliceName: slice, inputPaths: p });
    console.log(res.changed ? `✓ Removed ${res.removed} item(s) from "${slice}"` : "No changes");
  });

// LIST COMMANDS
const list = program
  .command("list")
  .description("List slices, slice contents, or groups");

// `zzza list` defaults to listing slices.
list.action(() => {
  const file = manifestPath(process.cwd());
  ensureManifest(process.cwd());
  listSlicesCmd(file);
});

list
  .command("slices")
  .description("List all slices")
  .action(() => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    listSlicesCmd(file);
  });

list
  .command("slice")
  .description("List all paths included in a slice")
  .argument("<slice>", "slice name")
  .action((slice: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    listSliceCmd(file, slice);
  });

list
  .command("group")
  .description("Show the group for a slice")
  .argument("<slice>", "slice name")
  .action((slice: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    listGroupCmd(file, slice);
  });

list
  .command("groups")
  .description("List all groups and the slices in them")
  .action(() => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    listGroupsCmd(file);
  });

program
  .command("build")
  .description("Generate slice_context.md (for all slices, or a group/slice)")
  .argument("[target]", "optional: group name OR slice name")
  .action((target?: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    buildCmd(file, target);
  });

program
  .command("rmslice")
  .description("Remove a slice entirely")
  .argument("<slice>", "Slice name")
  .action((slice: string) => {
    const manifestFile = manifestPath(process.cwd(), DEFAULT_MANIFEST_FILE);
    const res = removeSlice({ manifestFile, sliceName: slice });
    if (res.changed) {
      console.log(`✓ Removed slice "${slice}"`);
    } else {
      console.log("No changes (slice not found)");
    }
  });

program.addHelpText("after", HELP_FOOTER);

program.parse(process.argv);