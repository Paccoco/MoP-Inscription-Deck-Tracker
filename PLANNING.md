# Mist of Pandaria Card Tracker — Planning Document

## 🎯 Project Vision
A full-stack, self-hosted web application for World of Warcraft: Mist of Pandaria Classic guilds to transparently track Inscription Cards, deck completions, sales, payouts, and notifications. The goal is to empower guilds with collaborative tools, automated notifications, and robust admin controls, all tailored for MoP Classic transparency and collaboration.

## 📊 Current Status (v1.2.5)
### ✅ **Implemented Features**
- **Core Functionality**: Card/deck tracking, user management, JWT authentication
- **Admin Panel**: User approval, deck allocation, analytics dashboard, export/import
- **Notification System**: In-app notifications, Discord webhooks, per-user Gotify integration
- **Security**: Automated dependency updates, manual version checking, rollback capabilities
- **Database**: SQLite with WAL mode, comprehensive schema, automated initialization
- **Production Ready**: Deployment scripts, backup systems, monitoring tools
- **UI/UX**: Responsive design, MoP theming, mobile-friendly interface

### 🚧 **Active Development Areas**
- **Code Quality**: File modularization (500-line limit enforcement)
- **Performance**: Database optimization, React component optimization
- **Security**: Input validation, rate limiting, CSRF protection
- **Testing**: Comprehensive test coverage, integration testing
- **Documentation**: Enhanced developer guides, API documentation

## 🏗️ Technical Architecture

### **Stack Overview**
- **Frontend**: React 18 (SPA) + Custom CSS + Chart.js analytics
- **Backend**: Node.js + Express.js + JWT authentication + SQLite
- **Database**: SQLite with WAL mode, foreign keys, automated backups
- **Deployment**: PM2 + Nginx + Ubuntu/Debian servers
- **Integrations**: Discord webhooks + Gotify notifications

### **Core Components**
- **`server-auth.js`**: Main backend API, authentication, notifications
- **`client/src/App.js`**: Main React application shell
- **`client/src/Admin.js`**: Admin dashboard and controls
- **Database Schema**: 15+ tables for users, cards, decks, notifications, activity
- **Notification Engine**: Unified delivery system for all alert types

### **Security Architecture**
- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access (Admin, Officer, User)
- **Input Validation**: Parameterized queries, sanitization (needs enhancement)
- **Rate Limiting**: Basic protection (needs expansion)
- **Security Monitoring**: Automated dependency scanning, update alerts

## 🎯 Development Standards

### **Code Quality Requirements**
- **File Size Limit**: Maximum 500 lines per file - split immediately when exceeded
- **Testing Coverage**: Minimum 3 test cases per feature (happy path, edge case, error case)
- **Error Handling**: Comprehensive try-catch blocks, user-friendly error messages
- **Documentation**: JSDoc comments for complex functions, inline explanations
- **Performance**: React.memo, useMemo, useCallback for optimization

### **Security Standards**
- **Input Validation**: All `req.body`, `req.params`, `req.query` must be validated
- **Database Safety**: Parameterized queries only, no `SELECT *` statements
- **Authentication**: JWT verification on all protected endpoints
- **Environment Security**: All secrets in environment variables
- **Audit Trail**: Complete activity logging for administrative actions

### **Database Standards**
- **Query Optimization**: Specific column selection, proper indexing
- **Transaction Safety**: Multi-step operations in transactions
- **Backup Strategy**: Automated backups before schema changes
- **Performance**: WAL mode, foreign key constraints, proper indexes
- **Monitoring**: Query performance tracking, error logging

## 🚀 Development Workflow

### **Git Strategy**
- **Main Branch**: `master` - production-ready code only
- **Development**: `dev-branch` - active development and testing
- **Feature Branches**: For major features, merge to dev-branch first
- **Hotfixes**: Direct to master for critical production issues

### **Testing Procedures**
- **Unit Tests**: Jest for backend logic, React Testing Library for components
- **Integration Tests**: Full workflow testing (login, card management, notifications)
- **Manual Testing**: Browser testing for UI changes, mobile responsiveness
- **Production Testing**: Staging environment validation before deployment

### **Development Setup**
```bash
# Initial setup
npm install && cd client && npm install

# Development
npm run dev          # Backend with nodemon
cd client && npm start  # Frontend development server

# Testing
npm test 2>&1 | head -50  # Backend tests (limited output)
cd client && npm test     # Frontend tests

# Production build
cd client && npm run build
```

### **Code Review Standards**
- **Automated Checks**: ESLint, security scanning, test execution
- **Manual Review**: Architecture compliance, security considerations
- **Performance Review**: Database query efficiency, React optimization
- **Documentation Review**: Comments, README updates, CHANGELOG entries

## 🔮 Roadmap & Future Directions

### **Phase 1: Code Quality & Performance (Current)**
- **File Modularization**: Split large files into focused modules
- **Security Hardening**: Input validation, rate limiting, CSRF protection
- **Performance Optimization**: Database indexing, React optimizations
- **Test Coverage**: Comprehensive testing suite implementation

### **Phase 2: Enhanced Features**
- **Advanced Analytics**: Expanded Chart.js integration, trend analysis
- **Role Management**: Granular permissions (Officer, Contributor roles)
- **API Expansion**: REST API documentation, webhook endpoints
- **Mobile App**: React Native companion app

### **Phase 3: Scalability & Enterprise**
- **Multi-Guild Support**: Tenant isolation, guild-specific configs
- **Microservices**: Service separation for larger deployments
- **Real-time Features**: WebSocket notifications, live updates
- **Advanced Integrations**: More game integration points

## 📋 Integration Points

### **External Services**
- **Discord**: Automated notifications for deck completions, sales, requests
- **Gotify**: Per-user notification servers with custom configurations
- **GitHub**: Automated version checking and update management
- **npm Registry**: Dependency monitoring and security scanning

### **Internal Integrations**
- **Activity System**: Transparent logging across all components
- **Notification Engine**: Unified delivery system for all alert types
- **Authentication**: JWT-based security across frontend and backend
- **Analytics**: Chart.js integration for data visualization

## 🎯 Maintenance Guidelines

### **Document Updates**
- **Feature Changes**: Update PLANNING.md when adding major features
- **Architecture Changes**: Document significant technical modifications
- **Security Updates**: Record new security measures and requirements
- **Version Updates**: Align with CHANGELOG.md for major releases

### **Decision Criteria for New Features**
- **Guild Focus**: Must serve MoP Classic guild collaboration needs
- **Security First**: Cannot compromise existing security posture
- **Performance Impact**: Must not degrade current performance
- **Maintenance Burden**: Consider long-term support requirements
- **User Value**: Clear benefit to guild members or administrators

### **Scope Boundaries**
- **✅ In Scope**: Guild collaboration, MoP Classic content, transparency tools
- **❌ Out of Scope**: Email notifications, non-MoP content, individual player tools
- **🤔 Consider**: Features that enhance guild coordination without complexity

## 📈 Success Metrics
- **Performance**: <200ms API response times, <3s page loads
- **Security**: Zero security incidents, up-to-date dependencies
- **Quality**: >80% test coverage, <500 lines per file
- **Usability**: Mobile-friendly, <3 clicks for common actions
- **Reliability**: 99.9% uptime, automated backup verification

---

**This planning document serves as the authoritative guide for project direction, technical standards, and development practices. All development decisions should align with these principles and standards.**
