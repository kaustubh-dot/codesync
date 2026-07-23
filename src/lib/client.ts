import { GraphQLClient } from 'graphql-request';

export const LEETCODE_GRAPHQL_API_URL = 'https://leetcode.com/graphql/';
const client = new GraphQLClient(LEETCODE_GRAPHQL_API_URL, { credentials: 'include' });

export const getClient = () => client;
