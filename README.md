# Scrabble Calculator Web

Mobile-first frontend for the Scrabble Calculator API.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Zustand
- Lucide React
- Sonner

## Local backend

The frontend expects the backend at:

    http://localhost:5050

The Next.js rewrite proxies:

    /backend/*

to:

    http://localhost:5050/api/v1/*

This allows browser requests to remain on the same frontend origin during local development.

## Start the backend

In Terminal 1:

    cd ~/ScrabbleCalculator
    nvm use 24
    docker compose up -d db
    npx prisma migrate deploy
    npm run dictionary:seed
    npm run dev

## Start the frontend

In Terminal 2:

    cd ~/scrabble-calculator-web
    nvm use 24
    npm run dev

Open:

    http://localhost:3000

## Environment

Copy `.env.example` to `.env.local` and update the backend URL when necessary.

## Product rule

Exact cumulative scores remain private while a match is active. Exact final scores become visible only after successful match completion.
