import type { SecureTool } from "@agent-shield/shared-types";

export const GITHUB_READ_ISSUE: SecureTool = {
  id: "github_read_issue",
  name: "Read GitHub Issue",
  description: "Reads the content of a GitHub issue by number.",
  privileged: false,
  allowedTrustLevels: ["trusted", "untrusted", "sensitive"],
  parameters: [
    { name: "issueNumber", type: "number", description: "GitHub issue number", required: true },
  ],
};

export const GITHUB_POST_COMMENT: SecureTool = {
  id: "github_post_comment",
  name: "Post GitHub Comment",
  description: "Posts a comment on a GitHub issue. Privileged — writes to external system.",
  privileged: true,
  allowedTrustLevels: ["trusted"],
  parameters: [
    { name: "issueNumber", type: "number", description: "GitHub issue number", required: true },
    { name: "body", type: "string", description: "Comment body", required: true },
  ],
};

export const SECRET_READ_FILE: SecureTool = {
  id: "read_secret_file",
  name: "Read Secret File",
  description: "Reads a secret file from the filesystem. Privileged — never allowed via untrusted context.",
  privileged: true,
  allowedTrustLevels: [],
  parameters: [
    { name: "path", type: "string", description: "File path", required: true },
  ],
};

export const INTERNAL_DOCS_SEARCH: SecureTool = {
  id: "internal_docs_search",
  name: "Search Internal Docs",
  description: "Searches internal documentation. Trusted source only.",
  privileged: false,
  allowedTrustLevels: ["trusted", "untrusted", "sensitive"],
  parameters: [
    { name: "query", type: "string", description: "Search query", required: true },
  ],
};

export const ALL_TOOLS: SecureTool[] = [
  GITHUB_READ_ISSUE,
  GITHUB_POST_COMMENT,
  SECRET_READ_FILE,
  INTERNAL_DOCS_SEARCH,
];
