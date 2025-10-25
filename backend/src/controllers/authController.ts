import { Request, Response } from 'express';
import { query, transaction } from '@/utils/database';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  validateEmail,
  generateCompanySlug,
  generateVerificationToken,
} from '@/utils/auth';
import { LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '@/types';

export class AuthController {
  // Register a new company and admin user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, email, password, name }: RegisterRequest = req.body;

      // Check if email already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'Email already registered',
        });
        return;
      }

      // Generate company slug and check for uniqueness
      let slug = generateCompanySlug(companyName);
      let slugCounter = 1;
      
      while (true) {
        const existingCompany = await query(
          'SELECT id FROM companies WHERE slug = $1',
          [slug]
        );
        
        if (existingCompany.rows.length === 0) {
          break;
        }
        
        slug = `${generateCompanySlug(companyName)}-${slugCounter}`;
        slugCounter++;
      }

      // Create company and user in a transaction
      const result = await transaction(async (client) => {
        // Create company
        const companyResult = await client.query(
          `INSERT INTO companies (name, slug, subscription_plan, subscription_status, settings)
           VALUES ($1, $2, 'free', 'active', $3)
           RETURNING id, name, slug, subscription_plan, subscription_status, settings, created_at`,
          [
            companyName,
            slug,
            JSON.stringify({
              timezone: 'UTC',
              currency: 'USD',
              defaultMarkupPercent: 20,
              features: [],
              maxUsers: 3,
              maxProjects: 5,
              storageGB: 1,
            }),
          ]
        );

        const company = companyResult.rows[0];

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create admin user
        const verificationToken = generateVerificationToken();
        const userResult = await client.query(
          `INSERT INTO users (company_id, email, password_hash, name, role, permissions, is_active, email_verified, verification_token)
           VALUES ($1, $2, $3, $4, 'admin', $5, true, false, $6)
           RETURNING id, email, name, role, permissions, is_active, email_verified, created_at`,
          [
            company.id,
            email,
            passwordHash,
            name,
            JSON.stringify(['all']),
            verificationToken,
          ]
        );

        const user = userResult.rows[0];

        return { company, user };
      });

      // Generate tokens
      const tokens = generateTokens({
        id: result.user.id,
        companyId: result.company.id,
        email: result.user.email,
        passwordHash: '', // Not needed for token generation
        name: result.user.name,
        role: result.user.role,
        permissions: result.user.permissions,
        isActive: result.user.is_active,
        emailVerified: result.user.email_verified,
        createdAt: result.user.created_at,
        updatedAt: result.user.created_at,
      });

      const response: AuthResponse = {
        user: {
          id: result.user.id,
          companyId: result.company.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          permissions: result.user.permissions,
          isActive: result.user.is_active,
          emailVerified: result.user.email_verified,
          createdAt: result.user.created_at,
          updatedAt: result.user.created_at,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
          subscriptionPlan: result.company.subscription_plan,
          subscriptionStatus: result.company.subscription_status,
          createdAt: result.company.created_at,
          updatedAt: result.company.created_at,
          settings: result.company.settings,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'Company and admin user created successfully',
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Find user with company information
      const userResult = await query(
        `SELECT u.id, u.company_id, u.email, u.password_hash, u.name, u.role, u.permissions, 
                u.is_active, u.email_verified, u.last_login_at, u.created_at, u.updated_at,
                c.name as company_name, c.slug, c.subscription_plan, c.subscription_status, c.settings
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      const userData = userResult.rows[0];

      // Check if user is active
      if (!userData.is_active) {
        res.status(401).json({
          success: false,
          error: 'Account is deactivated',
        });
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, userData.password_hash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [userData.id]
      );

      // Generate tokens
      const tokens = generateTokens({
        id: userData.id,
        companyId: userData.company_id,
        email: userData.email,
        passwordHash: '', // Not needed for token generation
        name: userData.name,
        role: userData.role,
        permissions: userData.permissions,
        isActive: userData.is_active,
        emailVerified: userData.email_verified,
        lastLoginAt: userData.last_login_at,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      });

      const response: AuthResponse = {
        user: {
          id: userData.id,
          companyId: userData.company_id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          permissions: userData.permissions,
          isActive: userData.is_active,
          emailVerified: userData.email_verified,
          lastLoginAt: userData.last_login_at,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        },
        company: {
          id: userData.company_id,
          name: userData.company_name,
          slug: userData.slug,
          subscriptionPlan: userData.subscription_plan,
          subscriptionStatus: userData.subscription_status,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          settings: userData.settings,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };

      res.json({
        success: true,
        data: response,
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token required',
        });
        return;
      }

      // Verify refresh token
      const { verifyRefreshToken, generateAccessToken } = await import('@/utils/auth');
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const userResult = await query(
        'SELECT id, company_id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      const user = userResult.rows[0];

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user.id,
        companyId: user.company_id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more sophisticated implementation, you might want to:
      // 1. Add the token to a blacklist
      // 2. Remove refresh tokens from the database
      // 3. Log the logout event

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get current user info
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get user with company information
      const userResult = await query(
        `SELECT u.id, u.company_id, u.email, u.name, u.role, u.permissions, 
                u.is_active, u.email_verified, u.last_login_at, u.created_at, u.updated_at,
                c.name as company_name, c.slug, c.subscription_plan, c.subscription_status, c.settings
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.id = $1`,
        [req.user.userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const userData = userResult.rows[0];

      const response = {
        user: {
          id: userData.id,
          companyId: userData.company_id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          permissions: userData.permissions,
          isActive: userData.is_active,
          emailVerified: userData.email_verified,
          lastLoginAt: userData.last_login_at,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        },
        company: {
          id: userData.company_id,
          name: userData.company_name,
          slug: userData.slug,
          subscriptionPlan: userData.subscription_plan,
          subscriptionStatus: userData.subscription_status,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          settings: userData.settings,
        },
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
