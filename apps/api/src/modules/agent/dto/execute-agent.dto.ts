import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class ExecuteAgentDto {
  @IsOptional()
  @IsBoolean()
  shieldEnabled?: boolean = true;

  @IsOptional()
  @IsBoolean()
  useAttackScenario?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  input?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
