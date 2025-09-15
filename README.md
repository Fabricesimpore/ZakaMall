# 🛒 ZakaMall - Modern E-commerce Marketplace

ZakaMall is a comprehensive, full-stack e-commerce marketplace platform built with modern web technologies. It supports multi-vendor operations, real-time features, and provides a seamless shopping experience for customers while offering powerful management tools for vendors and administrators.

## 🌟 Features

### For Customers
- **Product Discovery**: Advanced search with filtering, sorting, and personalized recommendations
- **Multi-Vendor Shopping**: Browse products from multiple vendors in one platform
- **Shopping Cart & Wishlist**: Persistent cart and wishlist functionality
- **Secure Payments**: Integrated with Stripe for secure payment processing
- **Order Tracking**: Real-time order status updates and notifications
- **User Reviews**: Rate and review products and vendors
- **Restaurant Ordering**: Dedicated restaurant marketplace with delivery options

### For Vendors
- **Vendor Dashboard**: Complete vendor management interface
- **Product Management**: Add, edit, and manage product inventory
- **Order Management**: Process orders and track sales
- **Analytics**: Sales analytics and performance metrics
- **Commission Tracking**: Transparent commission and payout system
- **Multi-Store Support**: Manage multiple stores under one account

### For Administrators
- **Admin Dashboard**: Comprehensive platform management
- **User Management**: Manage customers, vendors, and admin accounts
- **Content Management**: Manage categories, products, and platform content
- **Analytics & Reporting**: Platform-wide analytics and financial reports
- **Security & Moderation**: Content moderation and fraud detection

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling with custom design system
- **TanStack Query** for state management and caching
- **Wouter** for routing
- **Radix UI** for accessible components
- **Framer Motion** for animations
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **Redis** for caching and session management
- **Passport.js** for authentication
- **WebSockets** for real-time features
- **Cloudinary** for image storage and optimization

### Database & Infrastructure
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **Meilisearch** for advanced search capabilities
- **Railway** for deployment and hosting
- **GitHub Actions** for CI/CD

### Payment & Communication
- **Stripe** for payment processing
- **Nodemailer** for email notifications
- **SMS integration** for order updates

## 📁 Project Structure

```
ZakaMall/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
│   ├── public/            # Static assets
│   └── index.html         # Entry HTML file
├── server/                # Express.js backend
│   ├── api/              # API route handlers
│   ├── auth.ts           # Authentication logic
│   ├── storage.ts        # Database operations
│   ├── routes/           # Route definitions
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic services
│   └── utils/            # Server utilities
├── shared/               # Shared types and schemas
│   └── schema.ts         # Zod schemas for validation
├── scripts/              # Database and utility scripts
├── migrations/           # Database migrations
└── e2e/                  # End-to-end tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis server
- Cloudinary account (for image storage)
- Stripe account (for payments)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ZakaMall.git
   cd ZakaMall
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Copy `.env.example` to `.env` and configure:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/zakamall
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # Authentication
   SESSION_SECRET=your-super-secret-session-key
   GOOGLE_CLIENT_ID=your-google-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   
   # Payments
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Storage
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Search
   MEILISEARCH_HOST=http://localhost:7700
   MEILISEARCH_API_KEY=your-meilisearch-key
   
   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:push
   
   # Setup database indexes
   npm run db:indexes
   
   # Run startup migrations
   npm run migrations:startup
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 📝 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run check` - TypeScript type checking
- `npm run build` - Build for production

### Database Management
- `npm run db:push` - Push database schema changes
- `npm run db:indexes` - Setup database indexes
- `npm run db:migrate` - Run database migrations
- `npm run db:validate` - Validate database schema
- `npm run db:health-check` - Check database health

### Testing
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:search` - Test search functionality

### Production
- `npm run start` - Start production server
- `npm run build:analyze` - Analyze build output

## 🏗 Architecture Overview

ZakaMall follows a modern full-stack architecture with clear separation of concerns:

### Frontend Architecture
- **Component-Based**: Modular React components with TypeScript
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: File-based routing with Wouter
- **Styling**: Utility-first CSS with Tailwind CSS
- **Forms**: Declarative forms with React Hook Form and Zod validation

### Backend Architecture
- **API-First**: RESTful API design with Express.js
- **Type Safety**: End-to-end TypeScript for reliability
- **Database Layer**: Drizzle ORM for type-safe database operations
- **Caching Strategy**: Redis for session storage and API caching
- **Real-time**: WebSocket integration for live updates

### Key Design Patterns
- **Repository Pattern**: Database operations abstracted through storage layer
- **Middleware Pattern**: Modular request processing with Express middleware
- **Observer Pattern**: Real-time updates through WebSocket events
- **Factory Pattern**: Service instantiation and dependency injection

## 🔐 Security Features

- **Authentication**: Secure session-based auth with Passport.js
- **Authorization**: Role-based access control (Customer, Vendor, Admin)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation with Zod schemas
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Headers**: Security headers with Express middleware

## 🎯 Key Features Deep Dive

### Multi-Vendor Marketplace
- Vendor registration and approval workflow
- Independent vendor storefronts
- Commission-based revenue model
- Vendor analytics and reporting

### Advanced Search & Discovery
- Full-text search with Meilisearch
- Faceted search with filters
- Personalized recommendations
- Search analytics and optimization

### Real-time Features
- Live inventory updates
- Real-time order notifications
- WebSocket-based communication
- Live chat support (coming soon)

### Payment Processing
- Secure Stripe integration
- Multiple payment methods
- Automated vendor payouts
- Transaction monitoring

## 📊 Performance & Monitoring

### Performance Optimizations
- Database query optimization with indexes
- Redis caching for frequently accessed data
- Image optimization with Cloudinary
- Code splitting and lazy loading
- Gzip compression for assets

### Monitoring & Logging
- Structured logging with Winston
- Performance monitoring
- Error tracking and reporting
- Health check endpoints

## 🚢 Deployment

### Production Deployment (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment-Specific Scripts
```bash
# Production database operations
npm run db:push:prod
npm run db:indexes:prod
npm run migrations:startup

# Health checks
npm run health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Follow the existing code style (Prettier + ESLint)

## 📋 Roadmap

See [ARCHITECTURE_ROADMAP.md](./ARCHITECTURE_ROADMAP.md) for detailed future plans, including:

- **Phase 1**: Microservices migration and performance improvements
- **Phase 2**: AI-powered recommendations and advanced search
- **Phase 3**: Machine learning fraud detection and analytics
- **Phase 4**: International expansion and mobile apps

## 📚 Documentation

- [Architecture Roadmap](./ARCHITECTURE_ROADMAP.md) - Future development plans
- [Database Management](./DATABASE-MANAGEMENT.md) - Database operations guide
- [Search Testing](./SEARCH-TESTING.md) - Search functionality testing
- [Meilisearch Integration](./README-MEILISEARCH.md) - Search engine setup

## 🐛 Known Issues & Solutions

### Common Issues
1. **Products not loading**: Check vendor approval status and product active status
2. **Search not working**: Verify Meilisearch configuration and indexing
3. **Payment failures**: Validate Stripe webhook configuration
4. **Image upload issues**: Check Cloudinary credentials and upload presets

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer**: [Your Name](https://github.com/your-username)
- **Contributors**: See [Contributors](https://github.com/your-username/ZakaMall/graphs/contributors)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Stripe](https://stripe.com/) - Payment processing
- [Cloudinary](https://cloudinary.com/) - Image management
- [Railway](https://railway.app/) - Deployment platform

---

## 📞 Support

For support, email support@zakamall.com or create an issue in the GitHub repository.

**Happy Shopping! 🛍️**