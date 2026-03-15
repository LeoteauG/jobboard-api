import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from './job.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  VIEWED = 'viewed',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  candidate: User;

  @ManyToOne(() => Job, { eager: true })
  job: Job;

  @Column({ nullable: true })
  cvUrl: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @CreateDateColumn()
  appliedAt: Date;
}
