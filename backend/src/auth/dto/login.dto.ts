import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'nimal@example.com' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @Length(8, 72)
  password!: string;
}
