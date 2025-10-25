import { Request, Response } from 'express';
import { query, transaction } from '@/utils/database';
import { hashPassword } from '@/utils/auth';
import { ApiResponse, PaginatedResponse, User } from '@/types';

export class UsersController {
  // Get all users for the current company
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get users with pagination
      const usersResult = await query(
        `SELECT id, company_id, email, name, role, permissions, is_active, 
                email_verified, last_login_at, hourly_rate, created_at, updated_at
         FROM users 
         WHERE company_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.companyId, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM users WHERE company_id = $1',
        [req.user.companyId]
      );

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse<User> = {
        success: true,
        data: usersResult.rows.map(row => ({
          id: row.id,
          companyId: row.company_id,
          email: row.email,
          passwordHash: '', // Never return password hash
          name: row.name,
          role: row.role,
          permissions: row.permissions,
          isActive: row.is_active,
          emailVerified: row.email_verified,
          lastLoginAt: row.last_login_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          hourlyRate: row.hourly_rate,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get a single user by ID
  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      const userResult = await query(
        `SELECT id, company_id, email, name, role, permissions, is_active, 
                email_verified, last_login_at, hourly_rate, created_at, updated_at
         FROM users 
         WHERE id = $1 AND company_id = $2`,
        [id, req.user.companyId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = userResult.rows[0];

      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: user.id,
          companyId: user.company_id,
          email: user.email,
          passwordHash: '', // Never return password hash
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          hourlyRate: user.hourly_rate,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Create a new user
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Only admins and managers can create users
      if (!['admin', 'manager'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      const {
        email,
        name,
        role = 'employee',
        hourlyRate,
        permissions = [],
      } = req.body;

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

      // Generate a temporary password (in production, you'd send this via email)
      const tempPassword = Math.random().toString(36).substring(2, 15);
      const passwordHash = await hashPassword(tempPassword);

      const result = await query(
        `INSERT INTO users (company_id, email, password_hash, name, role, permissions, is_active, email_verified, hourly_rate)
         VALUES ($1, $2, $3, $4, $5, $6, true, false, $7)
         RETURNING id, company_id, email, name, role, permissions, is_active, email_verified, hourly_rate, created_at, updated_at`,
        [
          req.user.companyId,
          email,
          passwordHash,
          name,
          role,
          JSON.stringify(permissions),
          hourlyRate,
        ]
      );

      const user = result.rows[0];

      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: user.id,
          companyId: user.company_id,
          email: user.email,
          passwordHash: '', // Never return password hash
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          hourlyRate: user.hourly_rate,
        },
        message: `User created successfully. Temporary password: ${tempPassword}`,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Update a user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      // Check if user exists and belongs to company
      const existingUser = await query(
        'SELECT id, role FROM users WHERE id = $1 AND company_id = $2',
        [id, req.user.companyId]
      );

      if (existingUser.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Users can only update their own profile unless they're admin/manager
      if (id !== req.user.userId && !['admin', 'manager'].includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      // Prevent non-admins from changing roles
      if (updates.role && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only admins can change user roles',
        });
        return;
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'companyId' && key !== 'passwordHash') {
          if (key === 'permissions') {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
        return;
      }

      values.push(id, req.user.companyId);
      const queryText = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND company_id = $${paramCount + 1}
        RETURNING id, company_id, email, name, role, permissions, is_active, email_verified, hourly_rate, created_at, updated_at
      `;

      const result = await query(queryText, values);
      const user = result.rows[0];

      const response: ApiResponse<User> = {
        success: true,
        data: {
          id: user.id,
          companyId: user.company_id,
          email: user.email,
          passwordHash: '', // Never return password hash
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          hourlyRate: user.hourly_rate,
        },
        message: 'User updated successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Delete a user
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Only admins can delete users
      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only admins can delete users',
        });
        return;
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
        });
        return;
      }

      // Check if user exists and belongs to company
      const existingUser = await query(
        'SELECT id FROM users WHERE id = $1 AND company_id = $2',
        [id, req.user.companyId]
      );

      if (existingUser.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Delete user (cascade will handle related records)
      await query('DELETE FROM users WHERE id = $1 AND company_id = $2', [
        id,
        req.user.companyId,
      ]);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
