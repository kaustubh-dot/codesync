import { getClient, LEETCODE_GRAPHQL_API_URL } from '../lib/client';
import { GraphQLClient } from 'graphql-request';

describe('getClient', () => {
  it('returns one client configured for LeetCode', () => {
    expect(LEETCODE_GRAPHQL_API_URL).toBe('https://leetcode.com/graphql');
    expect(getClient()).toBeInstanceOf(GraphQLClient);
    expect(getClient()).toBe(getClient());
  });
});
