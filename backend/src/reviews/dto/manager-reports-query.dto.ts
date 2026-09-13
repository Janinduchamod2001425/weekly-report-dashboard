import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { ListReportsQueryDto } from '../../reports/dto/list-reports-query.dto.js';

export class ManagerReportsQueryDto extends ListReportsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filter reports by team member',
  })
  @IsOptional()
  @IsUUID()
  teamMemberId?: string;
}
