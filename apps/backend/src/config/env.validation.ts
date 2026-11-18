import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsPort,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

/** Settings the backend needs to start; see .env.example. */
class EnvironmentVariables {
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must be a postgres:// connection string',
  })
  DATABASE_URL!: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  WEB_URL!: string;

  @MinLength(32)
  BETTER_AUTH_SECRET!: string;

  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsOptional()
  @IsString()
  TRUST_PROXY?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsPort()
  SMTP_PORT?: string;

  @ValidateIf((env: EnvironmentVariables) => env.SMTP_HOST !== undefined)
  @IsNotEmpty({ message: 'SMTP_USER is required when SMTP_HOST is set' })
  SMTP_USER?: string;

  @ValidateIf((env: EnvironmentVariables) => env.SMTP_HOST !== undefined)
  @IsNotEmpty({ message: 'SMTP_PASS is required when SMTP_HOST is set' })
  SMTP_PASS?: string;
}

/**
 * Fails startup with every missing or malformed setting at once, instead of
 * the first request that happens to need one. Empty values (`SMTP_HOST=`)
 * count as unset.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const set = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== ''),
  );
  const env = plainToInstance(EnvironmentVariables, set);
  const errors = validateSync(env);

  if (errors.length > 0) {
    const problems = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(
      `Invalid environment (see .env.example):\n- ${problems.join('\n- ')}`,
    );
  }

  return config;
}
