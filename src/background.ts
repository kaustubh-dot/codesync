import { GithubHandler } from './handlers';
import { Submission } from './types/Submission';

chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });

const showSuccessIcon = () => {
  chrome.action.setIcon({ path: 'icon-fire-96x96.gif' }, () => {
    setTimeout(() => chrome.action.setIcon({ path: 'logo96.png' }), 5000);
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request?.type !== 'submit-to-github' ||
    sender.id !== chrome.runtime.id ||
    !sender.url?.startsWith('https://leetcode.com/problems/')
  ) {
    return;
  }

  new GithubHandler()
    .submit(request.data as Submission)
    .then((isPushed) => {
      if (isPushed) showSuccessIcon();
      sendResponse({ status: isPushed ? 'OK' : 'IGNORED' });
    })
    .catch((error) => {
      console.error('LeetSync upload failed:', error instanceof Error ? error.message : error);
      sendResponse({ status: 'ERROR' });
    });

  return true;
});

const sendMessageToContentScript = (tabId: number, type: string, data: unknown) => {
  chrome.tabs.sendMessage(tabId, { type, data }, (response) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
      return;
    }
    console.log('Submission request acknowledged', response);
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

export {};
