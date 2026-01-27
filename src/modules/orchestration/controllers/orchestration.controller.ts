import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('orchestration')
@Controller('orchestration')
export class OrchestrationController {
  // Internal orchestration endpoints can be added here if needed
}
