import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { EMPTY, catchError, timeout } from 'rxjs';
import { Repository } from 'typeorm';
import {
  AUDIT_CLIENT,
  AUTH_LOGIN_EVENT,
  OIDC_KEY_ID,
  USER_CLIENT,
  USER_CREATED_EVENT,
} from './constants';
import { AuthLoginEvent } from './contracts/auth-login.event';
import { UserCreatedEvent } from './contracts/user-created.event';
import { OAuthGrantType, OAuthTokenDto } from './dto/oauth-token.dto';
import { Credential } from './entities/credential.entity';
import { getAudience, getIssuer, getJwks } from './oidc/oidc.config';

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Credential)
    private readonly credRepo: Repository<Credential>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(AUDIT_CLIENT) private readonly auditClient: ClientProxy,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.credRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const credential = this.credRepo.create({ email, passwordHash });

    try {
      await this.credRepo.save(credential);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }

    this.publishUserCreatedEvent({
      id: credential.id,
      email: credential.email,
      occurredAt: new Date().toISOString(),
    });

    const token = this.signUserToken(credential);

    return {
      user: { id: credential.id, email: credential.email },
      access_token: token.access_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
    };
  }

  async login(email: string, password: string) {
    const credential = await this.validateCredential(email, password);
    const token = this.signUserToken(credential);

    this.publishAuthLoginEvent({
      credentialId: credential.id,
      email: credential.email,
      occurredAt: new Date().toISOString(),
    });

    return {
      access_token: token.access_token,
      token_type: token.token_type,
      expires_in: token.expires_in,
    };
  }

  async issueOAuthToken(dto: OAuthTokenDto): Promise<TokenResponse> {
    switch (dto.grant_type) {
      case OAuthGrantType.PASSWORD:
        return this.issuePasswordGrantToken(dto);
      case OAuthGrantType.CLIENT_CREDENTIALS:
        return this.issueClientCredentialsToken(dto);
      default:
        throw new BadRequestException('Unsupported grant_type');
    }
  }

  getOpenIdConfiguration() {
    const issuer = getIssuer(this.configService);
    return {
      issuer,
      token_endpoint: `${issuer}/oauth/token`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      grant_types_supported: ['password', 'client_credentials'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: ['openid', 'profile', 'email', 'audit:read', 'roles:write'],
    };
  }

  getJwks() {
    return getJwks(this.configService);
  }

  private async issuePasswordGrantToken(dto: OAuthTokenDto): Promise<TokenResponse> {
    this.validateClient(dto.client_id, dto.client_secret);

    if (!dto.username || !dto.password) {
      throw new BadRequestException('username and password are required for password grant');
    }

    const credential = await this.validateCredential(dto.username, dto.password);
    return this.signUserToken(credential, dto.scope);
  }

  private issueClientCredentialsToken(dto: OAuthTokenDto): TokenResponse {
    this.validateClient(dto.client_id, dto.client_secret);

    const clientId = dto.client_id ?? this.configService.get<string>(
      'OAUTH_CLIENT_ID',
      'toka-internal-client',
    );

    const scope = dto.scope ?? 'openid audit:read roles:write';
    const payload = {
      sub: `client:${clientId}`,
      client_id: clientId,
      scope,
      token_use: 'access_token',
    };

    return this.signToken(payload);
  }

  private async validateCredential(email: string, password: string): Promise<Credential> {
    const credential = await this.credRepo.findOne({ where: { email } });
    if (!credential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, credential.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return credential;
  }

  private signUserToken(credential: Credential, scope?: string): TokenResponse {
    const payload = {
      sub: credential.id,
      email: credential.email,
      scope: scope ?? 'openid profile email',
      token_use: 'access_token',
    };

    return this.signToken(payload);
  }

  private signToken(payload: Record<string, unknown>): TokenResponse {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    const token = this.jwtService.sign(payload, {
      keyid: this.configService.get<string>('OIDC_KEY_ID', OIDC_KEY_ID),
      algorithm: 'RS256',
      issuer: getIssuer(this.configService),
      audience: getAudience(this.configService),
      expiresIn: this.resolveJwtExpiresIn(expiresIn) as any,
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.resolveExpiresInSeconds(expiresIn),
    };
  }

  private validateClient(clientId?: string, clientSecret?: string): void {
    const expectedClientId = this.configService.get<string>(
      'OAUTH_CLIENT_ID',
      'toka-internal-client',
    );
    const expectedClientSecret = this.configService.get<string>(
      'OAUTH_CLIENT_SECRET',
      'toka-internal-secret',
    );

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('client_id and client_secret are required');
    }

    if (clientId !== expectedClientId || clientSecret !== expectedClientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }
  }

  private publishUserCreatedEvent(payload: UserCreatedEvent): void {
    this.publishEvent(this.userClient, USER_CREATED_EVENT, payload);
    this.publishEvent(this.auditClient, USER_CREATED_EVENT, payload);
  }

  private publishAuthLoginEvent(payload: AuthLoginEvent): void {
    this.publishEvent(this.auditClient, AUTH_LOGIN_EVENT, payload);
  }

  private publishEvent<TPayload>(client: ClientProxy, pattern: string, payload: TPayload): void {
    client
      .emit<TPayload>(pattern, payload)
      .pipe(
        timeout(2000),
        catchError((error: unknown) => {
          const message = error instanceof Error ? error.stack ?? error.message : String(error);
          this.logger.error(`Failed to publish "${pattern}"`, message);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private resolveJwtExpiresIn(value: string): number | string {
    const asNumber = Number(value);
    if (Number.isInteger(asNumber) && asNumber > 0) {
      return asNumber;
    }

    return value;
  }

  private resolveExpiresInSeconds(value: string): number {
    const asNumber = Number(value);
    if (Number.isInteger(asNumber) && asNumber > 0) {
      return asNumber;
    }

    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 3600;
      case 'd':
        return amount * 86400;
      default:
        return 3600;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return 'code' in error && (error as { code?: string }).code === '23505';
  }
}
