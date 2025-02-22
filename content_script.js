/********************************************
 * DOM変更を監視 → チャンネルブロック処理 & サイドメニューにメニュー挿入
 ********************************************/
const observer = new MutationObserver(() => {
  // ブロック機能がONの時だけ処理する
  chrome.runtime.sendMessage({ action: "getBlockEnabled" }, (response) => {
    if (response.enabled) {
      processChannelsAndButtons();
      ensureBlockMenuItem();
    } else {
      // OFFの場合はサイドメニューのみ再挿入しておく
      ensureBlockMenuItem();
    }
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });

/********************************************
 * 1) チャンネル要素にブロックボタンを1つだけ挿入
 * 2) ブロック済みチャンネルは非表示
 ********************************************/
function processChannelsAndButtons() {
  const channelAnchors = document.querySelectorAll(`
    #channel-name a.yt-simple-endpoint[href*="/channel/"],
    #channel-name a.yt-simple-endpoint[href*="/@"],
    ytd-channel-name a.yt-simple-endpoint[href*="/channel/"],
    ytd-channel-name a.yt-simple-endpoint[href*="/@"]
  `);

  if (!channelAnchors.length) return;

  // ブロックリストを取得し、既にブロックしているものは非表示
  chrome.runtime.sendMessage({ action: "getBlockedChannels" }, (response) => {
    const blockedChannels = response.blockedChannels || [];

    channelAnchors.forEach((anchor) => {
      const channelName = anchor.textContent.trim();
      if (!channelName) return;

      // リンクURLを絶対URLに整形
      let channelUrl = anchor.href;
      if (channelUrl.startsWith("/")) {
        channelUrl = "https://www.youtube.com" + channelUrl;
      }
      if (!channelUrl.startsWith("http")) {
        channelUrl = "https://www.youtube.com" + channelUrl;
      }

      // チャンネルアイコンを探す
      let channelIcon = null;
      const candidateParent = anchor.closest(
        "ytd-channel-renderer, ytd-video-owner-renderer, ytd-video-renderer, ytd-grid-channel-renderer, ytd-grid-video-renderer"
      );
      if (candidateParent) {
        const possibleImg = candidateParent.querySelector("img#img");
        if (possibleImg && possibleImg.src) {
          channelIcon = possibleImg.src;
        }
      }

      // すでにボタンを付けた要素はスキップ
      if (anchor.dataset.blockButtonAdded === "true") return;

      // ボタン挿入
      insertBlockButton(anchor, { channelName, channelUrl, channelIcon });
      anchor.dataset.blockButtonAdded = "true";

      // 既にブロックされているなら非表示
      if (blockedChannels.some((b) => b.name === channelName)) {
        hideChannel(anchor);
      }
    });
  });
}

/********************************************
 * ブロックボタンの挿入処理
 ********************************************/
function insertBlockButton(channelAnchor, { channelName, channelUrl, channelIcon }) {
  const blockButton = document.createElement("button");
  blockButton.innerText = "ブロック";
  blockButton.style.marginLeft = "8px";

  blockButton.onclick = () => {
    chrome.runtime.sendMessage({
      action: "addBlockedChannel",
      channelData: { name: channelName, url: channelUrl, icon: channelIcon }
    });
    hideChannel(channelAnchor);
  };

  const wrap = document.createElement("span");
  wrap.className = "my-block-button-wrap";

  if (channelAnchor.parentNode) {
    channelAnchor.parentNode.insertBefore(wrap, channelAnchor.nextSibling);
    wrap.appendChild(blockButton);
  }
}

/********************************************
 * ブロック済みチャンネルを非表示
 ********************************************/
function hideChannel(channelAnchor) {
  const closestItem = channelAnchor.closest(
    "ytd-video-renderer, ytd-grid-video-renderer, ytd-channel-renderer, ytd-search, ytd-expanded-shelf-contents-renderer"
  );
  if (closestItem) {
    closestItem.style.display = "none";
  } else {
    channelAnchor.style.display = "none";
  }
}

/********************************************
 * サイドメニューに「ブロック管理」を挿入
 ********************************************/
function ensureBlockMenuItem() {
  const possibleSelectors = [
    "tp-yt-app-drawer #guide-content",
    "tp-yt-app-drawer #sections",
    "tp-yt-app-drawer #items",
    "ytd-guide-renderer #sections",
    "ytd-guide-renderer #items",
    "ytd-mini-guide-renderer #items",
    "#guide-inner-content #items",
    "ytd-app #guide-content"
  ];

  let guideContainer = null;
  for (const sel of possibleSelectors) {
    guideContainer = document.querySelector(sel);
    if (guideContainer) break;
  }
  if (!guideContainer) return;

  const existing = document.getElementById("my-block-menu-item");
  if (existing && guideContainer.contains(existing)) {
    return;
  } else if (existing && !guideContainer.contains(existing)) {
    guideContainer.appendChild(existing);
    return;
  }

  // 拡張機能のアイコンURLを取得
  const iconURL = chrome.runtime.getURL("icon.jpg");

  const template = document.createElement("div");
  template.innerHTML = `
<ytd-mini-guide-entry-renderer
  id="my-block-menu-item"
  class="style-scope ytd-mini-guide-renderer"
  system-icons=""
  role="tab"
  tabindex="0"
  aria-selected="false"
  aria-label="ブロック管理">
  <a
    id="endpoint"
    tabindex="-1"
    class="yt-simple-endpoint style-scope ytd-mini-guide-entry-renderer"
    title="ブロック管理"
    href="javascript:void(0)">
    <yt-icon
      id="icon"
      class="guide-icon style-scope ytd-mini-guide-entry-renderer">
      <span class="yt-icon-shape style-scope yt-icon yt-spec-icon-shape">
        <div style="width: 100%; height: 100%; display: block;">
          <img src="${iconURL}" style="width:100%; height:100%; object-fit:contain;">
        </div>
      </span>
    </yt-icon>
    <span class="title style-scope ytd-mini-guide-entry-renderer">ブロック管理</span>
    <tp-yt-paper-tooltip
      animation-delay="0"
      offset="4"
      position="right"
      class="style-scope ytd-mini-guide-entry-renderer"
      role="tooltip"
      tabindex="-1"
      aria-label="tooltip"
      hidden=""
      style="--paper-tooltip-delay-in: 0ms;">
      <div id="tooltip" class="hidden style-scope tp-yt-paper-tooltip" style-target="tooltip">
        ブロック管理
      </div>
    </tp-yt-paper-tooltip>
    <yt-interaction class="style-scope ytd-mini-guide-entry-renderer">
      <div class="stroke style-scope yt-interaction"></div>
      <div class="fill style-scope yt-interaction"></div>
    </yt-interaction>
  </a>
</ytd-mini-guide-entry-renderer>
  `.trim();

  const newEntry = template.firstElementChild;
  const anchor = newEntry.querySelector("#endpoint");
  if (anchor) {
    anchor.addEventListener("click", () => {
      window.open(chrome.runtime.getURL("blocked_channels.html"), "_blank");
    });
  }
  guideContainer.appendChild(newEntry);
}
