import type { Policy, SecurityContext, PolicyResult } from "@agent-shield/shared-types";

export class NoPrivilegeEscalationPolicy implements Policy {
  id = "no-privilege-escalation";
  name = "No Privilege Escalation from Untrusted Context";
  description =
    "Prevents privileged tools from executing when the agent context is tainted by untrusted sources.";

  evaluate(context: SecurityContext): PolicyResult {
    const timestamp = Date.now();

    if (!context.tool.privileged) {
      return {
        decision: "allow",
        reason: "Tool is not privileged — policy does not apply",
        policyId: this.id,
        timestamp,
      };
    }

    if (context.taintChain.length > 0) {
      return {
        decision: "deny",
        reason: `Privileged tool '${context.tool.name}' blocked: execution context is tainted by ${context.taintChain.length} untrusted source(s): [${context.taintChain.join(", ")}]`,
        policyId: this.id,
        timestamp,
      };
    }

    if (context.message.trustLevel === "untrusted") {
      return {
        decision: "deny",
        reason: `Privileged tool '${context.tool.name}' blocked: context trust level is 'untrusted'`,
        policyId: this.id,
        timestamp,
      };
    }

    return {
      decision: "allow",
      reason: "Trust level permits privileged execution",
      policyId: this.id,
      timestamp,
    };
  }
}
