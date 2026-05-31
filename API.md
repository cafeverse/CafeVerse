# 🎬 Cinema & TV Shows Data Backend Service

A RESTful API service custom-built in **Go (Golang)** using the **Gin Web Framework**. This service delivers metadata endpoints for movies and television series.

Engineered with structural resilience, the platform leverages **PostgreSQL** for persistent relational storage, **Redis** as an active high-speed caching tier, and features dynamic on-the-fly episode generation from the TV season metadata stored directly in the database.

---

## 🛠️ Tech Stack & Key Features

- **Runtime & Web Architecture**: Go (Golang) + [Gin Gonic Framework](https://github.com/gin-gonic/gin) for high-concurrency routing.
- **Relational Storage**: PostgreSQL equipped with an optimized connection pool provider for transactional safety.
- **Dynamic JSONB Generation**: TV seasons metadata is loaded directly from the database's `seasons` JSONB column, with individual episodes dynamically generated on-the-fly to deliver zero-latency responses.
- **Caching Layer**: Redis cache integration featuring fallback resilience (operates gracefully even if the cache service is offline).
- **Graceful Shutdown**: Intercepts `SIGINT`/`SIGTERM` signals for clean server/database connection tear-downs.
- **Dynamic CORS Engine**: Standard-compliant Cross-Origin Resource Sharing middleware supporting wildcard and credential-enabled origins.
- **Robust Diagnostic Suite**: Live overall and sub-service level health monitoring via a dedicated JSON endpoint.

---

## 🚀 Getting Started

### 1. Prerequisites

- **Go**: Version 1.20+ installed.
- **Database Instances**: Accessible PostgreSQL and Redis service URIs.

### 2. Environment Configuration

Create a `.env` file in the root of the project to declare active connection strings:

```env
# Server Port Configuration
PORT=8080
GIN_MODE=debug # Use 'release' in production Environments

# Storage Connection Strings
DATABASE_URL="postgres://username:password@hostname:port/database"
REDIS_URL="redis://:password@hostname:port"

# JWT Security Configuration
JWT_SECRET="generate-a-strong-32-byte-secret-key-in-production"
```

### 3. Install Dependencies & Build

Fetch modules declared in `go.mod` and compile the optimized binary:

```bash
# Tidy up Go modules
go mod tidy

# Build the executable binary
go build -o moviebackend main.go
```

### 4. Running the Service

Execute the compiled backend application binary:

```bash
./moviebackend
```

---

## 📋 Comprehensive API Reference

### 🟢 Service Health & Diagnostics

Verify the current operational status of the web server, PostgreSQL pools, and Redis nodes.

- **Endpoint**: `GET /health`
- **Output Sample (Optimal State)**:

  ```json
  {
    "status": "healthy",
    "timestamp": "2026-05-28T10:15:00Z",
    "environment": "debug",
    "services": {
      "postgres": {
        "status": "healthy",
        "message": "connection is fully functional"
      },
      "redis": {
        "status": "healthy",
        "message": "ping successful"
      }
    }
  }
  ```

---

### 🔐 Authentication & Session Endpoints

Secure endpoints for registering users and signing in. Passwords are encrypted using high-performance bcrypt hashing, and sessions are authorized via JWT.

#### 1. User Registration

- **Endpoint**: `POST /api/auth/register`
- **Request Body**:

  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```

- **Response status**: `201 Created`
- **Output Sample**:

  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "createdAt": "2026-05-31T05:00:00Z",
      "updatedAt": "2026-05-31T05:00:00Z"
    }
  }
  ```

#### 2. User Login

- **Endpoint**: `POST /api/auth/login`
- **Request Body**:

  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

- **Response status**: `200 OK`
- **Output Sample**: Same as registration.

---

### 🎥 Movies API Endpoints

#### 1. List Movies (Paginated, Searchable & Filterable)

Returns a cursor-paginated list of movies.

- **Endpoint**: `GET /api/movies`
- **Query Parameters**:

  | Parameter | Type    | Default      | Description                                                                         |
  | :-------- | :------ | :----------- | :---------------------------------------------------------------------------------- |
  | `page`    | Integer | `1`          | Pagination offset index.                                                            |
  | `limit`   | Integer | `20`         | Max results returned (cap: `100`).                                                  |
  | `search`  | String  | _None_       | Performs fuzzy match on movie titles, synonyms, or overviews.                       |
  | `genre`   | String  | _None_       | Filters output containing the matching genre item.                                  |
  | `sort`    | String  | `popularity` | Sort criteria: `popularity`, `vote_average`, `release_date`, `created_at`, `title`. |
  | `order`   | String  | `desc`       | Ordering sequence: `asc` or `desc`.                                                 |

- **Example Call**: `/api/movies?page=1&limit=10&genre=Action&sort=vote_average`

#### 2. Get Movie by Internal Database ID

Retrieves details for a single movie based on the primary ID.

- **Endpoint**: `GET /api/movies/:id`

#### 3. Get Movie by TMDB Identifier

- **Endpoint**: `GET /api/movies/tmdb/:tmdbId`

#### 4. Get Movie by Unique URL Slug

- **Endpoint**: `GET /api/movies/slug/:slug`
- **Description**: Highly optimized indexed database query matching the movie's title in a URL-friendly slug format (e.g. `/api/movies/slug/harry-potter-and-the-philosophers-stone`).

#### 5. Get Unique Movie Genres Catalog

- **Endpoint**: `GET /api/movies/genres`
- **Description**: Returns a sorted alphabetical list of all unique movie genres stored in the database.

---

### 📺 TV Shows API Endpoints

#### 1. List TV Shows (Paginated & Sorted)

- **Endpoint**: `GET /api/tvshows`
- **Query Parameters**: Same as movies endpoint (Sort parameters support: `popularity`, `vote_average`, `first_air_date`, `created_at`, `name`).

#### 2. Get TV Show by Database ID

- **Endpoint**: `GET /api/tvshows/:id`

#### 3. Get TV Show by TMDB Identifier

- **Endpoint**: `GET /api/tvshows/tmdb/:tmdbId`

#### 4. Get TV Show by Unique URL Slug

- **Endpoint**: `GET /api/tvshows/slug/:slug`
- **Description**: Highly optimized indexed database query matching the TV show's name in a URL-friendly slug format (e.g. `/api/tvshows/slug/breaking-bad`).

#### 5. Get Unique TV Show Genres Catalog

- **Endpoint**: `GET /api/tvshows/genres`
- **Description**: Returns a sorted alphabetical list of all unique TV show genres stored in the database.

#### 6. Get Season Details

- **Endpoint**: `GET /api/tvshows/:id/seasons/:season`
- **Description**: Returns structural metadata and an array of all corresponding episodes for the specified season. Episodes are dynamically generated on-the-fly based on the season's `episodeCount` stored in the database's `seasons` JSONB column.

#### 7. Get Episode Details

- **Endpoint**: `GET /api/tvshows/:id/seasons/:season/episodes/:episode`
- **Description**: Returns details for a specific episode. Dynamically generated from the local database `seasons` JSONB column based on the season's `episodeCount`.

#### 8. Smart Episode Routing (SxxExx Format)

- **Endpoint**: `GET /api/tvshows/:id/episodes/:s_e`
- **Description**: Accepts flexible, case-insensitive episodic patterns (e.g. `/api/tvshows/5/episodes/s02e08` or `/api/tvshows/5/episodes/S2E8`). Dynamically resolves the target episode from the database's `seasons` JSONB metadata.

---

## 🌐 Production Deployment Guide

### Deploying to Persistent Host Services (Recommended)

Because this backend functions as a stateful, long-running Go service, hosting platforms supporting standard binary files or Docker containers are recommended.

#### Render / Railway / Fly.io

1. Push your repository to GitHub.
2. Link your repository inside your hosting panel.
3. Configure the build parameters:
   - **Build Command**: `go build -o main main.go`
   - **Start Command**: `./main`
4. Inject your `.env` variables into the environment configurations panel of your host provider.

#### Deploying to Vercel (Serverless)

We have pre-configured this project to deploy seamlessly as a single-function **Go Serverless Function** on Vercel!

1. Push your repository to GitHub.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect `vercel.json` and configure the Go serverless environment.
5. In **Environment Variables**, add the active credentials:
   - `DATABASE_URL` (your PostgreSQL connection pool string)
   - `REDIS_URL` (your Redis connection string)
   - `JWT_SECRET` (your session encryption key)
6. Click **Deploy**. Vercel compiles the Go source and routes all routes (`/api/*`, `/health`) to our high-performance serverless entrypoint `api/index.go`.

---

## ⚖️ DMCA & Copyright Disclaimer

This backend service does not host, store, download, or stream any media files, video streams, or copyrighted assets. It functions purely as a **Metadata API Engine** indexing details, descriptions, crew metadata, and chronological scheduling information fetched dynamically from community-maintained public databases (such as TMDB). No copyrighted media distributions occur under this application.
