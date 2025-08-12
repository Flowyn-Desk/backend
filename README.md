# Service Ticket Management System

A comprehensive backend API for managing service tickets with role-based access control, AI-powered severity suggestions, and automated workflow processing.

## 🚀 Features

- **Role-Based Access Control**: Manager, Associate, and Admin roles with specific permissions
- **AI Integration**: Automated severity suggestions using LLM APIs
- **Ticket Lifecycle Management**: Draft → Review → Pending → Open → Closed workflow
- **CSV Import/Export**: Seamless data exchange with external systems
- **Workspace Isolation**: Multi-tenant architecture with workspace-based access control
- **Automated Processing**: Scheduled jobs for ticket status updates
- **Audit Trail**: Complete ticket history tracking
- **Soft Delete**: Safe ticket deletion with recovery options

## 🏗️ Architecture

The project follows Clean Architecture principles with clear separation of concerns:

```
src/
├── application/
│   ├── dto/                    # Data Transfer Objects
│   ├── infrastructure/
│   │   ├── database/           # Repository implementations
│   │   └── web/
│   │       ├── controllers/    # API Controllers
│   │       ├── middleware/     # Authentication & Authorization
│   │       └── routes/         # Route definitions
│   └── services/               # Business logic implementations
├── domain/
│   ├── entities/               # Domain entities
│   ├── enums/                  # System enumerations
│   ├── repositories/           # Repository interfaces
│   └── services/               # Service interfaces
└── shared/
    ├── Errors/                 # Custom error classes
    └── Logger.ts               # Logging utilities
```

## 🔐 User Roles & Permissions

### Associate
- Create new tickets
- Update own ticket details (title, description)
- Accept/override AI severity suggestions
- View workspace tickets

### Manager
- Review tickets in Draft status
- Approve or modify ticket severity
- Export pending tickets to CSV
- Import processed CSV files
- All Associate permissions

### Admin
- Create and manage users
- Manage workspace membership
- All Manager permissions

## 🎫 Ticket Lifecycle

```mermaid
graph TD
    A[Draft] --> B{Manager Review}
    B -->|Approved| C[Pending]
    B -->|Severity Increased| D[Review]
    D -->|Associate Updates| A
    C -->|CSV Export/Import| E[Open]
    E -->|External Processing| F[Closed]
```

**Status Definitions:**
- **Draft**: Newly created, awaiting manager review
- **Review**: Severity increased by manager, needs associate attention
- **Pending**: Approved by manager, eligible for CSV export
- **Open**: Being processed by external system
- **Closed**: Resolved by external system

## 📋 API Endpoints

All API responses follow this format:
```json
{
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Success message"
}
```

### Authentication

#### POST `/api/users/login`
**Description:** User authentication
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ASSOCIATE",
      "workspaceUuid": "workspace-uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

#### GET `/api/users/profile`
**Headers:** `Authorization: Bearer <token>`
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ASSOCIATE",
    "workspaceUuid": "workspace-uuid",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "message": "Profile retrieved successfully"
}
```

#### PUT `/api/users/change-password`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "oldPassword": "currentPassword",
  "newPassword": "newPassword123"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password changed successfully"
}
```

### Ticket Management

#### POST `/api/tickets` (Associate+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Body:**
```json
{
  "title": "Database connection issue",
  "description": "Unable to connect to production database",
  "dueDate": "2025-01-20T23:59:59Z",
  "severity": "HIGH"
}
```
**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "uuid": "ticket-uuid",
    "ticketNumber": "TKT-2025-000001",
    "title": "Database connection issue",
    "description": "Unable to connect to production database",
    "status": "DRAFT",
    "severity": "HIGH",
    "dueDate": "2025-01-20T23:59:59Z",
    "createdByUuid": "user-uuid",
    "workspaceUuid": "workspace-uuid",
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "message": "Ticket created successfully"
}
```

#### GET `/api/tickets`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "uuid": "ticket-uuid",
      "ticketNumber": "TKT-2025-000001",
      "title": "Database connection issue",
      "status": "DRAFT",
      "severity": "HIGH",
      "createdAt": "2025-01-15T10:00:00Z",
      "createdBy": {
        "uuid": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "message": "Tickets retrieved successfully"
}
```

#### GET `/api/tickets/my-tickets` (Associate+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:** Same as GET `/api/tickets` but filtered to current user's tickets

