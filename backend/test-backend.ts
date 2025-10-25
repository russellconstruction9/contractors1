import { testConnection, initRedis } from './src/utils/database';

const testBackend = async () => {
  console.log('🧪 Testing ConstructTrack Pro Backend...\n');

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('✅ Database connection successful\n');
    } else {
      console.log('❌ Database connection failed\n');
      return;
    }

    // Test Redis connection
    console.log('🔄 Testing Redis connection...');
    await initRedis();
    console.log('✅ Redis connection successful\n');

    // Test basic queries
    console.log('🔍 Testing basic database queries...');
    const { query } = await import('./src/utils/database');
    
    // Test companies table
    const companiesResult = await query('SELECT COUNT(*) FROM companies');
    console.log(`✅ Companies table accessible (${companiesResult.rows[0].count} records)`);
    
    // Test users table
    const usersResult = await query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users table accessible (${usersResult.rows[0].count} records)`);
    
    // Test projects table
    const projectsResult = await query('SELECT COUNT(*) FROM projects');
    console.log(`✅ Projects table accessible (${projectsResult.rows[0].count} records)\n`);

    console.log('🎉 All backend tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your .env file with database credentials');
    console.log('2. Run: npm run migrate (to create tables)');
    console.log('3. Run: npm run db:seed (to add demo data)');
    console.log('4. Run: npm run dev (to start the server)');
    console.log('\n🔗 API will be available at: http://localhost:3001');

  } catch (error) {
    console.error('💥 Backend test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your DATABASE_URL in .env');
    console.log('3. Ensure Redis is running (optional)');
    console.log('4. Run migrations: npm run migrate');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testBackend()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test process failed:', error);
      process.exit(1);
    });
}

export { testBackend };
