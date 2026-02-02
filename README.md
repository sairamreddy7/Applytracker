# ApplyTrack Pro

A professional job application tracking system with analytics, resume management, and follow-up reminders.

![ApplyTrack Pro](.github/preview.png)

## Features

- 📋 **Application Tracking** - Track job applications with status, notes, and follow-up dates
- 📄 **Resume Management** - Upload and link resumes to applications
- 📊 **Analytics Dashboard** - Visualize your job search progress
- 🔔 **Follow-up Reminders** - Never miss an overdue follow-up
- 📥 **Data Export** - Export your data as CSV or JSON
- 🌙 **Dark Theme** - Easy on the eyes
- ♿ **Accessible** - WCAG AA compliant

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT with HTTP-only cookies

---

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/your-username/applytrack-pro.git
cd applytrack-pro

# Install dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/applytrack
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# Optional
SESSION_SECRET=your-session-secret
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

Run the migrations in order:

```bash
psql $DATABASE_URL -f server/config/schema.sql
psql $DATABASE_URL -f server/config/migration-v2.sql
psql $DATABASE_URL -f server/config/migration-v3.sql
```

### 4. Run Development

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

Open `http://localhost:5173`

---

## Production Deployment

### Replit Deploy

1. Import project to Replit
2. Set environment variables in Replit Secrets:
   - `DATABASE_URL` (use Replit PostgreSQL or external)
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Run build: `cd client && npm run build`
4. Deploy using Replit's deploy button

### Manual Deploy

```bash
# Build frontend
cd client && npm run build

# Start production server
cd ../server
NODE_ENV=production node index.js
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --workspaces
RUN cd client && npm run build
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server/index.js"]
```

---

## Database Migrations

Run migrations in this order:

| File | Description |
|------|-------------|
| `schema.sql` | Initial tables (users, job_applications, resumes) |
| `migration-v2.sql` | Phase 2 fields (job_description, follow_up_date, etc.) |
| `migration-v3.sql` | Phase 3 fields (interview tracking, indexes) |

All migrations are idempotent and safe to re-run.

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Log in |
| `/api/auth/logout` | POST | Log out |
| `/api/auth/me` | GET | Get current user |

### Applications

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET | List all (with filters) |
| `/api/applications/:id` | GET | Get one |
| `/api/applications` | POST | Create |
| `/api/applications/:id` | PUT | Update |
| `/api/applications/:id` | DELETE | Delete |
| `/api/applications/stats/summary` | GET | Get summary stats |

### Resumes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resumes` | GET | List all |
| `/api/resumes/upload` | POST | Upload (multipart) |
| `/api/resumes/:id` | DELETE | Delete |
| `/api/resumes/:id/download` | GET | Download file |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/stats` | GET | Status counts |
| `/api/analytics/over-time` | GET | Applications per period |
| `/api/analytics/resumes` | GET | Resume usage |
| `/api/analytics/companies` | GET | Top companies |
| `/api/analytics/follow-ups` | GET | Follow-up counts |

### Export

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/export/json` | GET | Export all as JSON |
| `/api/export/csv` | GET | Export all as CSV |

---

## Project Structure

```
applytrack-pro/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Shared components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Routes
│   └── vite.config.js
├── server/                # Express backend
│   ├── config/           # SQL migrations
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   └── index.js          # Entry point
├── .env.example
└── README.md
```

---

## Security

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- User data isolation enforced on all queries
- CORS configured for production
- Security headers in production mode

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (if available)
5. Submit a pull request

---
# test
