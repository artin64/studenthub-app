import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAlumniDto } from './dto/update-alumni.dto';
import { RejectUserDto } from './dto/approve-user.dto';
import { AVATARS_DIR } from '../common/uploads.util';

const ALLOWED_IMAGE_TYPES = /\/(jpg|jpeg|png|webp)$/;

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // Every role (student, parent, professor, admin, company) can set a
  // profile photo — this endpoint isn't role-restricted beyond "logged in".
  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: AVATARS_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.test(file.mimetype)) {
          cb(new BadRequestException('Only JPG, PNG, or WEBP images are allowed.'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@CurrentUser() user: { id: string }, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return this.usersService.updatePhoto(user.id, `/uploads/avatars/${file.filename}`);
  }

  @Post('me/change-password')
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Patch('me/alumni')
  @Roles(Role.STUDENT)
  updateAlumni(@CurrentUser() user: { id: string }, @Body() dto: UpdateAlumniDto) {
    return this.usersService.updateAlumniStatus(user.id, dto.isAlumnus, dto.alumniCompany, dto.alumniRole);
  }

  @Get('alumni')
  listAlumni() {
    return this.usersService.listAlumni();
  }

  // --- Registration approval queue (professor: students/parents only; admin: everyone) ---
  @Get('pending')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  listPending(@CurrentUser() user: { role: Role }, @Query('role') role?: Role) {
    return this.usersService.listPending(user.role, role);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  approve(@Param('id') id: string, @CurrentUser() user: { id: string; role: Role }) {
    return this.usersService.approve(id, user.id, user.role);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  reject(@Param('id') id: string, @CurrentUser() user: { role: Role }, @Body() dto: RejectUserDto) {
    return this.usersService.reject(id, user.role, dto.reason);
  }

  @Post(':id/suspend')
  @Roles(Role.ADMIN)
  suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }

  @Post(':id/reactivate')
  @Roles(Role.ADMIN)
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
  ) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      role,
      status,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PROFESSOR)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
