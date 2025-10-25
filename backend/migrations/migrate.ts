import { readFileSync } from 'fs';
import { join } from 'path';
import { query, testConnection } from './src/utils/database';

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Check if migrations table exists
    const migrationsTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!migrationsTableExists.rows[0].exists) {
      console.log('📋 Creating migrations table...');
      await query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }

    // Get list of executed migrations
    const executedMigrations = await query('SELECT filename FROM migrations ORDER BY id');
    const executedFilenames = executedMigrations.rows.map(row => row.filename);

    // Read migration files
    const migrationFiles = [
      '001_initial_schema.sql',
    ];

    for (const filename of migrationFiles) {
      if (executedFilenames.includes(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`🔄 Executing ${filename}...`);
      
      try {
        const migrationPath = join(__dirname, 'migrations', filename);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        await query(migrationSQL);
        
        // Record migration as executed
        await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        
        console.log(`✅ Successfully executed ${filename}`);
      } catch (error) {
        console.error(`❌ Failed to execute ${filename}:`, error);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export { runMigrations };
