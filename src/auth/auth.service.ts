import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { Organization, type OrganizationRole } from '../organizations/entities/organization.entity.js';
import { Session } from './entities/session.entity.js';
import { hashPassword, verifyPassword } from './password.js';
import type { AdminLoginDto } from './dto/admin-login.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';

export const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface OrganizationView {
  id: string;
  identificationCode: string;
  email: string;
  role: OrganizationRole;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toView(org: Organization): OrganizationView {
  return { id: org.id, identificationCode: org.identificationCode, email: org.email, role: org.role };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  async register(dto: RegisterDto): Promise<OrganizationView> {
    const exists = await this.organizations.exists({
      where: [{ identificationCode: dto.identificationCode }, { email: dto.email }],
    });
    if (exists) throw new ConflictException('Organization already registered');

    const org = await this.organizations.save(
      this.organizations.create({
        identificationCode: dto.identificationCode,
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
      }),
    );
    return toView(org);
  }

  async login(dto: LoginDto) {
    const org = await this.organizations.findOne({
      where: { identificationCode: dto.identificationCode },
      select: { id: true, identificationCode: true, email: true, role: true, passwordHash: true },
    });
    const valid = await verifyPassword(dto.password, org?.passwordHash ?? '');
    if (!org || !valid) throw new UnauthorizedException('Invalid credentials');
    return this.startSession(org);
  }

  // Same answer for a wrong password and a non-admin account, so admins cannot be discovered.
  async adminLogin(dto: AdminLoginDto) {
    const org = await this.organizations.findOne({
      where: { email: dto.email },
      select: { id: true, identificationCode: true, email: true, role: true, passwordHash: true },
    });
    const valid = await verifyPassword(dto.password, org?.passwordHash ?? '');
    if (!org || !valid || org.role !== 'admin') throw new UnauthorizedException('Invalid credentials');
    return this.startSession(org);
  }

  private async startSession(org: Organization) {
    // Clears every expired session, not only this organization's.
    await this.sessions.delete({ expiresAt: LessThan(new Date()) });
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessions.save(
      this.sessions.create({ tokenHash: hashToken(token), organizationId: org.id, expiresAt }),
    );
    return { token, expiresAt: expiresAt.toISOString(), organization: toView(org) };
  }

  async logout(token: string): Promise<void> {
    await this.sessions.delete({ tokenHash: hashToken(token) });
  }

  async findOrganizationByToken(token: string): Promise<OrganizationView | null> {
    const session = await this.sessions.findOne({
      where: { tokenHash: hashToken(token) },
      relations: { organization: true },
    });
    if (!session?.organization || session.expiresAt.getTime() <= Date.now()) return null;
    return toView(session.organization);
  }
}
