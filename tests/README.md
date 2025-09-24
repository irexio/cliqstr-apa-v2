# Cliqstr Authentication Flow Tests

This directory contains comprehensive automated tests for all authentication and invite flows in Cliqstr, based on the documentation in `docs/CURRENT-AUTH-FLOWS-DOCUMENTATION.md` and `docs/TESTING-MATRIX.md`.

## Test Structure

```
tests/
├── README.md                           # This file
├── run-tests.ts                        # Test runner script
├── utils/
│   └── test-helpers.ts                 # Shared test utilities and helpers
├── auth/
│   └── signup-flows.spec.ts            # Sign-up flow tests (4 scenarios)
├── invites/
│   └── invite-flows.spec.ts            # Invite flow tests (8 scenarios)
└── edge-cases/
    └── quota-and-permissions.spec.ts   # Edge case and error scenario tests
```

## Test Coverage

### Sign-Up Flows (4 scenarios)
1. **Adult Sign Up** - Happy path and plan requirement validation
2. **Child Sign Up → New Parent** - Complete parent approval flow
3. **Child Sign Up → Existing Parent** - Existing parent approval flow
4. **Child Sign Up → Existing Adult** - Adult upgrade to parent flow

### Invite Flows (8 scenarios)
1. **Adult Invites Adult** - Should NOT auto-join (fixes documented issue)
2. **Adult Invites Child → New Parent** - Complete parent approval flow
3. **Adult Invites Child → Existing Parent** - Existing parent approval flow
4. **Adult Invites Child → Existing Adult** - Adult upgrade to parent flow
5. **Child Invites Child → New Parent** - Child with permission invites
6. **Child Invites Child → Existing Parent** - Child with permission invites
7. **Child Invites Child → Existing Adult** - Child with permission invites
8. **Child Invites Child → Direct Child Email** - Should be blocked (fixes documented issue)

### Edge Cases and Error Scenarios
- **Quota Full During Invite** - Plan quota limits
- **Quota Full During Child Creation** - Parent HQ quota checks
- **PHQ Strict Permissions** - Restrictive child permissions
- **PHQ Flexible Permissions** - Permissive child permissions
- **Child Invites Child by Email** - Direct child email blocking
- **Plan Quota Limits** - Multiple children creation limits
- **Permission Validation** - Child without invite permission
- **Age-Based Routing Edge Cases** - Exactly 13, exactly 18
- **Invalid Email Format** - Email validation
- **Missing Required Fields** - Form validation

## Running Tests

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Ensure Convex is running: `npm run dev:convex`
3. Install Playwright browsers: `npx playwright install`

### Test Commands

```bash
# Run all authentication flow tests
npm run test:auth-flows

# Run specific test suites
npm run test:signup          # Sign-up flow tests only
npm run test:invites         # Invite flow tests only
npm run test:edge-cases      # Edge case tests only

# Run with UI (interactive mode)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# View test report
npm run test:report
```

### Individual Test Files
```bash
# Run specific test files
npx playwright test tests/auth/signup-flows.spec.ts
npx playwright test tests/invites/invite-flows.spec.ts
npx playwright test tests/edge-cases/quota-and-permissions.spec.ts
```

## Test Configuration

The tests are configured in `playwright.config.ts` with:
- **Base URL**: `http://localhost:3000` (development server)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

## Test Data Management

### Test Email Generation
- All test emails use the format: `{prefix}-{timestamp}-{random}@test.cliqstr.local`
- This ensures unique emails for each test run
- Test emails are automatically cleaned up after each test

### Test User Creation
- **Adults**: 25 years old by default
- **Children**: Configurable age (10-16 years old)
- **Parents**: 35 years old by default
- **Birthdates**: Generated based on age requirements

### Test Cleanup
- Each test automatically cleans up its test data
- Test emails are tracked and removed after test completion
- Database state is reset between tests

## Test Helpers

The `test-helpers.ts` file provides:

