import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  ContextValidationError,
  createContextDocument,
  parseContext,
  readContextFile,
  serializeContext,
  validateContextDocument,
  writeContextFile,
} from "../dist/index.js";

test("round-trips Unicode text, lists, and optional file references", () => {
  const document = {
    ...createContextDocument({ title: "ترحيل إلى الإصدار الجديد", now: new Date("2026-10-27T12:00:00Z") }),
    goal: "Keep the résumé readable for the next agent.",
    currentStatus: "The API is implemented and ready for review.",
    completedWork: ["Added the initial parser ✅"],
    decisions: ["Use Markdown with YAML metadata."],
    constraints: ["Do not include credentials."],
    relevantFiles: [{ path: "src/index.ts", reason: "Public API" }],
    nextSteps: ["Publish after checking the package name."],
  };
  const parsed = parseContext(serializeContext(document));
  assert.deepEqual(parsed, document);
});

test("accepts an empty optional relevant-files list", () => {
  const document = createContextDocument();
  document.goal = "A clear goal.";
  document.currentStatus = "In progress.";
  assert.deepEqual(parseContext(serializeContext(document)).relevantFiles, []);
});

test("rejects missing and unsupported format versions", () => {
  const doc = createContextDocument();
  doc.goal = "Goal";
  doc.currentStatus = "Status";
  assert.throws(() => validateContextDocument({ ...doc, formatVersion: undefined }), /formatVersion must be 1/);
  assert.throws(() => validateContextDocument({ ...doc, formatVersion: 2 }), /formatVersion must be 1/);
});

test("reports malformed YAML frontmatter", () => {
  assert.throws(() => parseContext("---\nformatVersion: [\n---\n"), /Malformed YAML frontmatter/);
});

test("reads and writes files without overwriting existing work", async () => {
  const directory = await mkdtemp(join(tmpdir(), "context-file-"));
  const path = join(directory, "handoff.context");
  try {
    const document = createContextDocument({ title: "New chat" });
    document.goal = "Continue the work.";
    document.currentStatus = "Waiting for the next step.";
    await writeContextFile(path, document);
    assert.deepEqual(await readContextFile(path), document);
    assert.match(await readFile(path, "utf8"), /^---\n/);
    await assert.rejects(writeContextFile(path, document), { code: "EEXIST" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI initializes and validates files and gives useful missing-path errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "context-file-cli-"));
  const path = join(directory, "handoff.context");
  const cli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
  try {
    const init = spawnSync(process.execPath, [cli, "init", path, "--title", "CLI handoff"], { encoding: "utf8" });
    assert.equal(init.status, 0, init.stderr);

    const valid = spawnSync(process.execPath, [cli, "validate", path], { encoding: "utf8" });
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /Valid \.context file: CLI handoff/);

    const missing = spawnSync(process.execPath, [cli, "validate", join(directory, "missing.context")], { encoding: "utf8" });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /File not found/);

    const invalidPath = join(directory, "invalid.context");
    await writeFile(invalidPath, "not a handoff file", "utf8");
    const invalid = spawnSync(process.execPath, [cli, "validate", invalidPath], { encoding: "utf8" });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Missing YAML frontmatter/);

    const duplicate = spawnSync(process.execPath, [cli, "init", path], { encoding: "utf8" });
    assert.equal(duplicate.status, 1);
    assert.match(duplicate.stderr, /File already exists/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
