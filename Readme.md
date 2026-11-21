# DocuShield — GxP Electronic & Physical Document Management System
> **VidyaGxP Suite** | FDA 21 CFR Part 11 Compliant Document Ingestion, Physical Archival, QR Identification & Chain-of-Custody Governance.

---

## 1. System Overview
DocuShield is an enterprise-grade full-stack MERN application engineered for regulated life sciences, pharmaceutical manufacturing, biotechnology, and QA environments. It bridges the gap between **electronic document lifecycle management (EDMS)** and **physical warehouse record archiving**, ensuring end-to-end auditability and compliance with **FDA 21 CFR Part 11**, **EU GMP Annex 11**, and **GAMP 5**.

### Key Differentiators & Demonstrated Workflows
1. **Intelligent Ingestion Pipeline (4-Step Regulated Wizard):**
   - **Step 1: File Ingestion** — Drag-and-drop PDF ingestion, client/server file validation, page-by-page preview navigation.
   - **Step 2: Header Extraction** — Real-time PDF header text parsing, confidence scoring (High/Medium/Low), duplicate detection (file hash, Doc #, and version), and rule-based auto-classification.
   - **Step 3: Storage & Custody** — Recommendation engine matching document types to designated vault racks/bins with real-time capacity checks, hierarchical coordinates (Building → Area → Room → Rack → Shelf → Bin → Box), and accountable custodian designation.
   - **Step 4: Review & Sign** — 21 CFR Part 11 electronic signature confirmation and transactional record creation.
2. **Physical Storage Map & Hierarchy:**
   - Multi-facility warehouse coordinate tracker with visual rack locator, capacity metrics, and document relocation audit trails.
3. **Chain of Custody & Physical Checkout Register:**
   - Formal custody transfer handovers with two-party digital sign-offs.
   - Controlled physical file check-outs with overdue enforcement and post-return condition inspections.
4. **Physical Reconciliation Audits:**
   - Location-specific physical inventory audits, automated pulling of expected records, optical QR verification, discrepancy tracking, and signed audit reports.
5. **21 CFR Part 11 Approval & Audit Cockpit:**
   - Role-based authorization for Print/Download/Controlled-Copy requests.
   - Immutable, append-only GxP audit trail logging all operations with operator identity, timestamps, and IP addresses.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18, Vite
- **Styling:** Tailwind CSS (Enterprise dark navy theme `#0F172A`, light workspace `#F8FAFC`, teal accents `#0D9488`)
- **Routing:** React Router DOM v6
- **Data Visualizations:** Recharts (5 analytical charts)
- **Icons:** Lucide React
- **HTTP Client:** Axios with JWT request interceptors
- **State Management:** React Context API (`AuthContext`, `NotificationContext`)
- **Optical Scanning:** Html5Qrcode & QRCode.react

### Backend
- **Runtime:** Node.js (v22+), Express.js (ES Modules)
- **Database:** MongoDB & Mongoose
- **Security & Authentication:** JWT, bcryptjs, Helmet, CORS, Express Rate Limit
- **File Ingestion & Parsing:** Multer, pdf-parse
- **QR Code Generation:** qrcode
- **Audit Logging:** Custom 21 CFR Part 11 append-only engine

---

## 3. Getting Started & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server (v6.0+) running locally or accessible via URI

### Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/docushield
JWT_SECRET=docushield_super_secure_jwt_secret_key_gxp_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./src/uploads
MAX_FILE_SIZE_MB=25
```

### Installation & Database Seeding

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Seed Database with Demo Data:**
   Ensure MongoDB is running, then run:
   ```bash
   cd backend
   npm run seed
   ```

4. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   # API will listen on http://localhost:5000
   ```

5. **Start Frontend Development Server:**
   ```bash
   cd frontend
   npm run dev
   # UI accessible at http://localhost:5173
   ```

---

## 4. Demo User Credentials (1-Click Login Enabled)

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Sarah Jenkins | `admin@docushield.com` | `DocuShield@2026` | Full system governance, master data, user administration |
| **QA Lead** | Michael Chang | `qa@docushield.com` | `DocuShield@2026` | Approvals, GxP audits, master data, checkout reviews |
| **Document Controller** | Elena Rostova | `doccontrol@docushield.com` | `DocuShield@2026` | Repository management, document revisions, vault assignments |
| **Department Head** | Dr. Rajesh Patel | `depthead@docushield.com` | `DocuShield@2026` | Departmental approvals, checkout requests, custody transfers |
| **Employee / Analyst** | Emily Davis | `analyst@docushield.com` | `DocuShield@2026` | Document search, view, request issuance, handover receipt |

---

## 5. API Architecture Reference

### Authentication
- `POST /api/auth/login` — Authenticate and issue JWT token
- `GET /api/auth/me` — Retrieve active profile & verified role
- `POST /api/auth/logout` — Invalidate session and log GxP event

### Document Ingestion & Repository
- `POST /api/documents/extract` — Upload PDF, run OCR header extraction, confidence scoring, duplicate check, auto-classification, and storage recommendation
- `POST /api/documents/check-duplicate` — Query existing records for duplicates
- `POST /api/documents` — Step 4: Finalize 21 CFR ingestion, reserve vault slot, generate QR
- `GET /api/documents` — Query repository with filters (status, type, dept, physical status), sorting, pagination
- `GET /api/documents/:id` — Retrieve full dossier (metadata, versions, requests, audit logs, related records)
- `PUT /api/documents/:id/metadata` — Regulated metadata update with change audit log
- `GET /api/documents/:id/qr` — Get high-density QR code image and payload

### Physical Archival & Chain of Custody
- `GET /api/storage/locations` — List warehouse rack/bin coordinates
- `GET /api/storage/hierarchy` — Retrieve hierarchical coordinate tree
- `POST /api/storage/move-document` — Relocate physical record with audit log
- `GET /api/handovers` — List chain-of-custody transfer transactions
- `POST /api/handovers` — Initiate custody transfer
- `POST /api/handovers/:id/accept` — Accept custody and transfer accountability
- `POST /api/handovers/:id/reject` — Reject custody transfer with justification
- `GET /api/checkouts` — List physical borrowing records and overdue items
- `POST /api/checkouts` — Check out physical binder
- `POST /api/checkouts/:id/return` — Inspect and verify physical return to vault
- `GET /api/audits` — List reconciliation audits
- `POST /api/audits` — Schedule physical reconciliation audit
- `PUT /api/audits/:id/verify-item` — Mark item Found (QR scanned), Missing, or Misplaced
- `POST /api/audits/:id/complete` — Finalize audit with signed report

### Workflow & Governance
- `GET /api/requests` & `POST /api/requests` — Manage print/download/checkout requests
- `GET /api/approvals` — Pending 21 CFR approval queue
- `POST /api/approvals/:id/approve` — Approve with electronic signature
- `POST /api/approvals/:id/reject` — Reject with documented justification
- `GET /api/dashboard/stats` — 8 key operational statistics
- `GET /api/dashboard/charts` — Distribution charts for Recharts
- `GET /api/audit-logs` — Immutable 21 CFR Part 11 audit trail
- `GET /api/master-data` — Departments, document types, storage locations
- `GET /api/notifications` — In-app notification center
- `POST /api/assistant/chat` — Context-aware procedure AI assistant

