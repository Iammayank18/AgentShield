import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  PolicyEvaluator,
  NoPrivilegeEscalationPolicy,
  NoSecretExfiltrationPolicy,
  ToolGovernancePolicy,
} from "@agent-shield/policy-engine";
import type { SecurityContext, PolicyResult } from "@agent-shield/shared-types";
import { SecurityEventEntity } from "../../entities/security-event.entity";

@ApiTags("security")
@Controller("security")
export class SecurityController {
  private policyEvaluator: PolicyEvaluator;

  constructor(
    @InjectRepository(SecurityEventEntity)
    private secEventRepo: Repository<SecurityEventEntity>,
  ) {
    this.policyEvaluator = new PolicyEvaluator()
      .register(new ToolGovernancePolicy())
      .register(new NoPrivilegeEscalationPolicy())
      .register(new NoSecretExfiltrationPolicy());
  }

  @Post("evaluate")
  @ApiOperation({ summary: "Manually run policy evaluation on a security context" })
  evaluate(@Body() context: SecurityContext): PolicyResult {
    return this.policyEvaluator.evaluate(context);
  }

  @Get("violations")
  @ApiOperation({ summary: "Get security violations, optionally filtered by executionId" })
  async getViolations(
    @Query("executionId") executionId?: string,
    @Query("limit") limit = 50,
  ): Promise<SecurityEventEntity[]> {
    const query = this.secEventRepo.createQueryBuilder("e");
    if (executionId) query.where("e.executionId = :executionId", { executionId });
    return query.orderBy("e.timestamp", "DESC").take(limit).getMany();
  }
}
