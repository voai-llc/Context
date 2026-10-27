 <div align="center">

<img src="https://i.ibb.co/fY6FwRzn/Pixel-Art-CONTEXT-Wordmark.png" alt="CONTEXT Pixel Art Logo" width="520" />

# context-file

**Your AI's memory, beyond the chat.**

A lightweight, portable handoff format that lets coding agents pick up exactly where the last conversation left off.

[![npm version](https://img.shields.io/npm/v/context-file?style=flat-square&color=white&label=npm)](https://www.npmjs.com/package/context-file)
[![npm downloads](https://img.shields.io/npm/dm/context-file?style=flat-square&color=white)](https://www.npmjs.com/package/context-file)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Getting Started](#-getting-started) · [How It Works](#-how-it-works) · [CLI](#-command-line-interface) · [File Format](#-the-context-format) · [API](#-typescript-api)

</div>

---

## The problem

AI coding agents are powerful, but conversations aren't infinite.

As a project grows, your chat fills up with code, debugging, architectural decisions, and implementation details. Eventually, you need to start a new conversation.

And suddenly, your new agent has no idea what happened before.

You find yourself explaining everything again:

- What you're building.
- Which features are already implemented.
- Why certain decisions were made.
- What files were modified.
- What still needs to be done.

**Your project shouldn't lose its progress just because your chat ran out of context.**

## The solution

**`context-file` gives your coding agent a portable project memory.**

Instead of carrying an entire conversation into a new chat, save the important information into a single `.context` file.

The file captures your project's current state, decisions, constraints, and next steps in a structured, human-readable format.

When you start a new conversation, give the new agent that file.

It can inspect the repository, understand the handoff, and continue the work without reconstructing the entire previous conversation.

> **One file. Any chat. Continue building.**

---

## ✦ How it works

```text
┌──────────────────────────────┐
│       AI Conversation 1      │
│                              │
│  Build → Debug → Improve     │
│                              │
│  Project progress saved      │
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────┐
       │   .context    │
       │               │
       │  Goal         │
       │  Progress     │
       │  Decisions    │
       │  Constraints  │
       │  Files        │
       │  Next steps   │
       └───────┬───────┘
               │
               ▼
┌──────────────────────────────┐
│       AI Conversation 2      │
│                              │
│  Read .context               │
│       ↓                      │
│  Inspect repository          │
│       ↓                      │
│  Verify current state        │
│       ↓                      │
│  Continue development        │
└──────────────────────────────┘
```

No transcript copying. No massive prompts. No starting from scratch.

Just the information that matters.

---

## ✦ Features

| Feature | Description |
|---|---|
| **Portable handoffs** | Move project context between coding-agent conversations. |
| **Human-readable** | Plain Markdown with YAML frontmatter. |
| **Structured memory** | Preserve goals, progress, decisions, and next steps. |
| **Agent-friendly** | Designed to be read and written by AI coding agents. |
| **Built-in validation** | Catch malformed or incomplete handoff documents. |
| **CLI support** | Initialize and validate files from your terminal. |
| **TypeScript API** | Integrate context files directly into JavaScript and TypeScript tools. |
| **Lightweight format** | Store project state without copying entire conversations. |
| **Safe file creation** | Prevent accidental overwriting of existing context files. |

---

## ✦ Getting started

### 1. Install the package

Install `context-file` using npm:

```bash
npm install context-file
```

**Requirements:** Node.js 22 or newer.

You can also run the CLI directly using `npx`, without adding it as a project dependency.

### 2. Initialize your context file

From your project directory, run:

```bash
npx context-file init .context --title "My Project"
```

This creates a starter `.context` file with the sections needed for a project handoff.

The command will not overwrite an existing file.

### 3. Save your progress

When you're ready to switch conversations, ask your current coding agent:

> Read the current repository and create or update my `.context` handoff file. Summarize the project goal, current implementation, completed work, architectural decisions, constraints, relevant files, and actionable next steps. Keep it concise and accurate. Do not include secrets or copy the full conversation.

For the complete instructions, see [Save a handoff](./PROMPTS.md#save-a-handoff).

### 4. Validate your file

```bash
npx context-file validate .context
```

The validator checks the document's structure and content.

If validation fails, it displays a readable error and exits with status `1`.

### 5. Continue in a new conversation

Start a fresh coding-agent conversation and provide the `.context` file.

Then use this prompt:

> Read `.context` to understand the previous development session. Inspect the repository to verify the current implementation, reconcile any differences between the handoff and the code, and continue from the documented next steps. Preserve existing decisions and constraints unless there's a clear reason to change them.

That's it. Your next agent now has a structured starting point.

See [Resume from a handoff](./PROMPTS.md#resume-from-a-handoff) for the full prompt.

---

## ✦ Command-line interface

`context-file` includes a simple CLI for managing handoff documents.

### Initialize

Create a new context file:

```bash
npx context-file init .context --title "Project handoff"
```

This generates a starter document that your agent can fill in.

### Validate

Check an existing context file:

```bash
npx context-file validate .context
```

**Validation behavior:**

- Reports malformed or invalid documents.
- Provides readable error messages.
- Exits with status `1` when validation fails.

### Recommended workflow

```bash
# Create a starter file
npx context-file init .context --title "My App"

# Ask your coding agent to populate the file

# Validate the completed handoff
npx context-file validate .context
```

---

## ✦ The `.context` format

A `.context` file is simply **Markdown with YAML frontmatter**.

It's readable by humans, understandable by AI agents, and easy to store alongside your source code.

### Example

```markdown
---
formatVersion: 1
title: Search improvements
updatedAt: 2026-10-27
---

## Goal

Improve search relevance for product names.

## Current status

Ranking changes are implemented, but tests have not
been executed yet.

## Completed work

- Added normalized token matching.
- Updated the ranking implementation.
- Preserved the existing API response structure.

## Decisions

- Keep the existing API response shape.
- Prefer lightweight ranking improvements.

## Constraints

- Avoid adding a runtime database dependency.
- Maintain compatibility with existing consumers.

## Relevant files

- `src/search.ts` — ranking implementation
- `src/search.test.ts` — search tests

## Next steps

- Run the search test suite.
- Verify ranking behavior with edge cases.
- Fix any regressions.
```

### Document structure

| Section | Purpose |
|---|---|
| `Goal` | What the project or current task is trying to achieve. |
| `Current status` | Where development currently stands. |
| `Completed work` | What has already been implemented. |
| `Decisions` | Important technical or architectural choices. |
| `Constraints` | Requirements and limitations that must be respected. |
| `Relevant files` | Important repository paths and their responsibilities. |
| `Next steps` | Specific actions for the next development session. |

### Why Markdown?

Because context should be accessible, not locked behind a proprietary format.

A `.context` file can be:

- Read directly by coding agents.
- Opened in any text editor.
- Reviewed through Git.
- Shared between development environments.
- Updated without specialized software.

The format is intentionally simple.

---

## ✦ TypeScript API

Want to integrate context handoffs into your own tools or coding agents?

`context-file` provides a programmatic API for creating, parsing, validating, serializing, reading, and writing context documents.

### Create a context document

```ts
import {
  createContextDocument,
  writeContextFile,
} from "context-file";

const handoff = createContextDocument({
  title: "Search improvements",
});

handoff.goal = "Improve search relevance for product names.";

handoff.currentStatus = "Ranking changes are implemented.";

handoff.nextSteps = [
  "Run the search test suite.",
  "Verify ranking edge cases.",
  "Fix any regressions.",
];

await writeContextFile(".context", handoff);
```

### Parse and validate

```ts
import {
  parseContext,
  validateContextDocument,
} from "context-file";

const markdown = `
---
formatVersion: 1
title: My Project
updatedAt: 2026-10-27
---

## Goal

Build a better search experience.

## Current status

Initial implementation completed.

## Completed work

- Implemented search indexing.

## Decisions

- Keep the existing API.

## Constraints

- No additional database dependencies.

## Relevant files

- \`src/search.ts\`

## Next steps

- Add integration tests.
`;

const document = parseContext(markdown);

validateContextDocument(document);
```

### Read an existing handoff

```ts
import { readContextFile } from "context-file";

const context = await readContextFile(".context");

console.log(context.goal);
console.log(context.currentStatus);
console.log(context.nextSteps);
```

### Serialize a document

```ts
import {
  createContextDocument,
  serializeContext,
} from "context-file";

const context = createContextDocument({
  title: "My Project",
});

const markdown = serializeContext(context);

console.log(markdown);
```

### Handle validation errors

Validation failures throw `ContextValidationError`, which includes an `issues` array describing the problems.

```ts
import {
  ContextValidationError,
  validateContextDocument,
} from "context-file";

try {
  validateContextDocument(document);
} catch (error) {
  if (error instanceof ContextValidationError) {
    console.error(error.issues);
  } else {
    throw error;
  }
}
```

**File safety:** `writeContextFile` creates missing parent directories and refuses to overwrite an existing file.

---

## ✦ Best practices

A good handoff should be concise, actionable, and grounded in the actual project.

**Do:**

- Describe the current implementation accurately.
- Include important architectural decisions.
- Reference relevant repository files.
- Document unresolved issues and blockers.
- Write clear, actionable next steps.
- Validate the file before using it.

**Avoid:**

- Copying the entire conversation.
- Including irrelevant debugging history.
- Saving API keys, passwords, tokens, or other secrets.
- Recording assumptions as verified facts.
- Treating an outdated handoff as more authoritative than the repository.

> **Important:** A `.context` file is a snapshot, not a replacement for your source code. Agents should inspect the repository and verify the handoff before making changes.

---

## ✦ Who is this for?

**AI-assisted developers**

Continue long coding sessions without repeatedly explaining your project.

**Coding-agent builders**

Add a structured handoff mechanism to your own agent workflows.

**Open-source maintainers**

Document development state in a format that's easy for humans and AI tools to read.

**Multi-session projects**

Keep important context available when moving between conversations or development sessions.

---

## ✦ Development

Want to work on the package locally?

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Inspect the npm package contents:

```bash
npm pack --dry-run
```

### Publishing

The package is prepared for publication under the name `context-file`.

Before publishing, verify that the package name is available on npm and configure your npm publishing credentials.

---

## ✦ Philosophy

**AI conversations are temporary. Your project's knowledge shouldn't be.**

`context-file` is built around a simple idea:

An AI agent doesn't need to remember every message you've ever sent. It needs to understand what you're building, what has already been done, why decisions were made, and what should happen next.

That's the purpose of `.context`.

Not to store everything.

**To preserve what matters.**

---

<div align="center">

### Stop restarting. Start continuing.

**Build more. Explain less. Keep your context.**

```bash
npx context-file init .context --title "My Project"
```

Made for developers building with AI.

</div>