#### GET `/api/tickets/:uuid`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "ticket-uuid",
    "ticketNumber": "TKT-2025-000001",
    "title": "Database connection issue",
    "description": "Unable to connect to production database",
    "status": "DRAFT",
    "severity": "HIGH",
    "dueDate": "2025-01-20T23:59:59Z",
    "createdByUuid": "user-uuid",
    "workspaceUuid": "workspace-uuid",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  "message": "Ticket retrieved successfully"
}
```

#### GET `/api/tickets/number/:ticketNumber`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Example:** GET `/api/tickets/number/TKT-2025-000001`
**Response:** Same as GET `/api/tickets/:uuid`

#### GET `/api/tickets/status/:status`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Example:** GET `/api/tickets/status/PENDING`
**Available statuses:** `DRAFT`, `REVIEW`, `PENDING`, `OPEN`, `CLOSED`
**Response:** Array of tickets with specified status

#### PUT `/api/tickets/:uuid/details` (Associate+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Body:**
```json
{
  "title": "Updated ticket title",
  "description": "Updated description"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "ticket-uuid",
    "title": "Updated ticket title",
    "description": "Updated description",
    "status": "DRAFT",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "message": "Ticket updated successfully"
}
```

#### PUT `/api/tickets/:uuid/review` (Manager+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Body:**
```json
{
  "newSeverity": "VERY_HIGH",
  "reason": "Critical production issue affecting all users"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "ticket-uuid",
    "severity": "VERY_HIGH",
    "status": "REVIEW",
    "updatedAt": "2025-01-15T11:00:00Z"
  },
  "message": "Ticket reviewed successfully"
}
```

#### DELETE `/api/tickets/:uuid`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "ticket-uuid",
    "deletedAt": "2025-01-15T11:00:00Z"
  },
  "message": "Ticket deleted successfully"
}
```

#### GET `/api/tickets/:uuid/history`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "uuid": "history-uuid",
      "ticketUuid": "ticket-uuid",
      "actionType": "STATUS_CHANGE",
      "oldValue": "DRAFT",
      "newValue": "PENDING",
      "reason": "Approved for processing",
      "changedByUuid": "manager-uuid",
      "changedAt": "2025-01-15T11:00:00Z"
    }
  ],
  "message": "Ticket history retrieved successfully"
}
```

#### GET `/api/tickets/:uuid/can-review` (Manager+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": true,
  "message": "User can review this ticket"
}
```

### AI Integration

#### POST `/api/tickets/suggest-severity` (Associate+)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "title": "Database connection timeout",
  "description": "Production database is not responding, affecting all users"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": "VERY_HIGH",
  "message": "Severity suggestion generated successfully"
}
```

### CSV Operations

#### GET `/api/tickets/export` (Manager+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:** CSV file download
```csv
uuid,ticketNumber,title,description,severity,status,dueDate,createdAt
ticket-uuid-1,TKT-2025-000001,Database Issue,Connection timeout,HIGH,PENDING,2025-01-20T23:59:59Z,2025-01-15T10:00:00Z
```

#### POST `/api/tickets/import` (Manager+)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`
- `Content-Type: multipart/form-data`

**Body:** Form data with CSV file
**CSV Format:**
```csv
uuid,status
ticket-uuid-1,OPEN
ticket-uuid-2,CLOSED
```
**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Tickets imported successfully"
}
```

### User Management

#### POST `/api/users` (Admin)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "securePassword123",
  "role": "ASSOCIATE",
  "workspaceUuid": "workspace-uuid"
}
```
**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "uuid": "new-user-uuid",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "ASSOCIATE",
    "workspaceUuid": "workspace-uuid",
    "createdAt": "2025-01-15T12:00:00Z"
  },
  "message": "User created successfully"
}
```

#### GET `/api/users`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    {
      "uuid": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ASSOCIATE",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

#### PUT `/api/users/:uuid` (Admin)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "Updated Name",
  "role": "MANAGER"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "user-uuid",
    "name": "Updated Name",
    "role": "MANAGER",
    "updatedAt": "2025-01-15T12:00:00Z"
  },
  "message": "User updated successfully"
}
```

### Workspace Management

#### POST `/api/workspaces` (Admin)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "name": "Development Team",
  "key": "DEV-TEAM",
  "description": "Development team workspace"
}
```
**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "uuid": "workspace-uuid",
    "name": "Development Team",
    "key": "DEV-TEAM",
    "description": "Development team workspace",
    "createdAt": "2025-01-15T12:00:00Z"
  },
  "message": "Workspace created successfully"
}
```

