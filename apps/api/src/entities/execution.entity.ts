import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";
import type { ExecutionStep, SecurityViolation } from "@agent-shield/shared-types";

@Entity("executions")
export class ExecutionEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  sessionId: string;

  @Column("text")
  input: string;

  @Column({ default: "protected" })
  mode: "protected" | "unprotected";

  @Column({ default: "running" })
  status: string;

  @Column("bigint")
  startedAt: number;

  @Column("bigint", { nullable: true })
  completedAt?: number;

  @Column("jsonb", { default: [] })
  steps: ExecutionStep[];

  @Column("jsonb", { default: [] })
  violations: SecurityViolation[];

  @Column("text", { nullable: true })
  output?: string;

  @CreateDateColumn()
  createdAt: Date;
}
