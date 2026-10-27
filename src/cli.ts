#!/usr/bin/env node
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import {
  ContextValidationError,
  createContextDocument,
  readContextFile,
  writeContextFile,
} from "./index.js";

async function main(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }
  if (command === "--version" || command === "-v") {
    console.log("context-file 0.1.0");
    return 0;
  }

  if (command === "init") {
    const path = rest.find((arg) => !arg.startsWith("--"));
    const titleIndex = rest.indexOf("--title");
    const title = titleIndex >= 0 ? rest[titleIndex + 1] : undefined;
    if (!path || (titleIndex >= 0 && !title)) {
      console.error("Usage: context-file init <path.context> [--title <title>]");
      return 2;
    }
    try {
      await writeContextFile(path, createContextDocument(title ? { title } : {}));
      console.log(`Created ${path}`);
      return 0;
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        console.error(`File already exists: ${path}`);
        return 1;
      }
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  if (command === "validate") {
    const path = rest[0];
    if (!path) {
      console.error("Usage: context-file validate <path.context>");
      return 2;
    }
    try {
      await access(path, constants.R_OK);
      const document = await readContextFile(path);
      console.log(`Valid .context file: ${document.title}`);
      return 0;
    } catch (error) {
      if (error instanceof ContextValidationError) {
        console.error(error.message);
      } else if (isNotFoundError(error)) {
        console.error(`File not found: ${path}`);
      } else {
        console.error(error instanceof Error ? error.message : String(error));
      }
      return 1;
    }
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 2;
}

function printHelp(): void {
  console.log(`context-file — portable coding-agent handoffs

Usage:
  context-file init <path.context> [--title <title>]
  context-file validate <path.context>
  context-file --help
  context-file --version`);
}

function isAlreadyExistsError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function isNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

process.exitCode = await main(process.argv.slice(2));