#### GET `/api/workspaces/key/:key`
**Headers:** `Authorization: Bearer <token>`
**Example:** GET `/api/workspaces/key/DEV-TEAM`
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "uuid": "workspace-uuid",
    "name": "Development Team",
    "key": "DEV-TEAM",
    "description": "Development team workspace"
  },
  "message": "Workspace retrieved successfully"
}
```

#### POST `/api/workspaces/add-user` (Admin)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Body:**
```json
{
  "userUuid": "user-uuid-to-add"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "User added to workspace successfully"
}
```

#### POST `/api/workspaces/remove-user` (Admin)
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Body:**
```json
{
  "userUuid": "user-uuid-to-remove"
}
```
**Response:**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "User removed from workspace successfully"
}
```

#### GET `/api/workspaces/members`
**Headers:** 
- `Authorization: Bearer <token>`
- `workspace-uuid: <workspace-id>`

**Response:**
```json
{
  "statusCode": 200,
  "data": [
    "user-uuid-1",
    "user-uuid-2",
    "user-uuid-3"
  ],
  "message": "Workspace members retrieved successfully"
}
```

### Health Check

#### GET `/api/health`
**No authentication required**
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T12:00:00Z",
    "version": "1.0.0"
  },
  "message": "Server is running"
}
```

## 🚫 Error Responses

All error responses follow the same format:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Invalid request data"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Authentication token required"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "data": null,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "data": null,
  "message": "Ticket not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "data": null,
  "message": "Internal server error"
}
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Install Additional Dependencies
```bash
npm install multer
npm install --save-dev @types/multer tsx vite-node
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ticket_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# AI Service
GOOGLE_AI_API_KEY="your-google-ai-api-key"
LLM_API_URL="https://api.together.ai/v1/chat/completions"
LLM_API_KEY="your-llm-api-key"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:push
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start development server with auto-reload
npm run dev

# Alternative using vite-node
npm run dev:vite
```

### Testing
```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Operations
```bash
# Open Prisma Studio
npx prisma studio

# View database schema
npm run db:generate
```

## 🔧 Key Implementation Details

### Authentication & Authorization
- JWT-based authentication with role verification
- Workspace membership validation for all ticket operations
- Middleware decorators for clean role-based access control

### Dependency Injection
- Simple container-based DI system
- Clean separation between controllers, services, and repositories
- Easy testing and mocking capabilities

### Error Handling
- Consistent API response format: `{statusCode, data, message}`
- Services never throw exceptions - always return typed responses
- Global error handler for unhandled exceptions

### CSV Processing
- **Export**: Generates CSV with all pending tickets
- **Auto Processor**: Simulates external system (30% each: Pending, Open, Closed)
- **Import**: Updates ticket statuses from processed CSV

### AI Integration
- Severity suggestion based on ticket title and description
- Configurable LLM providers (Google AI, TogetherAI, etc.)
- Fallback handling for AI service failures

## 🚀 Deployment

### Docker Support
The application is containerized for easy deployment:
```bash
# Build Docker image
docker build -t ticket-management-api .

# Run container
docker run -p 3000:3000 --env-file .env ticket-management-api
```

### Serverless Deployment
Optimized for serverless platforms like:
- Google Cloud Run
- AWS Fargate
- AWS Lambda (with Express adapter)

### Auto-scaling Configuration
- Scales to zero during inactivity
- Automatic scaling based on request load
- Health check endpoint: `/api/health`

## 📊 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-XX...",
    "version": "1.0.0"
  },
  "message": "Server is running"
}
```

### Request Headers
All authenticated requests require:
```
Authorization: Bearer <jwt-token>
workspace-uuid: <workspace-id>
Content-Type: application/json
```

## 🧪 Testing Strategy

### Unit Tests
- Service layer testing with mocked repositories
- Repository testing with test database
- Entity validation testing

### Integration Tests
- Full API endpoint testing
- Authentication flow testing
- Workflow testing (Draft → Pending → Closed)

### Test Coverage
- Minimum 80% code coverage required
- Critical business logic: 100% coverage
- Run `npm run test:coverage` for detailed reports

## 📈 Performance Considerations

### Database Optimization
- Indexed ticket numbers and UUIDs
- Soft delete implementation
- Optimized queries for workspace filtering

### Caching Strategy
- JWT token caching
- Workspace membership caching
- AI suggestion caching (optional)

### Rate Limiting
- Configurable rate limits per endpoint
- AI service request throttling
- File upload size limits (10MB default)

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- JWT token expiration
- Role-based access control
- Workspace isolation
- Audit logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors:**
```bash
# Check database URL
echo $DATABASE_URL
# Regenerate Prisma client
npm run db:generate
```

**Authentication Failures:**
```bash
# Verify JWT secret is set
echo $JWT_SECRET
# Check token expiration settings
```

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 npm run dev
```

### Support
For issues and questions, please create an issue in the GitHub repository.

---

**Built with ❤️ using Node.js, TypeScript, Express, and Prisma**