import type { TrustLevel } from "@agent-shield/shared-types";

const SOURCE_TRUST_MAP: Record<string, TrustLevel> = {
  user_input: "untrusted",
  web_content: "untrusted",
  external_message: "untrusted",
  web_retrieval: "untrusted",
  external_api: "untrusted",
  internal_db: "trusted",
  internal_api: "trusted",
  agent_memory: "trusted",
  system_prompt: "trusted",
  secret_manager: "sensitive",
  env_file: "sensitive",
  credentials: "sensitive",
};

export class TrustClassifier {
  classify(source: string): TrustLevel {
    const normalized = source.toLowerCase().trim();
    return SOURCE_TRUST_MAP[normalized] ?? "untrusted";
  }

  isKnownSource(source: string): boolean {
    return source.toLowerCase().trim() in SOURCE_TRUST_MAP;
  }
}
