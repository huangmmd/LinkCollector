document.addEventListener("DOMContentLoaded", () => {
  // 获取并设置插件状态
  chrome.storage.local.get(["enabled", "links"], (data) => {
    const toggleSwitch = document.getElementById("toggle-switch");
    if (data.enabled) {
      toggleSwitch.classList.add("on"); // 如果插件已启用，添加 "on" 类
    }

    // 初始化悬浮页中的图片
    const catImage = document.getElementById("cat-image");
    if (data.links && data.links.length > 0) {
      catImage.src = "icons/CAT2.png"; // 如果有链接，显示 CAT2.png
    } else {
      catImage.src = "icons/CAT.png"; // 如果没有链接，显示 CAT.png
    }

    // 显示所有链接
    const links = data.links || [];
    const linkList = document.getElementById("link-list");

    // 对链接数组进行倒序排列
    const sortedLinks = links.slice().reverse();

    // 初始显示最多5条链接
    const visibleLinks = sortedLinks.slice(0, 5);
    const hiddenLinks = sortedLinks.slice(5);

    // 显示链接
    const MAX_LENGTH = 50; // 最大显示长度
    const truncate = (text, maxLength) => {
      if (text.length > maxLength) {
        return text.slice(0, maxLength) + "...";
      }
      return text;
    };

    const displayLinks = (links) => {
      linkList.innerHTML = "";
      links.forEach((link) => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${link.id}`;

        const linkInfo = document.createElement("div");
        linkInfo.className = "link-info";

        const linkText = document.createElement("span");
        linkText.className = "link";
        linkText.textContent = `${link.id}. ${truncate(link.link, MAX_LENGTH)}`;
        linkText.title = link.link; // 添加鼠标悬停时显示完整链接的提示
        linkInfo.appendChild(linkText);

        const sourceText = document.createElement("span");
        sourceText.className = "source";
        sourceText.textContent = `来源: ${truncate(link.pageTitle, MAX_LENGTH)}`;
        sourceText.title = link.pageTitle; // 添加鼠标悬停时显示完整链接的提示
        linkInfo.appendChild(sourceText);

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.appendChild(linkInfo);

        li.appendChild(checkbox);
        li.appendChild(label);
        linkList.appendChild(li);
      });
    };

    displayLinks(visibleLinks);

    // 更新链接数量统计
    const linkCountNumber = document.getElementById("link-count-number");
    linkCountNumber.textContent = links.length;

    // 如果有隐藏的链接，显示“展开”按钮
    const expandButton = document.getElementById("expand-button");
    if (hiddenLinks.length > 0) {
      expandButton.style.display = "inline-block";
    }

    // 展开/收起按钮点击事件
    let isExpanded = false; // 用于跟踪当前是否已展开
    expandButton.addEventListener("click", () => {
      if (!isExpanded) {
        // 展开所有链接
        displayLinks(sortedLinks);
        expandButton.textContent = "收起"; // 更改按钮文本
      } else {
        // 收起多余链接
        displayLinks(visibleLinks);
        expandButton.textContent = "展开"; // 更改按钮文本
      }
      isExpanded = !isExpanded; // 切换
    });

    // 去除重复按钮点击事件
    const removeDuplicatesButton = document.getElementById("remove-duplicates-button");
    removeDuplicatesButton.addEventListener("click", () => {
      const uniqueLinks = Array.from(new Set(links.map(link => link.link))).map((link, index) => ({
        id: index + 1,
        link,
        pageTitle: links.find(l => l.link === link).pageTitle // 保留来源网页的标题
      }));
      chrome.storage.local.set({ links: uniqueLinks }, () => {
        // 重新加载链接
        displayLinks(uniqueLinks.slice().reverse());
        linkCountNumber.textContent = uniqueLinks.length; // 更新链接数量统计
      });
    });

    // 复制按钮点击事件
    const copyButton = document.getElementById("copy-button");
    copyButton.addEventListener("click", () => {
      const allLinksText = links.map(link => link.link).join("\n");
      const textarea = document.createElement("textarea");
      textarea.value = allLinksText;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        const message = document.getElementById("message");
        message.style.display = "block";
        setTimeout(() => {
          message.style.display = "none";
        }, 3000);
      } catch (err) {
        console.error("复制失败:", err);
      }
      document.body.removeChild(textarea);
    });

    // 清除全部按钮点击事件
    const clearAllButton = document.getElementById("clear-all-button");
    clearAllButton.addEventListener("click", () => {
      chrome.storage.local.set({ links: [] }, () => {
        linkList.innerHTML = "";
        catImage.src = "icons/CAT.png";
        linkCountNumber.textContent = 0; // 清除链接后，将链接数量设置为0
      });
    });

    // 添加链接按钮点击事件
    const addLinkButton = document.getElementById("add-link-button");
    addLinkButton.addEventListener("click", () => {
      const userInput = prompt("给猫咪新的小鱼干", "");
      if (userInput !== null) { // 用户点击了“确定”
        const newLink = {
          id: links.length + 1,
          link: userInput,
          pageTitle: "手动添加" // 默认来源信息
        };
        const updatedLinks = links.concat([newLink]);
        chrome.storage.local.set({ links: updatedLinks }, () => {
          // 在页面上显示新链接
          displayLinks(updatedLinks.slice().reverse());
          // 更新图片
          catImage.src = "icons/CAT2.png"; // 如果有链接，显示 CAT2.png
          // 更新链接数量统计
          linkCountNumber.textContent = updatedLinks.length;
        });
      }
    });

    // 删除选中链接按钮
    const deleteSelectedButton = document.createElement("button");
    deleteSelectedButton.id = "delete-selected-button";
    deleteSelectedButton.textContent = "删除选中";
    deleteSelectedButton.className = "button";
    deleteSelectedButton.style.display = "none";
    deleteSelectedButton.style.marginTop = "10px";
    deleteSelectedButton.style.backgroundColor = "#333";
    deleteSelectedButton.style.color = "white";
    document.querySelector(".button-container").appendChild(deleteSelectedButton);

    // 删除选中链接按钮点击事件
    deleteSelectedButton.addEventListener("click", () => {
      const selectedIds = Array.from(linkList.querySelectorAll("input[type=checkbox]:checked"))
        .map(checkbox => parseInt(checkbox.id.split("-")[1]));
      const updatedLinks = links.filter(link => !selectedIds.includes(link.id));
      chrome.storage.local.set({ links: updatedLinks }, () => {
        displayLinks(updatedLinks.slice().reverse());
        deleteSelectedButton.style.display = "none";
        linkCountNumber.textContent = updatedLinks.length;
      });
    });

    // 监听复选框的选中状态变化
    linkList.addEventListener("change", () => {
      const selectedCheckboxes = linkList.querySelectorAll("input[type=checkbox]:checked");
      if (selectedCheckboxes.length > 0) {
        deleteSelectedButton.style.display = "inline-block";
      } else {
        deleteSelectedButton.style.display = "none";
      }
    });

    // 添加“监测当前页”按钮
    const monitorButton = document.createElement("button");
    monitorButton.id = "monitor-button";
    monitorButton.textContent = "监测当前页";
    monitorButton.className = "button";
    monitorButton.style.marginTop = "10px";
    monitorButton.style.backgroundColor = "#333";
    monitorButton.style.color = "white";
    document.querySelector(".button-container").appendChild(monitorButton);

    // 监测当前页按钮点击事件
    monitorButton.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                const currentTitle = currentTab.title;

                chrome.storage.local.get(["links"], (data) => {
                    const links = data.links || [];
                    const updatedLinks = links.filter(link => link.pageTitle !== currentTitle);

                    chrome.storage.local.set({ links: updatedLinks }, () => {
                        displayLinks(updatedLinks.slice().reverse());
                        linkCountNumber.textContent = updatedLinks.length;
                    });
                });
            }
        });
    });

    // 搜索功能
    const searchInput = document.getElementById("search-input");
    searchInput.placeholder = "让我找找是哪条小鱼干？"; // 修改占位符文本
    searchInput.style.width = "50%"; // 修改搜索框宽度为原来的一半
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase();
      if (searchTerm === "") {
        // 如果搜索框为空，不选择任何链接
        linkList.querySelectorAll("input[type=checkbox]").forEach(checkbox => {
          checkbox.checked = false;
        });
        displayLinks(sortedLinks.slice(0, 5)); // 显示前5条链接
        deleteSelectedButton.style.display = "none"; // 隐藏删除选中按钮
      } else {
        const filteredLinks = links.filter(link => link.link.toLowerCase().includes(searchTerm) || link.pageTitle.toLowerCase().includes(searchTerm));
        displayLinks(filteredLinks.slice().reverse());
        // 勾选匹配的链接
        filteredLinks.forEach(link => {
          const checkbox = document.getElementById(`checkbox-${link.id}`);
          if (checkbox) checkbox.checked = true;
        });
        // 检查是否显示删除选中按钮
        const selectedCheckboxes = linkList.querySelectorAll("input[type=checkbox]:checked");
        if (selectedCheckboxes.length > 0) {
          deleteSelectedButton.style.display = "inline-block";
        } else {
          deleteSelectedButton.style.display = "none";
        }
      }
    });

    // 监听悬浮页关闭事件，清空搜索框并取消勾选
    window.addEventListener("beforeunload", () => {
      searchInput.value = ""; // 清空搜索框
      linkList.querySelectorAll("input[type=checkbox]").forEach(checkbox => {
        checkbox.checked = false; // 取消勾选
      });
      deleteSelectedButton.style.display = "none"; // 隐藏删除选中按钮
    });
  });

  // 监听拨动按钮的点击事件，切换插件状态
  document.getElementById("toggle-switch").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TOGGLE" }, (response) => {
      if (response && response.enabled !== undefined) {
        const toggleSwitch = document.getElementById("toggle-switch");
        if (response.enabled) {
          toggleSwitch.classList.add("on");
        } else {
          toggleSwitch.classList.remove("on");
        }
      } else {
        console.error("Invalid response from background script:", response);
      }
    });
  });

  // 监听消息以更新图片
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_IMAGE") {
      const catImage = document.getElementById("cat-image");
      catImage.src = `icons/${message.image}`;
    }
  });

  function refreshAllTabs() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.reload(tab.id);
        });
    });
}

  document.getElementById('cat-image').addEventListener('click', () => { // 修改事件绑定方式
    refreshAllTabs();
});

  // 添加对浏览器标签页打开事件的监听
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // 页面加载完成时执行获取链接的逻辑
        collectLinks(tabId);
    }
});

chrome.tabs.onCreated.addListener((tab) => {
    // 新标签页创建时执行获取链接的逻辑
    chrome.tabs.onUpdated.addListener((newTabId, newChangeInfo, newTab) => {
        if (newTabId === tab.id && newChangeInfo.status === 'complete') {
            collectLinks(newTabId);
        }
    });
});

// 添加 collectLinks 函数
function collectLinks(tabId) {
    chrome.tabs.executeScript(tabId, {
        code: `
            (function() {
                const links = Array.from(document.querySelectorAll('a'), a => a.href);
                return links;
            })();
        `
    }, (results) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        if (results && results.length > 0) {
            const newLinks = results[0].map((link, index) => ({
                id: Date.now() + index, // 使用时间戳和索引生成唯一ID
                link,
                pageTitle: document.title
            }));

            chrome.storage.local.get(["links"], (data) => {
                const existingLinks = data.links || [];
                const updatedLinks = [...existingLinks, ...newLinks];

                chrome.storage.local.set({ links: updatedLinks }, () => {
                    // 更新悬浮页中的链接列表
                    chrome.runtime.sendMessage({ type: "UPDATE_LINKS" });
                });
            });
        }
    });
}
});