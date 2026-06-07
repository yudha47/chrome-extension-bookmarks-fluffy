chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch(() => {});

chrome.action.onClicked.addListener(() => {});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ pinned: [], recent: [], theme: 'dark' }, () => {});
});
