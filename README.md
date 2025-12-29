# RigCheck Web Application

A comprehensive PC build planning and compatibility checking platform built with Next.js.

## Overview

RigCheck is a web-based tool that helps users plan, validate, and share custom PC builds. The platform provides real-time compatibility checking, component pricing, and community features for PC enthusiasts and builders.

## Features

- Interactive PC builder with step-by-step component selection
- Real-time compatibility validation
- Live PSU wattage calculation and monitoring
- Component search and filtering
- Price tracking and comparison
- Build sharing and community feed
- User authentication and profile management
- Dark mode support

## Technology Stack

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Axios for API communication

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your API endpoint

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
rigcheck-web/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and API client
├── public/          # Static assets
└── styles/          # Global styles
```

## License

All rights reserved.
