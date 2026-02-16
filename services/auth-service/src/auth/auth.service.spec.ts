import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { AUTH_LOGIN_EVENT, USER_CREATED_EVENT } from './constants';
import { OAuthGrantType } from './dto/oauth-token.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const configValues: Record<string, string> = {
    OAUTH_CLIENT_ID: 'toka-internal-client',
    OAUTH_CLIENT_SECRET: 'toka-internal-secret',
    OIDC_ISSUER: 'http://localhost:3001',
    OIDC_AUDIENCE: 'toka-api',
    OIDC_KEY_ID: 'toka-auth-key-1',
    JWT_EXPIRES_IN: '1h',
  };

  let credRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let userClient: { emit: jest.Mock };
  let auditClient: { emit: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    configValues.JWT_EXPIRES_IN = '1h';

    credRepo = {
      findOne: jest.fn(),
      create: jest.fn((input) => ({ id: 'cred-1', ...input })),
      save: jest.fn(async (input) => input),
    };

    jwtService = {
      sign: jest.fn(() => 'signed-token'),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: string) => configValues[key] ?? defaultValue),
    };

    userClient = {
      emit: jest.fn(() => of(undefined)),
    };

    auditClient = {
      emit: jest.fn(() => of(undefined)),
    };

    service = new AuthService(
      credRepo as never,
      jwtService as never,
      configService as never,
      userClient as never,
      auditClient as never,
    );

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register throws conflict when credential already exists', async () => {
    credRepo.findOne.mockResolvedValue({ id: 'exists' });

    await expect(service.register('user@test.com', 'secret123')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('register handles unique violation from database', async () => {
    credRepo.findOne.mockResolvedValue(null);
    credRepo.save.mockRejectedValue({ code: '23505' });

    await expect(service.register('user@test.com', 'secret123')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('register persists credential, publishes event and returns token', async () => {
    credRepo.findOne.mockResolvedValue(null);

    const result = await service.register('user@test.com', 'secret123');

    expect(result).toMatchObject({
      user: { id: 'cred-1', email: 'user@test.com' },
      access_token: 'signed-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    expect(userClient.emit).toHaveBeenCalledWith(
      USER_CREATED_EVENT,
      expect.objectContaining({ id: 'cred-1', email: 'user@test.com' }),
    );
    expect(auditClient.emit).toHaveBeenCalledWith(
      USER_CREATED_EVENT,
      expect.objectContaining({ id: 'cred-1', email: 'user@test.com' }),
    );
  });

  it('login throws unauthorized when password does not match', async () => {
    credRepo.findOne.mockResolvedValue({
      id: 'cred-1',
      email: 'user@test.com',
      passwordHash: 'hash',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login('user@test.com', 'wrong-pass')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login returns token and publishes auth.login event', async () => {
    credRepo.findOne.mockResolvedValue({
      id: 'cred-1',
      email: 'user@test.com',
      passwordHash: 'hash',
    });

    const result = await service.login('user@test.com', 'secret123');

    expect(result).toMatchObject({
      access_token: 'signed-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    expect(auditClient.emit).toHaveBeenCalledWith(
      AUTH_LOGIN_EVENT,
      expect.objectContaining({ credentialId: 'cred-1', email: 'user@test.com' }),
    );
  });

  it('issueOAuthToken throws bad request when grant type is unsupported', async () => {
    await expect(service.issueOAuthToken({ grant_type: 'invalid' } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('issueOAuthToken validates required fields for password grant', async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: OAuthGrantType.PASSWORD,
        client_id: 'toka-internal-client',
        client_secret: 'toka-internal-secret',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('issueOAuthToken rejects invalid client credentials', async () => {
    await expect(
      service.issueOAuthToken({
        grant_type: OAuthGrantType.CLIENT_CREDENTIALS,
        client_id: 'bad-client',
        client_secret: 'bad-secret',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issueOAuthToken returns token for client_credentials grant', async () => {
    configValues.JWT_EXPIRES_IN = '120';

    const result = await service.issueOAuthToken({
      grant_type: OAuthGrantType.CLIENT_CREDENTIALS,
      client_id: 'toka-internal-client',
      client_secret: 'toka-internal-secret',
    });

    expect(result).toMatchObject({
      access_token: 'signed-token',
      token_type: 'Bearer',
      expires_in: 120,
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'client:toka-internal-client',
        scope: 'openid audit:read roles:write',
      }),
      expect.objectContaining({
        algorithm: 'RS256',
        issuer: 'http://localhost:3001',
        audience: 'toka-api',
      }),
    );
  });

  it('issueOAuthToken returns token for password grant', async () => {
    credRepo.findOne.mockResolvedValue({
      id: 'cred-1',
      email: 'user@test.com',
      passwordHash: 'hash',
    });

    const result = await service.issueOAuthToken({
      grant_type: OAuthGrantType.PASSWORD,
      client_id: 'toka-internal-client',
      client_secret: 'toka-internal-secret',
      username: 'user@test.com',
      password: 'secret123',
      scope: 'openid profile',
    });

    expect(result).toMatchObject({
      access_token: 'signed-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'cred-1',
        email: 'user@test.com',
        scope: 'openid profile',
      }),
      expect.any(Object),
    );
  });

  it('returns OIDC metadata and JWKS', () => {
    const metadata = service.getOpenIdConfiguration();
    const jwks = service.getJwks();

    expect(metadata).toMatchObject({
      issuer: 'http://localhost:3001',
      token_endpoint: 'http://localhost:3001/oauth/token',
    });
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0]).toMatchObject({
      use: 'sig',
      alg: 'RS256',
      kid: 'toka-auth-key-1',
    });
  });
});
