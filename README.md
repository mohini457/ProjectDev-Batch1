<p align="center">
  <img src="public/logo-transparent.png" alt="Carvaan Go" width="280" />
</p>

<h1 align="center">🚗 Carvaan Go — Smart Carpooling System</h1>

<p align="center">
  <strong>Share rides. Save money. Travel smarter.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.2-06B6D4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk" alt="Clerk Auth" />
  <img src="https://img.shields.io/badge/Mapbox-GL-000000?style=for-the-badge&logo=mapbox" alt="Mapbox" />
  <img src="https://img.shields.io/badge/Groq_AI-Vision-FF6600?style=for-the-badge" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Appwrite-Storage-FD366E?style=for-the-badge&logo=appwrite" alt="Appwrite" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [UI Components](#-ui-components)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🌟 Overview

**Carvaan Go** is a modern, AI-powered carpooling platform that connects drivers with empty seats to riders heading in the same direction. Built with cutting-edge technologies, it delivers a seamless ride-sharing experience with intelligent vehicle verification, interactive route planning, and real-time search capabilities.

> 🎯 **Mission:** Reduce travel costs, carbon footprint, and traffic congestion by making carpooling effortless and trustworthy.

---

## ✨ Key Features

### 🗺️ Interactive Landing Experience
- **3D Interactive Globe** — Stunning animated globe showcasing global carpool network using `cobe`
- **Parallax Stars Background** — Dynamic star field with mouse-tracking parallax effects
- **Container Scroll Animation** — Smooth scroll-triggered animations for value propositions
- **Animated Roadmap** — Visual project milestone tracker with animated waypoints
- **Smart Search Pill** — Sticky search bar with location autocomplete, date picker & passenger selector

### 🔐 Authentication System
- **Clerk Integration** — Secure sign-up/sign-in with social providers support
- **Animated Auth Pages** — Car animation that parks on different sides for Sign-In vs Sign-Up
- **Automatic User Sync** — New users are automatically synced to the database on first login

### 🚀 Ride Publishing (5-Step Wizard)

| Step | Feature | Description |
|:----:|---------|-------------|
| **1** | 🗺️ Route Selection | Interactive Mapbox map with draggable markers, multi-route suggestions via OSRM, real-time distance & ETA |
| **2** | 📅 Schedule | Custom date picker + time picker with quick-select options |
| **3** | 🚗 Vehicle Details | AI-powered vehicle image verification (Groq Vision / Llama 4 Scout), Appwrite cloud upload with retry logic, auto seat-capacity detection |
| **4** | ⚙️ Preferences | Smoking, music, pets, female-only, luggage size, price per seat |
| **5** | ✅ Review | Complete ride summary before publishing |

### 🤖 AI-Powered Vehicle Verification
- Uses **Groq's Llama 4 Scout** vision model to:
  - Verify uploaded image is a real car exterior
  - Detect exact vehicle make & model
  - Cross-check against the user's claimed vehicle model
  - Auto-determine vehicle seating capacity

### 🔍 Advanced Ride Search
- **Location-based search** with geocoded coordinates
- **Real-time filtering** — Sort by earliest, cheapest, shortest
- **Time slot filters** — Before 6 AM, 6–12 PM, 12–6 PM, After 6 PM
- **Amenity filters** — Music, smoking, pets, female-only
- **Trust & Safety** — Verified profile badges
- **Responsive sidebar** with mobile filter drawer

### 📍 Smart Location Services
- **Forward Geocoding** — Convert place names to coordinates via Nominatim
- **Reverse Geocoding** — Convert coordinates to human-readable addresses
- **Distance-aware Drag Handling** — Preserves custom location names during fine-tuning
- **Multi-route Suggestions** — OSRM-powered alternative route options with distance, duration & tags

