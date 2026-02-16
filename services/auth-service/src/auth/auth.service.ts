import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from './entities/credential.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { EMPTY, catchError, timeout } from 'rxjs';
import { USER_CLIENT, USER_CREATED_EVENT } from './constants';
import { UserCreatedEvent } from './contracts/user-created.event';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    private readonly jwtService: JwtService,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register(email: string, password: string) {
    const existing = await this.credRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const cred = this.credRepo.create({ email, passwordHash });
    try {
      await this.credRepo.save(cred);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }

    this.publishUserCreatedEvent({
      id: cred.id,
      email: cred.email,
      occurredAt: new Date().toISOString(),
    });

    const token = this.generateToken(cred);
    return {
      user: { id: cred.id, email: cred.email },
      access_token: token,
    };
  }

  // =========================
  // LOGIN
  // =========================
  async login(email: string, password: string) {
    const cred = await this.credRepo.findOne({ where: { email } });
    if (!cred) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, cred.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(cred);
    return { access_token: token };
  }

  // =========================
  // TOKEN GENERATION
  // =========================
  private generateToken(cred: Credential): string {
    const payload = { sub: cred.id, email: cred.email };
    return this.jwtService.sign(payload);
  }

  private publishUserCreatedEvent(payload: UserCreatedEvent): void {
    this.userClient
      .emit<UserCreatedEvent>(USER_CREATED_EVENT, payload)
      .pipe(
        timeout(2_000),
        catchError((error: unknown) => {
          const message = error instanceof Error ? error.stack ?? error.message : String(error);
          this.logger.error(`Failed to publish "${USER_CREATED_EVENT}"`, message);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return 'code' in error && (error as { code?: string }).code === '23505';
  }
}
