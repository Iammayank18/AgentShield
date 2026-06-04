import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExecutionEntity } from "../../entities/execution.entity";

@ApiTags("executions")
@Controller("executions")
export class ExecutionsController {
  constructor(
    @InjectRepository(ExecutionEntity)
    private executionRepo: Repository<ExecutionEntity>,
  ) {}

  @Get(":id")
  @ApiOperation({ summary: "Get full execution trace by ID" })
  async getExecution(@Param("id") id: string): Promise<ExecutionEntity> {
    const execution = await this.executionRepo.findOne({ where: { id } });
    if (!execution) throw new NotFoundException(`Execution ${id} not found`);
    return execution;
  }

  @Get()
  @ApiOperation({ summary: "List recent executions" })
  async listExecutions(): Promise<ExecutionEntity[]> {
    return this.executionRepo.find({
      order: { createdAt: "DESC" },
      take: 20,
    });
  }
}
