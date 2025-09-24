import { Page, expect } from '@playwright/test';

/**
 * Test Helper Functions for Cliqstr Authentication Flows
 * Based on CURRENT-AUTH-FLOWS-DOCUMENTATION.md
 */

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthdate: string; // Format: YYYY-MM-DD
  role: 'Adult' | 'Child' | 'Parent';
}

export interface TestChild {
  firstName: string;
  lastName: string;
  birthdate: string;
  parentEmail: string;
}

export interface TestInvite {
  inviteeEmail: string;
  inviteeName?: string;
  message?: string;
  inviteType: 'adult' | 'child';
  childDetails?: TestChild;
}

/**
 * Generate unique test email addresses
 */
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@test.cliqstr.local`;
}

/**
 * Generate test birthdate for age calculation
 */
export function generateBirthdate(age: number): string {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${birthYear}-${month}-${day}`;
}

/**
 * Create a test adult user
 */
export function createTestAdult(prefix: string = 'adult'): TestUser {
  return {
    firstName: 'Test',
    lastName: 'Adult',
    email: generateTestEmail(prefix),
    password: 'TestPassword123!',
    birthdate: generateBirthdate(25),
    role: 'Adult'
  };
}

/**
 * Create a test child user
 */
export function createTestChild(prefix: string = 'child', age: number = 15): TestChild {
  return {
    firstName: 'Test',
    lastName: 'Child',
    birthdate: generateBirthdate(age),
    parentEmail: generateTestEmail(`${prefix}-parent`)
  };
}

/**
 * Create a test parent user
 */
export function createTestParent(prefix: string = 'parent'): TestUser {
  return {
    firstName: 'Test',
    lastName: 'Parent',
    email: generateTestEmail(prefix),
    password: 'TestPassword123!',
    birthdate: generateBirthdate(35),
    role: 'Parent'
  };
}

/**
 * Navigate to sign-up page and fill adult form
 */
export async function fillAdultSignupForm(page: Page, user: TestUser): Promise<void> {
  console.log(`[SETUP] Filling adult signup form for ${user.email}`);
  
  await page.goto('/sign-up');
  await page.fill('[data-testid="firstName"]', user.firstName);
  await page.fill('[data-testid="lastName"]', user.lastName);
  await page.fill('[data-testid="birthdate"]', user.birthdate);
  
  // Wait for age detection and role selection
  await page.waitForSelector('[data-testid="role-adult"]');
  await page.click('[data-testid="role-adult"]');
  
  await page.fill('[data-testid="email"]', user.email);
  await page.fill('[data-testid="password"]', user.password);
  await page.fill('[data-testid="confirmPassword"]', user.password);
}

/**
 * Navigate to sign-up page and fill child form
 */
export async function fillChildSignupForm(page: Page, child: TestChild): Promise<void> {
  console.log(`[SETUP] Filling child signup form for ${child.firstName} ${child.lastName}`);
  
  await page.goto('/sign-up');
  await page.fill('[data-testid="firstName"]', child.firstName);
  await page.fill('[data-testid="lastName"]', child.lastName);
  await page.fill('[data-testid="birthdate"]', child.birthdate);
  
  // Wait for age detection and role selection
  await page.waitForSelector('[data-testid="role-child"]');
  await page.click('[data-testid="role-child"]');
  
  await page.fill('[data-testid="parentEmail"]', child.parentEmail);
}

/**
 * Submit signup form and wait for response
 */
export async function submitSignupForm(page: Page): Promise<void> {
  console.log(`[ACTION] Submitting signup form`);
  
  await page.click('[data-testid="submit-signup"]');
  
  // Wait for either success redirect or error message
  await Promise.race([
    page.waitForURL('**/verification-pending', { timeout: 10000 }),
    page.waitForURL('**/awaiting-approval', { timeout: 10000 }),
    page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
  ]);
}

/**
 * Fill parent approval form in Parent HQ
 */
export async function fillParentHQForm(page: Page, child: TestChild, permissions: any = {}): Promise<void> {
  console.log(`[SETUP] Filling Parent HQ form for child ${child.firstName}`);
  
  // Wait for Parent HQ form to load
  await page.waitForSelector('[data-testid="child-username"]');
  
  // Fill child account details
  await page.fill('[data-testid="child-username"]', `${child.firstName.toLowerCase()}${child.lastName.toLowerCase()}`);
  await page.fill('[data-testid="child-password"]', 'ChildPassword123!');
  await page.fill('[data-testid="child-confirm-password"]', 'ChildPassword123!');
  await page.fill('[data-testid="child-email"]', generateTestEmail(`child-${child.firstName.toLowerCase()}`));
  
  // Set permissions (default to restrictive settings)
  const defaultPermissions = {
    canPost: true,
    canComment: true,
    canReact: true,
    canViewProfiles: true,
    canReceiveInvites: true,
    canCreatePublicCliqs: false,
    canInviteChildren: false,
    canInviteAdults: false,
    canCreateCliqs: false,
    canUploadVideos: false,
    invitesRequireParentApproval: true,
    isSilentlyMonitored: true,
    aiModerationLevel: 'strict',
    canAccessGames: true,
    canShareYouTube: false,
    visibilityLevel: 'private'
  };
  
  const finalPermissions = { ...defaultPermissions, ...permissions };
  
  // Set permission toggles
  for (const [key, value] of Object.entries(finalPermissions)) {
    const selector = `[data-testid="permission-${key}"]`;
    const element = await page.$(selector);
    if (element) {
      const isChecked = await element.isChecked();
      if (isChecked !== value) {
        await page.click(selector);
      }
    }
  }
  
  // Accept red alert
  await page.check('[data-testid="red-alert-accept"]');
}

