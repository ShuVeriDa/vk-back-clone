import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './entity/message.entity';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/create.dto';
import { UserEntity } from '../user/entity/user.entity';
import { UpdateMessageDto } from './dto/update.dto';
import { markAsRead } from '../components/forServices/markAsRead';
import { validationMessage } from '../components/forServices/validationMessage';
import { returnMessage } from '../components/forServices/returnMessage';

@Injectable()
export class MessageService {
  @InjectRepository(MessageEntity)
  private readonly messageRepository: Repository<MessageEntity>;

  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;

  async getAll(userId: string) {
    const messages = await this.messageRepository.find({
      where: { sender: { id: userId } },
    });

    return messages.map((m) => {
      return returnMessage(m);
    });
  }

  async getAllByRecipientId(recipientId: string, userId: string) {
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });

    if (!recipient) throw new NotFoundException('Recipient not found');

    const myMessages = await this.messageRepository.find({
      where: { recipient: { id: recipientId }, sender: { id: userId } },
    });

    const hisMessages = await this.messageRepository.find({
      where: { recipient: { id: userId }, sender: { id: recipientId } },
    });

    myMessages.map((m) => {
      return m;
    });

    hisMessages.map((m) => {
      m.read = true;
      m.readAt = new Date();
      return m;
    });

    await this.messageRepository.save(hisMessages);

    const markHisMessages = await this.messageRepository.find({
      where: { recipient: { id: userId }, sender: { id: recipientId } },
    });

    markHisMessages.map((m) => {
      return m;
    });

    const allOurSorteredMessages = myMessages
      .concat(markHisMessages)
      .sort((a, b) => {
        if (a.createdAt > b.createdAt) return 1;
        if (a.createdAt < b.createdAt) return -1;
        return 0;
      });

    return allOurSorteredMessages.map((m) => {
      return returnMessage(m);
    });
  }

  async getOneById(messageId: string, userId: string) {
    const { message } = await validationMessage(
      messageId,
      this.messageRepository,
    );

    if (message.sender.id !== userId) {
      if (!message.read) {
        return await markAsRead(messageId, this.messageRepository);
      }
    }

    return returnMessage(message);
  }

  async create(dto: CreateMessageDto, userId: string) {
    const createMessage = await this.messageRepository.save({
      message: dto.message,
      sender: { id: userId },
      recipient: { id: dto.recipientId },
    });

    const message = await this.messageRepository.findOne({
      where: { id: createMessage.id },
      relations: ['sender', 'recipient'],
    });

    return returnMessage(message);
  }

  async update(dto: UpdateMessageDto, messageId: string, userId: string) {
    const { message } = await validationMessage(
      messageId,
      this.messageRepository,
    );

    if (message.sender.id !== userId) {
      throw new ForbiddenException('You do not have access to this message');
    }

    await this.messageRepository.update(
      {
        id: message.id,
      },
      {
        message: dto.message,
      },
    );

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    delete updatedMessage.recipient.password;
    delete updatedMessage.sender.password;

    return returnMessage(updatedMessage);
  }

  async delete(messageId: string, userId: string) {
    const { message } = await validationMessage(
      messageId,
      this.messageRepository,
    );

    if (message.sender.id !== userId) {
      throw new ForbiddenException('You do not have access to this message');
    }

    delete message.sender.password;
    delete message.recipient.password;

    await this.messageRepository.remove(message);

    return { message: 'Success' };
  }
}
