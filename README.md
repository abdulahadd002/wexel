# Wexel

A full-stack application for extracting handwritten text from bill images using AI-powered OCR and managing sales data.

## Features

- **Image Upload**: Upload photos of handwritten bills directly
- **AI-Powered OCR**: Uses OpenAI GPT-4 Vision to extract handwritten text in English and Urdu
- **Dynamic Field Extraction**: Automatically detects and extracts all fields from bills
- **Excel-like Editing**: Edit extracted data directly in a spreadsheet-style interface
- **Daily Sheets**: Bills organized by day with automatic gross sales calculation
- **Excel Export**: Export daily sheets to Excel format
- **User Authentication**: Secure login/registration with JWT

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Vanilla CSS for styling
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- OpenAI API for OCR
- ExcelJS for exports

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional, for PostgreSQL)
- OpenAI API key

## Getting Started

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Database

Using Docker (recommended):
```bash
# From project root
docker-compose up -d
```

Or use your own PostgreSQL instance.

### 3. Configure Environment

Copy the environment example and fill in your values:

```bash
cd server
cp ../.env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL=postgresql://wexel:wexel123@localhost:5432/wexel
JWT_SECRET=your-secure-jwt-secret
OPENAI_API_KEY=your-openai-key
```

### 4. Initialize Database

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Bills**: Go to Upload page and upload photos of handwritten bills
3. **View Data**: See extracted data on the Sheets page
4. **Edit Data**: Click on any cell to edit the extracted values
5. **Export**: Download daily sheets as Excel files

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user
- `POST /api/auth/logout` - Logout

### Bills
- `GET /api/bills` - List bills (with filters)
- `POST /api/bills/upload` - Upload and process image
- `PUT /api/bills/:id` - Update bill data
- `DELETE /api/bills/:id` - Delete bill

### Sheets
- `GET /api/sheets` - List daily sheets
- `GET /api/sheets/:date` - Get sheet by date
- `GET /api/sheets/:date/export` - Export to Excel
- `GET /api/sheets/gross-sales` - Get sales summary

## Project Structure

```
wexel/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # React context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS files
│   │   └── types/          # TypeScript types
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   ├── prisma/             # Database schema
│   ├── uploads/            # Uploaded images
│   └── ...
├── docker-compose.yml      # PostgreSQL container
└── README.md
```

## License

MIT
