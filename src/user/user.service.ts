import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update.dto';
import { returnUserData } from '../components/forServices/returnUserData';
import { SearchUserDto } from './dto/search.dto';
import { returnMusicForCommunity } from '../components/forServices/returnMusicForCommunity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getAll() {
    const users = await this.userRepository.find({
      relations: ['friends'],
    });

    return users.map((user) => {
      delete user.password;
      const friends = user.friends.map((friend) => {
        return returnUserData(friend);
      });

      return {
        ...user,
        friends: friends,
      };
    });
  }

  async search(dto: SearchUserDto) {
    const qb = this.userRepository.createQueryBuilder('user');

    qb.limit(dto.limit || 0);
    qb.take(dto.take || 100);

    if (dto.firstName) {
      qb.andWhere('user.firstName ILIKE :firstname');
    }

    if (dto.lastName) {
      qb.andWhere('user.lastName ILIKE :lastname');
    }

    qb.setParameters({
      firstname: `%${dto.firstName}%`,
      lastname: `%${dto.lastName}%`,
    });

    const [user, total] = await qb.getManyAndCount();

    const users = user.map((u) => returnUserData(u));

    return { users: users, total };
  }

  async getById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['friends'],
    });

    if (!user) throw new NotFoundException('User not found');

    const friends = user.friends.map((friend) => {
      return returnUserData(friend);
    });

    delete user.password;

    return {
      ...user,
      friends: friends,
    };
  }

  async updateUser(userIdToChange: string, userId: string, dto: UpdateUserDto) {
    if (userIdToChange !== String(userId))
      throw new ForbiddenException("You don't have access");

    const user = await this.userRepository.findOneBy({ id: userIdToChange });

    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.update(
      {
        id: userIdToChange,
      },
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status,
      },
    );

    return await this.getById(userIdToChange);
  }

  async removeUser(userIdToChange: string, userId: string) {
    if (userIdToChange !== String(userId))
      throw new ForbiddenException("You don't have access");

    return this.userRepository.delete({ id: userIdToChange });
  }

  async addFriend(friendId: string, userId: string) {
    const friendExist = await this.userRepository.findOne({
      where: { id: friendId },
      relations: ['friends'],
    });

    const userExist = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['friends'],
    });

    if (!userExist || !friendExist) {
      throw new HttpException(
        'Invalid user or friend id!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (friendId === String(userId)) {
      throw new HttpException(
        "Friend not found because you can't add yourself as a friend",
        HttpStatus.BAD_REQUEST,
      );
    }

    const isFriendExist = userExist.friends.find(
      (obj) => String(obj?.id) === friendId,
    );

    if (isFriendExist) {
      throw new HttpException(
        'Friendship already exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const newFriend = await this.userRepository.save({
      ...userExist,
      friends: [...userExist.friends, friendExist],
    });

    const friends = newFriend.friends.map((friend) => {
      return returnUserData(friend);
    });

    return {
      ...newFriend,
      friends: friends,
    };
  }

  async removeFriend(friendId: string, userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['friends'],
    });

    const friend = user.friends.find((obj) => String(obj.id) === friendId);

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    user.friends = user.friends.filter((fr) => fr.id !== friend.id);

    const updatedUser = await this.userRepository.save(user);
    const friends = updatedUser.friends.map((friend) => {
      return returnUserData(friend);
    });

    return {
      ...updatedUser,
      friends: friends,
    };
  }
}
