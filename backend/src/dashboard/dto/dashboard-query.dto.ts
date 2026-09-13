import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    example: '2026-09-07',
    description:
      'Any date within the selected week. Defaults to the current week.',
  })
  @IsOptional()
  @IsDateString()
  weekStart?: string;
}
