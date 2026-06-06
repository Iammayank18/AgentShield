import { describe, it, expect } from "vitest";
import { NoPrivilegeEscalationPolicy } from "../policies/no-privilege-escalation.policy";
import type { SecurityContext } from "@agent-shield/shared-types";

const trustedMessage = {
  id: "msg-1",
  content: "safe",
  trustLevel: "trusted" as const,
  source: "internal_db",
  timestamp: Date.now(),
};

const untrustedMessage = {
  id: "msg-2",
  content: "inject",
  trustLevel: "untrusted" as const,
  source: "user_input",
  timestamp: Date.now(),
};

const privilegedTool = {
  id: "github_post_comment",
  name: "Post GitHub Comment",
  description: "Posts a comment",
  privileged: true,
  allowedTrustLevels: ["trusted" as const],
  parameters: [],
};

const nonPrivilegedTool = {
  id: "github_read_issue",
  name: "Read GitHub Issue",
  description: "Reads an issue",
  privileged: false,
  allowedTrustLevels: ["trusted" as const, "untrusted" as const, "sensitive" as const],
  parameters: [],
};

describe("NoPrivilegeEscalationPolicy", () => {
  const policy = new NoPrivilegeEscalationPolicy();

  it("allows non-privileged tool regardless of trust level", () => {
    const ctx: SecurityContext = {
      message: untrustedMessage,
      tool: nonPrivilegedTool,
      taintChain: ["msg-2"],
      executionId: "exec-1",
    };
    expect(policy.evaluate(ctx).decision).toBe("allow");
  });

  it("allows privileged tool from trusted context with empty taint chain", () => {
    const ctx: SecurityContext = {
      message: trustedMessage,
      tool: privilegedTool,
      taintChain: [],
      executionId: "exec-1",
    };
    expect(policy.evaluate(ctx).decision).toBe("allow");
  });

  it("denies privileged tool from untrusted context", () => {
    const ctx: SecurityContext = {
      message: untrustedMessage,
      tool: privilegedTool,
      taintChain: [],
      executionId: "exec-1",
    };
    expect(policy.evaluate(ctx).decision).toBe("deny");
  });

  it("denies privileged tool when taint chain is non-empty even if immediate level is trusted", () => {
    const ctx: SecurityContext = {
      message: trustedMessage,
      tool: privilegedTool,
      taintChain: ["some-untrusted-ancestor-id"],
      executionId: "exec-1",
    };
    expect(policy.evaluate(ctx).decision).toBe("deny");
  });

  it("deny reason mentions tainted source count", () => {
    const ctx: SecurityContext = {
      message: trustedMessage,
      tool: privilegedTool,
      taintChain: ["id-1", "id-2"],
      executionId: "exec-1",
    };
    const result = policy.evaluate(ctx);
    expect(result.reason).toContain("2 untrusted source");
  });
});
