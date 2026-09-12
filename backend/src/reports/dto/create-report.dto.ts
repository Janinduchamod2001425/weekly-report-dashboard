import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { AchievementDto } from './achievement.dto.js';
import { BlockerDto } from './blocker.dto.js';
import { NextWeekTaskDto } from './next-week-task.dto.js';
import { ReportLinkDto } from './report-link.dto.js';
import { ReportTaskDto } from './report-task.dto.js';
import { TimeEntryDto } from './time-entry.dto.js';

export class CreateReportDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({
    example: '2026-09-07',
    description: 'Start date of the reporting week',
  })
  @IsDateString()
  weekStart!: string;

  @ApiProperty({
    example: '2026-09-13',
    description: 'End date of the reporting week',
  })
  @IsDateString()
  weekEnd!: string;

  @ApiPropertyOptional({
    example: 'Additional information about this week',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [ReportTaskDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ReportTaskDto)
  tasks?: ReportTaskDto[];

  @ApiPropertyOptional({ type: [NextWeekTaskDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => NextWeekTaskDto)
  nextWeekTasks?: NextWeekTaskDto[];

  @ApiPropertyOptional({ type: [BlockerDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BlockerDto)
  blockers?: BlockerDto[];

  @ApiPropertyOptional({ type: [AchievementDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];

  @ApiPropertyOptional({ type: [TimeEntryDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => TimeEntryDto)
  timeEntries?: TimeEntryDto[];

  @ApiPropertyOptional({ type: [ReportLinkDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ReportLinkDto)
  links?: ReportLinkDto[];
}
