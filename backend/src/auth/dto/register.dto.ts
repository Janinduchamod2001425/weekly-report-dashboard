import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

export class RegisterDto {
    @ApiProperty({ example: 'Nimal' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    firstName!: string;

    @ApiProperty({ example: 'Perera' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    lastName!: string;

    @ApiProperty({ example: 'nimal@example.com' })
    @IsEmail()
    @MaxLength(150)
    email!: string;

    @ApiProperty({ example: 'Developer', required: false })
    @IsString()
    @MaxLength(100)
    jobTitle?: string;

    @ApiProperty({
        example: 'Password@123',
        minLength: 8,
        maxLength: 72,
    })
    @IsString()
    @Length(8, 72)
    password!: string;
}