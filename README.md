# Encadri V1

Student-Supervisor Management Platform built with Angular and .NET Core.

## Project Structure

```
encadri-V1/
├── Encadri-Frontend/          # Angular Frontend
└── Encadri-Backend/           # .NET Core Backend
```

## Prerequisites

- **Node.js** (v18+)
- **Angular CLI** (v18.2.21+)
- **.NET SDK** (v6.0+)
- **PostgreSQL** or **SQL Server**

## Getting Started

### Frontend Setup

```bash
cd Encadri-Frontend
npm install
ng serve
```

Navigate to `http://localhost:4200/`

### Backend Setup

```bash
cd Encadri-Backend/Encadri-Backend
dotnet restore
dotnet run
```

API runs on `https://localhost:7165/` (or configured port)

## Configuration

### Frontend
Update `Encadri-Frontend/src/environments/environment.ts` with your API URL.

### Backend
Update `Encadri-Backend/Encadri-Backend/appsettings.json` with your database connection string.

## Features

- Student-Supervisor Management
- Real-time Chat (SignalR)
- Document Repository
- Authentication & Authorization
- Meeting Scheduling
- Task Management

## Tech Stack

**Frontend:**
- Angular 18
- TypeScript
- RxJS
- Angular Material

**Backend:**
- .NET Core
- Entity Framework Core
- SignalR
- PostgreSQL/SQL Server

## Development

### Frontend Build
```bash
cd Encadri-Frontend
ng build
```

### Backend Build
```bash
cd Encadri-Backend/Encadri-Backend
dotnet build
```

## License

Private Project
