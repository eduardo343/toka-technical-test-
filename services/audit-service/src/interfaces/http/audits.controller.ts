import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ListAuditsUseCase } from '../../application/audit/use-cases/list-audits.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audits')
export class AuditsController {
  constructor(private readonly listAuditsUseCase: ListAuditsUseCase) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    const numericLimit = limit ? Number(limit) : undefined;
    return this.listAuditsUseCase.execute(numericLimit);
  }
}
