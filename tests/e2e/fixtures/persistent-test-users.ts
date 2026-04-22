/**
 * CETECH persistent test DB users (shared environment).
 * Do not reset or reseed the DB; treat values as durable fixtures.
 */
export const CETECH_PERSISTENT_TEST_USERS = {
  athlete: {
    email: "athlete01@test.com",
    password: "ABCD4321",
  },
  coach: {
    email: "coach01@test.com",
    password: "ABCD4321",
  },
  admin: {
    email: "admin01@test.com",
    password: "ABCD4321",
  },
} as const;
