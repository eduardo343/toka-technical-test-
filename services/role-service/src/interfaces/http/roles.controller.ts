import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleUseCase } from '../../application/roles/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '../../application/roles/use-cases/delete-role.use-case';
import { GetRoleByIdUseCase } from '../../application/roles/use-cases/get-role-by-id.use-case';
import { ListRolesUseCase } from '../../application/roles/use-cases/list-roles.use-case';
import { UpdateRoleUseCase } from '../../application/roles/use-cases/update-role.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Post()
  create(@Body() body: CreateRoleDto) {
    return this.createRoleUseCase.execute(body);
  }

  @Get()
  findAll() {
    return this.listRolesUseCase.execute();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getRoleByIdUseCase.execute(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateRoleDto) {
    return this.updateRoleUseCase.execute({ id, ...body });
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deleteRoleUseCase.execute(id);
  }
}
