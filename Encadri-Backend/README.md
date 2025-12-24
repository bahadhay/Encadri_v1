# Encadri Backend - ASP.NET Core API

Academic project management system backend built with ASP.NET Core 6.0, Entity Framework Core, and MySQL.

## Quick Start

```bash
# 1. Update connection string in appsettings.json
# 2. Create database migration
dotnet ef migrations add InitialCreate

# 3. Update database
dotnet ef database update

# 4. Run application
dotnet run
```

**API will be available at:**
- HTTP: http://localhost:5040
- HTTPS: https://localhost:7225
- Swagger: http://localhost:5040/swagger

## Test Credentials

All test accounts use password: `password123`

- Student: `student@test.com`
- Supervisor: `supervisor@test.com`

## Recent Updates ✅

### Security
- ✅ Implemented PBKDF2 password hashing
- ✅ Password hash never exposed in API responses
- ✅ Secure user authentication

### Data Handling
- ✅ Fixed Technologies and Objectives fields in Projects
- ✅ Arrays now stored as JSON in MySQL
- ✅ Configured camelCase JSON serialization

### Database
- ✅ Auto-seeding with comprehensive test data
- ✅ 4 users, 2 projects, milestones, submissions, meetings, messages

## API Endpoints

### Authentication
- `POST /api/Auth/login` - Login with email/password
- `POST /api/Auth/register` - Register new user
- `GET /api/Auth/me` - Get current user

### Resources
- `GET/POST/PUT/DELETE /api/Projects`
- `GET/POST/PUT/DELETE /api/Submissions`
- `GET/POST/PUT/DELETE /api/Meetings`
- `GET/POST/PUT/DELETE /api/Evaluations`
- `GET/POST/PUT/DELETE /api/Messages`
- `GET/POST/PUT/DELETE /api/Notifications`
- `GET/POST/PUT/DELETE /api/Milestones`

Full API documentation available at Swagger UI when running.

## Project Structure

```
Encadri-Backend/
├── Controllers/         # API Controllers
├── Models/             # Data models
├── Data/               # DbContext and seeding
├── Services/           # Business logic (PasswordHasher)
├── Migrations/         # EF Core migrations
├── appsettings.json    # Configuration
└── Program.cs          # App startup
```

## Configuration

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=encadri_db;User=root;Password=YOUR_PASSWORD;"
  }
}
```

## Documentation

See project root for complete documentation:
- `../QUICK_START.md` - Quick setup guide
- `../BACKEND_FRONTEND_INTEGRATION_GUIDE.md` - Frontend integration
- `../PROJECT_ANALYSIS_REPORT.md` - Complete project analysis
- `../IMPLEMENTATION_SUMMARY.md` - Recent changes summary

## Tech Stack

- **Framework:** ASP.NET Core 6.0
- **ORM:** Entity Framework Core 6.0
- **Database:** MySQL (via Pomelo.EntityFrameworkCore.MySql)
- **API Docs:** Swashbuckle (Swagger)
- **Security:** PBKDF2 password hashing

## Development Commands

```bash
# Run with auto-reload
dotnet watch run

# Create migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Drop database
dotnet ef database drop --force

# Build
dotnet build
```

## Next Steps

1. Review `../IMPLEMENTATION_SUMMARY.md` for recent changes
2. Test API with Swagger UI
3. Follow `../BACKEND_FRONTEND_INTEGRATION_GUIDE.md` for frontend integration
4. Implement JWT authentication (currently using simple tokens)
5. Add authorization checks on endpoints

## License

Academic project - For educational purposes only
