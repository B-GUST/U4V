<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# U4V Rules & Policies

## 1. Git Versioning Policy (Conventional Commits)
* **Branch Naming**:
  - `feature/description` for new features (e.g. `feature/registro-ong`)
  - `fix/description` for bugs (e.g. `fix/doctor-git-enomem`)
  - `security/description` for security fixes (e.g. `security/zod-sanitizer`)
  - `docs/description` for documentation
* **Commit Messages**: Follow Conventional Commits:
  - Format: `<type>(<scope>): <description>` (e.g. `feat(auth): add public registration page`)
  - Allowed types: `feat`, `fix`, `sec`, `docs`, `style`, `refactor`, `test`, `chore`

## 2. Zero Trust Security Policy
* **Never Trust, Always Verify**:
  - Do not trust client-side state. Every API Route, Server Action, and page request must verify the caller's session using `supabase.auth.getUser()`. Never use `getSession()`.
  - Validate all input parameters using Zod schemas before database inserts or business logic.
* **Least Privilege**:
  - Ensure Row Level Security (RLS) is enabled and strictly restricted on all Postgres tables.
  - Never prefix backend secret keys (e.g., `SUPABASE_SERVICE_ROLE_KEY`) with `NEXT_PUBLIC_`.
* **Ephemeral Tokens**:
  - Driver dispatch tokens (`token_reporte`) must have a strict TTL and be immediately set to `NULL` (single-use) upon the first successful field report submission.

