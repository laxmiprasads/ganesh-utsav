# Ganesh Utsav Management System 2026

Production-oriented colony committee application with one Angular frontend, one Spring Boot backend, and one MySQL database.

## Projects

- `ganesh-utsav-frontend`: Angular public transparency portal and protected committee dashboard.
- `ganesh-utsav-backend`: Spring Boot REST API with Spring Security, JWT, JPA, Bean Validation, and MySQL.
- Database: `ganesh_utsav_db`

## Public Flow

- `/`
- `/contributions`
- `/expenses`
- `/auctions`

Public APIs are read-only under `/api/public/**` and do not require login.

## Committee Flow

- `/committee/login`
- `/committee/dashboard`
- `/committee/contributions`
- `/committee/expenses`
- `/committee/auctions`

Committee APIs require JWT authentication and `COMMITTEE` role under `/api/committee/**`.

Contribution screenshots and expense receipt photos are uploaded through `POST /api/committee/uploads`
and stored on disk under the `UPLOAD_DIR` folder (`uploads` by default), then served back from `/uploads/**`.

## Committee Credentials

- Username: `Prasad`
- Password: `Prasad@122006`

## Backend Setup

Set environment variables as needed:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ganesh_utsav_db
DB_USERNAME=root
DB_PASSWORD=root
CORS_ALLOWED_ORIGINS=https://ganesh-utsav-frontend-production.up.railway.app
UPLOAD_DIR=uploads
JWT_SECRET=replace-with-a-long-production-secret
```

Run:

```bash
cd ganesh-utsav-backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`.

## Frontend Setup

```bash
cd ganesh-utsav-frontend
npm install
npm start
```

The Angular app starts on `http://localhost:4200`.

## Verification

Commands used during implementation:

```bash
cd ganesh-utsav-backend
mvn -q -DskipTests package

cd ../ganesh-utsav-frontend
npx tsc -p tsconfig.app.json --noEmit
```

Full Angular bundling uses `esbuild`; on this machine it requires permission to spawn the local native executable.