### 🎫 Ride Request System
- Passengers can request to join published rides
- Drivers can approve/reject ride requests
- Seat availability tracking with auto-decrement
- Custom pickup notes and messaging

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **Next.js 16** | Full-stack React framework with App Router |
| **React 19** | UI library with latest concurrent features |
| **TypeScript 5** | Type-safe development |
| **TailwindCSS 4** | Utility-first CSS framework |
| **Framer Motion** | Animations & page transitions |
| **Mapbox GL JS** | Interactive maps with route visualization |
| **Cobe** | 3D WebGL globe component |
| **Lucide React** | Modern icon library |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **Next.js API Routes** | RESTful API endpoints |
| **Drizzle ORM** | Type-safe database queries |
| **Neon PostgreSQL** | Serverless Postgres database |
| **Clerk** | Authentication & user management |
| **Appwrite** | Cloud file storage for vehicle images |
| **Groq AI (Llama 4 Scout)** | Vision AI for vehicle verification |
| **OSRM** | Open Source Routing Machine for directions |
| **Nominatim** | OpenStreetMap geocoding service |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Landing  │  │  Auth    │  │ Publish  │  │ Search  │ │
│  │  Page    │  │  Pages   │  │ Wizard   │  │  Page   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │             │              │      │
│  ┌────┴──────────────┴─────────────┴──────────────┴────┐ │
│  │              Shared UI Components                    │ │
│  │  Globe │ MapView │ LocationAutocomplete │ RideCard   │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │ API Calls
┌─────────────────────────┼────────────────────────────────┐
│                  SERVER (Next.js API)                     │
│  ┌──────────┐  ┌────────┴───┐  ┌──────────┐  ┌────────┐ │
│  │ /api/    │  │ /api/rides │  │ /api/    │  │ /api/  │ │
│  │ geocode  │  │ CRUD +     │  │ validate │  │ route  │ │
│  │          │  │ search     │  │ car-img  │  │        │ │
│  └────┬─────┘  └────┬───────┘  └────┬─────┘  └───┬────┘ │
│       │              │               │             │      │
│  ┌────┴──────────────┴───────────────┴─────────────┴───┐ │
│  │                   Service Layer                      │ │
│  └──┬──────────┬──────────────┬─────────────┬──────────┘ │
│     │          │              │             │             │
│  Nominatim  Neon DB      Groq AI      Appwrite           │
│  (Geocode)  (Drizzle)   (Vision)     (Storage)           │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
smart-carpooling-system/
├── app/
│   ├── api/
│   │   ├── geocode/              # Forward geocoding
│   │   ├── reverse-geocode/      # Reverse geocoding
│   │   ├── rides/                # Ride CRUD & search
│   │   │   ├── [id]/
│   │   │   │   └── request/      # Ride request handling
│   │   │   ├── my-rides/         # User's published rides
│   │   │   └── my-requests/      # User's ride requests
│   │   ├── route/                # OSRM multi-route API
│   │   ├── upload-car-image/     # Appwrite file upload
│   │   ├── validate-car-image/   # Groq AI vehicle verification
│   │   └── user/sync/            # Clerk → DB user sync
│   ├── auth/[[...auth]]/         # Clerk auth pages
│   ├── dashboard/                # User dashboard
│   ├── publish/                  # 5-step ride publishing wizard
│   ├── search/                   # Ride search & filters
│   ├── rides/[id]/               # Individual ride details
│   ├── layout.tsx                # Root layout with Clerk provider
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/ui/
│   ├── globe.tsx                 # 3D interactive globe (cobe)
│   ├── stars.tsx                 # Parallax stars background
│   ├── container-scroll-animation.tsx  # Scroll-triggered animation
│   ├── animated-roadmap.tsx      # Milestone roadmap component
│   ├── map-view.tsx              # Mapbox map wrapper
│   ├── map-view-inner.tsx        # Mapbox map with routes & markers
│   ├── location-autocomplete.tsx # Smart location search input
│   ├── ride-card.tsx             # Ride listing card component
│   ├── date-picker.tsx           # Custom date picker
│   ├── time-picker.tsx           # Custom time picker
│   ├── search-pill-date-picker.tsx # Compact search pill date picker
│   ├── step-progress.tsx         # Animated step wizard progress bar
│   ├── auth-layout.tsx           # Auth page with car animations
│   ├── navbar.tsx                # Navigation bar
│   ├── nav-auth.tsx              # Auth-aware navigation
│   ├── avatar.tsx                # User avatar (Radix UI)
│   └── NeumorphismButton.tsx     # Neumorphic button component
├── db/
│   ├── schema.ts                 # Drizzle database schema
│   └── index.ts                  # Database connection
├── lib/
│   ├── appwrite.ts               # Appwrite client config
│   ├── haversine.ts              # Haversine distance calculation
│   ├── osrm.ts                   # OSRM routing utilities
│   └── utils.ts                  # Shared utility functions
├── drizzle/                      # Database migrations
├── public/                       # Static assets (logos, car images)
└── scripts/
    └── migrate-uuid.ts           # UUID migration script
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** or **yarn**
- Accounts on: [Clerk](https://clerk.com), [Neon](https://neon.tech), [Appwrite](https://appwrite.io), [Mapbox](https://mapbox.com), [Groq](https://groq.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mohini457/ProjectDev-Batch1.git
cd ProjectDev-Batch1

# 2. Switch to the parmeet branch
git checkout parmeet

# 3. Install dependencies
npm install

# 4. Set up environment variables (see section below)
cp .env.example .env.local

# 5. Run database migrations
npx drizzle-kit push

# 6. Start the development server
npm run dev
```

The app will be running at **http://localhost:3000** 🎉

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# ── Clerk Authentication ─────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth

# ── Neon PostgreSQL Database ─────────────────
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Mapbox (Maps & Routing) ──────────────────
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# ── Appwrite (File Storage) ──────────────────
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_BUCKET_ID=your_bucket_id

# ── Groq AI (Vehicle Vision Verification) ────
GROQ_API_KEY=gsk_...
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS {
        serial id PK
        varchar clerk_id UK
        varchar name
        varchar email UK
        timestamp created_at
    }

    RIDE_POOLS {
        uuid id PK
        integer driver_id FK
        text pickup_location
        text drop_location
        text pickup_lat
        text pickup_lng
        text drop_lat
        text drop_lng
        timestamp departure_date
        varchar departure_time
        integer total_seats
        integer available_seats
        integer vehicle_capacity
        varchar vehicle_model
        varchar vehicle_plate
        text vehicle_image_url
        integer price_per_seat
        integer smoking_allowed
        integer music_allowed
        integer pets_allowed
        integer female_only
        varchar luggage_size
        text additional_notes
        varchar status
        integer estimated_duration
        integer estimated_distance
        text route_polyline
        timestamp created_at
    }

    RIDE_REQUESTS {
        serial id PK
        integer rider_id FK
        uuid ride_pool_id FK
        varchar status
        integer requested_seats
        text message
        text pickup_note
        timestamp created_at
    }

    USERS ||--o{ RIDE_POOLS : "publishes"
    USERS ||--o{ RIDE_REQUESTS : "requests"
    RIDE_POOLS ||--o{ RIDE_REQUESTS : "receives"
```

---

## 📡 API Reference

### Geocoding

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/api/geocode?q={query}` | Forward geocode — place name → coordinates |
| `GET` | `/api/reverse-geocode?lat={lat}&lng={lng}` | Reverse geocode — coordinates → address |

### Rides

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/api/rides?from=lat,lng&to=lat,lng&date=YYYY-MM-DD&seats=N` | Search available rides |
| `POST` | `/api/rides` | Publish a new ride |
| `GET` | `/api/rides/[id]` | Get ride details by UUID |
| `GET` | `/api/rides/my-rides` | Get current user's published rides |
| `GET` | `/api/rides/my-requests` | Get current user's ride requests |

### Ride Requests

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/rides/[id]/request` | Request to join a ride |

### Routing

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `GET` | `/api/route?pickup_lat&pickup_lng&drop_lat&drop_lng` | Get multi-route options via OSRM |

### Vehicle Verification

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/validate-car-image` | AI vehicle image verification (multipart/form-data) |
| `POST` | `/api/upload-car-image` | Upload vehicle image to Appwrite (multipart/form-data) |

### User

| Method | Endpoint | Description |
|:------:|----------|-------------|
| `POST` | `/api/user/sync` | Sync Clerk user to database |

---

## 🧩 UI Components

| Component | Description |
|:----------|:------------|
| `Globe` | 3D WebGL globe with animated arcs and global markers |
| `StarsBackground` | Canvas-based parallax star field with custom colors |
| `ContainerScroll` | Scroll-triggered 3D perspective animation |
| `AnimatedRoadmap` | Interactive milestone tracker with hover effects |
| `MapView` | Mapbox GL wrapper with multi-route visualization & draggable markers |
| `LocationAutocomplete` | Debounced geocoding search with dropdown suggestions |
| `RideCard` | Feature-rich ride listing card with driver info & amenities |
| `DatePicker` | Custom calendar-style date picker |
| `TimePicker` | Custom time selection with wheel-style input |
| `SearchPillDatePicker` | Compact inline date picker for search bars |
| `StepProgress` | Animated wizard progress bar with driving car icon |
| `AuthLayout` | Animated auth page with car transitions & smoke effects |
| `NavAuth` | Auth-aware navigation with profile menu & "My Rides" |
| `NeumorphismButton` | Soft UI neumorphic button component |

---

## 📸 Screenshots

> *Screenshots will be added as the application progresses through development modules.*

| Page | Description |
|:-----|:------------|
| Landing Page | Hero section with 3D globe, search pill, value props |
| Auth Page | Animated sign-in/sign-up with car transitions |
| Publish Wizard | 5-step ride creation with live map |
| Search Page | Ride results with sidebar filters |
| Ride Details | Full ride info with request functionality |

---

## 📄 License

This project is developed as part of **ProjectDev Batch 1** and is intended for educational and portfolio purposes.

---

<p align="center">
  <strong>Built with ❤️ using Next.js, React & AI</strong>
</p>

<p align="center">
  <sub>Carvaan Go © 2026 — All Rights Reserved</sub>
</p>
