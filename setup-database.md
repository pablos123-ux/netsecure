# Database Setup Instructions

## Current Issue
Your application is getting a 500 Internal Server Error because it cannot connect to the PostgreSQL database. The error shows it's trying to connect to a Neon database but failing.

## Solution Steps

### 1. Create Environment File
Create a `.env.local` file in your project root with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@ep-purple-dew-adil0eqm-pooler.c-2.us-east-1.aws.neon.tech:5432/dbname?sslmode=require"

# JWT Secret for authentication
JWT_SECRET="your-super-secret-jwt-key-here"

# Next.js Environment
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

### 2. Database Options

#### Option A: Use Neon Database (Recommended for Production)
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new database or use your existing one
3. Copy the connection string and update the `DATABASE_URL` in your `.env.local` file

#### Option B: Use Local PostgreSQL (Recommended for Development)
1. Install PostgreSQL locally
2. Create a database named `netsecure_db`
3. Update your `.env.local` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/netsecure_db"
```

### 3. Run Database Migrations
After setting up your database connection:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database with initial data
npx prisma db seed
```

### 4. Test the Connection
Restart your development server and test the admin stats API:

```bash
npm run dev
```

The API should now work without the 500 error.

## Troubleshooting

- **Connection refused**: Check if your database server is running
- **Authentication failed**: Verify your database credentials
- **SSL/TLS errors**: Make sure your connection string includes `?sslmode=require` for remote databases
- **Network issues**: Check your internet connection and firewall settings

## Environment File Location
- Create `.env.local` in the root directory (same level as `package.json`)
- This file will be automatically loaded by Next.js
- Never commit this file to version control (it should be in `.gitignore`)
