# ConstructTrack Pro Backend API

A robust Node.js/Express backend API for the ConstructTrack Pro construction management platform.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with refresh tokens
- 🏢 **Multi-tenant Architecture** - Company-based data isolation
- 📊 **PostgreSQL Database** - Reliable data storage with migrations
- 🚀 **Redis Caching** - Fast session and cache management
- 🛡️ **Security Middleware** - Rate limiting, CORS, helmet, validation
- 📝 **Comprehensive API** - RESTful endpoints for all features
- 🔄 **Database Migrations** - Version-controlled schema changes
- 🌱 **Seed Data** - Demo data for development and testing

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with pg driver
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, rate-limiting
- **File Upload**: multer + AWS S3

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Set up the database**:
   ```bash
   # Create PostgreSQL database
   createdb constructtrack
   
   # Run migrations
   npm run migrate
   
   # Seed with demo data (optional)
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/constructtrack
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate strong secrets for production)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# External APIs
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Email (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@constructtrack.com

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=constructtrack-files

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company and admin user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Health Check
- `GET /health` - API health status
- `GET /api` - API information

## Database Schema

The database uses a multi-tenant architecture with the following main tables:

- **companies** - Tenant/company information
- **users** - User accounts with company association
- **projects** - Construction projects
- **tasks** - Project tasks and assignments
- **time_logs** - Employee time tracking
- **inventory_items** - Material inventory
- **material_logs** - Material usage tracking
- **punch_list_items** - Project completion items
- **project_photos** - Photo documentation
- **invoices** - Billing and invoicing

## Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Database
npm run migrate      # Run database migrations
npm run db:seed      # Seed database with demo data

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for XSS, CSRF protection
- **Input Validation**: Comprehensive request validation
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Secure token generation and verification
- **SQL Injection Protection**: Parameterized queries only

## Development

### Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/         # Database models (future)
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic services
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── migrations/         # Database migration files
├── tests/             # Test files
└── dist/              # Compiled JavaScript (generated)
```

### Adding New Features

1. **Define types** in `src/types/index.ts`
2. **Create controller** in `src/controllers/`
3. **Add validation** in `src/middleware/validation.ts`
4. **Define routes** in `src/routes/`
5. **Add database migrations** if needed
6. **Write tests** in `tests/`

### Database Migrations

Create new migration files in `migrations/` directory:

```bash
# Example: migrations/002_add_new_table.sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Production Deployment

### Environment Setup

1. **Set production environment variables**
2. **Use strong JWT secrets**
3. **Configure production database**
4. **Set up Redis instance**
5. **Configure file storage (AWS S3)**

### Deployment Options

- **Railway**: Easy Node.js deployment
- **Render**: Managed hosting with PostgreSQL
- **DigitalOcean**: App Platform with managed databases
- **AWS**: EC2 with RDS and ElastiCache
- **Heroku**: Platform-as-a-Service

### Performance Considerations

- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Connection Pooling**: Configure PostgreSQL connection pool
- **Redis Caching**: Cache frequently accessed data
- **CDN**: Use CloudFlare or AWS CloudFront for static assets
- **Monitoring**: Set up logging and error tracking (Sentry, DataDog)

## Demo Data

The seed script creates demo data including:

- **Demo Company**: "Demo Construction Co."
- **Users**: Admin, Manager, Employee accounts
- **Projects**: Sample construction projects
- **Tasks**: Assigned project tasks
- **Inventory**: Common construction materials
- **Punch Lists**: Project completion items

**Demo Login Credentials**:
- Admin: `admin@demo.com` / `admin123!`
- Manager: `manager@demo.com` / `manager123!`
- Employee: `employee@demo.com` / `employee123!`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
