import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';

@Entity('job_views')
export class JobView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job: Job;

  @Column({ nullable: true })
  visitorIp: string;

  @CreateDateColumn()
  viewedAt: Date;
}
