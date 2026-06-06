import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExecutionEntity } from "./entities/execution.entity";
import { SecurityEventEntity } from "./entities/security-event.entity";
import { ToolCallEntity } from "./entities/tool-call.entity";
import { AgentModule } from "./modules/agent/agent.module";
import { SecurityModule } from "./modules/security/security.module";
import { ExecutionsModule } from "./modules/executions/executions.module";
import { DemoModule } from "./modules/demo/demo.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("DATABASE_URL"),
        entities: [ExecutionEntity, SecurityEventEntity, ToolCallEntity],
        synchronize: true,
        logging: config.get("NODE_ENV") !== "production",
        ssl: config.get("NODE_ENV") === "production" ? { rejectUnauthorized: false } : false,
      }),
    }),
    AgentModule,
    SecurityModule,
    ExecutionsModule,
    DemoModule,
  ],
})
export class AppModule {}
