# Weekly Report Dashboard

A full-stack internal reporting platform that allows team members to create and submit weekly reports while managers and administrators review progress, request corrections, approve reports, and monitor team performance.

## Features

* Secure registration and login
* JWT authentication using HTTP-only cookies
* Role-based access control
* Team Member, Manager, and Administrator roles
* Weekly report creation and editing
* Report submission and version history
* Manager review and correction workflow
* Report approval
* Team and project management
* Dashboard analytics and charts
* Seeded demonstration data
* Swagger API documentation
* Automated backend tests

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Recharts

### Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT authentication
* class-validator
* Swagger
* Jest
* Supertest

### Development Tools

* pnpm
* Docker
* Docker Compose
* Git

## Project Structure

```text
weekly-report-dashboard/
├── backend/                # NestJS REST API
│   ├── prisma/             # Prisma schema, migrations and seed script
│   ├── src/                # Backend application source code
│   ├── test/               # End-to-end and RBAC tests
│   ├── .env.example        # Backend environment variable example
│   └── package.json
│
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js routes and pages
│   ├── components/         # Reusable UI components
│   ├── contexts/           # Authentication context
│   ├── lib/                # API client and utilities
│   ├── types/              # TypeScript interfaces and types
│   ├── .env.example        # Frontend environment variable example
│   └── package.json
│
├── docs/                   # Project documentation
├── docker-compose.yml      # Local PostgreSQL configuration
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── package.json
└── README.md
```

## Prerequisites

Install the following software before running the project:

