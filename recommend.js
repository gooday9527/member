// =================================================================
//                 recommend.js (靜態 JSON 版)
// =================================================================

// ✅ 指向您手動產生的靜態 JSON 檔案路徑
const STATIC_JSON_URL = '/recommendations_latest.json'; 

// 儲存從 JSON 檔案載入的所有推薦資料
let allRecommendationsData = null;

/**
 * 這是由 app.js 呼叫的主函數，負責啟動整個推薦清單頁面
 */
export function initializeRecommendPage() {
    const container = document.getElementById('page-recommend');
    if (!container) {
        console.error("錯誤：在 index.html 中找不到 ID 為 'page-recommend' 的容器。");
        return;
    }
    // 整個流程的第一步：載入靜態 JSON 檔案
    loadStaticData(container);
}

/**
 * 步驟一：從伺服器載入靜態的 JSON 檔案
 * @param {HTMLElement} container - 頁面容器
 */
async function loadStaticData(container) {
    container.innerHTML = `
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">載入分類中...</span>
            </div>
        </div>`;

    try {
        // 加上時間戳避免瀏覽器快取舊的 JSON 檔案
        const response = await fetch(`${STATIC_JSON_URL}?v=${new Date().getTime()}`); 
        if (!response.ok) {
            throw new Error(`無法載入推薦資料檔案: ${response.statusText}`);
        }
        allRecommendationsData = await response.json();
        
        const categories = Object.keys(allRecommendationsData);
        if (categories.length > 0) {
            renderCategories(container, categories);
        } else {
            throw new Error("JSON 檔案中沒有任何分類資料。");
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">無法載入推薦清單。請確認 recommendations_latest.json 檔案是否存在且格式正確。</div>`;
        console.error("載入靜態 JSON 失敗:", error);
    }
}

/**
 * 步驟二：將分類渲染成按鈕
 * @param {HTMLElement} container - 頁面容器
 * @param {Array<string>} categories - 分類名稱陣列
 */
function renderCategories(container, categories) {
    container.innerHTML = `
        <h2 class="mb-4 text-center">推薦清單</h2>
        <div id="recommend-categories" class="text-center mb-4">
            ${categories.map(cat => `<button class="btn btn-outline-primary m-1" data-category="${cat}">${cat}</button>`).join('')}
        </div>
        <div id="recommend-content" class="row g-4"></div>
    `;

    const categoryButtons = container.querySelectorAll('#recommend-categories button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const categoryName = button.dataset.category;
            // 直接從已載入的資料中取得項目並渲染，不再發送網路請求
            const items = allRecommendationsData[categoryName] || [];
            renderRecommendations(document.getElementById('recommend-content'), items);
        });
    });

    // 預設自動點擊第一個分類按鈕，載入初始內容
    if (categoryButtons.length > 0) {
        categoryButtons[0].click();
    }
}

/**
 * 步驟三：將指定分類的項目渲染成卡片
 * @param {HTMLElement} contentArea - 內容顯示區
 * @param {Array<Object>} items - 項目資料陣列
 */
function renderRecommendations(contentArea, items) {
    if (!contentArea) return;

    if (!items || items.length === 0) {
        contentArea.innerHTML = `<div class="col-12"><div class="alert alert-info">這個分類目前沒有推薦項目。</div></div>`;
        return;
    }

    // 注意：下面的 item['圖片'], item['股名'] 等，是您試算表中的「欄位標題」，如果您的標題不同，請修改這裡
    contentArea.innerHTML = items.map(item => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm">
                <img src="${item['圖片'] || 'https://placehold.co/600x400/EFEFEF/AAAAAA?text=No+Image'}" class="card-img-top" alt="${item['股名']}" style="aspect-ratio: 16/10; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${item['股名'] || ''} (${item['股號'] || ''})</h5>
                    <p class="card-text">${item['品名'] || '詳情未定'}</p>
                </div>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>最後買進:</strong> ${item['最後買進日'] || 'N/A'}</li>
                    <li class="list-group-item"><strong>股東會:</strong> ${item['股東會'] || 'N/A'}</li>
                </ul>
            </div>
        </div>
    `).join('');
}
