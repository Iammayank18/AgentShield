import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AgentRunner } from "@agent-shield/agent-core";
import { ExecutionEntity } from "../../entities/execution.entity";
import { SecurityEventEntity } from "../../entities/security-event.entity";
import { ToolCallEntity } from "../../entities/tool-call.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(ExecutionEntity)
    private executionRepo: Repository<ExecutionEntity>,
    @InjectRepository(SecurityEventEntity)
    private secEventRepo: Repository<SecurityEventEntity>,
    @InjectRepository(ToolCallEntity)
    private toolCallRepo: Repository<ToolCallEntity>,
  ) {}

  async seedDemoData(): Promise<string[]> {
    const runner = new AgentRunner();
    const ids: string[] = [];

    // Scenario 1: Normal issue, protected
    const run1 = await runner.run({ mode: "protected", useAttackScenario: false });
    await this.saveExecution(run1, "protected");
    ids.push(run1.executionId);

    // Scenario 2: Attack, unprotected (shows the danger)
    const run2 = await runner.run({ mode: "unprotected", useAttackScenario: true });
    await this.saveExecution(run2, "unprotected");
    ids.push(run2.executionId);

    // Scenario 3: Attack, protected (shows AgentShield blocking it)
    const run3 = await runner.run({ mode: "protected", useAttackScenario: true });
    await this.saveExecution(run3, "protected");
    ids.push(run3.executionId);

    return ids;
  }

  private async saveExecution(
    run: { executionId: string; events: any[]; output: string; isBlocked: boolean },
    mode: "protected" | "unprotected",
  ): Promise<void> {
    const completedEvent = run.events.find((e) => e.type === "execution_completed");
    const execution = completedEvent?.payload?.execution;
    if (!execution) return;

    await this.executionRepo.save({
      id: run.executionId,
      sessionId: uuidv4(),
      input: execution.input,
      mode,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      steps: execution.steps ?? [],
      violations: execution.violations ?? [],
      output: run.output,
    });

    for (const event of run.events) {
      if (event.type === "violation_detected") {
        const v = (event.payload as any).violation;
        await this.secEventRepo.save({
          id: v.id,
          executionId: run.executionId,
          type: v.type,
          severity: v.severity,
          description: v.description,
          taintChain: v.taintChain,
          timestamp: v.timestamp,
        });
      }
    }
  }

  getScenarios() {
    return [
      {
        id: "normal_protected",
        name: "Normal Ticket — Protected",
        description: "Customer refund request. AgentShield active. Agent reads KB and replies safely.",
        mode: "protected",
        useAttackScenario: false,
      },
      {
        id: "attack_unprotected",
        name: "PII Theft — Unprotected",
        description: "Social engineering via support ticket. No AgentShield. Agent leaks customer PII (SSN, credit card).",
        mode: "unprotected",
        useAttackScenario: true,
      },
      {
        id: "attack_protected",
        name: "PII Theft — Protected",
        description: "Social engineering via support ticket. AgentShield active. Attack blocked, PII safe.",
        mode: "protected",
        useAttackScenario: true,
      },
    ];
  }
}
