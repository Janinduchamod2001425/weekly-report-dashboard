import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Kasun' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Perera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'kasun@example.com' })
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @Length(8, 72)
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.TEAM_MEMBER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Project IDs assigned to the user',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  projectIds?: string[];
}
