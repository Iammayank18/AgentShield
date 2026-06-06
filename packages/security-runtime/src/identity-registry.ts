import type { AgentIdentity, IdentityVerificationResult } from "@agent-shield/shared-types";

// Sources that are inherently external — no caller verification needed
const EXTERNAL_SOURCES = new Set([
  "user_input",
  "web_content",
  "web_retrieval",
  "external_message",
  "external_api",
]);

export class AgentIdentityRegistry {
  private identities = new Map<string, AgentIdentity>();

  constructor() {
    this.register({ id: "input-processor", name: "Input Processor Node", allowedSources: ["user_input"] });
    this.register({ id: "issue-retriever", name: "Issue Retriever Node", allowedSources: ["web_content", "web_retrieval"] });
    this.register({ id: "planner", name: "Planner Node", allowedSources: ["internal_db"] });
    this.register({ id: "tool-executor", name: "Tool Executor Node", allowedSources: ["internal_api", "internal_db"] });
    this.register({ id: "responder", name: "Responder Node", allowedSources: ["internal_db"] });
    this.register({ id: "system", name: "System", allowedSources: ["system_prompt", "agent_memory"] });
  }

  register(identity: AgentIdentity): void {
    this.identities.set(identity.id, identity);
  }

  verify(claimedSource: string, callerId?: string): IdentityVerificationResult {
    const normalized = claimedSource.toLowerCase().trim();

    // External sources are always legitimate — no identity check needed
    if (EXTERNAL_SOURCES.has(normalized)) {
      return {
        verified: true,
        spoofingDetected: false,
        claimedSource,
        callerId,
        reason: "External source — no identity verification required",
      };
    }

    // Sensitive sources require a registered, authorized caller
    if (!callerId) {
      return {
        verified: false,
        spoofingDetected: true,
        claimedSource,
        callerId,
        reason: `Claimed trusted source '${claimedSource}' without a caller identity — identity spoofing detected`,
      };
    }

    const identity = this.identities.get(callerId);
    if (!identity) {
      return {
        verified: false,
        spoofingDetected: true,
        claimedSource,
        callerId,
        reason: `Unknown caller '${callerId}' claiming trusted source '${claimedSource}' — identity spoofing detected`,
      };
    }

    if (!identity.allowedSources.includes(normalized)) {
      return {
        verified: false,
        spoofingDetected: true,
        claimedSource,
        callerId,
        reason: `'${identity.name}' (${callerId}) is not authorized to claim source '${claimedSource}' — identity spoofing detected`,
      };
    }

    return {
      verified: true,
      spoofingDetected: false,
      claimedSource,
      callerId,
      reason: `Verified: '${identity.name}' is authorized to use source '${claimedSource}'`,
    };
  }
}
