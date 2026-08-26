import { describe, it, expect } from 'vitest';
import { runCoreBackendUnitTests } from './coreBackendVerification';

describe('BizOne ERP Core Backend Unit Tests', () => {
  it('runs all core backend unit tests successfully', () => {
    const out = runCoreBackendUnitTests();
    expect(out.failed).toBe(0);
    expect(out.passed).toBe(out.total);
  });
});
