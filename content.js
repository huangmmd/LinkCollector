// content.js
const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]*/gi; // 磁力链接正则表达式
const ed2kRegex = /ed2k:\/\/[^"]+/gi; // 匹配所有以 ed2k:// 开头的链接

// 创建刷新按钮
const refreshButton = document.createElement('button');
refreshButton.textContent = '刷新所有标签页';
refreshButton.style.position = 'fixed';
refreshButton.style.bottom = '10px';
refreshButton.style.right = '10px';
refreshButton.style.zIndex = '10000';
document.body.appendChild(refreshButton);

// 添加点击事件监听器
refreshButton.addEventListener('click', () => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id);
    });
  });
});

// 检测并发送磁力链接和ed2k链接
chrome.runtime.sendMessage({ type: "GET_ENABLED" }, (response) => {
  if (response.enabled) {
    const magnetLinks = document.body.innerHTML.match(magnetRegex) || [];
    const ed2kLinks = document.body.innerHTML.match(ed2kRegex) || [];

    // 清理ed2k链接，移除HTML标签和其他非链接内容
    const cleanedEd2kLinks = ed2kLinks.map(link => {
      return link.replace(/<[^>]+>/g, '').trim();
    });

    // 合并磁力链接和清理后的ed2k链接，并去重
    let allLinks = Array.from(new Set([...magnetLinks, ...cleanedEd2kLinks]));

    // 获取当前页面的标题作为备注
    const pageTitle = document.title;

    if (allLinks.length > 0) {
      // 对链接进行倒序排序
      allLinks.sort((a, b) => {
        return b.localeCompare(a); // 假设链接的顺序就是它们在页面中出现的顺序
      });

      chrome.runtime.sendMessage({ type: "SAVE_LINK", links: allLinks, pageTitle });
      chrome.runtime.sendMessage({ type: "UPDATE_IMAGE", image: "CAT2.png" }); // 发送更新图片的消息
    } else {
      chrome.runtime.sendMessage({ type: "UPDATE_IMAGE", image: "CAT.png" }); // 没有链接时保持原图
    }
  }
});