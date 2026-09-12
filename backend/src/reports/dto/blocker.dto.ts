import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class BlockerDto {
  @ApiProperty({ example: 'Waiting for API credentials' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'The payment provider has not issued sandbox credentials',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  isKeyIssue!: boolean;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  isResolved!: boolean;
}
