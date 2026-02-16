import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersEventsController } from './users.events';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UsersEventsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
