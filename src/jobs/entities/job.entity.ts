import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum JobStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAUSED = 'paused',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  company: string;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salary: number;

  @Column('simple-array', { nullable: true })
  skills: string[];

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.OPEN })
  status: JobStatus;

  @ManyToOne(() => User, { eager: false })
  postedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
