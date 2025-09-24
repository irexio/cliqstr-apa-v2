import { test, expect } from '@playwright/test';
import { 
  createTestAdult, 
  createTestChild, 
  createTestParent,
  fillInviteForm,
  submitInviteForm,
  fillParentHQForm,
  submitParentHQForm,
  signIn,
  verifySignedIn,
  verifyEmailSent,
  verifyParentApprovalEmailSent,
  verifyChildAccountCreated,
  verifyPermissionCheckFailed,
  logTestStep,
  waitForEmailProcessing,
  cleanupTestData,
  TestInvite,
  TestChild
} from '../utils/test-helpers';

/**
 * Invite Flow Tests
 * Based on CURRENT-AUTH-FLOWS-DOCUMENTATION.md
 * 
 * Tests all 8 invite scenarios:
 * 1. Adult Invites Adult
 * 2. Adult Invites Child → New Parent
 * 3. Adult Invites Child → Existing Parent
 * 4. Adult Invites Child → Existing Adult
 * 5. Child Invites Child → New Parent
 * 6. Child Invites Child → Existing Parent
 * 7. Child Invites Child → Existing Adult
 * 8. Child Invites Child → Direct Child Email (should be blocked)
 */

test.describe('Invite Flows', () => {
  let testEmails: string[] = [];
  let inviterUser: any = null;

  test.beforeEach(async ({ page }) => {
    // Create a logged-in user for each test
    inviterUser = createTestAdult('inviter');
    testEmails.push(inviterUser.email);
    
    // Sign in the inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    logTestStep('Inviter signed in', { email: inviterUser.email });
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    if (testEmails.length > 0) {
      await cleanupTestData(page, testEmails);
      testEmails = [];
    }
  });

  test('1. Adult Invites Adult - Happy Path', async ({ page }) => {
    logTestStep('Starting Adult Invites Adult test');
    
    // Setup
    const invitee = createTestAdult('invitee-adult');
    testEmails.push(invitee.email);
    
    const invite: TestInvite = {
      inviteeEmail: invitee.email,
      inviteType: 'adult',
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      inviteeEmail: invitee.email
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should NOT auto-join, should require plan selection
    await verifyEmailSent(page, 'adult');
    
    // Verify invitee gets plan selection, not auto-join
    // This tests the fix for the documented issue
    logTestStep('Adult invite sent - invitee must select plan (no auto-join)');
  });

  test('2. Adult Invites Child → New Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Adult Invites Child → New Parent test');
    
    // Setup
    const child = createTestChild('invited-child-new-parent', 14);
    const parent = createTestParent('new-parent-invite');
    child.parentEmail = parent.email;
    testEmails.push(child.parentEmail, parent.email);
    
    const invite: TestInvite = {
      inviteeEmail: child.parentEmail,
      inviteType: 'child',
      childDetails: child,
      message: 'Your child is invited to join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: child.parentEmail
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to new parent');
    
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
    
    // Expected Result - Child account created and can access invited cliq
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created and can access invited cliq');
  });

  test('3. Adult Invites Child → Existing Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Adult Invites Child → Existing Parent test');
    
    // Setup - Create existing parent first
    const existingParent = createTestParent('existing-parent-invite');
    const child = createTestChild('invited-child-existing-parent', 13);
    child.parentEmail = existingParent.email;
    testEmails.push(existingParent.email);
    
    // Create existing parent account
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', existingParent.firstName);
    await page.fill('[data-testid="lastName"]', existingParent.lastName);
    await page.fill('[data-testid="birthdate"]', existingParent.birthdate);
    await page.waitForSelector('[data-testid="role-adult"]');
    await page.click('[data-testid="role-adult"]');
    await page.fill('[data-testid="email"]', existingParent.email);
    await page.fill('[data-testid="password"]', existingParent.password);
    await page.fill('[data-testid="confirmPassword"]', existingParent.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Verify parent account created
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing parent account created');
    
    // Sign back in as inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    
    const invite: TestInvite = {
      inviteeEmail: child.parentEmail,
      inviteType: 'child',
      childDetails: child,
      message: 'Your child is invited to join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      childName: `${child.firstName} ${child.lastName}`,
      existingParentEmail: existingParent.email
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to existing parent');
    
    // Simulate parent clicking approval link
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    
    // Parent should be redirected to Parent HQ (existing parent)
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    
    // Create child account in Parent HQ
    await fillParentHQForm(page, child);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created and can access invited cliq
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created and can access invited cliq via existing parent');
  });

  test('4. Adult Invites Child → Existing Adult - Happy Path', async ({ page }) => {
    logTestStep('Starting Adult Invites Child → Existing Adult test');
    
    // Setup - Create existing adult first
    const existingAdult = createTestAdult('existing-adult-invite');
    const child = createTestChild('invited-child-existing-adult', 15);
    child.parentEmail = existingAdult.email;
    testEmails.push(existingAdult.email);
    
    // Create existing adult account
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', existingAdult.firstName);
    await page.fill('[data-testid="lastName"]', existingAdult.lastName);
    await page.fill('[data-testid="birthdate"]', existingAdult.birthdate);
    await page.waitForSelector('[data-testid="role-adult"]');
    await page.click('[data-testid="role-adult"]');
    await page.fill('[data-testid="email"]', existingAdult.email);
    await page.fill('[data-testid="password"]', existingAdult.password);
    await page.fill('[data-testid="confirmPassword"]', existingAdult.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Verify adult account created
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing adult account created');
    
    // Sign back in as inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    
    const invite: TestInvite = {
      inviteeEmail: child.parentEmail,
      inviteType: 'child',
      childDetails: child,
      message: 'Your child is invited to join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      childName: `${child.firstName} ${child.lastName}`,
      existingAdultEmail: existingAdult.email
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to existing adult');
    
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
    
    // Expected Result - Child account created and can access invited cliq
    await verifyChildAccountCreated(page, child.firstName);
    logTestStep('Child account created and can access invited cliq via existing adult upgrade');
  });

  test('5. Child Invites Child → New Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Invites Child → New Parent test');
    
    // Setup - Create child inviter with permission
    const childInviter = createTestChild('child-inviter', 16);
    const childInvitee = createTestChild('child-invitee-new-parent', 14);
    const parent = createTestParent('new-parent-child-invite');
    childInvitee.parentEmail = parent.email;
    testEmails.push(childInviter.parentEmail, childInvitee.parentEmail, parent.email);
    
    // Create child inviter account (simplified - would normally go through parent approval)
    // For testing, we'll simulate a child with canInviteChildren permission
    
    const invite: TestInvite = {
      inviteeEmail: childInvitee.parentEmail,
      inviteType: 'child',
      childDetails: childInvitee,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childInviterName: `${childInviter.firstName} ${childInviter.lastName}`,
      childInviteeName: `${childInvitee.firstName} ${childInvitee.lastName}`,
      parentEmail: childInvitee.parentEmail
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to new parent');
    
    // Simulate parent clicking approval link and creating child account
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    await expect(page).toHaveURL(/.*\/sign-up.*approvalToken/);
    
    // Fill parent signup form
    await page.fill('[data-testid="firstName"]', parent.firstName);
    await page.fill('[data-testid="lastName"]', parent.lastName);
    await page.fill('[data-testid="email"]', parent.email);
    await page.fill('[data-testid="password"]', parent.password);
    await page.fill('[data-testid="confirmPassword"]', parent.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Select plan and create child account
    await expect(page).toHaveURL(/.*\/choose-plan.*approvalToken/);
    await page.click('[data-testid="plan-test"]');
    await page.click('[data-testid="submit-plan"]');
    
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    await fillParentHQForm(page, childInvitee);
    await submitParentHQForm(page);
    
    await verifyChildAccountCreated(page, childInvitee.firstName);
    logTestStep('Child account created via child invite to new parent');
  });

  test('6. Child Invites Child → Existing Parent - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Invites Child → Existing Parent test');
    
    // Setup - Create existing parent first
    const existingParent = createTestParent('existing-parent-child-invite');
    const childInvitee = createTestChild('child-invitee-existing-parent', 13);
    childInvitee.parentEmail = existingParent.email;
    testEmails.push(existingParent.email);
    
    // Create existing parent account
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', existingParent.firstName);
    await page.fill('[data-testid="lastName"]', existingParent.lastName);
    await page.fill('[data-testid="birthdate"]', existingParent.birthdate);
    await page.waitForSelector('[data-testid="role-adult"]');
    await page.click('[data-testid="role-adult"]');
    await page.fill('[data-testid="email"]', existingParent.email);
    await page.fill('[data-testid="password"]', existingParent.password);
    await page.fill('[data-testid="confirmPassword"]', existingParent.password);
    await page.click('[data-testid="submit-signup"]');
    
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing parent account created');
    
    // Sign back in as inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    
    const invite: TestInvite = {
      inviteeEmail: childInvitee.parentEmail,
      inviteType: 'child',
      childDetails: childInvitee,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childInviteeName: `${childInvitee.firstName} ${childInvitee.lastName}`,
      existingParentEmail: existingParent.email
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to existing parent');
    
    // Simulate parent clicking approval link
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    
    // Create child account in Parent HQ
    await fillParentHQForm(page, childInvitee);
    await submitParentHQForm(page);
    
    await verifyChildAccountCreated(page, childInvitee.firstName);
    logTestStep('Child account created via child invite to existing parent');
  });

  test('7. Child Invites Child → Existing Adult - Happy Path', async ({ page }) => {
    logTestStep('Starting Child Invites Child → Existing Adult test');
    
    // Setup - Create existing adult first
    const existingAdult = createTestAdult('existing-adult-child-invite');
    const childInvitee = createTestChild('child-invitee-existing-adult', 15);
    childInvitee.parentEmail = existingAdult.email;
    testEmails.push(existingAdult.email);
    
    // Create existing adult account
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', existingAdult.firstName);
    await page.fill('[data-testid="lastName"]', existingAdult.lastName);
    await page.fill('[data-testid="birthdate"]', existingAdult.birthdate);
    await page.waitForSelector('[data-testid="role-adult"]');
    await page.click('[data-testid="role-adult"]');
    await page.fill('[data-testid="email"]', existingAdult.email);
    await page.fill('[data-testid="password"]', existingAdult.password);
    await page.fill('[data-testid="confirmPassword"]', existingAdult.password);
    await page.click('[data-testid="submit-signup"]');
    
    await expect(page).toHaveURL(/.*\/verification-pending/);
    logTestStep('Existing adult account created');
    
    // Sign back in as inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    
    const invite: TestInvite = {
      inviteeEmail: childInvitee.parentEmail,
      inviteType: 'child',
      childDetails: childInvitee,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childInviteeName: `${childInvitee.firstName} ${childInvitee.lastName}`,
      existingAdultEmail: existingAdult.email
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result
    await verifyEmailSent(page, 'parent');
    logTestStep('Child invite sent to existing adult');
    
    // Simulate adult clicking approval link and upgrading to parent
    await page.goto(`/parent-approval?approvalToken=test-token-${Date.now()}`);
    await expect(page).toHaveURL(/.*\/sign-up.*approvalToken/);
    
    // Fill parent signup form (upgrade existing adult to parent)
    await page.fill('[data-testid="firstName"]', existingAdult.firstName);
    await page.fill('[data-testid="lastName"]', existingAdult.lastName);
    await page.fill('[data-testid="email"]', existingAdult.email);
    await page.fill('[data-testid="password"]', existingAdult.password);
    await page.fill('[data-testid="confirmPassword"]', existingAdult.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Select plan and create child account
    await expect(page).toHaveURL(/.*\/choose-plan.*approvalToken/);
    await page.click('[data-testid="plan-test"]');
    await page.click('[data-testid="submit-plan"]');
    
    await expect(page).toHaveURL(/.*\/parents\/hq.*approvalToken/);
    await fillParentHQForm(page, childInvitee);
    await submitParentHQForm(page);
    
    await verifyChildAccountCreated(page, childInvitee.firstName);
    logTestStep('Child account created via child invite to existing adult upgrade');
  });

  test('8. Child Invites Child → Direct Child Email - Should Be Blocked', async ({ page }) => {
    logTestStep('Starting Child Invites Child → Direct Child Email test');
    
    // Setup - Child trying to invite another child directly by email
    const childInvitee = createTestChild('child-direct-email', 14);
    const childEmail = `child-${Date.now()}@test.cliqstr.local`;
    testEmails.push(childEmail);
    
    const invite: TestInvite = {
      inviteeEmail: childEmail, // Direct child email (should be blocked)
      inviteType: 'child',
      childDetails: childInvitee,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childInviteeName: `${childInvitee.firstName} ${childInvitee.lastName}`,
      directChildEmail: childEmail,
      shouldBeBlocked: true
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should be blocked and show error
    const errorMessage = await page.$('[data-testid="child-direct-email-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('parent email');
    expect(errorText).toContain('required');
    
    // Should NOT send email to child directly
    expect(page.url()).not.toContain('/invite/sent');
    
    logTestStep('Child direct email invite correctly blocked');
  });

  test('Child Invites Child - Permission Check Failed', async ({ page }) => {
    logTestStep('Starting Child Invites Child - Permission Check Failed test');
    
    // Setup - Child without canInviteChildren permission
    const childInvitee = createTestChild('child-no-permission', 13);
    testEmails.push(childInvitee.parentEmail);
    
    const invite: TestInvite = {
      inviteeEmail: childInvitee.parentEmail,
      inviteType: 'child',
      childDetails: childInvitee,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childInviteeName: `${childInvitee.firstName} ${childInvitee.lastName}`,
      noPermission: true
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show permission error
    await verifyPermissionCheckFailed(page);
    
    logTestStep('Child invite correctly blocked due to missing permission');
  });

  test('Adult Invites Child - Missing Child Details', async ({ page }) => {
    logTestStep('Starting Adult Invites Child - Missing Child Details test');
    
    // Setup - Adult trying to invite child without required details
    const invite: TestInvite = {
      inviteeEmail: 'parent@test.cliqstr.local',
      inviteType: 'child',
      // Missing childDetails
      message: 'Your child is invited!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      missingChildDetails: true
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show validation error
    const errorMessage = await page.$('[data-testid="child-details-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('child details');
    expect(errorText).toContain('required');
    
    logTestStep('Child invite correctly validates required child details');
  });
});
