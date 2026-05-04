/**
 * Tests for .github/workflows/ci.yml
 *
 * These tests validate the structural correctness of the CI workflow file:
 * triggers, job configuration, steps, and tool versions.
 * They use the raw file content so no external YAML parser is required.
 */

import * as fs from 'fs';
import * as path from 'path';

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../.github/workflows/ci.yml',
);

let workflowContent: string;

beforeAll(() => {
  workflowContent = fs.readFileSync(WORKFLOW_PATH, 'utf8');
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Returns true when the workflow YAML contains the given literal string. */
function contains(text: string): boolean {
  return workflowContent.includes(text);
}

/** Returns true when at least one line matches the given regular expression. */
function matchesLine(pattern: RegExp): boolean {
  return workflowContent.split('\n').some((line) => pattern.test(line));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('.github/workflows/ci.yml', () => {
  it('workflow file exists', () => {
    expect(fs.existsSync(WORKFLOW_PATH)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Workflow name
  // -------------------------------------------------------------------------

  describe('workflow name', () => {
    it('has a non-empty name field', () => {
      expect(matchesLine(/^name:\s*\S/)).toBe(true);
    });

    it('includes "EnergyIQ" in the workflow name', () => {
      expect(matchesLine(/^name:.*EnergyIQ/)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Triggers
  // -------------------------------------------------------------------------

  describe('workflow triggers', () => {
    it('triggers on pull_request events', () => {
      expect(contains('pull_request:')).toBe(true);
    });

    it('supports manual workflow_dispatch trigger', () => {
      expect(contains('workflow_dispatch')).toBe(true);
    });

    it('targets the dev branch on pull_request', () => {
      expect(contains('- dev')).toBe(true);
    });

    it('targets the staging branch on pull_request', () => {
      expect(contains('- staging')).toBe(true);
    });

    it('targets the main branch on pull_request', () => {
      expect(contains('- main')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Runner
  // -------------------------------------------------------------------------

  describe('job runner', () => {
    it('runs on ubuntu-latest', () => {
      expect(contains('runs-on: ubuntu-latest')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Steps — checkout
  // -------------------------------------------------------------------------

  describe('checkout step', () => {
    it('uses actions/checkout', () => {
      expect(matchesLine(/uses:\s*actions\/checkout/)).toBe(true);
    });

    it('uses actions/checkout at v4 or later', () => {
      expect(matchesLine(/uses:\s*actions\/checkout@v[4-9]/)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Steps — pnpm setup
  // -------------------------------------------------------------------------

  describe('pnpm setup step', () => {
    it('uses pnpm/action-setup', () => {
      expect(matchesLine(/uses:\s*pnpm\/action-setup/)).toBe(true);
    });

    it('specifies pnpm version 10', () => {
      // The version: line should appear near the pnpm setup action
      expect(contains('version: 10')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Steps — Node.js setup
  // -------------------------------------------------------------------------

  describe('Node.js setup step', () => {
    it('uses actions/setup-node', () => {
      expect(matchesLine(/uses:\s*actions\/setup-node/)).toBe(true);
    });

    it('uses actions/setup-node at v4 or later', () => {
      expect(matchesLine(/uses:\s*actions\/setup-node@v[4-9]/)).toBe(true);
    });

    it('specifies Node.js version 20', () => {
      expect(contains('node-version: 20')).toBe(true);
    });

    it('enables pnpm caching for node_modules', () => {
      expect(contains('cache: pnpm')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Steps — dependency installation
  // -------------------------------------------------------------------------

  describe('dependency installation step', () => {
    it('installs dependencies with pnpm', () => {
      expect(matchesLine(/run:\s*pnpm\s+install/)).toBe(true);
    });

    it('uses --frozen-lockfile to ensure reproducible installs', () => {
      expect(contains('--frozen-lockfile')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Steps — validate (lint + test + build)
  // -------------------------------------------------------------------------

  describe('validate step', () => {
    it('runs pnpm validate', () => {
      expect(matchesLine(/run:\s*pnpm\s+validate/)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Step ordering
  // -------------------------------------------------------------------------

  describe('step ordering', () => {
    it('checkout appears before pnpm setup', () => {
      const checkoutIdx = workflowContent.indexOf('actions/checkout');
      const pnpmIdx = workflowContent.indexOf('pnpm/action-setup');
      expect(checkoutIdx).toBeGreaterThanOrEqual(0);
      expect(pnpmIdx).toBeGreaterThanOrEqual(0);
      expect(checkoutIdx).toBeLessThan(pnpmIdx);
    });

    it('pnpm setup appears before Node.js setup', () => {
      const pnpmIdx = workflowContent.indexOf('pnpm/action-setup');
      const nodeIdx = workflowContent.indexOf('actions/setup-node');
      expect(pnpmIdx).toBeGreaterThanOrEqual(0);
      expect(nodeIdx).toBeGreaterThanOrEqual(0);
      expect(pnpmIdx).toBeLessThan(nodeIdx);
    });

    it('dependency installation appears before validate step', () => {
      const installIdx = workflowContent.indexOf('--frozen-lockfile');
      const validateIdx = workflowContent.indexOf('pnpm validate');
      expect(installIdx).toBeGreaterThanOrEqual(0);
      expect(validateIdx).toBeGreaterThanOrEqual(0);
      expect(installIdx).toBeLessThan(validateIdx);
    });

    it('Node.js setup appears before dependency installation', () => {
      const nodeIdx = workflowContent.indexOf('actions/setup-node');
      const installIdx = workflowContent.indexOf('--frozen-lockfile');
      expect(nodeIdx).toBeGreaterThanOrEqual(0);
      expect(installIdx).toBeGreaterThanOrEqual(0);
      expect(nodeIdx).toBeLessThan(installIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Regression / negative cases
  // -------------------------------------------------------------------------

  describe('regression and negative cases', () => {
    it('does not target feature branches directly in pull_request trigger', () => {
      // The branches list should only contain dev, staging, main
      // (no wildcard "feature/**" entries that could widen the trigger)
      expect(matchesLine(/^\s+-\s+feature\//)).toBe(false);
    });

    it('does not use an outdated Node.js version (< 20)', () => {
      // Ensure no node-version: 18 or 16 is present
      expect(matchesLine(/node-version:\s*(1[0-9]|[0-9])\b/)).toBe(false);
    });

    it('does not use an outdated pnpm version (< 9)', () => {
      // Ensure no version: < 9 for pnpm setup
      expect(matchesLine(/version:\s*[1-8]\b/)).toBe(false);
    });

    it('does not install dependencies without the lockfile flag', () => {
      // Bare `pnpm install` without --frozen-lockfile would allow drift
      const lines = workflowContent.split('\n');
      const bareInstall = lines.some(
        (line) =>
          /run:\s*pnpm\s+install\b/.test(line) &&
          !line.includes('--frozen-lockfile'),
      );
      expect(bareInstall).toBe(false);
    });

    it('workflow file is valid UTF-8 and non-empty', () => {
      expect(workflowContent.length).toBeGreaterThan(0);
    });
  });
});