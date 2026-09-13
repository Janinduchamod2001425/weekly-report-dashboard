import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({
    example:
      'Please provide the deliverable link and update the actual time spent.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment!: string;
}
