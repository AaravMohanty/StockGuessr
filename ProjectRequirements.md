# CS390 Web Application Programming - Final Capstone Project

## Overview
**Goal:** Build a Full-Stack MERN Application with a "Wow Factor".
**Value:** Solves an actual problem or creates something useful.
**Key Feature:** Integrates a powerful external API (e.g., ElevenLabs, OpenAI).

## Core Requirements (The 9 Must-Haves)

### 1. Authentication & User System
**Backend:**
- User model with email, password (bcrypt hashed), name.
- `POST /api/auth/register` - Create account.
- `POST /api/auth/login` - Login, get JWT token.
- `GET /api/auth/me` - Get current user (protected).
- Authentication middleware (verify JWT).
- JWT secret in environment variable.

**Frontend:**
- Registration page with validation.
- Login page with error handling.
- Store JWT in localStorage.
- Send token in Authorization header.
- Logout functionality.
- Redirect to login if not authenticated.

**Security:** NEVER store plain passwords. NEVER expose JWT secret.

### 2. Main Resource with Full CRUD
Choose a domain (Posts, Products, Events, Recipes, etc.).
- **CREATE**: `POST /api/[resource]` (Protected).
- **READ**: `GET /api/[resource]` (List) & `GET /api/[resource]/:id` (Single).
- **UPDATE**: `PUT /api/[resource]/:id` (Owner only).
- **DELETE**: `DELETE /api/[resource]/:id` (Owner only).

**Authorization:** Users can only edit/delete their OWN items. Return `403 Forbidden` otherwise.

### 3. MongoDB Database
- MongoDB Atlas cloud database.
- Connection string in `.env`.
- Minimum 2 Mongoose models (User + Main resource).
- Timestamps enabled.

### 4. React Frontend
- Minimum 8 functional components.
- Reusable components (2+).
- Hooks: `useState`, `useEffect`.
- Patterns: Conditional rendering, List rendering (`.map`), Event handlers, Controlled forms.
- State Management: Auth state, Loading/Error states.

### 5. Express Backend
- Express server configured with CORS and JSON body parsing.
- Routes in separate files.
- RESTful naming conventions.
- Middleware: Auth, Error handling, CORS.
- Error Handling: Try-catch blocks, validation errors, graceful DB errors.

### 6. Full-Stack Integration
- Frontend API calls using `fetch()` with JWT in Authorization header.
- Backend verifies JWT, queries DB, and returns processed data.
- UI updates based on data/loading/error states.

### 7. External API Integration ("Wow Factor")
**Requirement:** Integrate a powerful external API (e.g., ElevenLabs, OpenAI, Stripe, Twilio, Maps).
**Backend Proxy Pattern:**
- Backend calls external API (never frontend directly).
- Backend validates requests and saves results to MongoDB.
- Backend returns processed data to frontend.
**Security:** Store API keys in `.env`. NEVER commit API keys.

### 8. Deployment
**Frontend: Netlify (Recommended)**
- Zero-config deployment, Automatic HTTPS & CDN.
- **Tip:** Ensure `package.json` has a "build" script.

**Backend: Railway (Recommended)**
- Simple Node.js deployment, built-in database support.
- **Tip:** Express app must listen on `process.env.PORT || 3000`.

**Database:** MongoDB Atlas.

**Checklist:** All features work end-to-end in production.

### 9. Documentation
**README.md must include:**
- Project Overview.
- Features List.
- Tech Stack.
- Installation Instructions.
- Deployment Links (Live Frontend & Backend).
- Screenshots (At least 3).

## Design Guidelines (Class 20)
**Goal:** Avoid the "AI-generated" look. Create a clean, readable, and human interface.

- **Hierarchy:** Use size, weight, spacing, and contrast (not borders) to guide the eye.
- **Spacing:** Use a consistent scale (4, 8, 12, 16px...).
- **Typography:** Use SF Pro + Inter. One heading font, one body font. 2-3 weights max.
- **Color:** Neutral base, single intentional accent color. Avoid loud/childish colors.
- **Style:** "Notion x Apple Hybrid" - Minimalist, modular, plenty of white space, smooth motion.

## Product Planning (Class 19)
**PRD (Product Requirements Document):** Write this *before* coding.
- Clarify goals, define features, set boundaries.
- **Benefits:** Faster dev, better UX, fewer bugs, stronger demo.

## Grading Breakdown (30% of Final Grade)
- **Technical Implementation (40%):** Backend (15%), Frontend (15%), Database (10%).
- **External API Integration (25%):** "Wow Factor" API properly implemented.
- **Presentation & Demo (20%):** Live demo + technical explanation.
- **Documentation (10%):** Complete README.
- **Innovation & Creativity (5%):** Going beyond requirements.

## Suggested Tools
- **Cursor:** AI-powered code editor.
- **Windsurf:** AI coding assistant.

## Important Dates
- **Team Formation:** Teams of 2-6 people.
- **Submission:** Team name & idea submissions due this Sunday.
