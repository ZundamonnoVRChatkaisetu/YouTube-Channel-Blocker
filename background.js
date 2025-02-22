/********************************************
 * インストール時の初期化、右クリックメニュー作成
 ********************************************/
chrome.runtime.onInstalled.addListener(() => {
    // ブロックリストを初期化
    chrome.storage.local.set({ blockedChannels: [] });
  
    // ブロック機能のON/OFFフラグを初期化(true=有効)
    chrome.storage.local.set({ isBlockEnabled: true });
  
    // 右クリックメニュー: ブロック管理ページを開く
    chrome.contextMenus.create({
      id: "open-block-manager",
      title: "ブロック管理を開く",
      contexts: ["all"],
      documentUrlPatterns: ["*://www.youtube.com/*"]
    });
  });
  
  /********************************************
   * 右クリックメニューのクリック時処理
   ********************************************/
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-block-manager") {
      chrome.tabs.create({ url: chrome.runtime.getURL("blocked_channels.html") });
    }
  });
  
  /********************************************
   * ブロックリスト操作
   ********************************************/
  function addBlockedChannel(channelData) {
    // channelData は { name, url, icon } を想定
    chrome.storage.local.get(["blockedChannels"], (result) => {
      const blocked = result.blockedChannels || [];
      // 重複チェック
      const alreadyExists = blocked.some(
        (item) => item.name === channelData.name && item.url === channelData.url
      );
      if (!alreadyExists) {
        blocked.push(channelData);
        chrome.storage.local.set({ blockedChannels: blocked });
      }
    });
  }
  
  function removeBlockedChannel(channelName) {
    chrome.storage.local.get(["blockedChannels"], (result) => {
      let blocked = result.blockedChannels || [];
      blocked = blocked.filter((item) => item.name !== channelName);
      chrome.storage.local.set({ blockedChannels: blocked });
    });
  }
  
  function getBlockedChannels(callback) {
    chrome.storage.local.get(["blockedChannels"], (result) => {
      callback(result.blockedChannels || []);
    });
  }
  
  function setBlockEnabled(enabled) {
    // ブロック機能の有効/無効を保存
    chrome.storage.local.set({ isBlockEnabled: enabled });
  }
  
  function getBlockEnabled(callback) {
    chrome.storage.local.get(["isBlockEnabled"], (result) => {
      callback(result.isBlockEnabled !== false);
    });
  }
  
  /********************************************
   * content_script / UI などからのメッセージ受信
   ********************************************/
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addBlockedChannel") {
      addBlockedChannel(request.channelData);
      sendResponse({ status: "ok" });
    } else if (request.action === "removeBlockedChannel") {
      removeBlockedChannel(request.channelName);
      sendResponse({ status: "ok" });
    } else if (request.action === "getBlockedChannels") {
      getBlockedChannels((list) => {
        sendResponse({ blockedChannels: list });
      });
      return true; // 非同期レスポンス許可
    } else if (request.action === "openBlockManager") {
      // サイドメニューなどからのクリックで開く
      chrome.tabs.create({ url: chrome.runtime.getURL("blocked_channels.html") });
      sendResponse({ status: "ok" });
    } else if (request.action === "setBlockEnabled") {
      setBlockEnabled(request.enabled);
      sendResponse({ status: "ok" });
    } else if (request.action === "getBlockEnabled") {
      getBlockEnabled((val) => {
        sendResponse({ enabled: val });
      });
      return true; 
    }
  });
  