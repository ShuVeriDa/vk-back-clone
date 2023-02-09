import { Module } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoEntity } from './entity/photo.entity';
import { UserEntity } from '../user/entity/user.entity';
import { CommunityEntity } from '../community/entity/community.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotoEntity, UserEntity, CommunityEntity]),
  ],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
