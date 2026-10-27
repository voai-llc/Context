# context-file

`context-file` creates and validates portable `.context` handoff files for coding-agent chats. Save a concise snapshot of the project goal, current state, decisions, and next steps, then give the file to a new chat so it can continue the work.

The format is readable Markdown with YAML frontmatter. It stores project state rather than a transcript. Keep credentials and other secrets out of handoff files.

## Install

```sh
npm install context-file
```

Requires Node.js 22 or newer.

## CLI

Initialize a starter file in your project:

```sh
npx context-file init .context --title "Project handoff"
```

Ask the current agent to fill in the handoff using [the save prompt](./PROMPTS.md#save-a-handoff), or edit it yourself. Then validate it:

```sh
npx context-file validate .context
```

In a new chat, ask the agent to read `.context`, inspect the current repository, reconcile the notes with the code, and continue from the listed next steps. See [the resume prompt](./PROMPTS.md#resume-from-a-handoff).

`init` does not overwrite an existing file. `validate` exits with status 1 and a readable error when the file is malformed or invalid.

## File format

The first format version contains YAML metadata and these Markdown sections:

- Goal
- Current status
- Completed work
- Decisions
- Constraints
- Relevant files
- Next steps

Example:

```markdown
---
formatVersion: 1
title: Search improvements
updatedAt: 2026-10-27
---

## Goal

Improve search relevance for product names.

## Current status

Ranking changes are implemented; no tests have run yet.

## Completed work

- Added normalized token matching.

## Decisions

- Keep the existing API response shape.

## Constraints

- Avoid adding a runtime database dependency.

## Relevant files

- `src/search.ts` — ranking implementation

## Next steps

- Run the search test suite.
```

## TypeScript API

```ts
import {
  createContextDocument,
  parseContext,
  readContextFile,
  serializeContext,
  validateContextDocument,
  writeContextFile,
} from "context-file";

const handoff = createContextDocument({ title: "Search improvements" });
handoff.goal = "Improve search relevance for product names.";
handoff.currentStatus = "Ranking changes are implemented.";
handoff.nextSteps = ["Run the search test suite."];

const markdown = serializeContext(handoff);
const parsed = parseContext(markdown);
validateContextDocument(parsed);

await writeContextFile(".context", handoff);
const loaded = await readContextFile(".context");
```

`writeContextFile` creates parent directories and refuses to overwrite an existing file. `validateContextDocument` throws `ContextValidationError` with an `issues` array if validation fails.

## Development

```sh
npm install
npm test
npm pack --dry-run
```

The package is prepared for NPM publication as `context-file`; check that the package name is available and configure NPM publishing credentials before release.
