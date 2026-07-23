//this script should only run in leetcode/problems/*.com pages  (i.e. the problem page)

import { LeetCodeHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
let initialized = false;
let lastQuestionSlug = '';
let lastSubmissionId = '';
let syncing = false;

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getQuestionSlug = () => location.pathname.match(/^\/problems\/([^/]+)/)?.[1] ?? '';

const syncLatestAccepted = async (questionSlug: string, triggeredBySubmit = false) => {
  if (!questionSlug || syncing) return;
  syncing = true;
  try {
    if (questionSlug !== lastQuestionSlug) {
      initialized = false;
      lastQuestionSlug = questionSlug;
      lastSubmissionId = '';
    }

    let submissionId = await leetcode.getLatestSubmissionId(questionSlug);
    for (let retry = 1; !submissionId && triggeredBySubmit && retry <= 3; retry++) {
      await sleep(retry * 1000);
      submissionId = await leetcode.getLatestSubmissionId(questionSlug);
    }
    if (!submissionId) {
      if (triggeredBySubmit) chrome.runtime.sendMessage({ type: 'leetcode-sync-error' });
      return;
    }

    if (!initialized) {
      initialized = true;
      lastSubmissionId = submissionId;
    } else if (submissionId === lastSubmissionId) {
      return;
    } else {
      lastSubmissionId = submissionId;
    }

    const submission = await leetcode.getSubmissionById(submissionId);
    if (!submission || Date.now() - submission.timestamp * 1000 > 3 * 60 * 1000) {
      if (triggeredBySubmit) chrome.runtime.sendMessage({ type: 'leetcode-sync-error' });
      return;
    }
    chrome.runtime.sendMessage({ type: 'submit-to-github', data: submission });
  } finally {
    syncing = false;
  }
};

chrome.runtime.onMessage.addListener((request) => {
  if (request?.type !== 'get-submission') return;
  const questionSlug =
    typeof request?.data?.questionSlug === 'string' ? request.data.questionSlug : '';
  syncLatestAccepted(questionSlug, true).catch(() =>
    chrome.runtime.sendMessage({ type: 'leetcode-sync-error' }),
  );
});

syncLatestAccepted(getQuestionSlug()).catch(() => undefined);
setInterval(() => {
  if (document.visibilityState === 'visible') {
    syncLatestAccepted(getQuestionSlug()).catch(() => undefined);
  }
}, 15_000);
