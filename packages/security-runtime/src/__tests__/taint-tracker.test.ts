import { describe, it, expect, beforeEach } from "vitest";
import { TaintTracker } from "../taint-tracker";

describe("TaintTracker", () => {
  let tracker: TaintTracker;

  beforeEach(() => {
    tracker = new TaintTracker();
  });

  it("labels trusted message from trusted source", () => {
    const msg = tracker.labelMessage("1", "hello", "internal_db");
    expect(msg.trustLevel).toBe("trusted");
    expect(tracker.isTainted("1")).toBe(false);
  });

  it("labels untrusted message from web_content", () => {
    const msg = tracker.labelMessage("1", "content", "web_content");
    expect(msg.trustLevel).toBe("untrusted");
    expect(tracker.isTainted("1")).toBe(true);
  });

  it("labels sensitive message from secret_manager", () => {
    const msg = tracker.labelMessage("1", "secret", "secret_manager");
    expect(msg.trustLevel).toBe("sensitive");
    expect(tracker.isTainted("1")).toBe(true);
  });

  it("unknown sources default to untrusted (fail-secure)", () => {
    const msg = tracker.labelMessage("1", "data", "unknown_exotic_source");
    expect(msg.trustLevel).toBe("untrusted");
  });

  it("trusted child stays trusted when all parents are trusted", () => {
    const parent = tracker.labelMessage("p1", "safe", "internal_db");
    const child = tracker.labelMessage("c1", "derived", "internal_db");
    const propagated = tracker.propagateTaint(child, [parent]);
    expect(propagated.trustLevel).toBe("trusted");
    expect(tracker.isTainted("c1")).toBe(false);
  });

  it("child becomes untrusted when any parent is untrusted", () => {
    const trusted = tracker.labelMessage("p1", "safe", "internal_db");
    const untrusted = tracker.labelMessage("p2", "evil", "user_input");
    const child = tracker.labelMessage("c1", "plan", "internal_db");
    const propagated = tracker.propagateTaint(child, [trusted, untrusted]);
    expect(propagated.trustLevel).toBe("untrusted");
    expect(tracker.isTainted("c1")).toBe(true);
  });

  it("child becomes sensitive when parent is sensitive", () => {
    const sensitive = tracker.labelMessage("p1", "secret", "secret_manager");
    const child = tracker.labelMessage("c1", "derived", "internal_db");
    const propagated = tracker.propagateTaint(child, [sensitive]);
    expect(propagated.trustLevel).toBe("sensitive");
  });

  it("untrusted beats sensitive in taint chain (injection precedence)", () => {
    const sensitive = tracker.labelMessage("p1", "secret", "secret_manager");
    const untrusted = tracker.labelMessage("p2", "evil", "user_input");
    const child = tracker.labelMessage("c1", "derived", "internal_db");
    const propagated = tracker.propagateTaint(child, [sensitive, untrusted]);
    expect(propagated.trustLevel).toBe("untrusted");
  });

  it("getTaintChain returns all tainted ancestor IDs", () => {
    const parent = tracker.labelMessage("p1", "evil", "user_input");
    const child = tracker.labelMessage("c1", "plan", "internal_db");
    tracker.propagateTaint(child, [parent]);
    const chain = tracker.getTaintChain("c1");
    expect(chain).toContain("p1");
  });

  it("getTaintChain returns empty for clean messages", () => {
    tracker.labelMessage("m1", "clean", "internal_db");
    expect(tracker.getTaintChain("m1")).toHaveLength(0);
  });
});
