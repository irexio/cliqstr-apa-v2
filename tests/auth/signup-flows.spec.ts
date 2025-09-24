import { test, expect } from '@playwright/test';
import { 
  createTestAdult, 
  createTestChild, 
  createTestParent,
  fillAdultSignupForm,
  fillChildSignupForm,
  submitSignupForm,
  fillParentHQForm,
  submitParentHQForm,
  signIn,
  verifySignedIn,
  verifyParentApprovalEmailSent,
  verifyChildAccountCreated,
  logTestStep,
  waitForEmailProcessing,
  cleanupTestData,
  TestUser,
  TestChild
} from '../utils/test-helpers';

/**
 * Sign Up Flow Tests
 * Based on CURRENT-AUTH-FLOWS-DOCUMENTATION.md
 * 
 * Tests all 4 sign-up scenarios:
 * 1. Sign Up Adult
 * 2. Sign Up Child → New Parent
 * 3. Sign Up Child → Existing Parent  
 * 4. Sign Up Child → Existing Adult
 */

test.describe('Sign Up Flows', () => {
  let testEmails: string[] = [];

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    if (testEmails.length > 0) {
      await cleanupTestData(page, testEmails);
      testEmails = [];
    }
  });

  test('1. Adult Sign Up - Happy Path', async ({ page }) => {
    logTestStep('Starting Adult Sign Up test');
    
    // Setup
    const adult = createTestAdult('adult-signup');
    testEmails.push(adult.email);
    
    logTestStep('Setup complete', { email: adult.email, role: adult.role });
    
    // Action
    await fillAdultSignupForm(page, adult);
    await submitSignupForm(page);
    
    // Expected Result
    await expect(page).toHaveURL(/.*\/verification-pending/);
    
    const verificationMessage = await page.$('[data-testid="verification-pending-message"]');
    expect(verificationMessage).toBeTruthy();
    
    logTestStep('Adult signup successful - verification email sent');
  });

  test('2. Child Sign Up → New Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Sign Up → New Parent test');
    
    // Setup
    const child = createTestChild('child-new-parent', 15);
    const parent = createTestParent('new-parent');
    testEmails.push(child.parentEmail, parent.email);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: child.parentEmail,
      childAge: 15
    });
    
    // Action - Child requests approval
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Child redirected to awaiting approval
    await verifyParentApprovalEmailSent(page);
    logTestStep('Child approval request sent to parent');
    
    // Simulate parent clicking approval link
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    
    // Parent should be redirected to signup (new parent)
    await expect(page).toHaveURL(/.*\/sign-up.*approvalToken/);
    
    // Fill parent signup form
    await page.fill('[data-testid="firstName"]', parent.firstName);
    await page.fill('[data-testid="lastName"]', parent.lastName);
    await page.fill('[data-testid="email"]', parent.email);
    await page.fill('[data-testid="password"]', parent.password);
    await page.fill('[data-testid="confirmPassword"]', parent.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Parent should be redirected to choose plan
    await expect(page).toHaveURL(/.*\/choose-plan.*approvalToken/);
    
    // Select plan
    await page.click('[data-testid="plan-test"]');
    await page.click('[data-testid="submit-plan"]');
    
    // Parent should be redirected to Parent HQ
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    
    // Create child account in Parent HQ
    await fillParentHQForm(page, child);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created successfully
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created successfully via new parent');
  });

  test('3. Child Sign Up → Existing Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Sign Up → Existing Parent test');
    
    // Setup - Create existing parent first
    const existingParent = createTestParent('existing-parent');
    const child = createTestChild('child-existing-parent', 12);
    child.parentEmail = existingParent.email; // Use existing parent's email
    testEmails.push(existingParent.email);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: existingParent.email,
      childAge: 12
    });
    
    // Create existing parent account
    await fillAdultSignupForm(page, existingParent);
    await submitSignupForm(page);
    
    // Verify parent account created
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing parent account created');
    
    // Now test child signup with existing parent email
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Child redirected to awaiting approval
    await verifyParentApprovalEmailSent(page);
    logTestStep('Child approval request sent to existing parent');
    
    // Simulate parent clicking approval link
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    
    // Parent should be redirected to Parent HQ (existing parent)
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    
    // Create child account in Parent HQ
    await fillParentHQForm(page, child);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created successfully
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created successfully via existing parent');
  });

  test('4. Child Sign Up → Existing Adult - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Sign Up → Existing Adult test');
    
    // Setup - Create existing adult first
    const existingAdult = createTestAdult('existing-adult');
    const child = createTestChild('child-existing-adult', 14);
    child.parentEmail = existingAdult.email; // Use existing adult's email
    testEmails.push(existingAdult.email);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      adultEmail: existingAdult.email,
      childAge: 14
    });
    
    // Create existing adult account
    await fillAdultSignupForm(page, existingAdult);
    await submitSignupForm(page);
    
    // Verify adult account created
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing adult account created');
    
    // Now test child signup with existing adult email
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Child redirected to awaiting approval
    await verifyParentApprovalEmailSent(page);
    logTestStep('Child approval request sent to existing adult');
    
    // Simulate adult clicking approval link
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    
    // Adult should be redirected to signup (upgrade to parent)
    await expect(page).toHaveURL(/.*\/sign-up.*approvalToken/);
    
    // Fill parent signup form (upgrade existing adult to parent)
    await page.fill('[data-testid="firstName"]', existingAdult.firstName);
    await page.fill('[data-testid="lastName"]', existingAdult.lastName);
    await page.fill('[data-testid="email"]', existingAdult.email);
    await page.fill('[data-testid="password"]', existingAdult.password);
    await page.fill('[data-testid="confirmPassword"]', existingAdult.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Adult should be redirected to choose plan
    await expect(page).toHaveURL(/.*\/choose-plan.*approvalToken/);
    
    // Select plan
    await page.click('[data-testid="plan-test"]');
    await page.click('[data-testid="submit-plan"]');
    
    // Adult should be redirected to Parent HQ
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    
    // Create child account in Parent HQ
    await fillParentHQForm(page, child);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created successfully
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created successfully via existing adult upgrade');
  });

  test('Adult Sign Up - Plan Required', async ({ page }) => {
    logTestStep('Starting Adult Sign Up - Plan Required test');
    
    // Setup
    const adult = createTestAdult('adult-plan-required');
    testEmails.push(adult.email);
    
    logTestStep('Setup complete', { email: adult.email });
    
    // Action
    await fillAdultSignupForm(page, adult);
    await submitSignupForm(page);
    
    // Expected Result - Should redirect to plan selection, not verification
    await expect(page).toHaveURL(/.*\/choose-plan/);
    
    const planMessage = await page.$('[data-testid="plan-required-message"]');
    expect(planMessage).toBeTruthy();
    
    logTestStep('Adult signup correctly requires plan selection');
  });

  test('Child Sign Up - Invalid Birthdate', async ({ page }) => {
    logTestStep('Starting Child Sign Up - Invalid Birthdate test');
    
    // Setup - Child with invalid birthdate (future date)
    const child = createTestChild('child-invalid-birthdate', -5); // Negative age = future birthdate
    testEmails.push(child.parentEmail);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      invalidBirthdate: child.birthdate
    });
    
    // Action
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Should show validation error
    const errorMessage = await page.$('[data-testid="birthdate-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('birthdate');
    expect(errorText).toContain('invalid');
    
    logTestStep('Child signup correctly validates birthdate');
  });

  test('Child Sign Up - Missing Parent Email', async ({ page }) => {
    logTestStep('Starting Child Sign Up - Missing Parent Email test');
    
    // Setup - Child without parent email
    const child = createTestChild('child-no-parent-email', 13);
    child.parentEmail = ''; // Empty parent email
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      missingParentEmail: true
    });
    
    // Action
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Should show validation error
    const errorMessage = await page.$('[data-testid="parent-email-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('parent email');
    expect(errorText).toContain('required');
    
    logTestStep('Child signup correctly validates parent email requirement');
  });

  test('Child Sign Up - Under 13 Age Routing', async ({ page }) => {
    logTestStep('Starting Child Sign Up - Under 13 Age Routing test');
    
    // Setup - Child under 13
    const child = createTestChild('child-under-13', 10);
    testEmails.push(child.parentEmail);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      childAge: 10,
      under13: true
    });
    
    // Action
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Should redirect to awaiting approval
    await verifyParentApprovalEmailSent(page);
    
    // Verify age-specific messaging
    const message = await page.$('[data-testid="awaiting-approval-message"]');
    const messageText = await message?.textContent();
    expect(messageText).toContain('parent');
    expect(messageText).toContain('approval');
    
    logTestStep('Child under 13 correctly routed to parent approval');
  });

  test('Child Sign Up - 13+ Age Routing', async ({ page }) => {
    logTestStep('Starting Child Sign Up - 13+ Age Routing test');
    
    // Setup - Child 13 or older
    const child = createTestChild('child-13-plus', 16);
    testEmails.push(child.parentEmail);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      childAge: 16,
      over13: true
    });
    
    // Action
    await fillChildSignupForm(page, child);
    await submitSignupForm(page);
    
    // Expected Result - Should redirect to awaiting approval
    await verifyParentApprovalEmailSent(page);
    
    // Verify age-specific messaging
    const message = await page.$('[data-testid="awaiting-approval-message"]');
    const messageText = await message?.textContent();
    expect(messageText).toContain('parent');
    expect(messageText).toContain('approval');
    
    logTestStep('Child 13+ correctly routed to parent approval');
  });
});
