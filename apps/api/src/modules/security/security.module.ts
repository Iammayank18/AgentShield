import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SecurityController } from "./security.controller";
import { SecurityEventEntity } from "../../entities/security-event.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SecurityEventEntity])],
  controllers: [SecurityController],
})
export class SecurityModule {}
