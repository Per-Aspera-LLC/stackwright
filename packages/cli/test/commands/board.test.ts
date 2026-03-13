import { describe, it, expect } from 'vitest';
import { parseBoard, GhIssueRaw } from '../../src/commands/board';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<GhIssueRaw> = {}): GhIssueRaw {
  return {
    number: 1,
    title: 'Test issue',
    labels: [],
    assignees: [],
    updatedAt: '2026-03-12T00:00:00Z',
    ...overrides,
  };
}

function label(name: string): { name: string } {
  return { name };
}

function assignee(login: string): { login: string } {
  return { login };
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
    const issues: GhIssueRaw[] = [
      makeIssue({ number: 1, title: 'Urgent fix', labels: [label('priority:now')] }),
      makeIssue({ number: 2, title: 'Next up', labels: [label('priority:next')] }),
      makeIssue({ number: 3, title: 'Someday', labels: [label('priority:later')] }),
      makeIssue({ number: 4, title: 'Dream big', labels: [label('priority:vision')] }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(1);
    expect(result.now[0].number).toBe(1);
    expect(result.next).toHaveLength(1);
    expect(result.next[0].number).toBe(2);
    expect(result.later).toHaveLength(1);
    expect(result.later[0].number).toBe(3);
    expect(result.vision).toHaveLength(1);
    expect(result.vision[0].number).toBe(4);
    expect(result.unlabeled).toHaveLength(0);
  });

  it('puts issues without a priority label into unlabeled', () => {
    const issues: GhIssueRaw[] = [
      makeIssue({ number: 10, title: 'No label', labels: [] }),
      makeIssue({ number: 11, title: 'Other label', labels: [label('enhancement')] }),
    ];

    const result = parseBoard(issues);
    expect(result.unlabeled).toHaveLength(2);
    expect(result.unlabeled[0].number).toBe(10);
    expect(result.unlabeled[1].number).toBe(11);
  });

  it('handles issues with multiple labels including a priority label', () => {
    const issues: GhIssueRaw[] = [
      makeIssue({
        number: 42,
        title: 'Labeled both ways',
        labels: [label('enhancement'), label('priority:now'), label('bug')],
      }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(1);
    expect(result.now[0].labels).toEqual(['enhancement', 'priority:now', 'bug']);
  });

  it('flattens assignee objects to login strings', () => {
    const issues: GhIssueRaw[] = [
      makeIssue({
        number: 7,
        labels: [label('priority:next')],
        assignees: [assignee('alice'), assignee('bob')],
      }),
    ];

    const result = parseBoard(issues);
    expect(result.next[0].assignees).toEqual(['alice', 'bob']);
  });

  it('preserves updatedAt timestamp', () => {
    const ts = '2026-06-15T10:30:00Z';
    const issues: GhIssueRaw[] = [
      makeIssue({ number: 99, labels: [label('priority:later')], updatedAt: ts }),
    ];

    const result = parseBoard(issues);
    expect(result.later[0].updatedAt).toBe(ts);
  });

  it('ignores unknown priority: prefixed labels', () => {
    const issues: GhIssueRaw[] = [
      makeIssue({
        number: 50,
        title: 'Unknown priority',
        labels: [label('priority:critical')],
      }),
    ];

    const result = parseBoard(issues);
    expect(result.unlabeled).toHaveLength(1);
    expect(result.now).toHaveLength(0);
  });

  it('handles a mix of everything', () => {
    const issues: GhIssueRaw[] = [
      makeIssue({ number: 1, labels: [label('priority:now')] }),
      makeIssue({ number: 2, labels: [label('priority:now')] }),
      makeIssue({ number: 3, labels: [label('priority:next')] }),
      makeIssue({ number: 4, labels: [] }),
      makeIssue({ number: 5, labels: [label('priority:vision')] }),
      makeIssue({ number: 6, labels: [label('bug')] }),
    ];

    const result = parseBoard(issues);
    expect(result.now).toHaveLength(2);
    expect(result.next).toHaveLength(1);
    expect(result.later).toHaveLength(0);
    expect(result.vision).toHaveLength(1);
    expect(result.unlabeled).toHaveLength(2);
  });
});
