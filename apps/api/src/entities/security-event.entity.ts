import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("security_events")
export class SecurityEventEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  executionId: string;

  @Column()
  type: string;

  @Column({ default: "high" })
  severity: string;

  @Column("text")
  description: string;

  @Column("jsonb", { default: [] })
  taintChain: string[];

  @Column("bigint")
  timestamp: number;

  @CreateDateColumn()
  createdAt: Date;
}