### User Creation Functions
- `createTestAdult(prefix)` - Create adult test user
- `createTestChild(prefix, age)` - Create child test user
- `createTestParent(prefix)` - Create parent test user

### Form Filling Functions
- `fillAdultSignupForm(page, user)` - Fill adult signup form
- `fillChildSignupForm(page, child)` - Fill child signup form
- `fillParentHQForm(page, child, permissions)` - Fill Parent HQ form
- `fillInviteForm(page, invite)` - Fill invite form

### Verification Functions
- `verifySignedIn(page, email)` - Verify user is signed in
- `verifyEmailSent(page, type)` - Verify email was sent
- `verifyParentApprovalEmailSent(page)` - Verify parent approval email
- `verifyChildAccountCreated(page, name)` - Verify child account created
- `verifyQuotaCheckFailed(page)` - Verify quota check failed
- `verifyPermissionCheckFailed(page)` - Verify permission check failed

### Utility Functions
- `generateTestEmail(prefix)` - Generate unique test email
- `generateBirthdate(age)` - Generate birthdate for age
- `logTestStep(step, details)` - Log test steps with timestamp
- `waitForEmailProcessing(page, delay)` - Wait for email processing
- `cleanupTestData(page, emails)` - Clean up test data

## Test Scenarios

### Happy Path Tests
Each flow is tested with valid data to ensure the complete user journey works correctly.

### Error Scenario Tests
Each flow is tested with invalid data to ensure proper error handling and validation.

### Edge Case Tests
Boundary conditions and special cases are tested to ensure robust behavior.

## Issues Being Tested

### Documented Issues
1. **Adult Invites Adult Auto-Join** - Tests that adults must select plan, not auto-join
2. **Child Invites Child Direct Email** - Tests that direct child emails are blocked
3. **Plan Requirements** - Tests that adults must select plans
4. **Quota Checks** - Tests that quota limits are enforced

### Validation Tests
- Email format validation
- Required field validation
- Age-based routing validation
- Permission validation
- Quota validation

## Test Results

### Success Criteria
- All happy path tests pass
- All error scenario tests pass
- All edge case tests pass
- No false positives or negatives
- Proper error messages displayed
- Correct redirects and navigation

### Failure Investigation
When tests fail:
1. Check the test output for specific error messages
2. Review screenshots and videos in `playwright-report/`
3. Check browser console for JavaScript errors
4. Verify the development server is running
5. Check Convex connection and data

## Continuous Integration

The tests are designed to run in CI environments:
- Headless mode by default
- Retry failed tests
- Generate reports and artifacts
- Clean up test data automatically

## Maintenance

### Adding New Tests
1. Add test cases to appropriate spec files
2. Use existing test helpers where possible
3. Follow the naming convention: `test('Description - Scenario', async ({ page }) => { ... })`
4. Include setup, action, and expected result logging
5. Clean up test data in `afterEach`

### Updating Test Helpers
1. Add new helper functions to `test-helpers.ts`
2. Export functions for use in test files
3. Include proper TypeScript types
4. Add JSDoc comments for documentation

### Test Data Changes
1. Update test data generation functions
2. Ensure unique test data for each run
3. Update cleanup functions as needed
4. Test with various data scenarios

## Troubleshooting

### Common Issues
1. **Tests fail with "Page not found"** - Ensure dev server is running
2. **Tests fail with "Convex connection error"** - Ensure Convex is running
3. **Tests fail with "Element not found"** - Check test selectors and page structure
4. **Tests fail with "Timeout"** - Increase timeout or check page loading

### Debug Mode
Use `npm run test:debug` to step through tests and identify issues.

### Test Reports
View detailed test reports with `npm run test:report` to see:
- Test results and timing
- Screenshots of failures
- Video recordings
- Trace files for debugging

## Contributing

When adding new tests:
1. Follow the existing test structure and patterns
2. Use descriptive test names
3. Include proper setup and cleanup
4. Add appropriate logging
5. Test both happy path and error scenarios
6. Update this README if adding new test categories
