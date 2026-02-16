import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.safeSave(user);
  }

  async createFromAuth(id: string, email: string, name?: string) {
    const exists = await this.userRepository.findOne({ where: { id } });
    if (exists) return exists;

    const emailInUse = await this.findByEmail(email);
    if (emailInUse && emailInUse.id !== id) {
      return emailInUse;
    }

    const user = this.userRepository.create({ id, email, name });
    return this.safeSave(user);
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (updateUserDto.email) {
      const emailInUse = await this.findByEmail(updateUserDto.email);
      if (emailInUse && emailInUse.id !== id) {
        throw new ConflictException('Email already exists');
      }
    }
    Object.assign(user, updateUserDto);
    return this.safeSave(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { message: `User with ID ${id} deleted successfully` };
  }

  private async safeSave(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    return 'code' in error && (error as { code?: string }).code === '23505';
  }
}
