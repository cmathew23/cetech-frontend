This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Architecture, SRS, and UX docs:** see [`docs/srs/README.md`](docs/srs/README.md) (onboarding, admin dashboard, gaps, auth-flow notes, milestones).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result (`npm run dev` uses port 3001).

On **WSL**, work from the Linux path to this repo (e.g. under `/home/...`); use the same `npm` commands from that directory.

### Sandbox integration proof (frontend)

- Exercise retrieval sandbox route: `/sandbox/training` (after login).
- Uses authenticated frontend API path `GET /exercise-catalog` with category/search filtering.
- Supports local selected-exercise add/remove and duration editing.
- Sandbox-only proof: no persistence to training domain, not final production assignment flow.

## E2E Testing — Correct Commands

### Regression Pack (use this by default)

```bash
npm run test:e2e:regression
```

### Full E2E (debug / exploration)

```bash
npx playwright test tests/e2e --reporter=list
```

### Onboarding Suite

```bash
npx playwright test tests/e2e/onboarding --reporter=list
```

**Notes:**

- Do NOT rely on multiline CLI file arguments (WSL issues with `\`)
- Regression suite uses a dedicated config and is the source of truth

### Development Auth Rate Limiting (backend)

Auth rate limiting is configured in the **backend** (`src/config/rate-limit.js`, `src/modules/auth/auth.rate-limit.js`). The frontend only needs to know this for local testing and E2E.

- **Production (unchanged):** login — 15 minutes / max **5** attempts; register — 15 minutes / max **10** attempts.
- **Development default:** login and register use very high ceilings (15 minutes / max **10000** each), so normal local dev and Playwright runs should not hit auth rate limits when the API runs with **`NODE_ENV=development`**.
- **Optional bypass (local debugging only):** `RATE_LIMIT_MODE=off` or `RATE_LIMIT_DISABLED=true` on the backend. **Do not** use these in production.
- For auth E2E and local sign-in flows, run the backend in **development** so the relaxed limits apply. If you still see HTTP **429** on `/auth/login`, confirm the API is not running in production mode and see the backend env docs.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
