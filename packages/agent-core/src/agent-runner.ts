import { v4 as uuidv4 } from "uuid";
import { TaintTracker, IFCEngine, SecurityEventEmitter } from "@agent-shield/security-runtime";
import {
  PolicyEvaluator,
  NoPrivilegeEscalationPolicy,
  NoSecretExfiltrationPolicy,
  ToolGovernancePolicy,
} from "@agent-shield/policy-engine";
import { ToolGateway, ToolExecutor } from "@agent-shield/tool-registry";
import type { AgentEvent } from "@agent-shield/shared-types";
import { buildGitHubSupportAgent } from "./agent/github-support-agent";
import { createInitialState } from "./agent/state";

export interface RunOptions {
  input?: string;
  mode: "protected" | "unprotected";
  useAttackScenario: boolean;
  sessionId?: string;
}

export interface RunResult {
  executionId: string;
  events: AgentEvent[];
  output: string;
  isBlocked: boolean;
}

export class AgentRunner {
  private eventEmitter: SecurityEventEmitter;
  private ifcEngine: IFCEngine;
  private policyEvaluator: PolicyEvaluator;
  private toolGateway: ToolGateway;
  private llm?: import("@langchain/openai").AzureChatOpenAI;

  constructor() {
    this.eventEmitter = new SecurityEventEmitter();
    const tracker = new TaintTracker();
    this.ifcEngine = new IFCEngine(tracker, this.eventEmitter);
    this.policyEvaluator = new PolicyEvaluator()
      .register(new ToolGovernancePolicy())
      .register(new NoPrivilegeEscalationPolicy())
      .register(new NoSecretExfiltrationPolicy());
    const executor = new ToolExecutor();
    this.toolGateway = new ToolGateway(this.ifcEngine, this.policyEvaluator, this.eventEmitter, executor);
    this.initLLM();
  }

  private initLLM(): void {
    if (process.env.MOCK_LLM === "true") return;
    try {
      const { AzureChatOpenAI } = require("@langchain/openai");
      if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
        this.llm = new AzureChatOpenAI({
          azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
          azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT,
          azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
          azureOpenAIApiVersion: "2024-02-15-preview",
          temperature: 0.3,
        });
      }
    } catch {
      // LLM unavailable — will use mock responses
    }
  }

  async run(options: RunOptions): Promise<RunResult> {
    const executionId = uuidv4();
    const sessionId = options.sessionId ?? uuidv4();

    // Fresh instances per run to avoid taint state leaking between executions
    const tracker = new TaintTracker();
    const emitter = new SecurityEventEmitter();
    const ifcEngine = new IFCEngine(tracker, emitter);
    const executor = new ToolExecutor(options.useAttackScenario);
    const toolGateway = new ToolGateway(ifcEngine, this.policyEvaluator, emitter, executor);

    const collectedEvents: AgentEvent[] = [];
    emitter.on("agent_event", (event: AgentEvent) => {
      collectedEvents.push(event);
    });

    const agent = buildGitHubSupportAgent({
      ifcEngine,
      policyEvaluator: this.policyEvaluator,
      toolGateway,
      eventEmitter: emitter,
      llm: this.llm,
    });

    const initialState = createInitialState(
      executionId,
      sessionId,
      options.input ?? "Analyze the latest GitHub issue and respond.",
      options.mode === "protected",
      options.useAttackScenario,
    );

    const finalState = await agent.invoke(initialState);

    return {
      executionId,
      events: collectedEvents,
      output: finalState.output,
      isBlocked: finalState.isBlocked,
    };
  }

  async *stream(options: RunOptions): AsyncGenerator<AgentEvent> {
    const executionId = uuidv4();
    const sessionId = options.sessionId ?? uuidv4();
    const queue: AgentEvent[] = [];
    let done = false;

    const tracker = new TaintTracker();
    const emitter = new SecurityEventEmitter();
    const ifcEngine = new IFCEngine(tracker, emitter);
    const executor = new ToolExecutor(options.useAttackScenario);
    const toolGateway = new ToolGateway(ifcEngine, this.policyEvaluator, emitter, executor);

    emitter.on("agent_event", (event: AgentEvent) => {
      queue.push(event);
    });

    const agent = buildGitHubSupportAgent({
      ifcEngine,
      policyEvaluator: this.policyEvaluator,
      toolGateway,
      eventEmitter: emitter,
      llm: this.llm,
    });

    const initialState = createInitialState(
      executionId,
      sessionId,
      options.input ?? "Analyze the latest GitHub issue and respond.",
      options.mode === "protected",
      options.useAttackScenario,
    );

    agent.invoke(initialState).then(() => { done = true; });

    while (!done || queue.length > 0) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }
}
