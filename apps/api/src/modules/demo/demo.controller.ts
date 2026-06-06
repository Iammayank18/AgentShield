import { Controller, Get, Post } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { DemoService } from "./demo.service";

@ApiTags("demo")
@Controller("demo")
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post("seed")
  @ApiOperation({ summary: "Seed prerecorded demo execution data for reliable live demos" })
  async seed(): Promise<{ message: string; executionIds: string[] }> {
    const ids = await this.demoService.seedDemoData();
    return { message: "Demo data seeded successfully", executionIds: ids };
  }

  @Get("scenarios")
  @ApiOperation({ summary: "Get available attack scenarios" })
  getScenarios() {
    return this.demoService.getScenarios();
  }
}
