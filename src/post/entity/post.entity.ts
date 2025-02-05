import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entity/user.entity';
import { CommentEntity } from '../../comment/entity/comment.entity';
import { CommunityEntity } from '../../community/entity/community.entity';
import { PhotoEntity } from '../../photo/entity/photo.entity';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  text: string;

  @Column({ nullable: true })
  imageUrl: string | null;

  @Column({ nullable: true })
  musicUrl: string | null;

  @Column({ nullable: true })
  videoUrl: string | null;

  @ManyToOne(() => UserEntity, { eager: true, nullable: false })
  user: UserEntity;

  @Column({
    default: 0,
  })
  views: number;

  @ManyToOne(() => PostEntity, (post) => post.reposts)
  @JoinColumn({ name: 'repostId' })
  reposts: PostEntity;

  @ManyToOne(() => PhotoEntity, (photo) => photo)
  @JoinColumn({ name: 'repostPhotoId' })
  repostsPhoto: PhotoEntity;

  @Column({ default: 0 })
  favorites: number;

  @Column({ default: 4.0 })
  rating?: number;

  @Column({
    default: false,
  })
  turnOffComments: boolean;

  @OneToMany(() => CommentEntity, (comment) => comment.post, { eager: true })
  @JoinColumn()
  comments: CommentEntity[];

  @ManyToOne(() => CommunityEntity, (community) => community.posts)
  community: CommunityEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
