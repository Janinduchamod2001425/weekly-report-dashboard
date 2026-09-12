import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';

export class TimeEntryDto {
  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  taskType!: TaskType;

  @ApiProperty({
    example: 1200,
    description: 'Time spent in minutes',
  })
  @IsInt()
  @Min(0)
  minutes!: number;
}
