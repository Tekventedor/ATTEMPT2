# Next.js Supabase Courses Portal

A modern courses portal built with Next.js, Supabase, and Tailwind CSS.

## Features
- **Supabase-powered backend** for authentication and data
- **Single password authentication** for all users
- **Flexible usernames** (no special format required)
- **Modern UI** with Tailwind CSS
- **Ready for Vercel deployment**

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Tekventedor/REPO_NAME.git
cd REPO_NAME
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase and other secrets:
```bash
cp .env.local.example .env.local
```

### 4. Run locally
```bash
npm run dev
```

## Environment Variables
Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SINGLE_AUTH_PASSWORD=your-shared-password
```

## Deployment (Vercel)
1. Push your code to GitHub.
2. Import the repo in [Vercel](https://vercel.com/).
3. Set the environment variables in the Vercel dashboard (from `.env.local.example`).
4. Deploy!

---

### License
MIT
