// announcement.js
import { APP_URLS } from './app.js'; 

async function loadAnnouncements() {
    const container = document.getElementById('announcement-list');
    if (!container) return;

    try {
        const response = await fetch(`${APP_URLS.main}?view=getAnnouncements`);
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            container.innerHTML = ''; 
            result.data.forEach(item => {
                const announcementEl = document.createElement('div');
                announcementEl.className = 'alert alert-light';
                announcementEl.setAttribute('role', 'alert');
                announcementEl.innerHTML = `
                    <h4 class="alert-heading">${item.標題}</h4>
                    <p>${item.內容}</p>
                    <hr>
                    <p class="mb-0 text-end"><small>發布日期：${item.發布日期}</small></p>
                `;
                container.appendChild(announcementEl);
            });
        } else {
            container.innerHTML = '<p class="text-center">目前沒有可顯示的公告。</p>';
        }
    } catch (error) {
        console.error('無法載入公告:', error);
        container.innerHTML = '<p class="text-center text-danger">公告載入失敗，請稍後再試。</p>';
    }
}

// 頁面載入時自動執行
loadAnnouncements();
