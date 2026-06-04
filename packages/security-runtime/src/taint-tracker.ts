import type { TrustLevel, SecureMessage } from "@agent-shield/shared-types";
import { TrustClassifier } from "./trust-classifier";

const TRUST_PRIORITY: Record<TrustLevel, number> = {
  trusted: 0,
  sensitive: 1,
  untrusted: 2,
};

function worstTrust(a: TrustLevel, b: TrustLevel): TrustLevel {
  return TRUST_PRIORITY[a] >= TRUST_PRIORITY[b] ? a : b;
}

export class TaintTracker {
  private taintGraph = new Map<string, Set<string>>();
  private classifier = new TrustClassifier();

  labelMessage(
    id: string,
    content: string,
    source: string,
    parentIds?: string[],
  ): SecureMessage {
    const trustLevel = this.classifier.classify(source);
    const message: SecureMessage = {
      id,
      content,
      trustLevel,
      source,
      timestamp: Date.now(),
      parentIds,
    };
    this.taintGraph.set(id, new Set());
    if (trustLevel !== "trusted") {
      this.taintGraph.get(id)!.add(id);
    }
    return message;
  }

  propagateTaint(child: SecureMessage, parents: SecureMessage[]): SecureMessage {
    if (!this.taintGraph.has(child.id)) {
      this.taintGraph.set(child.id, new Set());
    }

    const childTaints = this.taintGraph.get(child.id)!;
    let effectiveTrust = child.trustLevel;

    for (const parent of parents) {
      const parentTaints = this.taintGraph.get(parent.id);
      if (parentTaints) {
        for (const taintId of parentTaints) {
          childTaints.add(taintId);
        }
      }
      if (parent.trustLevel !== "trusted") {
        childTaints.add(parent.id);
        effectiveTrust = worstTrust(effectiveTrust, parent.trustLevel);
      }
    }

    return { ...child, trustLevel: effectiveTrust, parentIds: parents.map((p) => p.id) };
  }

  getTaintChain(messageId: string): string[] {
    return Array.from(this.taintGraph.get(messageId) ?? []);
  }

  isTainted(messageId: string): boolean {
    const taints = this.taintGraph.get(messageId);
    return taints !== undefined && taints.size > 0;
  }

  clear(): void {
    this.taintGraph.clear();
  }
}
