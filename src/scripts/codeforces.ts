import CodeforcesHandler from '../handlers/CodeforcesHandler';

let syncing = false;

const getConfiguredHandle = () =>
  new Promise<string>((resolve) => {
    chrome.runtime.sendMessage({ type: 'get-codeforces-handle' }, (response) => {
      if (chrome.runtime.lastError) return resolve('');
      resolve(typeof response?.handle === 'string' ? response.handle : '');
    });
  });

const syncLatestSubmission = async (attempts: number) => {
  if (syncing) return false;
  syncing = true;
  try {
    const handle = await getConfiguredHandle();
    if (!handle) return false;

    const submission = await new CodeforcesHandler().getLatestAcceptedSubmission(handle, attempts);
    if (!submission) return false;

    chrome.runtime.sendMessage({ type: 'submit-codeforces-to-github', data: submission });
    return true;
  } catch {
    chrome.runtime.sendMessage({ type: 'codeforces-sync-error' });
    return false;
  } finally {
    syncing = false;
  }
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type !== 'get-codeforces-submission') return;
  syncLatestSubmission(15).then(sendResponse).catch(() => sendResponse(false));
  return true;
});

syncLatestSubmission(1).catch(() => undefined);
