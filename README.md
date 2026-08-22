
# Smart Roadmap Backend
A secure and scalable REST API backend for **Smart Roadmap**, a platform designed to help users create, manage, and track personalized learning roadmaps.
The backend is built with **FastAPI**, **PostgreSQL**, **SQLAlchemy**, and **JWT-based authentication**, with a focus on clean architecture, security, database migrations, and maintainability.
---
## 🚀 Project Status
**Current status:** Authentication foundation completed ✅
Implemented:
- User registration
- User login
- Argon2 password hashing
- JWT access tokens
- Refresh tokens
- Refresh-token hashing
- Refresh-token expiration
- Refresh-token rotation
- Refresh-token reuse protection
- Logout / refresh-token revocation
- Protected user endpoints
- PostgreSQL database integration
- SQLAlchemy ORM
- Alembic database migrations
- Pydantic request/response validation
- Swagger / OpenAPI documentation
Upcoming features will include roadmap management, learning resources, progress tracking, goals, and other Smart Roadmap functionality.
---
## 🛠️ Tech Stack
### Backend
- **Python 3.13**
- **FastAPI**
- **Uvicorn**
- **SQLAlchemy 2**
- **Pydantic 2**
- **Pydantic Settings**
### Database
- **PostgreSQL**
- **psycopg**
- **Alembic**
### Authentication & Security
- **JWT**
- **PyJWT**
- **Argon2**
- **pwdlib**
- HTTP Bearer authentication
- Refresh-token rotation
- Refresh-token hashing
- Token expiration and revocation
### Development
- Git
- GitHub
- Swagger / OpenAPI
- Python virtual environment
---
## 📁 Project Structure
```text
backend/
│
├── app/
│   ├── core/
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   └── security.py
│   │
│   ├── crud/
│   │   ├── __init__.py
│   │   └── user.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   └── refresh_token.py
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── health.py
│   │   └── users.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py
│   │
│   └── main.py
│
├── alembic/
│   ├── versions/
│   │   ├── ac9cdcc123da_create_users_table.py
│   │   └── 7320ba5d90b2_add_refresh_tokens.py
│   │
│   ├── env.py
│   ├── script.py.mako
│   └── README
│
├── .env
├── .gitignore
├── alembic.ini
├── requirements.txt
└── README.md

⸻

⚙️ Getting Started

1. Clone the repository

git clone <your-repository-url>
cd smart-roadmap/backend

⸻

2. Create a virtual environment

python3 -m venv .venv

Activate it:

macOS / Linux

source .venv/bin/activate

Windows

.venv\Scripts\activate

⸻

3. Install dependencies

python -m pip install -r requirements.txt

⸻

🗄️ Database Setup

Smart Roadmap uses PostgreSQL.

Make sure PostgreSQL is running before starting the backend.

Create the database:

createdb -h localhost -p 5432 -U postgres smart_roadmap

Alternatively:

psql -h localhost -p 5432 -U postgres

Then:

CREATE DATABASE smart_roadmap;

⸻

🔐 Environment Configuration

Create a .env file in the backend root directory:

DATABASE_URL="postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/smart_roadmap"
JWT_SECRET_KEY="YOUR_SECURE_SECRET_KEY"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

Generate a secure JWT secret

You can generate one using Python:

python -c "import secrets; print(secrets.token_urlsafe(32))"

Example:

JWT_SECRET_KEY="replace-with-your-generated-secret"

Important: Never commit .env to Git.

⸻

🗃️ Database Migrations

The project uses Alembic to manage database schema changes.

Check the current migration:

alembic current

Check whether models and database are synchronized:

alembic check

Create a new migration after changing SQLAlchemy models:

alembic revision --autogenerate -m "description of change"

Apply migrations:

alembic upgrade head

Rollback one migration:

alembic downgrade -1

⸻

▶️ Running the API

Start the development server:

fastapi dev app/main.py

The API will be available at:

http://127.0.0.1:8000

⸻

📚 API Documentation

FastAPI automatically generates interactive API documentation.

Swagger UI

http://127.0.0.1:8000/docs

ReDoc

http://127.0.0.1:8000/redoc

OpenAPI schema

http://127.0.0.1:8000/openapi.json

⸻

🔑 Authentication

Smart Roadmap uses JWT-based authentication.

The authentication flow is:

Register
   ↓
Login
   ↓
Access Token + Refresh Token
   ↓
Access Protected Resources
   ↓
Access Token expires
   ↓
Refresh Token
   ↓
Refresh Token Rotation
   ↓
New Access Token + New Refresh Token

Refresh tokens are stored in the database as SHA-256 hashes, not as plaintext tokens.

⸻

🔐 Authentication Endpoints

Register

POST /api/v1/auth/register

Request:

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}

Response:

{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2026-08-23T10:00:00",
  "updated_at": "2026-08-23T10:00:00"
}

⸻

Login

POST /api/v1/auth/login

Request:

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:

{
  "access_token": "eyJ...",
  "refresh_token": "random-secure-token",
  "token_type": "bearer"
}

⸻

Refresh Access Token

POST /api/v1/auth/refresh

Request:

{
  "refresh_token": "your-refresh-token"
}

Response:

{
  "access_token": "eyJ...",
  "refresh_token": "new-refresh-token",
  "token_type": "bearer"
}

The previous refresh token is revoked after successful rotation.

⸻

Logout

POST /api/v1/auth/logout

Request:

{
  "refresh_token": "your-refresh-token"
}

Response:

{
  "message": "Successfully logged out"
}

The refresh token is revoked and cannot be used again.

⸻

👤 Protected User Endpoint

Get Current User

GET /api/v1/users/me

Authentication:

Authorization: Bearer <access_token>

Response:

{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2026-08-23T10:00:00",
  "updated_at": "2026-08-23T10:00:00"
}

⸻

🧪 Authentication Testing

The authentication system can be tested through Swagger:

http://127.0.0.1:8000/docs

Recommended testing flow:

1. Register
      ↓
2. Login
      ↓
3. Copy access_token
      ↓
4. Authorize Swagger
      ↓
5. GET /users/me
      ↓
6. Refresh token
      ↓
7. Verify old refresh token is rejected
      ↓
8. Verify new refresh token works
      ↓
9. Logout
      ↓
10. Verify refresh token is rejected

⸻

🗂️ Database Schema

Current database tables:

users
refresh_tokens
alembic_version

Users

The users table stores account information:

users
├── id
├── email
├── username
├── hashed_password
├── full_name
├── is_active
├── created_at
└── updated_at

Refresh Tokens

The refresh_tokens table manages refresh-token lifecycle:

refresh_tokens
├── id
├── user_id
├── token_hash
├── expires_at
├── revoked_at
└── created_at

Relationship:

users
  │
  │ 1
  │
  │ N
  ▼
refresh_tokens

When a user is deleted, their refresh tokens are automatically deleted through:

ON DELETE CASCADE

⸻

🛡️ Security Design

The backend currently follows several important security practices.

Password security

Passwords are never stored directly.

Plain Password
      ↓
Argon2
      ↓
Password Hash
      ↓
PostgreSQL

Refresh-token security

Raw refresh tokens are returned only to the client.

The database stores:

SHA-256(refresh_token)

instead of the original token.

Access tokens

Access tokens contain a user identifier:

{
  "sub": "1",
  "exp": 1780000000
}

Refresh-token rotation

Every successful refresh invalidates the previous refresh token:

Refresh Token A
       ↓
     /refresh
       ↓
Revoke Token A
       ↓
Create Token B

This prevents the same refresh token from being repeatedly reused.

⸻

🧱 Architecture

The backend follows a layered architecture:

                    Client
                      │
                      ▼
                  FastAPI
                   Routers
                      │
                      ▼
                   Schemas
                Validation / DTO
                      │
                      ▼
                    CRUD
             Business / DB Operations
                      │
                      ▼
                   Models
                SQLAlchemy ORM
                      │
                      ▼
                 PostgreSQL

Core responsibilities:

Layer	Responsibility
routers/	HTTP endpoints
schemas/	Request/response validation
crud/	Database operations
models/	SQLAlchemy database models
db/	Database connection/session
core/	Configuration, security, dependencies
alembic/	Database migrations

⸻

🧰 Useful Commands

Activate environment

source .venv/bin/activate

Start server

fastapi dev app/main.py

Install package

python -m pip install <package>

Update requirements

python -m pip freeze > requirements.txt

Check Alembic status

alembic current

Check migrations

alembic check

Create migration

alembic revision --autogenerate -m "description"

Apply migration

alembic upgrade head

⸻

🔮 Roadmap

The backend will gradually expand into a complete learning-roadmap platform.

Phase 1 — Authentication ✅

* User registration
* User login
* Password hashing
* JWT access tokens
* Refresh tokens
* Refresh-token rotation
* Token revocation
* Protected routes
* Current-user endpoint

Phase 2 — User Management

* User profile
* Update profile
* Change password
* Account management
* User preferences

Phase 3 — Roadmaps

* Create roadmap
* Update roadmap
* Delete roadmap
* Public/private roadmaps
* Roadmap categories
* Roadmap levels
* Roadmap steps

Phase 4 — Learning Progress

* Track learning progress
* Complete roadmap steps
* Progress percentage
* Learning statistics
* Streak tracking

Phase 5 — Goals & Planning

* Learning goals
* Daily tasks
* Weekly planning
* Deadlines
* Progress reminders

Phase 6 — Resources

* Learning resources
* Links
* Videos
* Documentation
* Recommended resources

Phase 7 — Advanced Features

* Personalized roadmap recommendations
* AI-assisted roadmap generation
* Analytics
* Notifications
* Search and filtering

⸻

🤝 Development Workflow

Recommended development workflow:

Create / modify model
        ↓
Update SQLAlchemy model
        ↓
Create Alembic migration
        ↓
Review migration
        ↓
Run migration
        ↓
Update CRUD
        ↓
Create schema
        ↓
Create router
        ↓
Test through Swagger
        ↓
Commit changes

Example:

git add .
git commit -m "feat: add roadmap model"
git push origin main

⸻

📌 Development Principles

This project follows these principles:

* Clean and maintainable code
* Separation of responsibilities
* Strong input validation
* Secure authentication
* Database migration management
* RESTful API design
* Explicit error handling
* Scalable database design
* Environment-based configuration
* Avoid storing secrets in source code

⸻

📄 License

This project is currently developed for educational and personal development purposes.

⸻

👨‍💻 Author

Tep Makhon

Computer Science Student
Royal University of Phnom Penh
Cambodia

Interested in:

* Full Stack Development
* Backend Engineering
* Software Architecture
* Database Design
* Cybersecurity
* AI-powered applications

⸻

⭐ Smart Roadmap

Smart Roadmap is being developed as a long-term project to help learners organize their learning journey, track progress, manage goals, and eventually receive personalized learning recommendations.

Build your roadmap.
Track your progress.
Reach your goals.