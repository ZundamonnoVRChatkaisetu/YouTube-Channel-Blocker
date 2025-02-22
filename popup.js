const blockToggle = document.getElementById("blockToggle");
const homeBtn = document.getElementById("homeBtn");
const mypageBtn = document.getElementById("mypageBtn");
const blockManagerBtn = document.getElementById("blockManagerBtn");

// 初回ロード時にストレージから状態を取得してチェックボックス反映
chrome.runtime.sendMessage({ action: "getBlockEnabled" }, (response) => {
  blockToggle.checked = response.enabled;
});

// チェックボックス変更でON/OFFを切り替え
blockToggle.addEventListener("change", () => {
  chrome.runtime.sendMessage({
    action: "setBlockEnabled",
    enabled: blockToggle.checked
  });
});

homeBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://www.youtube.com/" });
});

mypageBtn.addEventListener("click", () => {
  // ライブラリを例にマイページ相当とする
  chrome.tabs.create({ url: "https://www.youtube.com/feed/library" });
});

blockManagerBtn.addEventListener("click", () => {
  // ブロック一覧管理ページを開く
  chrome.tabs.create({ url: chrome.runtime.getURL("blocked_channels.html") });
});