/**
 * Submit Parent HQ form
 */
export async function submitParentHQForm(page: Page): Promise<void> {
  console.log(`[ACTION] Submitting Parent HQ form`);
  
  await page.click('[data-testid="submit-parent-hq"]');
  
  // Wait for success redirect
  await page.waitForURL('**/parents/hq/success*', { timeout: 15000 });
}

/**
 * Fill invite form
 */
export async function fillInviteForm(page: Page, invite: TestInvite): Promise<void> {
  console.log(`[SETUP] Filling invite form for ${invite.inviteeEmail}`);
  
  await page.goto('/invite');
  
  if (invite.inviteType === 'adult') {
    await page.click('[data-testid="invite-type-adult"]');
    await page.fill('[data-testid="invitee-email"]', invite.inviteeEmail);
  } else {
    await page.click('[data-testid="invite-type-child"]');
    if (invite.childDetails) {
      await page.fill('[data-testid="child-first-name"]', invite.childDetails.firstName);
      await page.fill('[data-testid="child-last-name"]', invite.childDetails.lastName);
      await page.fill('[data-testid="child-birthdate"]', invite.childDetails.birthdate);
      await page.fill('[data-testid="parent-email"]', invite.childDetails.parentEmail);
    }
  }
  
  if (invite.message) {
    await page.fill('[data-testid="invite-message"]', invite.message);
  }
}

/**
 * Submit invite form
 */
export async function submitInviteForm(page: Page): Promise<void> {
  console.log(`[ACTION] Submitting invite form`);
  
  await page.click('[data-testid="submit-invite"]');
  
  // Wait for success redirect
  await page.waitForURL('**/invite/sent', { timeout: 10000 });
}

/**
 * Sign in with credentials
 */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  console.log(`[SETUP] Signing in with ${email}`);
  
  await page.goto('/sign-in');
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="submit-signin"]');
  
  // Wait for successful login redirect
  await page.waitForURL('**/my-cliqs-dashboard', { timeout: 10000 });
}

/**
 * Verify user is signed in
 */
export async function verifySignedIn(page: Page, expectedEmail: string): Promise<void> {
  console.log(`[VERIFY] Checking if user is signed in as ${expectedEmail}`);
  
  // Check for user email in navigation or profile
  const userElement = await page.$('[data-testid="user-email"]');
  if (userElement) {
    const userEmail = await userElement.textContent();
    expect(userEmail).toContain(expectedEmail);
  }
  
  // Verify we're on a protected page
  expect(page.url()).toContain('/my-cliqs-dashboard');
}

/**
 * Verify email was sent (check for success message)
 */
export async function verifyEmailSent(page: Page, recipientType: 'parent' | 'adult' | 'child'): Promise<void> {
  console.log(`[VERIFY] Checking if ${recipientType} email was sent`);
  
  // Check for success message
  const successMessage = await page.$('[data-testid="email-sent-success"]');
  expect(successMessage).toBeTruthy();
  
  // Verify we're on the sent page
  expect(page.url()).toContain('/invite/sent');
}

/**
 * Verify parent approval email was sent
 */
export async function verifyParentApprovalEmailSent(page: Page): Promise<void> {
  console.log(`[VERIFY] Checking if parent approval email was sent`);
  
  // Check for awaiting approval page
  expect(page.url()).toContain('/awaiting-approval');
  
  const message = await page.$('[data-testid="awaiting-approval-message"]');
  expect(message).toBeTruthy();
}

/**
 * Verify child account was created
 */
export async function verifyChildAccountCreated(page: Page, childName: string): Promise<void> {
  console.log(`[VERIFY] Checking if child account was created for ${childName}`);
  
  // Check for success page
  expect(page.url()).toContain('/parents/hq/success');
  
  const successMessage = await page.$('[data-testid="child-created-success"]');
  expect(successMessage).toBeTruthy();
}

/**
 * Verify quota check failed
 */
export async function verifyQuotaCheckFailed(page: Page): Promise<void> {
  console.log(`[VERIFY] Checking if quota check failed`);
  
  const errorMessage = await page.$('[data-testid="quota-error"]');
  expect(errorMessage).toBeTruthy();
  
  const errorText = await errorMessage?.textContent();
  expect(errorText).toContain('quota');
  expect(errorText).toContain('upgrade');
}

/**
 * Verify permission check failed
 */
export async function verifyPermissionCheckFailed(page: Page): Promise<void> {
  console.log(`[VERIFY] Checking if permission check failed`);
  
  const errorMessage = await page.$('[data-testid="permission-error"]');
  expect(errorMessage).toBeTruthy();
  
  const errorText = await errorMessage?.textContent();
  expect(errorText).toContain('permission');
}

/**
 * Log test step with timestamp
 */
export function logTestStep(step: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`);
  if (details) {
    console.log(`[${timestamp}] Details:`, JSON.stringify(details, null, 2));
  }
}

/**
 * Wait for email to be processed (simulate email delivery time)
 */
export async function waitForEmailProcessing(page: Page, delayMs: number = 2000): Promise<void> {
  console.log(`[WAIT] Waiting ${delayMs}ms for email processing`);
  await page.waitForTimeout(delayMs);
}

/**
 * Clean up test data (if needed)
 */
export async function cleanupTestData(page: Page, testEmails: string[]): Promise<void> {
  console.log(`[CLEANUP] Cleaning up test data for emails: ${testEmails.join(', ')}`);
  
  // This would typically involve API calls to delete test accounts
  // For now, we'll just log the cleanup
  for (const email of testEmails) {
    console.log(`[CLEANUP] Would delete account for ${email}`);
  }
}
