#!/usr/bin/env node
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { ensureManifest, manifestPath, addToSlice, removeFromSlice } from "./manifest.js";
import { listCmd } from "./list.js";
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
  .name("sliceza")
  .description(PROGRAM_DESCRIPTION)
  .option("--tips", "Show the welcome message / tips");

program.hook("preAction", (thisCmd, actionCmd) => {
  const opts = program.opts<{ tips?: boolean }>();
  if (opts.tips) {
    console.log(WELCOME);
    process.exit(0);
  }
});

program
  .command("about")
  .description("What Sliceza is and why it exists")
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
        ? `✓ Sliceza initialized (created ${path.basename(file)})`
        : `✓ Sliceza already initialized (${path.basename(file)} exists)`
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
  .description("Add a path to a slice, and set its channel")
  .argument("<slice>", "slice name")
  .argument("<channel>", "channel tag (often a color)")
  .argument("<path...>", "path(s) to add")
  .action((slice: string, channel: string, p: string[]) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    const res = addToSlice({ manifestFile: file, sliceName: slice, channel, inputPaths: p });
    console.log(res.changed ? `✓ Added ${res.added} item(s) to "${slice}"` : `No changes (already present)`);
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
    console.log(res.changed ? `✓ Removed ${res.removed} item(s) from "${slice}"` : `No changes`);
  });

program
  .command("list")
  .description("List slices (or list a channel, or show files in a slice)")
  .argument("[arg]", "optional: channel name OR slice name")
  .action((arg?: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    listCmd(file, arg);
  });

program
  .command("build")
  .description("Generate slice_context.md (for all slices, or a channel/slice)")
  .argument("[target]", "optional: channel name OR slice name")
  .action((target?: string) => {
    const file = manifestPath(process.cwd());
    ensureManifest(process.cwd());
    buildCmd(file, target);
  });

program.addHelpText("after", HELP_FOOTER);

program.parse(process.argv);