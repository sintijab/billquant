# Overview

This is ProQuote AI, an AI-powered construction project quotation platform built as a full-stack web application. The system enables users to create accurate construction proposals through a guided wizard interface that handles site visits, BOQ (Bill of Quantities) analysis, and document generation. The application follows a modern architecture with a React frontend, Express.js backend, and PostgreSQL database using Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system variables and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and local React state for UI
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture  
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON request/response format
- **Database Integration**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Middleware**: Express JSON parsing, URL encoding, and custom logging middleware
- **Development**: Hot reload with Vite development server integration

## Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for schema management
- **Schema Structure**: 
  - Users table for authentication
  - Projects table with workflow status tracking
  - Site areas and subareas for location hierarchy
  - Activity categories and activities for work breakdown
  - BOQ items for pricing and quantities
- **Migrations**: Drizzle Kit for database schema migrations and version control

## Project Workflow System
- **Multi-Step Wizard**: Five-step process (Setup → Site Visit → Activities → BOQ Pricing → Documents)
- **Data Flow**: Progressive data collection with validation at each step
- **State Persistence**: Project data stored in database with status tracking
- **Document Generation**: Automated quotation and cost breakdown document creation

## Authentication & Security
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Data Validation**: Zod schemas for both frontend and backend validation
- **Type Safety**: Full TypeScript coverage with shared types between client and server

# External Dependencies

## Core Technologies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database driver
- **drizzle-orm**: TypeScript ORM for database operations
- **drizzle-kit**: Database migration and introspection toolkit

## UI & Design System
- **@radix-ui/***: Comprehensive collection of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom design tokens
- **class-variance-authority**: Type-safe component variant management
- **lucide-react**: Icon library for consistent visual elements

## Development & Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking and enhanced developer experience
- **@replit/vite-plugin-***: Replit-specific development and debugging tools

## Data Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities

## Deployment Architecture
- **Production Build**: Vite builds optimized client bundle, esbuild compiles server
- **Static Assets**: Client files served from Express with Vite middleware in development
- **Database**: PostgreSQL with connection pooling and serverless compatibility