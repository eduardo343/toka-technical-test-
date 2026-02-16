import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OAuthGrantType {
  PASSWORD = 'password',
  CLIENT_CREDENTIALS = 'client_credentials',
}

export class OAuthTokenDto {
  @IsEnum(OAuthGrantType)
  grant_type: OAuthGrantType;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  client_secret?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
