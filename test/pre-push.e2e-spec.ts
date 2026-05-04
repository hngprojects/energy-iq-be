/**
 * Tests for .husky/pre-push
 *
 * The pre-push hook reads git push ref lines from stdin (one per push destination):
 *   <local_ref> <local_sha> <remote_ref> <remote_sha>
 *
 * It blocks direct pushes to refs/heads/main and refs/heads/staging (exit 1).
 * For all other refs it runs `pnpm --silent run validate`.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync, SpawnSyncReturns } from 'child_process';

const HOOK_PATH = path.resolve(__dirname, '../.husky/pre-push');
const DUMMY_SHA = 'aabbccddeeff00112233445566778899aabbccdd';

/**
 * Run the pre-push hook, injecting a fake `pnpm` shim so the validate step
 * exits 0 without requiring the real tool-chain.
 */
function runHook(
  stdinLines: string[],
  opts: { mockPnpm?: boolean } = { mockPnpm: true },
): SpawnSyncReturns<Buffer> {
  const stdinInput = stdinLines.join('\n') + (stdinLines.length ? '\n' : '');

  let env = { ...process.env };

  if (opts.mockPnpm) {
    // Create a temp dir with a `pnpm` shim that exits 0
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'husky-test-'));
    const pnpmShim = path.join(tmpDir, 'pnpm');
    fs.writeFileSync(pnpmShim, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    env = { ...env, PATH: `${tmpDir}:${process.env.PATH ?? ''}` };

    const result = spawnSync('sh', [HOOK_PATH], {
      input: stdinInput,
      env,
      encoding: 'buffer',
    });

    // Clean up shim
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // best-effort cleanup
    }

    return result;
  }

  return spawnSync('sh', [HOOK_PATH], {
    input: stdinInput,
    env,
    encoding: 'buffer',
  });
}

/** Build a git push stdin line in the format the hook reads */
function pushLine(remoteRef: string): string {
  return `refs/heads/feature/test ${DUMMY_SHA} ${remoteRef} ${DUMMY_SHA}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('.husky/pre-push', () => {
  it('hook script exists and is executable', () => {
    expect(() => fs.accessSync(HOOK_PATH, fs.constants.X_OK)).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // Protected branches — should be blocked
  // -------------------------------------------------------------------------

  describe('blocks direct pushes to protected branches', () => {
    it('exits with code 1 when pushing to refs/heads/main', () => {
      const result = runHook([pushLine('refs/heads/main')], {
        mockPnpm: false,
      });
      expect(result.status).toBe(1);
    });

    it('prints branch name in error message when pushing to main', () => {
      const result = runHook([pushLine('refs/heads/main')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      expect(stdout).toContain('main');
    });

    it('advises opening a PR to dev branch when pushing to main', () => {
      const result = runHook([pushLine('refs/heads/main')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      expect(stdout).toContain('dev');
    });

    it('exits with code 1 when pushing to refs/heads/staging', () => {
      const result = runHook([pushLine('refs/heads/staging')], {
        mockPnpm: false,
      });
      expect(result.status).toBe(1);
    });

    it('prints branch name in error message when pushing to staging', () => {
      const result = runHook([pushLine('refs/heads/staging')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      expect(stdout).toContain('staging');
    });

    it('does not mention the wrong branch in the main error message', () => {
      const result = runHook([pushLine('refs/heads/main')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      // Error should name "main", not "staging"
      expect(stdout).not.toContain('staging');
    });

    it('does not mention the wrong branch in the staging error message', () => {
      const result = runHook([pushLine('refs/heads/staging')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      // Error should name "staging", not "main"
      expect(stdout).not.toContain('Cannot push directly to main');
    });
  });

  // -------------------------------------------------------------------------
  // Allowed branches — should pass the branch check
  // -------------------------------------------------------------------------

  describe('allows pushes to non-protected branches', () => {
    it('exits 0 when pushing to refs/heads/dev (with mock pnpm)', () => {
      const result = runHook([pushLine('refs/heads/dev')]);
      expect(result.status).toBe(0);
    });

    it('exits 0 when pushing to a feature branch (with mock pnpm)', () => {
      const result = runHook([pushLine('refs/heads/feature/my-feature')]);
      expect(result.status).toBe(0);
    });

    it('exits 0 when pushing to a fix branch (with mock pnpm)', () => {
      const result = runHook([pushLine('refs/heads/fix/some-bug')]);
      expect(result.status).toBe(0);
    });

    it('exits 0 when pushing to a chore branch (with mock pnpm)', () => {
      const result = runHook([pushLine('refs/heads/chore/update-deps')]);
      expect(result.status).toBe(0);
    });

    it('prints validation message for allowed branches', () => {
      const result = runHook([pushLine('refs/heads/dev')]);
      const stdout = result.stdout.toString();
      expect(stdout).toContain('Running validation before push');
    });

    it('does not print the blocked message for an allowed branch', () => {
      const result = runHook([pushLine('refs/heads/feature/ok')]);
      const stdout = result.stdout.toString();
      expect(stdout).not.toContain('Cannot push directly');
    });
  });

  // -------------------------------------------------------------------------
  // Branch name stripping — refs/heads/<name> → <name>
  // -------------------------------------------------------------------------

  describe('branch name extraction in error messages', () => {
    it('strips refs/heads/ prefix from main in the error message', () => {
      const result = runHook([pushLine('refs/heads/main')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      // Should say "main", not "refs/heads/main"
      expect(stdout).toContain('Cannot push directly to main');
      expect(stdout).not.toContain('refs/heads/main');
    });

    it('strips refs/heads/ prefix from staging in the error message', () => {
      const result = runHook([pushLine('refs/heads/staging')], {
        mockPnpm: false,
      });
      const stdout = result.stdout.toString();
      expect(stdout).toContain('Cannot push directly to staging');
      expect(stdout).not.toContain('refs/heads/staging');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple refs in one push
  // -------------------------------------------------------------------------

  describe('multiple ref lines in a single push', () => {
    it('blocks if any ref targets main', () => {
      const result = runHook([
        pushLine('refs/heads/feature/allowed'),
        pushLine('refs/heads/main'),
      ]);
      expect(result.status).toBe(1);
    });

    it('blocks if any ref targets staging', () => {
      const result = runHook([
        pushLine('refs/heads/dev'),
        pushLine('refs/heads/staging'),
      ]);
      expect(result.status).toBe(1);
    });

    it('exits 0 when all refs target allowed branches (with mock pnpm)', () => {
      const result = runHook([
        pushLine('refs/heads/feature/a'),
        pushLine('refs/heads/feature/b'),
      ]);
      expect(result.status).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('exits 0 for empty stdin (no refs pushed) with mock pnpm', () => {
      // git can call the hook with no input in some scenarios
      const result = runHook([]);
      expect(result.status).toBe(0);
    });

    it('does not block a branch that merely contains the word "main"', () => {
      // e.g. refs/heads/main-feature should NOT be blocked
      const result = runHook([pushLine('refs/heads/main-feature')]);
      expect(result.status).toBe(0);
    });

    it('does not block a branch that merely contains the word "staging"', () => {
      const result = runHook([pushLine('refs/heads/staging-test')]);
      expect(result.status).toBe(0);
    });

    it('does not confuse refs/heads/MAIN (uppercase) with refs/heads/main', () => {
      // The hook case match is case-sensitive; MAIN should not be blocked
      const result = runHook([pushLine('refs/heads/MAIN')]);
      expect(result.status).toBe(0);
    });
  });
});
