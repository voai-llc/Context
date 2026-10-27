import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

export const CONTEXT_FORMAT_VERSION = 1 as const;

export interface ContextFileReference {
  path: string;
  reason?: string;
}

export interface ContextDocument {
  formatVersion: typeof CONTEXT_FORMAT_VERSION;
  title: string;
  updatedAt: string;
  goal: string;
  currentStatus: string;
  completedWork: string[];
  decisions: string[];
  constraints: string[];
  relevantFiles: ContextFileReference[];
  nextSteps: string[];
}

export interface CreateContextOptions {
  title?: string;
  now?: Date;
}

export class ContextValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid .context document:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "ContextValidationError";
    this.issues = issues;
  }
}

const SECTION_TITLES = [
  "Goal",
  "Current status",
  "Completed work",
  "Decisions",
  "Constraints",
  "Relevant files",
  "Next steps",
] as const;

type SectionTitle = (typeof SECTION_TITLES)[number];

export function createContextDocument(options: CreateContextOptions = {}): ContextDocument {
  const now = options.now ?? new Date();
  return {
    formatVersion: CONTEXT_FORMAT_VERSION,
    title: options.title?.trim() || "Project handoff",
    updatedAt: now.toISOString().slice(0, 10),
    goal: "TODO: State the goal of the work.",
    currentStatus: "TODO: Describe the current state and what remains.",
    completedWork: [],
    decisions: [],
    constraints: [],
    relevantFiles: [],
    nextSteps: [],
  };
}

export function validateContextDocument(value: unknown): value is ContextDocument {
  const issues = getValidationIssues(value);
  if (issues.length > 0) throw new ContextValidationError(issues);
  return true;
}

export function parseContext(source: string): ContextDocument {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) {
    throw new ContextValidationError(["Missing YAML frontmatter delimited by --- lines."]);
  }

  let metadata: unknown;
  try {
    metadata = parseYaml(frontmatter[1] ?? "");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ContextValidationError([`Malformed YAML frontmatter: ${detail}`]);
  }

  const body = source.slice(frontmatter[0].length);
  const sections = parseSections(body);
  const metadataRecord = isRecord(metadata) ? metadata : {};
  const candidate: unknown = {
    ...metadataRecord,
    goal: sections.get("Goal"),
    currentStatus: sections.get("Current status"),
    completedWork: parseBulletList(sections.get("Completed work")),
    decisions: parseBulletList(sections.get("Decisions")),
    constraints: parseBulletList(sections.get("Constraints")),
    relevantFiles: parseReferences(sections.get("Relevant files")),
    nextSteps: parseBulletList(sections.get("Next steps")),
  };

  if (validateContextDocument(candidate)) return candidate;
  throw new ContextValidationError(["Document failed validation."]);
}

export function serializeContext(document: ContextDocument): string {
  validateContextDocument(document);
  const metadata = stringifyYaml({
    formatVersion: document.formatVersion,
    title: document.title,
    updatedAt: document.updatedAt,
  }).trimEnd();

  const sections: Record<SectionTitle, string> = {
    Goal: document.goal,
    "Current status": document.currentStatus,
    "Completed work": formatBulletList(document.completedWork),
    Decisions: formatBulletList(document.decisions),
    Constraints: formatBulletList(document.constraints),
    "Relevant files": formatReferences(document.relevantFiles),
    "Next steps": formatBulletList(document.nextSteps),
  };

  const body = SECTION_TITLES.map((title) => `## ${title}\n\n${sections[title] || "_None recorded._"}`).join("\n\n");
  return `---\n${metadata}\n---\n\n${body}\n`;
}

export async function readContextFile(path: string): Promise<ContextDocument> {
  return parseContext(await readFile(path, "utf8"));
}

export async function writeContextFile(path: string, document: ContextDocument): Promise<void> {
  const absolutePath = resolve(path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, serializeContext(document), { encoding: "utf8", flag: "wx" });
}

function getValidationIssues(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["Document must be an object."];

  if (value.formatVersion !== CONTEXT_FORMAT_VERSION) {
    issues.push(`formatVersion must be ${CONTEXT_FORMAT_VERSION}; received ${String(value.formatVersion)}.`);
  }
  for (const field of ["title", "updatedAt", "goal", "currentStatus"] as const) {
    if (typeof value[field] !== "string" || value[field].trim() === "") {
      issues.push(`${field} must be a non-empty string.`);
    }
  }
  if (typeof value.updatedAt === "string" && !isIsoDate(value.updatedAt)) {
    issues.push("updatedAt must use YYYY-MM-DD format.");
  }
  for (const field of ["completedWork", "decisions", "constraints", "nextSteps"] as const) {
    if (!isStringArray(value[field])) issues.push(`${field} must be an array of non-empty strings.`);
  }
  if (!Array.isArray(value.relevantFiles)) {
    issues.push("relevantFiles must be an array.");
  } else {
    value.relevantFiles.forEach((reference, index) => {
      if (!isRecord(reference) || typeof reference.path !== "string" || reference.path.trim() === "") {
        issues.push(`relevantFiles[${index}].path must be a non-empty string.`);
      } else if (reference.reason !== undefined && typeof reference.reason !== "string") {
        issues.push(`relevantFiles[${index}].reason must be a string when provided.`);
      }
    });
  }
  return issues;
}

function parseSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = body.split(/\r?\n/);
  let currentTitle: string | undefined;
  let currentLines: string[] = [];

  const save = (): void => {
    if (currentTitle !== undefined) {
      if (sections.has(currentTitle)) throw new ContextValidationError([`Duplicate section: ${currentTitle}.`]);
      sections.set(currentTitle, currentLines.join("\n").trim());
    }
  };

  for (const line of lines) {
    const heading = line.match(/^## (.+?)\s*$/);
    if (heading) {
      save();
      currentTitle = heading[1];
      currentLines = [];
    } else if (currentTitle !== undefined) {
      currentLines.push(line);
    } else if (line.trim() !== "") {
      throw new ContextValidationError(["Content must begin with a supported level-two section heading."]);
    }
  }
  save();

  for (const title of SECTION_TITLES) {
    if (!sections.has(title)) throw new ContextValidationError([`Missing section: ${title}.`]);
  }
  const unsupported = [...sections.keys()].filter((title) => !SECTION_TITLES.includes(title as SectionTitle));
  if (unsupported.length > 0) {
    throw new ContextValidationError([`Unsupported section: ${unsupported.join(", ")}.`]);
  }
  return sections;
}

function parseBulletList(section: string | undefined): string[] {
  const content = section?.trim() ?? "";
  if (!content || content === "_None recorded._") return [];
  return content.split(/\r?\n/).map((line, index) => {
    const item = line.match(/^\s*[-*]\s+(.+?)\s*$/);
    if (!item) throw new ContextValidationError([`Expected a bullet item on list line ${index + 1}.`]);
    return item[1] ?? "";
  });
}

function parseReferences(section: string | undefined): ContextFileReference[] {
  return parseBulletList(section).map((item) => {
    const reference = item.match(/^`([^`]+)`(?:\s+—\s+(.+))?$/);
    if (!reference) return { path: item };
    return reference[2] ? { path: reference[1]!, reason: reference[2] } : { path: reference[1]! };
  });
}

function formatBulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatReferences(references: ContextFileReference[]): string {
  return references.map(({ path, reason }) => `- \`${path}\`${reason ? ` — ${reason}` : ""}`).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim() !== "");
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
