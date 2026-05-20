import { describe, it, expect } from 'vitest';
import { parseBoard, BeadsIssue } from '../../src/commands/board';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<BeadsIssue> = {}): BeadsIssue {
  return {
    _type: 'issue',
    id: 'stackwright-abc',
    title: 'Test issue',
    status: 'open',
    priority: 1,
    updated_at: '2026-03-12T00:00:00Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// parseBoard
// ---------------------------------------------------------------------------

describe('parseBoard', () => {
  it('returns empty tiers when given no issues', () => {
    const result = parseBoard([]);
    expect(result.now).toHaveLength(0);
    expect(result.next).toHaveLength(0);
    expect(result.later).toHaveLength(0);
    expect(result.vision).toHaveLength(0);
    expect(result.unlabeled).toHaveLength(0);
  });

  it('sorts issues into the correct priority tier', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-001', title: 'Urgent fix', priority: 1 }),
      makeIssue({ id: 'stackwright-002', title: 'Next up', priority: 2 }),
      makeIssue({ id: 'stackwright-003', title: 'Someday', priority: 3 }),
      makeIssue({ id: 'stackwright-004', title: 'Dream big', priority: 4 }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(1);
    expect(result.now[0].id).toBe('stackwright-001');
    expect(result.next).toHaveLength(1);
    expect(result.next[0].id).toBe('stackwright-002');
    expect(result.later).toHaveLength(1);
    expect(result.later[0].id).toBe('stackwright-003');
    expect(result.vision).toHaveLength(1);
    expect(result.vision[0].id).toBe('stackwright-004');
    expect(result.unlabeled).toHaveLength(0);
  });

  it('puts issues with unknown priority into unlabeled', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-005', title: 'Unknown priority', priority: 99 }),
    ];

    const result = parseBoard(issues);
    expect(result.unlabeled).toHaveLength(1);
    expect(result.unlabeled[0].id).toBe('stackwright-005');
    expect(result.now).toHaveLength(0);
  });

  it('excludes closed issues from all tiers', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-006', priority: 1, status: 'closed' }),
      makeIssue({ id: 'stackwright-007', priority: 2, status: 'closed' }),
      makeIssue({ id: 'stackwright-008', priority: 1, status: 'open' }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(1);
    expect(result.now[0].id).toBe('stackwright-008');
    expect(result.next).toHaveLength(0);
  });

  it('ignores entries with _type other than "issue"', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-009', _type: 'comment', priority: 1 }),
      makeIssue({ id: 'stackwright-010', _type: 'issue', priority: 1 }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(1);
    expect(result.now[0].id).toBe('stackwright-010');
  });

  it('maps issue_type onto the BoardIssue.issueType field', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-011', priority: 2, issue_type: 'feature' }),
    ];

    const result = parseBoard(issues);
    expect(result.next[0].issueType).toBe('feature');
  });

  it('preserves updatedAt from updated_at timestamp', () => {
    const ts = '2026-06-15T10:30:00Z';
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-012', priority: 3, updated_at: ts }),
    ];

    const result = parseBoard(issues);
    expect(result.later[0].updatedAt).toBe(ts);
  });

  it('handles a mix of everything', () => {
    const issues: BeadsIssue[] = [
      makeIssue({ id: 'stackwright-013', priority: 1 }),
      makeIssue({ id: 'stackwright-014', priority: 1 }),
      makeIssue({ id: 'stackwright-015', priority: 2 }),
      makeIssue({ id: 'stackwright-016', priority: 1, status: 'closed' }),
      makeIssue({ id: 'stackwright-017', priority: 4 }),
      makeIssue({ id: 'stackwright-018', priority: 99 }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(2);
    expect(result.next).toHaveLength(1);
    expect(result.later).toHaveLength(0);
    expect(result.vision).toHaveLength(1);
    expect(result.unlabeled).toHaveLength(1);
  });
});
