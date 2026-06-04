import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ExecuteAgentDto {
  @IsOptional()
  @IsBoolean()
  shieldEnabled?: boolean = true;

  @IsOptional()
  @IsBoolean()
  useAttackScenario?: boolean = false;

  @IsOptional()
  @IsString()
  input?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
