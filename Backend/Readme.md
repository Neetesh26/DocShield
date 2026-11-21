# DocuShield Backend API Service
> GxP-compliant REST API server for electronic document management, physical coordinate archiving, and 21 CFR Part 11 electronic records.

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Seed database
npm run seed

# 3. Start development server
npm run dev

# 4. Run tests
npm test
```

## Environment Variables (.env)
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

