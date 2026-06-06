import type { SecureTool } from "@agent-shield/shared-types";

export const FETCH_WEB_CONTENT: SecureTool = {
  id: "fetch_web_content",
  name: "Fetch KB Article",
  description: "Fetches a knowledge base article, policy document, or order page by URL. Read-only.",
  privileged: false,
  allowedTrustLevels: ["trusted", "untrusted", "sensitive"],
  parameters: [
    { name: "url", type: "string", description: "URL to fetch", required: true },
  ],
};

export const SEND_MESSAGE: SecureTool = {
  id: "send_message",
  name: "Reply to Customer",
  description: "Sends a reply to the customer via the ticketing system. Privileged — writes customer-facing response.",
  privileged: true,
  allowedTrustLevels: ["trusted"],
  parameters: [
    { name: "recipient", type: "string", description: "Customer email or ticket ID", required: true },
    { name: "body", type: "string", description: "Reply message body", required: true },
  ],
};

export const SECRET_READ_FILE: SecureTool = {
  id: "read_secret_file",
  name: "Read Customer Account",
  description: "Reads sensitive customer PII and account data from the CRM. Privileged — strictly audited.",
  privileged: true,
  allowedTrustLevels: [],
  parameters: [
    { name: "path", type: "string", description: "Account ID or customer identifier", required: true },
  ],
};

export const KNOWLEDGE_SEARCH: SecureTool = {
  id: "knowledge_search",
  name: "Search Internal Docs",
  description: "Searches the internal support knowledge base for solutions, policies, and procedures. Read-only.",
  privileged: false,
  allowedTrustLevels: ["trusted", "untrusted", "sensitive"],
  parameters: [
    { name: "query", type: "string", description: "Search query", required: true },
  ],
};

export const ALL_TOOLS: SecureTool[] = [
  FETCH_WEB_CONTENT,
  SEND_MESSAGE,
  SECRET_READ_FILE,
  KNOWLEDGE_SEARCH,
];
