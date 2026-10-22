import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_google_login_challenges')
@Index('user_google_login_challenges_hash_uq', ['nonceHash'], { unique: true })
@Index('user_google_login_challenges_expiry_idx', ['expiresAt'])
export class GoogleLoginChallengeOrmEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') companyId: string;
  @Column({ type: 'varchar', length: 64 }) nonceHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) consumedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
