# Overview

ZakaMall is a multi-vendor e-commerce marketplace specifically designed for the Burkina Faso market. The platform connects vendors, customers, and delivery drivers through an integrated system that supports local West African payment solutions including Orange Money and Moov Money. The application features role-based dashboards for different user types (customers, vendors, drivers, and admins) and provides a complete e-commerce ecosystem with product management, order processing, cart functionality, and real-time delivery tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture
The application uses a modern full-stack JavaScript architecture with a clear separation between client and server:

- **Frontend**: React 18 with TypeScript, built using Vite for development and bundling
- **Backend**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit's OIDC authentication system with session management

## Frontend Architecture
The client-side application is built with React and follows a component-based architecture:

- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Forms**: React Hook Form with Zod validation schemas

The application supports multiple user roles with role-based routing and dashboards. Each role (customer, vendor, driver, admin) has dedicated pages and components tailored to their specific needs.

## Backend Architecture
The server follows a RESTful API design with Express.js:

- **Database Layer**: Drizzle ORM provides type-safe database access with schema definitions
- **Authentication**: Session-based authentication using Replit's OIDC with PostgreSQL session storage
- **API Routes**: Modular route handlers for different resource types
- **Middleware**: Request logging, JSON parsing, and error handling middleware

## Database Design
The database schema supports a multi-vendor marketplace with the following key entities:

- **Users**: Base user entity with role-based access (customer, vendor, driver, admin)
- **Vendors**: Extended vendor profiles with approval status and business details
- **Drivers**: Driver profiles for delivery personnel
- **Products**: Product catalog with categories, pricing, and inventory
- **Orders**: Order management with status tracking and line items
- **Cart**: Shopping cart functionality for customers
- **Reviews**: Product review and rating system

The schema uses PostgreSQL enums for type safety and includes proper relationships between entities.

## Payment Integration
The system is designed to support West African payment methods:

- Orange Money integration for mobile payments
- Moov Money support for alternative mobile payments
- Cash on delivery option for traditional payment preferences

## Development Environment
The application is configured for Replit deployment with:

- Hot module replacement in development using Vite
- TypeScript compilation and type checking
- ESM module system throughout the codebase
- Environment-based configuration for database connections

# Recent Changes

## 2025-08-08 - Email System Implementation
- **Feature Added**: Real email sending system using nodemailer and Gmail integration
- **Capabilities**: 
  - Verification codes sent to actual email addresses
  - Professional HTML email templates with ZakaMall branding
  - Welcome emails sent after successful account creation
  - Fallback to console logging in development mode
- **Configuration**: Email service supports Gmail via app passwords and SMTP providers
- **Status**: Both verification and welcome emails working successfully
- **Testing Confirmed**: Email delivery functional with proper templates and branding

## 2025-08-08 - SMS System Implementation
- **Feature Added**: Real SMS sending system with multiple provider support including Orange API
- **Capabilities**:
  - Verification codes sent to actual phone numbers
  - Primary support for Orange API (preferred for Burkina Faso market)
  - Additional support for Twilio, Textbelt, and Africa's Talking SMS providers
  - Phone number normalization for Burkina Faso (+226) format
  - Fallback to console logging in development mode
- **Configuration**: SMS service supports multiple providers via environment variables
- **Status**: SMS infrastructure ready for production with Twilio integration configured
- **Testing**: Real SMS sending enabled via Twilio with provided credentials

## 2025-08-08 - Registration System Fix
- **Issue Resolved**: Missing `phone_operator` column in users table causing registration failures
- **Action Taken**: Added missing database column with `ALTER TABLE users ADD COLUMN phone_operator VARCHAR(20);`
- **Status**: Registration system fully functional for both phone and email signup
- **Testing Confirmed**: Both Orange Money and Moov Money operator support working

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## Authentication Services
- **Replit OIDC**: Identity provider for user authentication
- **OpenID Client**: OAuth 2.0 and OpenID Connect client library

## UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Payment Processing
- **Orange Money API**: Mobile money payment integration (planned)
- **Moov Money API**: Alternative mobile payment solution (planned)

## Form Management
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation library
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Data Fetching
- **TanStack React Query**: Server state management and caching
- **Fetch API**: Native browser API for HTTP requests