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
            
            // --- 這是修改的開始 ---
            result.data.forEach(item => {
                const announcementEl = document.createElement('div');
                announcementEl.className = 'alert alert-light';
                announcementEl.setAttribute('role', 'alert');
                
                // 1. 組合新的標題 (e.g., "臨時會 - 1463 強盛")
                const heading = `${item.標題} - ${item.股號} ${item.股名}`;
                
                // 2. 建立公告內文，動態加入有資料的欄位
                let body = '';

                // 優先顯示「預計發放的紀念品」
                if (item.預計發放的紀念品 && item.預計發放的紀念品.trim() !== '') {
                    body += `<p class="mb-1"><strong>紀念品：</strong> ${item.預計發放的紀念品}</p>`;
                }
                
                // 顯示「最後買進日」
                if (item.最後買進日 && item.最後買進日.trim() !== '') {
                    body += `<p class="mb-1"><strong>最後買進日：</strong> ${item.最後買進日}</p>`;
                }

                // 顯示「內容」 (例如 "暫停交易日")
                if (item.內容 && item.內容.trim() !== '') {
                    body += `<p class="mb-1"><strong>補充：</strong> ${item.內容}</p>`;
                }
                
                // 如果上面三個欄位都為空，才顯示預設訊息
                if (body === '') {
                    body = '<p class="mb-1"><em>(尚無詳細資訊)</em></p>';
                }

                // 3. 組合完整的 HTML
                announcementEl.innerHTML = `
                    <h4 class="alert-heading">${heading}</h4>
                    ${body}
                    <hr>
                    <p class="mb-0 text-end"><small>發布日期：${item.發布日期}</small></p>
                `;
                
                container.appendChild(announcementEl);
            });
            // --- 這是修改的結束 ---

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
