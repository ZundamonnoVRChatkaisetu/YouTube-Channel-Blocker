document.addEventListener("DOMContentLoaded", () => {
    const blockedListContainer = document.getElementById("blockedList");
  
    function renderBlockedList() {
      blockedListContainer.innerHTML = "";
  
      chrome.runtime.sendMessage({ action: "getBlockedChannels" }, (response) => {
        const blockedChannels = response.blockedChannels || [];
  
        if (blockedChannels.length === 0) {
          blockedListContainer.innerHTML =
            "<p>現在ブロックしているチャンネルはありません。</p>";
        } else {
          blockedChannels.forEach((channel) => {
            // channel = { name, url, icon }
            const item = document.createElement("div");
            item.className = "channel-item";
  
            // アイコン表示
            const iconElem = document.createElement("img");
            iconElem.className = "channel-icon";
            iconElem.src =
              channel.icon ||
              "icon.jpg";
  
            iconElem.onerror = () => {
              iconElem.src =
                "icon.jpg";
            };
  
            // チャンネル名リンク
            const infoWrapper = document.createElement("div");
            infoWrapper.className = "channel-info";
  
            const nameLink = document.createElement("a");
            nameLink.className = "channel-name";
            nameLink.textContent = channel.name;
  
            if (channel.url && channel.url.startsWith("http")) {
              nameLink.href = channel.url;
              nameLink.target = "_blank";
              nameLink.rel = "noopener";
            } else {
              nameLink.href = "javascript:void(0)";
            }
  
            // ブロック解除ボタン
            const unblockButton = document.createElement("button");
            unblockButton.className = "btn-unblock";
            unblockButton.textContent = "ブロック解除";
            unblockButton.addEventListener("click", () => {
              chrome.runtime.sendMessage(
                { action: "removeBlockedChannel", channelName: channel.name },
                () => {
                  renderBlockedList();
                }
              );
            });
  
            infoWrapper.appendChild(nameLink);
            item.appendChild(iconElem);
            item.appendChild(infoWrapper);
            item.appendChild(unblockButton);
            blockedListContainer.appendChild(item);
          });
        }
      });
    }
  
    renderBlockedList();
  });
  