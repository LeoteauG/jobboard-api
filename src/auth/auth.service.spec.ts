import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const mockUser = {
  id: 'uuid-123',
  email: 'test@test.com',
  password: 'hashedpassword',
  role: UserRole.CANDIDATE,
  isActive: true,
};

const mockUsersService = {
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('debe registrar un usuario y retornar token', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@test.com',
        password: '123456',
        role: UserRole.CANDIDATE,
      });

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('login', () => {
    it('debe retornar token con credenciales válidas', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.login({
        email: 'test@test.com',
        password: '123456',
      });

      expect(result.token).toBe('mock-token');
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
