#!/usr/bin/env tsx

/**
 * Test Runner for Cliqstr Authentication Flows
 * 
 * This script runs the comprehensive test suite based on:
 * - CURRENT-AUTH-FLOWS-DOCUMENTATION.md
 * - TESTING-MATRIX.md
 * 
 * Usage:
 * npm run test:auth-flows
 * npm run test:signup
 * npm run test:invites
 * npm run test:edge-cases
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestConfig {
  name: string;
  description: string;
  command: string;
  files: string[];
}

const testConfigs: TestConfig[] = [
  {
    name: 'signup-flows',
    description: 'Sign Up Flow Tests (4 scenarios)',
    command: 'npx playwright test tests/auth/signup-flows.spec.ts',
    files: ['tests/auth/signup-flows.spec.ts']
  },
  {
    name: 'invite-flows',
    description: 'Invite Flow Tests (8 scenarios)',
    command: 'npx playwright test tests/invites/invite-flows.spec.ts',
    files: ['tests/invites/invite-flows.spec.ts']
  },
  {
    name: 'edge-cases',
    description: 'Edge Case Tests (quota, permissions, validation)',
    command: 'npx playwright test tests/edge-cases/quota-and-permissions.spec.ts',
    files: ['tests/edge-cases/quota-and-permissions.spec.ts']
  },
  {
    name: 'all',
    description: 'All Authentication Flow Tests',
    command: 'npx playwright test tests/',
    files: ['tests/auth/', 'tests/invites/', 'tests/edge-cases/']
  }
];

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[level];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPrerequisites(): boolean {
  log('Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('Playwright is installed', 'success');
  } catch (error) {
    log('Playwright is not installed. Please run: npm install @playwright/test', 'error');
    return false;
  }
  
  // Check if test files exist
  for (const config of testConfigs) {
    for (const file of config.files) {
      if (!existsSync(file)) {
        log(`Test file not found: ${file}`, 'error');
        return false;
      }
    }
  }
  
  log('All prerequisites met', 'success');
  return true;
}

function runTest(config: TestConfig): boolean {
  log(`Running ${config.description}...`);
  
  try {
    execSync(config.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log(`${config.description} completed successfully`, 'success');
    return true;
  } catch (error) {
    log(`${config.description} failed`, 'error');
    return false;
  }
}

function generateTestReport(): void {
  log('Generating test report...');
  
  const reportPath = 'playwright-report/index.html';
  if (existsSync(reportPath)) {
    log(`Test report available at: ${reportPath}`, 'success');
  } else {
    log('Test report not found', 'warn');
  }
}

function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  log('🚀 Starting Cliqstr Authentication Flow Tests');
  log(`Test type: ${testType}`);
  
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  const config = testConfigs.find(c => c.name === testType);
  if (!config) {
    log(`Unknown test type: ${testType}`, 'error');
    log('Available test types: ' + testConfigs.map(c => c.name).join(', '));
    process.exit(1);
  }
  
  const success = runTest(config);
  
  if (success) {
    generateTestReport();
    log('🎉 All tests completed successfully!', 'success');
  } else {
    log('💥 Some tests failed. Check the output above for details.', 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { testConfigs, runTest, checkPrerequisites };
