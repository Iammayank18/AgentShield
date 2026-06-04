import type { Policy, SecurityContext, PolicyResult } from "@agent-shield/shared-types";

const EXFILTRATION_TOOLS = new Set([
  "github_post_comment",
  "send_email",
  "post_webhook",
  "write_external_api",
  "post_slack_message",
]);

export class NoSecretExfiltrationPolicy implements Policy {
  id = "no-secret-exfiltration";
  name = "No Sensitive Data Exfiltration";
  description = "Prevents sensitive data from being sent to external destinations.";

  evaluate(context: SecurityContext): PolicyResult {
    const timestamp = Date.now();

    if (context.message.trustLevel !== "sensitive") {
      return {
        decision: "allow",
        reason: "No sensitive data in context",
        policyId: this.id,
        timestamp,
      };
    }

    if (EXFILTRATION_TOOLS.has(context.tool.id)) {
      return {
        decision: "deny",
        reason: `Sensitive data must not be sent to external destination via '${context.tool.name}'`,
        policyId: this.id,
        timestamp,
      };
    }

    return {
      decision: "allow",
      reason: "Tool is not an exfiltration target",
      policyId: this.id,
      timestamp,
    };
  }
}
