import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'Backend Developer Senior' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({
    example: 'Buscamos desarrollador con experiencia en NestJS...',
  })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  company: string;

  @ApiProperty({ example: 'Remoto' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: 3000 })
  @IsNumber()
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({ example: ['NestJS', 'PostgreSQL', 'Docker'] })
  @IsArray()
  @IsOptional()
  skills?: string[];
}
