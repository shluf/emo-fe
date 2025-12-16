# MindCare - Mental Health Frontend

A modern React application for AI-powered mental health support, built with Vite, TypeScript, and Tailwind CSS.

## Features

- 🧠 **Emotion Analysis**: AI-powered text analysis to understand emotional states
- 🎵 **Music Therapy**: Personalized music recommendations based on emotions
- 📊 **Dashboard**: Track mood patterns and wellness metrics
- 🔐 **Authentication**: Secure user registration and login
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- ⚡ **Performance**: Optimized with React.memo, lazy loading, and code splitting

## Tech Stack

- **Framework**: React 19.2.1 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Fonts**: Urbanist (Google Fonts)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   └── layout/         # Layout components (Header, Sidebar, etc.)
├── features/           # Feature-based modules
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Helper functions and constants
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your backend API URL:
   ```
   VITE_API_URL=http://localhost:8000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Overview

### Authentication
- User registration and login
- JWT token management
- Protected routes
- Persistent authentication state

### Emotion Analysis
- Text input for mood analysis
- AI-powered emotion detection
- Confidence scores and probability breakdown
- Personalized recommendations

### Music Therapy
- Emotion-based music recommendations
- Search and filter functionality
- Music player interface
- Playlist management

### Dashboard
- Mood tracking overview
- Recent activity display
- Statistics and trends
- Quick access to features

### Profile Management
- User profile editing
- Password change functionality
- Account statistics
- Settings management

## Performance Optimizations

- **React.memo**: Memoized components to prevent unnecessary re-renders
- **useCallback & useMemo**: Optimized expensive calculations and functions
- **Lazy Loading**: Code splitting for pages and heavy components
- **Image Optimization**: Proper image loading and caching
- **Bundle Splitting**: Automatic code splitting with Vite

## Design System

The application follows a comprehensive design system based on the Figma designs:

- **Typography**: Urbanist font family with consistent sizing
- **Colors**: Primary blue palette with semantic color system
- **Spacing**: Consistent spacing scale using Tailwind utilities
- **Components**: Reusable UI components with consistent styling
- **Responsive**: Mobile-first responsive design

## API Integration

The frontend integrates with the FastAPI backend for:

- User authentication and management
- Emotion prediction and analysis
- Music recommendations
- Data persistence and retrieval

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Follow the design system guidelines
4. Add proper error handling and loading states
5. Write meaningful commit messages

## License

This project is part of a university assignment for PPD (Penambangan Data) course.