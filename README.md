# HelpDesk ITSM - Employee Support Portal (Frontend)

[![Vue 3](https://img.shields.io/badge/Vue.js-3.5-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Nginx%20Alpine-2496ED.svg)](https://www.docker.com/)

Modern, enterprise-grade IT Helpdesk & Service Management (ITSM) web portal built with **Vue 3**, **TypeScript**, **Vite**, **Pinia**, and **Tailwind CSS**.

🔗 **Backend API Repository**: [https://github.com/HarshadRawat/helpdesk-backend](https://github.com/HarshadRawat/helpdesk-backend)

---

## Features

- **Role-Based Workspaces**:
  - **Employee (`ROLE_CUSTOMER`)**: Submit incident requests, upload diagnostic screenshots/attachments, track SLA countdowns, and discuss with technicians. Internal IT notes are strictly isolated and invisible to employees.
  - **Assigned IT Support (`ROLE_AGENT`)**: Interactive queue triage, ticket claiming, lifecycle state transitions (`OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`), amber-badged internal IT notes, and team workload capacity monitoring.
  - **Peer IT Support (`ROLE_AGENT`)**: ITIL 4 Support Swarming allowing peer technicians to collaborate by adding internal diagnostic notes to any active queue ticket.
  - **Administrator (`ROLE_ADMIN`)**: Staff directory onboarding, technician reassignment with duplicate-assignment guards, and immutable compliance audit trail with before/after state diffs.
- **Architectural Best Practices**:
  - **Optimistic Concurrency Detection**: Tracks ticket `@Version` on status updates. Gracefully alerts when another technician modified the ticket concurrently (`409 Conflict`) to prevent silent lost updates.
  - **Dual-Channel Resilient Fetching**: Loads ticket details and auxiliary resources concurrently with `Promise.allSettled`, providing fallback error boundaries.
  - **Automatic Token Rotation**: Axios interceptors handle stateless JWT access and refresh token exchange with automatic retry on expiration.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`. API requests to `/api` are automatically proxied to the Spring Boot backend on `http://localhost:8080`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.

---

## Demonstration Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **IT Support (Lead)** | Alex Rivera | `support@example.com` | `Support@123` |
| **IT Support (Infra)** | Marcus Vance | `marcus.vance@example.com` | `Support@123` |
| **Employee** | Sarah Connor | `employee@example.com` | `Employee@123` |
| **Employee** | John Doe | `john.doe@example.com` | `Employee@123` |

> *Note: System Administrator credentials are intentionally omitted for security and configured via environment variables.*
