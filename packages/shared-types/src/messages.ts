import type { TrustLevel } from "./trust";

export interface SecureMessage {
  id: string;
  content: string;
  trustLevel: TrustLevel;
  source: string;
  timestamp: number;
  parentIds?: string[];
  metadata?: Record<string, unknown>;
}
