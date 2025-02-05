import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entity/post.entity';
import { UserEntity } from '../user/entity/user.entity';
import { CommunityEntity } from '../community/entity/community.entity';
import { CommunityService } from '../community/community.service';
import { PhotoEntity } from '../photo/entity/photo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      UserEntity,
      CommunityEntity,
      PhotoEntity,
    ]),
    // UserModule,
  ],
  controllers: [PostController],
  providers: [PostService, CommunityService],
})
export class PostModule {}
