# Cinema & TV Shows Backend Service

A high-performance, robust REST API built in Go (Golang) for movies and TV show metadata. Integrates with PostgreSQL for persistent storage, Redis for fast cache delivery, and seamlessly bridges with The Movie Database (TMDB) API for real-time season and episode synchronization.

---

## 🔒 Security & Authentication

All API endpoints are public and do not require API Key authentication. Any client can request data without sending authentication headers.

---

## 🚀 Running Locally

1. **Prerequisites**: Ensure you have [Go](https://go.dev/) installed.
2. **Build the Application**:

   ```bash
   go build -o moviebackend
   ```

3. **Run the Server**:

   ```bash
   ./moviebackend
   ```

---

## 📋 API Reference

### Movies API

#### 1. List Movies (Paginated & Filterable)

- **Endpoint**: `GET /api/movies`
- **Query Parameters**:
  - `page` _(default: `1`)_: Page number.
  - `limit` _(default: `20`)_: Number of items per page (maximum: `100`).
  - `search` _(optional)_: Matches titles, original titles, or overviews.
  - `genre` _(optional)_: Filters items containing this specific genre in their `genres` array.
  - `sort` _(default: `popularity`)_: Fields to sort by (`popularity`, `vote_average`, `release_date`, `created_at`, `title`).
  - `order` _(default: `desc`)_: Sort direction (`asc`, `desc`).
- **Sample URL**: `/api/movies?page=1&limit=10&genre=Action&sort=vote_average`
- **Sample Response**:

  ```json
  {
    "data": [
      {
        "id": 12,
        "tmdbId": 27205,
        "imdbId": "tt1375666",
        "title": "Inception",
        "genres": ["Action", "Science Fiction", "Adventure"],
        "voteAverage": 8.3,
        "popularity": 124.5,
        "cast": [
          {
            "name": "Leonardo DiCaprio",
            "character": "Cobb",
            "profilePath": "/path.jpg"
          }
        ],
        "createdAt": "2026-05-25T12:00:00Z"
      }
    ],
    "meta": {
      "currentPage": 1,
      "itemCount": 1,
      "itemsPerPage": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

#### 2. Get Movie by Database ID

- **Endpoint**: `GET /api/movies/:id`
- **Sample URL**: `/api/movies/12`

#### 3. Get Movie by TMDB ID

- **Endpoint**: `GET /api/movies/tmdb/:tmdbId`
- **Sample URL**: `/api/movies/tmdb/27205`

---

### TV Shows API

#### 1. List TV Shows (Paginated & Filterable)

- **Endpoint**: `GET /api/tvshows`
- **Query Parameters**:
  - `page` _(default: `1`)_
  - `limit` _(default: `20`)_
  - `search` _(optional)_: Matches names, original names, or overviews.
  - `genre` _(optional)_
  - `sort` _(default: `popularity`)_: Fields to sort by (`popularity`, `vote_average`, `first_air_date`, `created_at`, `name`).
  - `order` _(default: `desc`)_
- **Sample URL**: `/api/tvshows?page=1&limit=5&sort=first_air_date`

#### 2. Get TV Show by Database ID

- **Endpoint**: `GET /api/tvshows/:id`
- **Sample URL**: `/api/tvshows/4`

#### 3. Get TV Show by TMDB ID

- **Endpoint**: `GET /api/tvshows/tmdb/:tmdbId`
- **Sample URL**: `/api/tvshows/tmdb/1399`

#### 4. Get TV Show Season Details

- **Endpoint**: `GET /api/tvshows/:id/seasons/:season`
- **Sample URL**: `/api/tvshows/1/seasons/1`
- **Description**: Returns season details including the full list of episodes in that season.

#### 5. Get TV Show Episode Details

- **Endpoint**: `GET /api/tvshows/:id/seasons/:season/episodes/:episode`
- **Sample URL**: `/api/tvshows/1/seasons/1/episodes/2`
- **Description**: Returns specific episode details.

#### 6. Get TV Show Episode by SxxExx Notation

- **Endpoint**: `GET /api/tvshows/:id/episodes/:s_e`
- **Sample URL**: `/api/tvshows/1/episodes/S01E02`
- **Description**: Parses case-insensitive standard SxxExx notation (e.g., `S01E02` or `s1e2`) and returns the specific episode details.
