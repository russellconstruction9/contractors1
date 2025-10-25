import { Request, Response } from 'express';
import { query, transaction } from '@/utils/database';
import { ApiResponse, PaginatedResponse, Project } from '@/types';

export class ProjectsController {
  // Get all projects for the current company
  static async getProjects(req: Request, res: Response): Promise<void> {
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

      // Get projects with pagination
      const projectsResult = await query(
        `SELECT p.*, 
                COUNT(t.id) as task_count,
                COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
                COUNT(pl.id) as punch_list_count,
                COUNT(CASE WHEN pl.is_complete = true THEN 1 END) as completed_punch_items
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         LEFT JOIN punch_list_items pl ON p.id = pl.project_id
         WHERE p.company_id = $1
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.companyId, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM projects WHERE company_id = $1',
        [req.user.companyId]
      );

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      const response: PaginatedResponse<Project> = {
        success: true,
        data: projectsResult.rows.map(row => ({
          id: row.id,
          companyId: row.company_id,
          name: row.name,
          address: row.address,
          type: row.type,
          status: row.status,
          startDate: row.start_date,
          endDate: row.end_date,
          budget: parseFloat(row.budget),
          currentSpend: parseFloat(row.current_spend),
          markupPercent: parseFloat(row.markup_percent),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          punchList: [], // Will be loaded separately if needed
          photos: [], // Will be loaded separately if needed
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
      console.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Get a single project by ID
  static async getProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      const projectResult = await query(
        `SELECT p.*, 
                COUNT(t.id) as task_count,
                COUNT(CASE WHEN t.status = 'Done' THEN 1 END) as completed_tasks,
                COUNT(pl.id) as punch_list_count,
                COUNT(CASE WHEN pl.is_complete = true THEN 1 END) as completed_punch_items
         FROM projects p
         LEFT JOIN tasks t ON p.id = t.project_id
         LEFT JOIN punch_list_items pl ON p.id = pl.project_id
         WHERE p.id = $1 AND p.company_id = $2
         GROUP BY p.id`,
        [id, req.user.companyId]
      );

      if (projectResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      const project = projectResult.rows[0];

      // Get punch list items
      const punchListResult = await query(
        'SELECT * FROM punch_list_items WHERE project_id = $1 ORDER BY created_at DESC',
        [id]
      );

      // Get project photos
      const photosResult = await query(
        'SELECT * FROM project_photos WHERE project_id = $1 ORDER BY date_added DESC',
        [id]
      );

      const response: ApiResponse<Project> = {
        success: true,
        data: {
          id: project.id,
          companyId: project.company_id,
          name: project.name,
          address: project.address,
          type: project.type,
          status: project.status,
          startDate: project.start_date,
          endDate: project.end_date,
          budget: parseFloat(project.budget),
          currentSpend: parseFloat(project.current_spend),
          markupPercent: parseFloat(project.markup_percent),
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          punchList: punchListResult.rows.map(item => ({
            id: item.id,
            projectId: item.project_id,
            text: item.text,
            isComplete: item.is_complete,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            photos: [], // Will be loaded separately if needed
          })),
          photos: photosResult.rows.map(photo => ({
            id: photo.id,
            projectId: photo.project_id,
            description: photo.description,
            imageUrl: photo.image_url,
            imageKey: photo.image_key,
            dateAdded: photo.date_added,
            createdAt: photo.created_at,
          })),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Create a new project
  static async createProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const {
        name,
        address,
        type,
        status = 'In Progress',
        startDate,
        endDate,
        budget,
        markupPercent = 20,
      } = req.body;

      const result = await query(
        `INSERT INTO projects (company_id, name, address, type, status, start_date, end_date, budget, markup_percent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.user.companyId,
          name,
          address,
          type,
          status,
          startDate,
          endDate,
          budget,
          markupPercent,
        ]
      );

      const project = result.rows[0];

      const response: ApiResponse<Project> = {
        success: true,
        data: {
          id: project.id,
          companyId: project.company_id,
          name: project.name,
          address: project.address,
          type: project.type,
          status: project.status,
          startDate: project.start_date,
          endDate: project.end_date,
          budget: parseFloat(project.budget),
          currentSpend: parseFloat(project.current_spend),
          markupPercent: parseFloat(project.markup_percent),
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          punchList: [],
          photos: [],
        },
        message: 'Project created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Update a project
  static async updateProject(req: Request, res: Response): Promise<void> {
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

      // Check if project exists and belongs to company
      const existingProject = await query(
        'SELECT id FROM projects WHERE id = $1 AND company_id = $2',
        [id, req.user.companyId]
      );

      if (existingProject.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key !== 'id' && key !== 'companyId') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
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
        UPDATE projects 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND company_id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await query(queryText, values);
      const project = result.rows[0];

      const response: ApiResponse<Project> = {
        success: true,
        data: {
          id: project.id,
          companyId: project.company_id,
          name: project.name,
          address: project.address,
          type: project.type,
          status: project.status,
          startDate: project.start_date,
          endDate: project.end_date,
          budget: parseFloat(project.budget),
          currentSpend: parseFloat(project.current_spend),
          markupPercent: parseFloat(project.markup_percent),
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          punchList: [],
          photos: [],
        },
        message: 'Project updated successfully',
      };

      res.json(response);
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Delete a project
  static async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      // Check if project exists and belongs to company
      const existingProject = await query(
        'SELECT id FROM projects WHERE id = $1 AND company_id = $2',
        [id, req.user.companyId]
      );

      if (existingProject.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      // Delete project (cascade will handle related records)
      await query('DELETE FROM projects WHERE id = $1 AND company_id = $2', [
        id,
        req.user.companyId,
      ]);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}
