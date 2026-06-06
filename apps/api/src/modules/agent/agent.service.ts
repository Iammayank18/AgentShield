import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter } from "events";
import { AgentRunner } from "@agent-shield/agent-core";
import type { AgentEvent, ToolCall, SecurityViolation } from "@agent-shield/shared-types";
import { ExecutionEntity } from "../../entities/execution.entity";
import { SecurityEventEntity } from "../../entities/security-event.entity";
import { ToolCallEntity } from "../../entities/tool-call.entity";
import type { ExecuteAgentDto } from "./dto/execute-agent.dto";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class AgentService implements OnModuleInit {
  private runner!: AgentRunner;
  private streamBus = new EventEmitter();
  private activeStreams = new Map<string, AgentEvent[]>();

  constructor(
    @InjectRepository(ExecutionEntity)
    private executionRepo: Repository<ExecutionEntity>,
    @InjectRepository(SecurityEventEntity)
    private secEventRepo: Repository<SecurityEventEntity>,
    @InjectRepository(ToolCallEntity)
    private toolCallRepo: Repository<ToolCallEntity>,
  ) {}

  onModuleInit() {
    this.runner = new AgentRunner();
    this.streamBus.setMaxListeners(100);
  }

  async executeAgent(dto: ExecuteAgentDto): Promise<{ executionId: string }> {
    const executionId = uuidv4();
    this.activeStreams.set(executionId, []);

    const execution = this.executionRepo.create({
      id: executionId,
      sessionId: dto.sessionId ?? uuidv4(),
      input: dto.input ?? "Help me with a task.",
      mode: dto.shieldEnabled !== false ? "protected" : "unprotected",
      status: "running",
      startedAt: Date.now(),
      steps: [],
      violations: [],
    });
    await this.executionRepo.save(execution);

    // Run agent async — don't await
    this.runAgentAsync(executionId, dto);

    return { executionId };
  }

  private async runAgentAsync(executionId: string, dto: ExecuteAgentDto): Promise<void> {
    try {
      for await (const event of this.runner.stream({
        mode: dto.shieldEnabled !== false ? "protected" : "unprotected",
        useAttackScenario: dto.useAttackScenario ?? false,
        input: dto.input,
        sessionId: dto.sessionId,
      })) {
        // Store and broadcast each event
        const buffer = this.activeStreams.get(executionId) ?? [];
        buffer.push(event);
        this.streamBus.emit(`stream:${executionId}`, event);

        await this.persistEvent(executionId, event);
      }
    } catch (err) {
      const errorEvent: AgentEvent = {
        type: "execution_completed",
        executionId,
        payload: {
          execution: {
            id: executionId,
            sessionId: dto.sessionId ?? "",
            input: dto.input ?? "",
            mode: dto.shieldEnabled !== false ? "protected" : "unprotected",
            status: "failed",
            startedAt: Date.now(),
            completedAt: Date.now(),
            steps: [],
            violations: [],
          },
        },
        timestamp: Date.now(),
      };
      this.streamBus.emit(`stream:${executionId}`, errorEvent);
    } finally {
      this.streamBus.emit(`stream:${executionId}:done`);
      this.activeStreams.delete(executionId);
    }
  }

  private async persistEvent(executionId: string, event: AgentEvent): Promise<void> {
    if (event.type === "execution_completed") {
      const payload = event.payload as any;
      await this.executionRepo.update(executionId, {
        status: payload.execution.status,
        completedAt: payload.execution.completedAt,
        steps: payload.execution.steps,
        violations: payload.execution.violations,
        output: payload.execution.output,
      });
    }

    if (event.type === "violation_detected") {
      const payload = event.payload as any;
      const v = payload.violation as SecurityViolation;
      await this.secEventRepo.save({
        id: v.id,
        executionId,
        type: v.type,
        severity: v.severity,
        description: v.description,
        taintChain: v.taintChain,
        timestamp: v.timestamp,
      });
    }

    if (event.type === "tool_call_blocked" || event.type === "tool_call_approved") {
      const payload = event.payload as any;
      const tc = payload.toolCall as ToolCall;
      await this.toolCallRepo.save({
        id: tc.id,
        executionId,
        toolId: tc.toolId,
        toolName: tc.toolName,
        status: tc.status,
        trustLevel: tc.trustLevel,
        taintedBy: tc.taintedBy ?? [],
        blockedReason: tc.blockedReason,
        parameters: tc.parameters,
        timestamp: tc.timestamp,
      });
    }
  }

  subscribeToStream(
    executionId: string,
    onEvent: (event: AgentEvent) => void,
    onDone: () => void,
  ): () => void {
    // Replay buffered events
    const buffer = this.activeStreams.get(executionId) ?? [];
    for (const event of buffer) {
      onEvent(event);
    }

    const handler = (event: AgentEvent) => onEvent(event);
    const doneHandler = () => onDone();

    this.streamBus.on(`stream:${executionId}`, handler);
    this.streamBus.once(`stream:${executionId}:done`, doneHandler);

    return () => {
      this.streamBus.off(`stream:${executionId}`, handler);
      this.streamBus.off(`stream:${executionId}:done`, doneHandler);
    };
  }
}
