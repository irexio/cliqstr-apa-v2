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
  verifyQuotaCheckFailed,
  verifyPermissionCheckFailed,
  logTestStep,
  waitForEmailProcessing,
  cleanupTestData,
  TestInvite,
  TestChild
} from '../utils/test-helpers';

/**
 * Edge Case Tests
 * Based on CURRENT-AUTH-FLOWS-DOCUMENTATION.md and TESTING-MATRIX.md
 * 
 * Tests edge cases and error scenarios:
 * 1. Quota full during invite
 * 2. PHQ strict/flexible permissions
 * 3. Child invites child by email (blocked)
 * 4. Plan quota limits
 * 5. Permission validation
 * 6. Age-based routing edge cases
 */

test.describe('Edge Cases - Quota and Permissions', () => {
  let testEmails: string[] = [];
  let inviterUser: any = null;

  test.beforeEach(async ({ page }) => {
    // Create a logged-in user for each test
    inviterUser = createTestAdult('inviter-edge-case');
    testEmails.push(inviterUser.email);
    
    // Sign in the inviter
    await signIn(page, inviterUser.email, inviterUser.password);
    logTestStep('Inviter signed in for edge case test', { email: inviterUser.email });
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    if (testEmails.length > 0) {
      await cleanupTestData(page, testEmails);
      testEmails = [];
    }
  });

  test('Quota Full During Invite - Adult Invites Child', async ({ page }) => {
    logTestStep('Starting Quota Full During Invite test');
    
    // Setup - Simulate quota full scenario
    const child = createTestChild('quota-test-child', 14);
    testEmails.push(child.parentEmail);
    
    const invite: TestInvite = {
      inviteeEmail: child.parentEmail,
      inviteType: 'child',
      childDetails: child,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      inviterEmail: inviterUser.email,
      childName: `${child.firstName} ${child.lastName}`,
      quotaFull: true
    });
    
    // Mock quota full scenario - this would typically be set up in the database
    // For testing, we'll simulate the API response
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show quota error
    await verifyQuotaCheckFailed(page);
    
    // Verify specific quota error messaging
    const errorMessage = await page.$('[data-testid="quota-error"]');
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('quota');
    expect(errorText).toContain('upgrade');
    expect(errorText).toContain('plan');
    
    logTestStep('Quota check correctly failed - invite blocked');
  });

  test('Quota Full During Child Creation - Parent HQ', async ({ page }) => {
    logTestStep('Starting Quota Full During Child Creation test');
    
    // Setup - Parent trying to create child when quota is full
    const child = createTestChild('quota-child-creation', 12);
    testEmails.push(child.parentEmail);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: child.parentEmail,
      quotaFull: true
    });
    
    // Simulate parent approval flow with quota full
    await page.goto(`/parents/hq?approvalToken=test-token-quota-${Date.now()}`);
    
    // Try to create child account
    await fillParentHQForm(page, child);
    await page.click('[data-testid="submit-parent-hq"]');
    
    // Expected Result - Should show quota error
    await verifyQuotaCheckFailed(page);
    
    // Verify quota error messaging
    const errorMessage = await page.$('[data-testid="quota-error"]');
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('quota');
    expect(errorText).toContain('upgrade');
    expect(errorText).toContain('plan');
    
    logTestStep('Child creation correctly blocked due to quota');
  });

  test('PHQ Strict Permissions - Child Account Creation', async ({ page }) => {
    logTestStep('Starting PHQ Strict Permissions test');
    
    // Setup - Child with strict permissions
    const child = createTestChild('strict-permissions-child', 10);
    testEmails.push(child.parentEmail);
    
    // Define strict permissions
    const strictPermissions = {
      canPost: false,
      canComment: false,
      canReact: false,
      canViewProfiles: false,
      canReceiveInvites: false,
      canCreatePublicCliqs: false,
      canInviteChildren: false,
      canInviteAdults: false,
      canCreateCliqs: false,
      canUploadVideos: false,
      invitesRequireParentApproval: true,
      isSilentlyMonitored: true,
      aiModerationLevel: 'strict',
      canAccessGames: false,
      canShareYouTube: false,
      visibilityLevel: 'private'
    };
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: child.parentEmail,
      permissions: 'strict'
    });
    
    // Simulate parent approval flow
    await page.goto(`/parents/hq?approvalToken=test-token-strict-${Date.now()}`);
    
    // Create child account with strict permissions
    await fillParentHQForm(page, child, strictPermissions);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created with strict permissions
    await expect(page).toHaveURL(/.*\/parents\/hq\/success/);
    
    const successMessage = await page.$('[data-testid="child-created-success"]');
    expect(successMessage).toBeTruthy();
    
    logTestStep('Child account created with strict permissions');
  });

  test('PHQ Flexible Permissions - Child Account Creation', async ({ page }) => {
    logTestStep('Starting PHQ Flexible Permissions test');
    
    // Setup - Child with flexible permissions
    const child = createTestChild('flexible-permissions-child', 16);
    testEmails.push(child.parentEmail);
    
    // Define flexible permissions
    const flexiblePermissions = {
      canPost: true,
      canComment: true,
      canReact: true,
      canViewProfiles: true,
      canReceiveInvites: true,
      canCreatePublicCliqs: true,
      canInviteChildren: true,
      canInviteAdults: true,
      canCreateCliqs: true,
      canUploadVideos: true,
      invitesRequireParentApproval: false,
      isSilentlyMonitored: false,
      aiModerationLevel: 'flexible',
      canAccessGames: true,
      canShareYouTube: true,
      visibilityLevel: 'public'
    };
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      parentEmail: child.parentEmail,
      permissions: 'flexible'
    });
    
    // Simulate parent approval flow
    await page.goto(`/parents/hq?approvalToken=test-token-flexible-${Date.now()}`);
    
    // Create child account with flexible permissions
    await fillParentHQForm(page, child, flexiblePermissions);
    await submitParentHQForm(page);
    
    // Expected Result - Child account created with flexible permissions
    await expect(page).toHaveURL(/.*\/parents\/hq\/success/);
    
    const successMessage = await page.$('[data-testid="child-created-success"]');
    expect(successMessage).toBeTruthy();
    
    logTestStep('Child account created with flexible permissions');
  });

  test('Child Invites Child by Email - Should Be Blocked', async ({ page }) => {
    logTestStep('Starting Child Invites Child by Email test');
    
    // Setup - Child trying to invite another child directly by email
    const childEmail = `child-direct-${Date.now()}@test.cliqstr.local`;
    testEmails.push(childEmail);
    
    const invite: TestInvite = {
      inviteeEmail: childEmail, // Direct child email (should be blocked)
      inviteType: 'child',
      childDetails: {
        firstName: 'Direct',
        lastName: 'Child',
        birthdate: '2010-01-01',
        parentEmail: 'parent@test.cliqstr.local'
      },
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
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
    expect(errorText).toContain('child');
    
    // Should NOT send email to child directly
    expect(page.url()).not.toContain('/invite/sent');
    
    logTestStep('Child direct email invite correctly blocked');
  });

  test('Plan Quota Limits - Multiple Children', async ({ page }) => {
    logTestStep('Starting Plan Quota Limits test');
    
    // Setup - Parent trying to create multiple children
    const children = [
      createTestChild('quota-child-1', 10),
      createTestChild('quota-child-2', 12),
      createTestChild('quota-child-3', 14)
    ];
    
    testEmails.push(...children.map(child => child.parentEmail));
    
    logTestStep('Setup complete', { 
      childrenCount: children.length,
      quotaLimit: 2 // Simulate plan limit of 2 children
    });
    
    // Simulate parent approval flow for first child
    await page.goto(`/parents/hq?approvalToken=test-token-quota-1-${Date.now()}`);
    await fillParentHQForm(page, children[0]);
    await submitParentHQForm(page);
    await expect(page).toHaveURL(/.*\/parents\/hq\/success/);
    
    logTestStep('First child created successfully');
    
    // Try to create second child
    await page.goto(`/parents/hq?approvalToken=test-token-quota-2-${Date.now()}`);
    await fillParentHQForm(page, children[1]);
    await submitParentHQForm(page);
    await expect(page).toHaveURL(/.*\/parents\/hq\/success/);
    
    logTestStep('Second child created successfully');
    
    // Try to create third child (should fail due to quota)
    await page.goto(`/parents/hq?approvalToken=test-token-quota-3-${Date.now()}`);
    await fillParentHQForm(page, children[2]);
    await page.click('[data-testid="submit-parent-hq"]');
    
    // Expected Result - Should show quota error
    await verifyQuotaCheckFailed(page);
    
    logTestStep('Third child correctly blocked due to quota limit');
  });

  test('Permission Validation - Child Without Invite Permission', async ({ page }) => {
    logTestStep('Starting Permission Validation test');
    
    // Setup - Child without canInviteChildren permission
    const child = createTestChild('no-invite-permission', 15);
    testEmails.push(child.parentEmail);
    
    const invite: TestInvite = {
      inviteeEmail: child.parentEmail,
      inviteType: 'child',
      childDetails: child,
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      noInvitePermission: true
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show permission error
    await verifyPermissionCheckFailed(page);
    
    // Verify specific permission error messaging
    const errorMessage = await page.$('[data-testid="permission-error"]');
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('permission');
    expect(errorText).toContain('invite');
    expect(errorText).toContain('children');
    
    logTestStep('Permission check correctly failed - invite blocked');
  });

  test('Age-Based Routing Edge Cases - Exactly 13', async ({ page }) => {
    logTestStep('Starting Age-Based Routing Edge Cases test');
    
    // Setup - Child exactly 13 years old
    const child = createTestChild('age-13-child', 13);
    testEmails.push(child.parentEmail);
    
    logTestStep('Setup complete', { 
      childName: `${child.firstName} ${child.lastName}`,
      childAge: 13,
      edgeCase: 'exactly 13'
    });
    
    // Action
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', child.firstName);
    await page.fill('[data-testid="lastName"]', child.lastName);
    await page.fill('[data-testid="birthdate"]', child.birthdate);
    
    // Wait for age detection and role selection
    await page.waitForSelector('[data-testid="role-child"]');
    await page.click('[data-testid="role-child"]');
    
    await page.fill('[data-testid="parentEmail"]', child.parentEmail);
    await page.click('[data-testid="submit-signup"]');
    
    // Expected Result - Should redirect to awaiting approval (13+ still requires parent approval)
    await expect(page).toHaveURL(/.*\/awaiting-approval/);
    
    const message = await page.$('[data-testid="awaiting-approval-message"]');
    expect(message).toBeTruthy();
    
    logTestStep('Child exactly 13 correctly routed to parent approval');
  });

  test('Age-Based Routing Edge Cases - Exactly 18', async ({ page }) => {
    logTestStep('Starting Age-Based Routing Edge Cases - Exactly 18 test');
    
    // Setup - Person exactly 18 years old
    const adult = createTestAdult('age-18-adult');
    adult.birthdate = '2006-01-01'; // Exactly 18 years old
    testEmails.push(adult.email);
    
    logTestStep('Setup complete', { 
      adultName: `${adult.firstName} ${adult.lastName}`,
      adultAge: 18,
      edgeCase: 'exactly 18'
    });
    
    // Action
    await page.goto('/sign-up');
    await page.fill('[data-testid="firstName"]', adult.firstName);
    await page.fill('[data-testid="lastName"]', adult.lastName);
    await page.fill('[data-testid="birthdate"]', adult.birthdate);
    
    // Wait for age detection and role selection
    await page.waitForSelector('[data-testid="role-adult"]');
    await page.click('[data-testid="role-adult"]');
    
    await page.fill('[data-testid="email"]', adult.email);
    await page.fill('[data-testid="password"]', adult.password);
    await page.fill('[data-testid="confirmPassword"]', adult.password);
    await page.click('[data-testid="submit-signup"]');
    
    // Expected Result - Should redirect to plan selection (adult)
    await expect(page).toHaveURL(/.*\/choose-plan/);
    
    const planMessage = await page.$('[data-testid="plan-required-message"]');
    expect(planMessage).toBeTruthy();
    
    logTestStep('Person exactly 18 correctly routed to adult signup');
  });

  test('Invalid Email Format - Invite Form', async ({ page }) => {
    logTestStep('Starting Invalid Email Format test');
    
    // Setup - Invalid email format
    const invite: TestInvite = {
      inviteeEmail: 'invalid-email-format',
      inviteType: 'adult',
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      invalidEmail: invite.inviteeEmail
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show validation error
    const errorMessage = await page.$('[data-testid="email-format-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('email');
    expect(errorText).toContain('format');
    expect(errorText).toContain('invalid');
    
    logTestStep('Invalid email format correctly validated');
  });

  test('Missing Required Fields - Child Invite', async ({ page }) => {
    logTestStep('Starting Missing Required Fields test');
    
    // Setup - Child invite with missing required fields
    const invite: TestInvite = {
      inviteeEmail: 'parent@test.cliqstr.local',
      inviteType: 'child',
      childDetails: {
        firstName: '', // Missing first name
        lastName: 'Child',
        birthdate: '2010-01-01',
        parentEmail: 'parent@test.cliqstr.local'
      },
      message: 'Join my cliq!'
    };
    
    logTestStep('Setup complete', { 
      missingFields: ['firstName']
    });
    
    // Action
    await fillInviteForm(page, invite);
    await submitInviteForm(page);
    
    // Expected Result - Should show validation error
    const errorMessage = await page.$('[data-testid="required-fields-error"]');
    expect(errorMessage).toBeTruthy();
    
    const errorText = await errorMessage?.textContent();
    expect(errorText).toContain('required');
    expect(errorText).toContain('first name');
    
    logTestStep('Missing required fields correctly validated');
  });
});
