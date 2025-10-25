"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("./src/utils/database");
const runMigrations = async () => {
    try {
        console.log('🔄 Starting database migrations...');
        const connected = await (0, database_1.testConnection)();
        if (!connected) {
            console.error('❌ Failed to connect to database');
            process.exit(1);
        }
        const migrationsTableExists = await (0, database_1.query)(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
        if (!migrationsTableExists.rows[0].exists) {
            console.log('📋 Creating migrations table...');
            await (0, database_1.query)(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT NOW()
        );
      `);
        }
        const executedMigrations = await (0, database_1.query)('SELECT filename FROM migrations ORDER BY id');
        const executedFilenames = executedMigrations.rows.map(row => row.filename);
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
                const migrationPath = (0, path_1.join)(__dirname, 'migrations', filename);
                const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
                await (0, database_1.query)(migrationSQL);
                await (0, database_1.query)('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
                console.log(`✅ Successfully executed ${filename}`);
            }
            catch (error) {
                console.error(`❌ Failed to execute ${filename}:`, error);
                throw error;
            }
        }
        console.log('🎉 All migrations completed successfully!');
    }
    catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
};
exports.runMigrations = runMigrations;
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
//# sourceMappingURL=migrate.js.map