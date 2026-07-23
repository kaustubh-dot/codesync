import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllSubmission } from '../api/submissions/getSubmission';
import { GET_SUBMISSIONS } from '../api/submissions/submission.query';
import { getClient, LEETCODE_GRAPHQL_API_URL } from '../lib/client';
import { GraphQLClient } from 'graphql-request';

describe('getClient', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns one client configured for LeetCode', () => {
    expect(LEETCODE_GRAPHQL_API_URL).toBe('https://leetcode.com/graphql');
    expect(getClient()).toBeInstanceOf(GraphQLClient);
    expect(getClient()).toBe(getClient());
  });

  it('uses the known-working parameterized submission-list contract', async () => {
    const request = vi.spyOn(getClient(), 'request').mockResolvedValue({} as never);

    await getAllSubmission('two-sum');

    expect(request).toHaveBeenCalledWith(GET_SUBMISSIONS, {
      questionSlug: 'two-sum',
      limit: 20,
      offset: 0,
      lastKey: null,
      status: 10,
    });
  });
});
