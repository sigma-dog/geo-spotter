# Geo-Spotter Development Guide

## Project Overview

Monorepo with NestJS backend (TypeScript) and React frontend (TypeScript + Vite).

---

## Commands

### Backend

```bash
# Development
npm run start          # Start production build
npm run start:dev     # Start with hot reload
npm run start:debug   # Start with debugger

# Build & Lint
npm run build          # Build for production
npm run lint           # Run ESLint with auto-fix

# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:cov      # Run tests with coverage
npm run test:e2e      # Run e2e tests
npm test -- --testPathPattern=<file>  # Run single test file
npm test -- -t <test_name>            # Run single test by name
```

### Frontend

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run lint          # Run ESLint
npm run preview       # Preview production build
```

---

## Code Style

### General Rules

- **Indentation**: 4 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes
- **Line length**: Max 140 chars (frontend), soft limit 140 (backend)
- **Curly braces**: Always use for conditionals (`if ({condition}) { ... }`)

### Import Order (Backend)

1. External packages (`@nestjs/...`, `cloudinary`)
2. Relative paths to project modules (`src/...`)
3. Relative paths (`../`, `./`)

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
```

### Import Order (Frontend)

Groups (configured in eslint.config.js):
1. React packages
2. Absolute paths (`app/`, `features/`, `entities/`, `shared/`)
3. Relative imports
4. Type imports
5. Style imports (`.scss`, `.css`)

### Naming Conventions

- **Files**: kebab-case (`user.service.ts`, `auth.controller.ts`)
- **Classes**: PascalCase (`UsersService`, `AuthController`)
- **Methods/variables**: camelCase
- **DTOs**: PascalCase with `.dto.ts` suffix
- **Constants**: SCREAMING_SNAKE_CASE

### TypeScript

- Enable `strictNullChecks`
- Avoid `any` - use `unknown` or proper types
- Use `interface` for objects, `type` for unions/aliases
- Use Prisma generated types from `generated/prisma/client`

### Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Throw exceptions, don't return error objects
- Use custom exception filters for global error handling

```typescript
throw new NotFoundException(`User with id ${id} not found`);
```

### NestJS Patterns

**Module structure**:
```typescript
@Module({
    imports: [...],
    controllers: [Controller],
    providers: [Service],
    exports: [Service],
})
export class FeatureModule {}
```

**Service**: Business logic, injected into controllers/other services
**Controller**: HTTP layer, delegates to services
**DTO**: Data Transfer Objects with class-validator for validation
**Guard**: Authentication/Authorization logic
**Interceptor**: Request/response transformation
**Decorator**: Custom metadata

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── main.ts                # Application entry
│   ├── app.module.ts          # Root module
│   ├── <feature>/
│   │   ├── <feature>.module.ts
│   │   ├── <feature>.service.ts
│   │   ├── <feature>.controller.ts
│   │   └── dto/               # Data transfer objects
│   └── shared/                # Shared utilities
├── test/                      # E2E tests
└── package.json

frontend/
├── src/
│   ├── app/                   # App-level components
│   ├── features/              # Feature-based modules
│   ├── entities/              # Data models
│   ├── shared/                # Shared components/hooks
│   ├── pages/                 # Page components
│   └── widgets/               # Reusable widgets
└── package.json
```

---

## Database

Uses Prisma ORM with PostgreSQL (production) or SQLite (development).

**Generate Prisma client**:
```bash
npx prisma generate
```

**Run migrations**:
```bash
npx prisma migrate dev
npx prisma migrate deploy  # production
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET=...
API_PROTOCOL=http
API_HOST=localhost
API_PORT=3000
```

### Frontend
Configure via Vite environment variables (`VITE_...`).

---

## Testing

- Jest for both unit and e2e tests
- Place `.spec.ts` files next to the code they test
- Use `TestingModule` from `@nestjs/testing` for unit tests

---

## Git Conventions

- Branch naming: `feature/description`, `fix/description`
- Commit messages: descriptive, imperative mood
- Run `npm run lint` before committing
- Run tests before pushing

---

## Dependencies

### Adding new packages

```bash
# Backend
npm install <package>
npm install -D @types/<package>

# Frontend  
npm install <package>
```

After adding Prisma-related packages, regenerate the client:
```bash
npx prisma generate
```
