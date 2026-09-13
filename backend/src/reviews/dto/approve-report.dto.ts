import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveReportDto {
  @ApiPropertyOptional({
    example: 'Reviewed and approved.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
