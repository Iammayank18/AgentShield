import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { ExecutionEntity } from "../../entities/execution.entity";
import { SecurityEventEntity } from "../../entities/security-event.entity";
import { ToolCallEntity } from "../../entities/tool-call.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ExecutionEntity, SecurityEventEntity, ToolCallEntity])],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
