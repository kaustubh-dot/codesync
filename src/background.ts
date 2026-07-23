import { GithubHandler } from './handlers';
import { migrateLegacyStorage } from './lib/storage';
import type { CodeforcesSubmission } from './types/CodeforcesSubmission';
import { Submission } from './types/Submission';

chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
const storageReady = migrateLegacyStorage();

const showSuccessIcon = () => {
  chrome.action.setBadgeBackgroundColor({ color: '#40a02b' });
  chrome.action.setBadgeText({ text: '✓' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const senderUrl = sender.url ?? '';
  if (sender.id !== chrome.runtime.id) return;

  if (request?.type === 'get-codeforces-handle' && senderUrl.startsWith('https://codeforces.com/')) {
    chrome.storage.local
      .get('codeforces_handle')
      .then((result) =>
        sendResponse({
          handle: typeof result.codeforces_handle === 'string' ? result.codeforces_handle : '',
        }),
      );
    return true;
  }

  if (request?.type === 'codeforces-sync-error' && senderUrl.startsWith('https://codeforces.com/')) {
    chrome.storage.local.set({
      lastUploadError: 'Codeforces sync could not read the latest submission. Sign in and retry.',
    });
    return;
  }

  let submission: Promise<boolean> | null = null;
  if (
    request?.type === 'submit-to-github' &&
    senderUrl.startsWith('https://leetcode.com/problems/')
  ) {
    submission = storageReady.then(() => new GithubHandler().submit(request.data as Submission));
  } else if (
    request?.type === 'submit-codeforces-to-github' &&
    senderUrl.startsWith('https://codeforces.com/')
  ) {
    submission = storageReady.then(() =>
      new GithubHandler().submitCodeforces(request.data as CodeforcesSubmission),
    );
  }
  if (!submission) return;

  submission
    .then((isPushed) => {
      if (isPushed) showSuccessIcon();
      sendResponse({ status: isPushed ? 'OK' : 'IGNORED' });
    })
    .catch((error) => {
      console.error('CodeSync upload failed:', error instanceof Error ? error.message : error);
      sendResponse({ status: 'ERROR' });
    });

  return true;
});

const sendMessageToContentScript = (tabId: number, type: string, data: unknown) => {
  chrome.tabs.sendMessage(tabId, { type, data }, (_response) => {
    if (chrome.runtime.lastError) {
      return;
    }
  });
};

chrome.webRequest.onCompleted.addListener(
  (details: chrome.webRequest.OnCompletedDetails) => {
    if (
      details.method !== 'POST' ||
      !details.url.startsWith('https://leetcode.com/problems/') ||
      !details.url.includes('/submit/')
    ) {
      return;
    }

    const questionSlug = details.url.match(/\/problems\/(.*)\/submit/)?.[1] ?? null;
    if (!questionSlug || details.tabId < 0) return;

    setTimeout(() => {
      sendMessageToContentScript(details.tabId, 'get-submission', { questionSlug });
    }, 5000);
  },
  {
    urls: ['https://leetcode.com/problems/*/submit/'],
    types: ['xmlhttprequest'],
  },
);

chrome.webRequest.onCompleted.addListener(
  (details: chrome.webRequest.OnCompletedDetails) => {
    if (
      details.method !== 'POST' ||
      details.tabId < 0 ||
      !details.url.startsWith('https://codeforces.com/') ||
      !/\/submit(?:\/|$|\?)/.test(details.url)
    ) {
      return;
    }

    setTimeout(() => {
      sendMessageToContentScript(details.tabId, 'get-codeforces-submission', null);
    }, 5000);
  },
  { urls: ['https://codeforces.com/*'] },
);

export {};
