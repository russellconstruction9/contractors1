import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/auth';
import { query } from '@/utils/database';
import { JwtPayload } from '@/types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    
    // Verify user still exists and is active
    const userResult = await query(
      'SELECT id, company_id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: 'User account is deactivated',
      });
      return;
    }

    req.user = {
      ...decoded,
      userId: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Get user permissions
      const userResult = await query(
        'SELECT permissions FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const permissions = userResult.rows[0].permissions || [];
      
      if (!permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: `Permission '${permission}' required`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
};

export const requireCompanyAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Check if user is accessing their own company's data
  const companyId = req.params.companyId || req.body.companyId;
  
  if (companyId && companyId !== req.user.companyId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to company data',
    });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      
      const userResult = await query(
        'SELECT id, company_id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        req.user = {
          ...decoded,
          userId: user.id,
          companyId: user.company_id,
          email: user.email,
          role: user.role,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