* [Node.js](https://nodejs.org/) — version 20 or later
* [pnpm](https://pnpm.io/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Git](https://git-scm.com/)

Verify the installations:

```bash
node --version
pnpm --version
docker --version
docker compose version
git --version
```

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd weekly-report-dashboard
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the actual GitHub repository URL.

## 2. Install Dependencies

This project uses a pnpm workspace. Install all frontend and backend dependencies from the project root:

```bash
pnpm install
```

If workspace installation is unavailable, dependencies can be installed separately:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install

cd ..
```

## 3. Configure Environment Variables

### Backend Environment

Create a `.env` file inside the `backend` directory.

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Command Prompt:

```cmd
copy backend\.env.example backend\.env
```

macOS or Linux:

```bash
cp backend/.env.example backend/.env
```

The backend `.env` file should contain:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://weekly_user:weekly_password@localhost:5440/weekly_reports?schema=public

JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN_SECONDS=86400

COOKIE_SECURE=false
```

Important:

* `JWT_SECRET` should be replaced with a secure random value.
* Keep `COOKIE_SECURE=false` during local HTTP development.
* Use `COOKIE_SECURE=true` in production when HTTPS is enabled.
* The PostgreSQL port is `5440` on the host machine.

### Frontend Environment

Create a `.env.local` file inside the `frontend` directory.

Windows PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Command Prompt:

```cmd
copy frontend\.env.example frontend\.env.local
```

macOS or Linux:

```bash
cp frontend/.env.example frontend/.env.local
```

The frontend `.env.local` file should contain:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## 4. Run the PostgreSQL Database

Ensure Docker Desktop is running.

From the project root, start PostgreSQL:

```bash
docker compose up -d
```

Check the container status:

```bash
docker compose ps
```

The PostgreSQL container should appear as healthy:

```text
weekly_report_postgres   Up   healthy   0.0.0.0:5440->5432/tcp
```

To view the database logs:

```bash
docker compose logs postgres
```

To follow the logs continuously:

```bash
docker compose logs -f postgres
```

To stop the database:

```bash
docker compose down
```

To stop the database and delete its local Docker volume:

```bash
docker compose down -v
```

> Warning: `docker compose down -v` permanently removes the local database data.

## 5. Prepare the Database

Move into the backend directory:

```bash
cd backend
```

Generate the Prisma Client:

```bash
pnpm exec prisma generate
```

Check that the Prisma schema is valid:

```bash
pnpm exec prisma validate
```

Apply the existing database migrations:

```bash
pnpm exec prisma migrate deploy
```

For local development, the following command may also be used:

```bash
pnpm exec prisma migrate dev
```

Seed the database with demonstration users, projects, and weekly reports:

```bash
pnpm exec prisma db seed
```

The seeded data includes:

* Multiple users with different roles
* Team members and managers
* Multiple projects
* Several weeks of reports
* Reports in different workflow statuses
* Report versions and review history
* Dashboard data for demonstration

Optionally, open Prisma Studio to inspect the database:

```bash
pnpm exec prisma studio
```

Prisma Studio will normally be available at:

```text
http://localhost:5555
```

Return to the project root when finished:

```bash
cd ..
```

## 6. Run the Backend

Open a terminal and move into the backend directory:

```bash
cd backend
```

Start the NestJS backend in development mode:

```bash
pnpm run start:dev
```

The backend API will be available at:

```text
http://localhost:4000/api/v1
```

Swagger API documentation will be available at:

```text
http://localhost:4000/docs
```

Keep this terminal running while using the application.

## 7. Run the Frontend

Open another terminal and move into the frontend directory:

```bash
cd frontend
```

Start the Next.js development server:

```bash
pnpm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

Open the URL in a web browser.

## 8. Recommended Startup Order

Start the project in the following order:

1. Start Docker Desktop.
2. Start the PostgreSQL container.
3. Apply Prisma migrations if required.
4. Seed the database if required.
5. Start the NestJS backend.
6. Start the Next.js frontend.
7. Open `http://localhost:3000`.

Example:

### Terminal 1 — Database

```bash
docker compose up -d
```

### Terminal 2 — Backend

```bash
cd backend
pnpm run start:dev
```

### Terminal 3 — Frontend

```bash
cd frontend
pnpm run dev
```

## 9. Authentication and Cookies

Authentication is implemented using a JWT stored in a secure HTTP-only cookie.

The frontend sends API requests with credentials enabled. Therefore:

* The frontend must run on `http://localhost:3000`.
* The backend must run on `http://localhost:4000`.
* `FRONTEND_URL` must match the frontend URL.
* Backend CORS must allow credentials.
* Browser cookies must not be blocked.
* `COOKIE_SECURE` must remain `false` during local HTTP development.

The user remains authenticated until:

* The JWT expires
* The user logs out
* The authentication cookie is removed
* The backend JWT secret is changed

## 10. User Roles

The application supports the following roles:

### Team Member

* Create weekly report drafts
* Edit draft reports
* Submit reports for review
* View personal report history
* View manager correction comments
* Correct and resubmit reports

### Manager

* Access the team dashboard
* View submitted team reports
* Filter reports by member, project, status, and date
* Request corrections with comments
* Approve submitted reports
* View report versions and review history
* Manage team members and projects where permitted

### Administrator

* Access all manager features
* Manage users
* Manage projects
* Activate or deactivate users
* Assign roles, managers, and projects

## 11. Report Review Workflow

The complete report workflow is:

```text
DRAFT
  ↓
SUBMITTED
  ↓
NEEDS_CORRECTION
  ↓
DRAFT / RESUBMITTED
  ↓
SUBMITTED
  ↓
APPROVED
```

Detailed process:

1. A team member creates a weekly report.
2. The report is saved as `DRAFT`.
3. The team member submits the report.
4. A report version snapshot is created.
5. The report status changes to `SUBMITTED`.
6. A manager reviews the report.
7. The manager can request changes.
8. The status changes to `NEEDS_CORRECTION`.
9. The team member edits and resubmits the report.
10. A new report version is created.
11. The manager reviews the updated version.
12. The manager approves the report.
13. The status changes to `APPROVED`.

## 12. API Documentation

Swagger documentation is available while the backend is running:

```text
http://localhost:4000/docs
```

Swagger provides:

* Available API endpoints
* Request body formats
* Query parameters
* Response structures
* Authentication requirements
* HTTP status codes

Because authentication uses an HTTP-only cookie, log in through the application or the Swagger login endpoint before testing protected endpoints.

## 13. Run Automated Tests

Ensure the test database requirements are available and then move into the backend directory:

```bash
cd backend
```

Run the backend unit tests:

```bash
pnpm run test
```

Run the Jest end-to-end tests:

```bash
pnpm run test:e2e:jest
```

The end-to-end test suite includes role-based access control checks, such as:

* Allowing managers to access manager endpoints
* Denying team members access to manager endpoints
* Denying unauthenticated access
* Restricting administrator-only functionality

Run tests with coverage:

```bash
pnpm run test:cov
```

## 14. Production Builds

### Build the Backend

```bash
cd backend
pnpm run build
```

Start the production backend:

```bash
pnpm run start:prod
```

### Build the Frontend

```bash
cd frontend
pnpm run build
```

Start the production frontend:

```bash
pnpm run start
```

## 15. Common Problems

### PostgreSQL container does not appear

Check all containers, including stopped containers:

```bash
docker compose ps -a
```

Start the services again:

```bash
docker compose up -d
```

### Port 5440 is already in use

Check which process is using the port on Windows:

```powershell
netstat -ano | findstr :5440
```

Stop the conflicting process or change the host PostgreSQL port in `docker-compose.yml` and update `DATABASE_URL`.

### Prisma authentication failed

Confirm that:

* The PostgreSQL container is running and healthy.
* The username and password match `docker-compose.yml`.
* The database name is correct.
* `DATABASE_URL` uses port `5440`.

Test the database connection:

```bash
docker exec -it weekly_report_postgres psql -U weekly_user -d weekly_reports
```

Exit PostgreSQL using:

```text
\q
```

### Prisma Client types are outdated

Regenerate the Prisma Client:

```bash
cd backend
pnpm exec prisma generate
```

Restart the backend and the TypeScript language service afterward.

### Authentication disappears after refresh

Confirm the following values:

Backend `.env`:

```env
FRONTEND_URL=http://localhost:3000
JWT_EXPIRES_IN_SECONDS=86400
COOKIE_SECURE=false
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Also confirm that frontend API requests use:

```ts
credentials: "include"
```

Restart both frontend and backend servers after changing environment variables.

### CORS error

Make sure the frontend URL exactly matches the backend configuration:

```env
FRONTEND_URL=http://localhost:3000
```

Do not mix `localhost` and `127.0.0.1`, because browsers treat them as different hosts.

## 16. Reset the Local Database

Use the following only when local data can be safely deleted.

Stop the database and remove its volume:

```bash
docker compose down -v
```

Start a fresh database:

```bash
docker compose up -d
```

Apply migrations and seed data again:

```bash
cd backend
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm exec prisma db seed
```

## 17. Useful URLs

| Service               | URL                            |
| --------------------- | ------------------------------ |
| Frontend application  | `http://localhost:3000`        |
| Backend API           | `http://localhost:4000/api/v1` |
| Swagger documentation | `http://localhost:4000/docs`   |
| Prisma Studio         | `http://localhost:5555`        |
| PostgreSQL            | `localhost:5440`               |

## 18. Stopping the Application

Stop the frontend and backend development servers using:

```text
Ctrl + C
```

Stop PostgreSQL from the project root:

```bash
docker compose down
```

## License

This project was developed as part of a technical software engineering assignment.
