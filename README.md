# 🌾 Agronavis — Enterprise Farm Assistant Platform

> An AI-powered, full-stack farm management and advisory platform for Indian farmers.

---

## 📁 Monorepo Structure

```
Agronavis/
├── apps/
│   └── mobile/          # React Native (Expo Router) — farmer-facing app
├── backend/             # Node.js + Express + TypeScript REST API
├── packages/
│   └── shared-types/    # Shared TypeScript interfaces (used by app & backend)
├── services/
│   └── ml-service/      # Python FastAPI — AI/ML microservice
├── docs/                # Architecture & API documentation
└── scripts/             # Dev automation scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL (local or cloud)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd Agronavis

# 2. One-command setup
bash scripts/setup.sh

# 3. Start everything
npm run dev
```

This will start:
- 🖥️  Backend API  →  `http://localhost:3001`
- 📱  Expo DevTools → Metro bundler

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.76+, Expo 52+, Expo Router v4 |
| State | Redux Toolkit + redux-persist |
| Auth | Clerk (mobile) + Clerk JWT (backend) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Validation | Zod |
| Logging | Winston |
| ML Service | Python, FastAPI |
| CI/CD | GitHub Actions + EAS Build |

---

## 🌱 Key Features (Roadmap)

- [ ] Smart irrigation scheduling (IoT integration)
- [ ] AI crop disease detection (camera scan)
- [ ] AI Sahayak assistant (multilingual chatbot)
- [ ] Weather-based advisory system
- [ ] Market price intelligence
- [ ] Farmer community & knowledge-sharing
- [ ] Farm & crop management dashboard
- [ ] Government scheme recommendations

---

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)
- [Contributing Guide](docs/CONTRIBUTING.md)
