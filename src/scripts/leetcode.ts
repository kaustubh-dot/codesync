import { LeetCodeHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

chrome.runtime.onMessage.addListener((request) => {
  if (request?.type !== 'get-submission') return;
  const questionSlug =
    typeof request?.data?.questionSlug === 'string' ? request.data.questionSlug : '';
  if (!questionSlug) return;

  const sync = async () => {
    let submission = await leetcode.getSubmission(questionSlug);
    for (let retry = 1; !submission && retry <= 3; retry++) {
      await sleep(retry * 1000);
      submission = await leetcode.getSubmission(questionSlug);
    }
    if (!submission) {
      chrome.runtime.sendMessage({ type: 'leetcode-sync-error' });
      return;
    }
    if (Date.now() - submission.timestamp * 1000 > 60_000) return;
    chrome.runtime.sendMessage({ type: 'submit-to-github', data: submission });
  };

  sync().catch(() => chrome.runtime.sendMessage({ type: 'leetcode-sync-error' }));
});
