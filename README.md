# E-Commerce Chita

Fresh produce marketplace for Chita, Russia. Built with Next.js 16, Prisma, and PostgreSQL.

## Getting Started

### Option 1: Docker Compose (Recommended)

The easiest way to run the project with all dependencies:

```bash
# Start all services (PostgreSQL + Next.js app)
docker compose up -d

# Run database migrations
docker compose exec app npx prisma db push

# Seed the database
docker compose exec app npm run db:seed

# View logs
docker compose logs -f app
```

The app will be available at [http://localhost:3000](http://localhost:3000)

**Useful commands:**
```bash
# Stop all services
docker compose down

# Stop and remove volumes (reset database)
docker compose down -v

# Rebuild after package.json changes
docker compose up -d --build

# Open Prisma Studio
docker compose exec app npx prisma studio
```

### Option 2: Local Development

If you prefer running locally without Docker:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your PostgreSQL connection string
   ```

3. **Set up database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Commands

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

## Demo Accounts

After seeding, you can log in with:

- **Admin:** admin@freshproduce.ru / admin123
- **Customer:** customer@example.com / customer123

## Tech Stack

- **Framework:** Next.js 16
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5
- **Styling:** Tailwind CSS v4
- **UI:** Radix UI primitives

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
