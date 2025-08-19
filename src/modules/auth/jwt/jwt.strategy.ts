import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../user/repository/user.repository';
import { CompanyRepository } from '../../company/repository/company.repository';
import { AuthenticatedPrincipal } from '../types/principal.types';
import {
  mapUserToPrincipal,
  mapCompanyToPrincipal,
} from '../utils/principal.mapper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      issuer: 'vagas-api',
      audience: 'vagas-api-users',
    });
  }

  async validate(payload: { email: string }) {
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid payload or email');
    }

    try {
      const user = await this.userRepository.findOneByEmail(payload.email);

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return { ...safeUser, userType: 'user' };
      }

      const company = await this.companyRepository.findOneByEmail(
        payload.email,
      );

      if (company) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeCompany } = company;
        return { ...safeCompany, userType: 'company' };
      }

      throw new UnauthorizedException('User not found or not authorized!');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw error;
    }
  }
}
