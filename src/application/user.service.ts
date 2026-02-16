import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../infrastructure/database/entities/user.entity';
import { CreateUserDto } from '../presentation/dto/create-user.dto';
import { UpdateUserDto } from '../presentation/dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(dto: CreateUserDto) {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.userRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.userRepository.delete(id);
    return { message: 'User deleted' };
  }
}
