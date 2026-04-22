# Onboarding E2E

Mock responses: `tests/e2e/helpers/onboarding-mock-bodies.ts`. Route interception: `tests/e2e/helpers/onboarding-route-mock.ts` (`mockOnboardingGetStatus`, `unmockOnboardingRoutes`).

Mocked specs:

- `onboarding.mocked-states.spec.ts` - COMPLETE admin/coach/athlete post-login URLs
- `onboarding.role-selection-actions.spec.ts` - ROLE_SELECTION post-login /onboarding
- `onboarding.route-gates.spec.ts` - COMPLETE clears /onboarding; ROLE_SELECTION clears /admin/dashboard

Integration: `integration.spec.ts`, `integration.incomplete.spec.ts` (optional env).

Commands:

```bash
npx playwright test tests/e2e/onboarding/onboarding.mocked-states.spec.ts tests/e2e/onboarding/onboarding.role-selection-actions.spec.ts tests/e2e/onboarding/onboarding.route-gates.spec.ts --reporter=list
npx playwright test tests/e2e/onboarding/integration.spec.ts tests/e2e/onboarding/integration.incomplete.spec.ts --reporter=list
npx playwright test --reporter=list
```

## Regression Pack (Authoritative)

Command:

```bash
npm run test:e2e:regression
```

Details:

- Uses `playwright.regression.config.ts`
- Includes:
  - `athlete-onboarding.spec.ts`
  - `athlete-login-state.spec.ts`
  - `athlete-invitation-inbox.spec.ts`
  - `athlete-waiting-logout.spec.ts`
  - `fresh-coach-dashboard-logout.spec.ts`

Result:

- 11 tests
- 11 passed
- Covers:
  - login → dashboard redirect
  - onboarding state handling
  - invitation inbox behavior
  - accept/decline flows
  - logout session clearing

Important:

- This is the reliable E2E validation path
- Default Playwright config may not reflect full regression coverage

