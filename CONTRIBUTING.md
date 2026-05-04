# Contributing to EnergyIQ

EnergyIQ is expected to stay production-ready. Contributions should be small, tested, and easy to review.

## Core Rules

- Always add or update tests for your implementation.
- Always run `pnpm validate` before you push.
- Include migrations, seed changes, or docs updates when the change requires them.
- Prefer the smallest change that solves the problem at the root cause.
- Work on a dedicated feature branch instead of committing directly to `dev` or `main`.
- Merge feature work into `dev` first unless a maintainer explicitly instructs a different target.
- Use standard commit messages that clearly describe the change, such as `feat: add refresh token expiry` or `fix: handle invalid user pagination`.

## Required Workflow

1. Read the existing implementation for the area you want to change.
2. Make the code change.
3. Add or update tests for the behavior you changed.
4. Run the most relevant local test command first.
5. Run `pnpm validate` before pushing.
6. Fix every failure before opening or updating a pull request.

`pnpm validate` runs linting, tests, and the build in one command. Do not skip it before pushing.

## Git Hooks

This repository uses Husky hooks to enforce quality checks locally:

- `pre-commit` runs `lint-staged` on staged TypeScript files.
- `commit-msg` runs `commitlint` against the commit message.
- `pre-push` runs `pnpm validate` before code leaves your local branch.

If you clone the repository normally and run `pnpm install`, Husky is installed automatically through the `prepare` script in `package.json`. You should not need to configure the hooks again by hand on each machine, unless dependency install scripts were skipped or disabled.

## Codebase Map

This repository is a NestJS API with a small but opinionated structure.

### `src/main.ts`

Application bootstrap, global prefixes, middleware, and server startup live here.

### `src/app.module.ts`

The root module wires configuration, TypeORM, feature modules, and global providers such as validation, the JWT guard, the exception filter, and response/logging interceptors.

### `src/common/`

Shared infrastructure used across the app.

- `decorators/` contains request-scoped helpers like `@CurrentUser()` and `@Public()`.
- `filters/` contains the global HTTP exception filter.
- `interceptors/` contains response transformation and request logging.
- `responses/` contains `StandardResponse` class and API response envelope types (`APIResponse`, `APIErrorResponse`).
- `constants/` contains centralized message constants (`SYS_MSG`).

### `src/config/`

Environment and runtime configuration live here.

- `env.ts` validates environment variables at startup.
- `app.config.ts` holds app-level settings.
- `database.config.ts` defines TypeORM database configuration.
- `jwt.config.ts` defines token-related settings.

Do not read environment variables directly from feature code unless you are extending the config layer.

### `src/database/`

Database infrastructure and one-off data operations live here.

- `data-source.ts` is used by TypeORM CLI commands.
- `migrations/` contains schema history.
- `seeds/` contains seed runners and seeders.

Any schema change should include a migration. If seed data depends on the schema or feature behavior, update the relevant seeder too.

When generating a migration, use the short wrapper command:

```bash
pnpm migration:generate CreateUserTable
```

This creates the migration file in `src/database/migrations` automatically.

### `src/modules/auth/`

Authentication flows live here.

- `auth.controller.ts` exposes register, login, refresh, logout, and profile endpoints.
- `auth.service.ts` contains auth business logic.
- `guards/` and `strategies/` contain Passport and JWT plumbing.
- `dto/` contains request validation contracts.

### `src/modules/users/`

User CRUD behavior lives here.

- `users.controller.ts` exposes create, list, read, update, and delete endpoints.
- `users.service.ts` contains user business logic.
- `entities/` holds the user entity.
- `dto/` contains request and pagination contracts.
- `actions/` contains reusable user-related action logic when the service grows beyond a single file.

### `src/modules/health/`

This module owns the public liveness probe used by deployment and uptime checks.

## Testing Expectations

- Add unit tests for new services, controllers, utilities, and business logic.
- Add e2e coverage when you change request/response behavior, auth flows, route handling, or public/private access rules.
- Keep tests deterministic and independent of local machine state.
- Update fixtures and seed data when implementation depends on them.
- Prefer testing behavior over implementation details.
- When testing error responses, verify that the error uses the correct `SYS_MSG` constant and includes proper `statusCode` and `error` fields.
- When testing success responses, verify that the response envelope contains `success`, `message`, `data`, and `meta` (with `timestamp`).

If your change touches the database schema, verify the migration path and seed path as part of the test plan.

## Code Quality Expectations

- Keep DTOs strict and validated.
- Preserve the global response envelope and exception handling patterns.
- Keep API changes backward compatible unless a breaking change is intentional and documented.
- Use existing decorators, guards, interceptors, and filters before introducing new patterns.
- Keep controllers thin and move business logic into services or actions.
- Use `SYS_MSG` constants from `src/common/constants/sys-msg.ts` for all error and success messages instead of hard-coded strings.
- Let `StandardResponse` and `TransformInterceptor` handle message and envelope formatting; services should focus on business logic.

## API Versioning

The API uses URI-based versioning. All routes are prefixed with `/api/v1` (except `/health` which remains unversioned for load balancer compatibility). Each controller specifies its version:

```typescript
@Controller({ path: 'users', version: '1' })
```

**When adding a new API version:**
- Create a new controller with the version in metadata: `version: '2'`
- Add versioning tests to verify the old and new versions coexist.
- Update `README.md` to document the new endpoints.
- Consider keeping the old version around for backward compatibility unless a deprecation period has passed.

**Versioning is NOT required when:**
- Making backward-compatible fixes or improvements within the same version.
- Updating error messages or response metadata (as long as the response envelope structure doesn't change).
- Adding new optional fields to request or response DTOs (must document them as optional).

## Production Best Practices

- Never commit secrets, credentials, or `.env` values.
- Keep `DATABASE_SYNC=false` outside local development and rely on migrations.
- Add a migration for every schema change and verify it applies cleanly.
- Update seeders only when initial data or reference data actually changes.
- Treat auth, validation, and error handling changes as production-sensitive and cover them with tests.
- Review logging, CORS, and Swagger settings before deploying.
- Prefer small, reviewable pull requests that can be validated quickly.

## Change Checklist

- Tests were added or updated for the change.
- `pnpm validate` passed locally before push.
- Database migrations were added when schema changes were introduced.
- Seed data was updated when the feature depends on initial records.
- Documentation was updated when behavior changed.
- The change was reviewed for security, validation, and error handling.

## When in Doubt

If you are unsure whether a change should include tests, assume yes. If you are unsure whether it needs a migration or documentation update, check before pushing. If a change affects production behavior, treat it as a production change and validate accordingly.
