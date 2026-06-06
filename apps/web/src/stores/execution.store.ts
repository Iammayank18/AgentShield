"use client";
import { create } from "zustand";
import type {
  AgentEvent,
  AgentExecution,
  ExecutionStep,
  ToolCall,
  SecurityViolation,
} from "@agent-shield/shared-types";

export type StreamStatus = "idle" | "connecting" | "streaming" | "completed" | "error";

interface ExecutionStore {
  currentExecution: AgentExecution | null;
  steps: ExecutionStep[];
  violations: SecurityViolation[];
  toolCalls: ToolCall[];
  streamStatus: StreamStatus;
  shieldEnabled: boolean;
  useAttackScenario: boolean;
  customInput: string;
  eventLog: AgentEvent[];
  executionId: string | null;

  startExecution: (executionId: string) => void;
  processEvent: (event: AgentEvent) => void;
  toggleShield: () => void;
  toggleAttackScenario: () => void;
  setCustomInput: (input: string) => void;
  setStreamStatus: (status: StreamStatus) => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  currentExecution: null,
  steps: [],
  violations: [],
  toolCalls: [],
  streamStatus: "idle",
  shieldEnabled: true,
  useAttackScenario: false,
  customInput: "",
  eventLog: [],
  executionId: null,

  startExecution: (executionId) =>
    set({ executionId, streamStatus: "connecting", steps: [], violations: [], toolCalls: [], eventLog: [] }),

  processEvent: (event) =>
    set((state) => {
      const eventLog = [...state.eventLog, event];

      switch (event.type) {
        case "execution_started": {
          const { execution } = event.payload as { execution: AgentExecution };
          return { eventLog, currentExecution: execution, streamStatus: "streaming" };
        }
        case "step_added": {
          const { step } = event.payload as { step: ExecutionStep };
          return { eventLog, steps: [...state.steps, step] };
        }
        case "tool_call_attempted": {
          const { toolCall } = event.payload as { toolCall: ToolCall };
          return { eventLog, toolCalls: [...state.toolCalls, toolCall] };
        }
        case "tool_call_blocked":
        case "tool_call_approved": {
          const { toolCall } = event.payload as { toolCall: ToolCall };
          return {
            eventLog,
            toolCalls: state.toolCalls.map((tc) => (tc.id === toolCall.id ? toolCall : tc)),
          };
        }
        case "violation_detected": {
          const { violation } = event.payload as { violation: SecurityViolation };
          return { eventLog, violations: [...state.violations, violation] };
        }
        case "identity_spoofing_detected": {
          const payload = event.payload as { claimedSource: string; callerId?: string; reason: string; messageId: string };
          const spoofingViolation: SecurityViolation = {
            id: payload.messageId,
            executionId: event.executionId,
            type: "identity_spoofing",
            severity: "critical",
            description: payload.reason,
            taintChain: [],
            timestamp: event.timestamp,
          };
          return { eventLog, violations: [...state.violations, spoofingViolation] };
        }
        case "execution_completed": {
          const { execution } = event.payload as { execution: AgentExecution };
          // Merge: keep SSE-accumulated violations since state.violations in agent is never populated
          const merged = [
            ...state.violations,
            ...execution.violations.filter((v) => !state.violations.some((sv) => sv.id === v.id)),
          ];
          return {
            eventLog,
            currentExecution: execution,
            steps: execution.steps,
            violations: merged,
            streamStatus: "completed",
          };
        }
        default:
          return { eventLog };
      }
    }),

  toggleShield: () => set((s) => ({ shieldEnabled: !s.shieldEnabled })),
  toggleAttackScenario: () => set((s) => ({ useAttackScenario: !s.useAttackScenario })),
  setCustomInput: (customInput) => set({ customInput }),
  setStreamStatus: (streamStatus) => set({ streamStatus }),

  resetExecution: () =>
    set({
      currentExecution: null,
      steps: [],
      violations: [],
      toolCalls: [],
      streamStatus: "idle",
      eventLog: [],
      executionId: null,
    }),
}));
