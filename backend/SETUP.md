# ConstructTrack Pro Backend - Phase 1 Setup Guide

## 🎉 Phase 1 Complete!

You now have a fully functional backend API with:
- ✅ Node.js/Express server with TypeScript
- ✅ PostgreSQL database with migrations
- ✅ JWT authentication system
- ✅ Multi-tenant architecture
- ✅ Security middleware (rate limiting, CORS, validation)
- ✅ Core CRUD API endpoints
- ✅ Redis caching support
- ✅ Comprehensive error handling

## 🚀 Quick Start

### 1. Prerequisites
Make sure you have these installed:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 12+** - [Download here](https://www.postgresql.org/download/)
- **Redis 6+** (optional) - [Download here](https://redis.io/download)

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Create database
createdb constructtrack

# Or using psql
psql -U postgres
CREATE DATABASE constructtrack;
\q
```

**Option B: Docker (Recommended)**
```bash
# Create docker-compose.yml in backend directory
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: constructtrack
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

```bash
# Start services
docker-compose up -d
```

### 3. Environment Configuration

```bash
# Copy environment template
cp dev.env .env

# Edit .env with your settings
DATABASE_URL=postgresql://postgres:password@localhost:5432/constructtrack
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
```

### 4. Install and Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Seed with demo data (optional)
npm run db:seed

# Test the setup
npm run test:backend
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at: **http://localhost:3001**

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Projects
- `GET /api/projects` - List projects (with pagination)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Users
- `GET /api/users` - List users (with pagination)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user (admin/manager only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Health Check
- `GET /health` - API health status
- `GET /api` - API information

## 🧪 Testing the API

### 1. Register a Company
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "My Construction Co",
    "email": "admin@mycompany.com",
    "password": "Admin123!",
    "name": "John Admin"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "Admin123!"
  }'
```

### 3. Create a Project (use token from login)
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Office Building Renovation",
    "address": "123 Main St, City, State",
    "type": "Renovation",
    "startDate": "2024-01-01",
    "endDate": "2024-06-01",
    "budget": 500000,
    "markupPercent": 20
  }'
```

## 🎭 Demo Data

If you ran `npm run db:seed`, you'll have demo data:

**Demo Company**: Demo Construction Co.
**Demo Users**:
- Admin: `admin@demo.com` / `admin123!`
- Manager: `manager@demo.com` / `manager123!`
- Employee: `employee@demo.com` / `employee123!`

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm start           # Start production server

# Database
npm run migrate      # Run migrations
npm run db:seed      # Seed demo data

# Testing
npm run test:backend # Test backend setup
npm test            # Run unit tests
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origins
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **JWT Security**: Secure token generation
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Protection**: Parameterized queries only

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   │   ├── authController.ts
│   │   ├── projectsController.ts
│   │   └── usersController.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── security.ts
│   ├── routes/         # API routes
│   │   ├── auth.ts
│   │   ├── projects.ts
│   │   └── users.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── utils/          # Utilities
│   │   ├── auth.ts
│   │   └── database.ts
│   └── index.ts        # Main server file
├── migrations/         # Database migrations
│   ├── 001_initial_schema.sql
│   ├── migrate.ts
│   └── seed.ts
└── tests/             # Test files
```

## 🚀 Next Steps (Phase 2)

1. **Frontend Integration**: Connect React app to backend API
2. **Additional Controllers**: Tasks, Time Logs, Inventory, Invoicing
3. **File Upload**: Photo/document management with AWS S3
4. **Real-time Features**: WebSocket support for live updates
5. **Advanced Features**: Reporting, analytics, notifications
6. **Stripe Integration**: Subscription billing system
7. **Production Deployment**: Docker, CI/CD, monitoring

## 🐛 Troubleshooting

**Database Connection Issues**:
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Redis Connection Issues**:
- Redis is optional for development
- Check REDIS_URL in .env
- Start Redis server

**Port Already in Use**:
- Change PORT in .env
- Kill existing process: `lsof -ti:3001 | xargs kill`

**Migration Errors**:
- Check database permissions
- Ensure PostgreSQL extensions are available
- Run migrations manually if needed

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test database connectivity
4. Review the API documentation
5. Check the troubleshooting section above

---

**🎉 Congratulations!** You now have a production-ready backend API for ConstructTrack Pro!
