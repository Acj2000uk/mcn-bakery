# MCN Bakery Portal

Premium stock management portal for MCN Bakery. High-fidelity dessert distribution platform featuring AI-powered function sheet extraction, real-time production scheduling, and inventory analytics.

## Getting Started

### Prerequisites

- Node.js (v22.6 or later recommended for native TypeScript support)
- npm or yarn

### Installation

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file based on `.env.example`.
   - Add your `GEMINI_API_KEY` for AI features.

### Development

To start the development server with hot reload:
```bash
npm run dev
```

### Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

## Project Structure

- `server.ts`: Express server handling API routes and static file serving.
- `src/App.tsx`: Main React application logic.
- `firestore.rules`: Security rules for the Firestore database.
- `firebase-applet-config.json`: Firebase configuration for the project.

## Deployment Notes

This application is ready for deployment to platforms like Cloud Run, Heroku, or Vercel. Ensure you set the `NODE_ENV` to `production` in your deployment environment.
