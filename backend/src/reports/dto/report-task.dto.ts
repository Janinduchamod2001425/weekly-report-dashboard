import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReportTaskDto {
  @ApiProperty({ example: 'Implement authentication module' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional project override for this task',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ example: 100, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercentage!: number;

  @ApiProperty({ example: 90, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  actualPercentage!: number;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiProperty({
    example: 480,
    description: 'Planned time in minutes',
  })
  @IsInt()
  @Min(0)
  plannedMinutes!: number;

  @ApiProperty({
    example: 520,
    description: 'Actual time spent in minutes',
  })
  @IsInt()
  @Min(0)
  actualMinutes!: number;

  @ApiPropertyOptional({
    example: 'Authentication API and Swagger documentation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliverable?: string;
}
