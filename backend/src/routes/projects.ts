import { Router } from 'express';
import { ProjectsController } from '@/controllers/projectsController';
import { authenticateToken, requireCompanyAccess } from '@/middleware/auth';
import {
  validateCreateProject,
  validateUpdateProject,
  validateUUID,
  validatePagination,
} from '@/middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireCompanyAccess);

// GET /api/projects - Get all projects with pagination
router.get('/', validatePagination, ProjectsController.getProjects);

// GET /api/projects/:id - Get single project
router.get('/:id', validateUUID('id'), ProjectsController.getProject);

// POST /api/projects - Create new project
router.post('/', validateCreateProject, ProjectsController.createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', validateUUID('id'), validateUpdateProject, ProjectsController.updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', validateUUID('id'), ProjectsController.deleteProject);

export default router;
