import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExecutionsController } from "./executions.controller";
import { ExecutionEntity } from "../../entities/execution.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ExecutionEntity])],
  controllers: [ExecutionsController],
})
export class ExecutionsModule {}
