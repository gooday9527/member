// =================================================================
//                 recommend.js (靜態 JSON 表格版)
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
            renderCategoriesAndTable(container, categories);
        } else {
            throw new Error("JSON 檔案中沒有任何分類資料。");
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">無法載入推薦清單。請確認 recommendations_latest.json 檔案是否存在且格式正確。</div>`;
        console.error("載入靜態 JSON 失敗:", error);
    }
}

/**
 * 步驟二：將分類渲染成按鈕，並建立表格骨架
 * @param {HTMLElement} container - 頁面容器
 * @param {Array<string>} categories - 分類名稱陣列
 */
function renderCategoriesAndTable(container, categories) {
    // ✅【修改】建立包含表格結構的 HTML
    container.innerHTML = `
        <h2 class="mb-4 text-center">推薦清單</h2>
        <div id="recommend-categories" class="text-center mb-4">
            ${categories.map(cat => `<button class="btn btn-outline-primary m-1" data-category="${cat}">${cat}</button>`).join('')}
        </div>
        <div id="recommend-content" class="table-responsive">
            <table class="table table-striped table-hover align-middle">
                <thead>
                    <tr>
                        <th>圖片</th>
                        <th>股號</th>
                        <th>股名</th>
                        <th>品名</th>
                        <th>最後買進日</th>
                        <th>股東會</th>
                    </tr>
                </thead>
                <tbody id="recommend-table-body">
                    <!-- 表格內容將會動態插入這裡 -->
                </tbody>
            </table>
        </div>
    `;

    const categoryButtons = container.querySelectorAll('#recommend-categories button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const categoryName = button.dataset.category;
            // 直接從已載入的資料中取得項目並渲染
            const items = allRecommendationsData[categoryName] || [];
            renderTableRows(document.getElementById('recommend-table-body'), items);
        });
    });

    // 預設自動點擊第一個分類按鈕，載入初始內容
    if (categoryButtons.length > 0) {
        categoryButtons[0].click();
    }
}

/**
 * 步驟三：將指定分類的項目渲染成表格的列 (rows)
 * @param {HTMLElement} tableBody - 表格的 tbody 元素
 * @param {Array<Object>} items - 項目資料陣列
 */
function renderTableRows(tableBody, items) {
    if (!tableBody) return;

    if (!items || items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">這個分類目前沒有推薦項目。</td></tr>`;
        return;
    }

    // ✅【修改】將資料轉換成表格的 <tr> 結構
    tableBody.innerHTML = items.map(item => `
        <tr>
            <td>
                <img src="${item['圖片'] || 'https://placehold.co/120x80/EFEFEF/AAAAAA?text=No+Image'}" class="img-fluid rounded" alt="${item['股名']}" style="max-width: 120px; object-fit: cover;">
            </td>
            <td>${item['股號'] || ''}</td>
            <td><strong>${item['股名'] || ''}</strong></td>
            <td>${item['品名'] || '詳情未定'}</td>
            <td>${item['最後買進日'] || 'N/A'}</td>
            <td>${item['股東會'] || 'N/A'}</td>
        </tr>
    `).join('');
}
