import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("tool_calls")
export class ToolCallEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  executionId!: string;

  @Column()
  toolId!: string;

  @Column()
  toolName!: string;

  @Column({ default: "pending" })
  status!: string;

  @Column({ default: "untrusted" })
  trustLevel!: string;

  @Column("jsonb", { default: [] })
  taintedBy!: string[];

  @Column("text", { nullable: true })
  blockedReason?: string;

  @Column("jsonb", { nullable: true })
  parameters?: Record<string, unknown>;

  @Column("bigint")
  timestamp!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
