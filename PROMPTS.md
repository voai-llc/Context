# Reusable agent prompts

## Save a handoff

Create or update a `.context` handoff file in this project for a fresh coding-agent chat. Follow the `context-file` format and validate the result with `context-file validate <path>` if the CLI is installed. Summarize the goal, current status, completed work, decisions, constraints, relevant project-relative file paths, and concrete next steps. Keep the file self-contained and concise. Do not copy the full transcript or include secrets. Inspect the repository before describing its state, and do not overwrite an existing handoff without first reading it.

## Resume from a handoff

Read the specified `.context` file first. Then inspect the current repository and relevant files before acting. Treat the saved notes as a handoff, not guaranteed current truth: reconcile them with the code and call out meaningful differences. Continue with the listed next steps and preserve the recorded decisions and constraints. Ask only if a real ambiguity blocks progress. Do not repeat or request secrets.
