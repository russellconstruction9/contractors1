import { query, transaction } from './src/utils/database';
import { hashPassword } from './src/utils/auth';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const existingCompanies = await query('SELECT COUNT(*) FROM companies');
    if (parseInt(existingCompanies.rows[0].count) > 0) {
      console.log('⏭️  Database already has data, skipping seed');
      return;
    }

    await transaction(async (client) => {
      // Create demo company
      const companyResult = await client.query(`
        INSERT INTO companies (name, slug, subscription_plan, subscription_status, settings)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        'Demo Construction Co.',
        'demo-construction-co',
        'premium',
        'active',
        JSON.stringify({
          timezone: 'America/New_York',
          currency: 'USD',
          defaultMarkupPercent: 20,
          features: ['ai_assistant', 'advanced_reporting', 'api_access'],
          maxUsers: 50,
          maxProjects: -1,
          storageGB: 100,
        })
      ]);

      const companyId = companyResult.rows[0].id;

      // Create demo users
      const adminPassword = await hashPassword('admin123!');
      const managerPassword = await hashPassword('manager123!');
      const employeePassword = await hashPassword('employee123!');

      const users = [
        {
          email: 'admin@demo.com',
          password: adminPassword,
          name: 'Admin User',
          role: 'admin',
          permissions: ['all'],
        },
        {
          email: 'manager@demo.com',
          password: managerPassword,
          name: 'Manager User',
          role: 'manager',
          permissions: ['manage_projects', 'manage_tasks', 'view_reports'],
        },
        {
          email: 'employee@demo.com',
          password: employeePassword,
          name: 'Employee User',
          role: 'employee',
          permissions: ['clock_in_out', 'view_tasks'],
          hourlyRate: 25.00,
        },
      ];

      const userIds: string[] = [];
      for (const user of users) {
        const userResult = await client.query(`
          INSERT INTO users (company_id, email, password_hash, name, role, permissions, is_active, email_verified, hourly_rate)
          VALUES ($1, $2, $3, $4, $5, $6, true, true, $7)
          RETURNING id
        `, [
          companyId,
          user.email,
          user.password,
          user.name,
          user.role,
          JSON.stringify(user.permissions),
          user.hourlyRate || null,
        ]);
        userIds.push(userResult.rows[0].id);
      }

      // Create demo projects
      const projects = [
        {
          name: 'Sally Wertman Renovation',
          address: '23296 US 12 W, Sturgis, MI 49091',
          type: 'Renovation',
          status: 'In Progress',
          startDate: '2024-08-20',
          endDate: '2025-01-20',
          budget: 150000,
          currentSpend: 45000,
          markupPercent: 20,
        },
        {
          name: 'Tony Szafranski New Construction',
          address: '1370 E 720 S, Wolcottville, IN 46795',
          type: 'New Construction',
          status: 'In Progress',
          startDate: '2024-09-05',
          endDate: '2025-05-05',
          budget: 320000,
          currentSpend: 80000,
          markupPercent: 15,
        },
        {
          name: 'Joe Eicher Interior Fit-Out',
          address: '6430 S 125 E, Wolcottville, IN 46795',
          type: 'Interior Fit-Out',
          status: 'On Hold',
          startDate: '2024-07-20',
          endDate: '2025-02-20',
          budget: 75000,
          currentSpend: 25000,
          markupPercent: 25,
        },
      ];

      const projectIds: string[] = [];
      for (const project of projects) {
        const projectResult = await client.query(`
          INSERT INTO projects (company_id, name, address, type, status, start_date, end_date, budget, current_spend, markup_percent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `, [
          companyId,
          project.name,
          project.address,
          project.type,
          project.status,
          project.startDate,
          project.endDate,
          project.budget,
          project.currentSpend,
          project.markupPercent,
        ]);
        projectIds.push(projectResult.rows[0].id);
      }

      // Create demo tasks
      const tasks = [
        {
          projectId: projectIds[0],
          title: 'Install kitchen cabinets',
          description: 'Install custom kitchen cabinets in the main kitchen area',
          assigneeId: userIds[2], // employee
          dueDate: '2024-12-15',
          status: 'In Progress',
        },
        {
          projectId: projectIds[0],
          title: 'Paint living room',
          description: 'Apply primer and two coats of paint to living room walls',
          assigneeId: userIds[2], // employee
          dueDate: '2024-12-20',
          status: 'To Do',
        },
        {
          projectId: projectIds[1],
          title: 'Foundation inspection',
          description: 'Schedule and complete foundation inspection with city inspector',
          assigneeId: userIds[1], // manager
          dueDate: '2024-11-30',
          status: 'Done',
        },
      ];

      for (const task of tasks) {
        await client.query(`
          INSERT INTO tasks (company_id, project_id, title, description, assignee_id, due_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          companyId,
          task.projectId,
          task.title,
          task.description,
          task.assigneeId,
          task.dueDate,
          task.status,
        ]);
      }

      // Create demo inventory items
      const inventoryItems = [
        {
          name: '2x4 Lumber',
          quantity: 150,
          unit: 'pieces',
          cost: 3.50,
          lowStockThreshold: 20,
        },
        {
          name: 'Drywall Sheets',
          quantity: 45,
          unit: 'sheets',
          cost: 12.00,
          lowStockThreshold: 10,
        },
        {
          name: 'Paint Primer',
          quantity: 8,
          unit: 'gallons',
          cost: 25.00,
          lowStockThreshold: 2,
        },
        {
          name: 'Nails',
          quantity: 5000,
          unit: 'pieces',
          cost: 0.05,
          lowStockThreshold: 500,
        },
      ];

      for (const item of inventoryItems) {
        await client.query(`
          INSERT INTO inventory_items (company_id, name, quantity, unit, cost, low_stock_threshold)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          companyId,
          item.name,
          item.quantity,
          item.unit,
          item.cost,
          item.lowStockThreshold,
        ]);
      }

      // Create demo punch list items
      const punchListItems = [
        {
          projectId: projectIds[0],
          text: 'Fix front door lock',
          isComplete: false,
        },
        {
          projectId: projectIds[0],
          text: 'Paint trim in living room',
          isComplete: true,
        },
        {
          projectId: projectIds[0],
          text: 'Repair drywall patch in hallway',
          isComplete: false,
        },
        {
          projectId: projectIds[1],
          text: 'Install kitchen backsplash',
          isComplete: false,
        },
      ];

      for (const item of punchListItems) {
        await client.query(`
          INSERT INTO punch_list_items (project_id, text, is_complete)
          VALUES ($1, $2, $3)
        `, [
          item.projectId,
          item.text,
          item.isComplete,
        ]);
      }

      console.log('✅ Demo data created successfully!');
      console.log('📧 Demo login credentials:');
      console.log('   Admin: admin@demo.com / admin123!');
      console.log('   Manager: manager@demo.com / manager123!');
      console.log('   Employee: employee@demo.com / employee123!');
    });
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
