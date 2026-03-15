import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ApplyJobDto {
  @IsUUID()
  jobId: string;

  @IsOptional()
  @IsString()
  cvUrl?: string;
}
