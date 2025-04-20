# Community Learning Hub

A platform for fostering an inclusive AI learning community with free and paid tiers, built with Next.js, Tailwind CSS, and Supabase.

## Features

- **Authentication**: User registration and login via Supabase Auth
- **Blog**: MDX-powered blog for community content
- **Forum**: Real-time forum discussions (coming soon)
- **Events**: Calendar and event registration system (coming soon)
- **Subscriptions**: Tiered membership plans via Stripe
- **Dashboard**: User profile and activity tracking
- **Admin Panel**: Content and user management

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Supabase (Auth & Database)
- **Content**: MDX for blog posts
- **Payments**: Stripe for subscription billing
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Supabase account
- Stripe account (for subscription features)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=your_stripe_basic_price_id
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=your_stripe_premium_price_id
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and API clients
- `/src/content`: MDX blog posts and other content

## Deployment

This project is optimized for deployment on Vercel:

```bash
npm run build
```

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
