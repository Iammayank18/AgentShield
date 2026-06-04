import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DemoController } from "./demo.controller";
import { DemoService } from "./demo.service";
import { ExecutionEntity } from "../../entities/execution.entity";
import { SecurityEventEntity } from "../../entities/security-event.entity";
import { ToolCallEntity } from "../../entities/tool-call.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ExecutionEntity, SecurityEventEntity, ToolCallEntity])],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
