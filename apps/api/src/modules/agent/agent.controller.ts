import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Sse,
  MessageEvent,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Observable } from "rxjs";
import type { Response } from "express";
import { AgentService } from "./agent.service";
import { ExecuteAgentDto } from "./dto/execute-agent.dto";

@ApiTags("agent")
@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("execute")
  @ApiOperation({ summary: "Start an agent execution" })
  execute(@Body() dto: ExecuteAgentDto): Promise<{ executionId: string }> {
    return this.agentService.executeAgent(dto);
  }

  @Sse("stream/:executionId")
  @ApiOperation({ summary: "Stream agent execution events via SSE" })
  stream(@Param("executionId") executionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const unsubscribe = this.agentService.subscribeToStream(
        executionId,
        (event) => {
          subscriber.next({ data: JSON.stringify(event) } as MessageEvent);
        },
        () => {
          subscriber.complete();
        },
      );
      return unsubscribe;
    });
  }
}
