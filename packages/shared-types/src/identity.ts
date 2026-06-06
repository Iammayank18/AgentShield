export interface AgentIdentity {
  id: string;
  name: string;
  allowedSources: string[];
}

export interface IdentityVerificationResult {
  verified: boolean;
  spoofingDetected: boolean;
  claimedSource: string;
  callerId?: string;
  reason: string;
}
