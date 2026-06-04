export type TrustLevel = "trusted" | "untrusted" | "sensitive";

export interface TrustLabel {
  level: TrustLevel;
  source: string;
  reason: string;
  timestamp: number;
}
