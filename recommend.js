// =================================================================
//                 recommend.js (最簡穩定版)
// =================================================================

// ✅ 我們不再使用自己的後端，回到最原始的公開 API
const OPENSHEET_URL = "https://opensheet.elk.sh/1WNSOI3l4AVk2h1kY0qj7xu4-9YdU_2fEj8xUf7lUSZk";

let isRecommendInitialized = false;
let categoriesList = []; // 用來存放分類

export function initializeRecommendPage() {
    if (isRecommendInitialized) return; 
    isRecommendInitialized = true;
    
    const selectElement = document.getElementById('recommendSheet');
    if (!selectElement) return;

    // 直接在這裡定義分類，不再從遠端讀取
    categoriesList = ["我全都要（不需證件）", "高cp推薦", "禮券類", "小資族", "入門組"];
    
    selectElement.innerHTML = '';
    categoriesList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });
    
    selectElement.disabled = false;
    selectElement.addEventListener('change', () => loadRecommendData(selectElement.value));
    
    if (categoriesList.length > 0) {
        loadRecommendData(categoriesList[0]);
    }
}

async function loadRecommendData(sheetName) {
    const tableElement = document.getElementById('recommendTable');
    if (!tableElement || !sheetName) return;
    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    const summaryInfoDiv = document.getElementById('summaryInfo'); // 獲取顯示總結資訊的 div

    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td colspan="100%" class="text-center p-4">資料載入中...</td></tr>`;
    summaryInfoDiv.innerHTML = '載入中...'; // 清空並顯示載入狀態

    try {
        const url = `${OPENSHEET_URL}/${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('無法從 opensheet.elk.sh 取得資料');
        
        const data = await response.json();
        
        // ✅ 新增：計算並顯示總結資訊
        let totalItems = 0;
        let totalCost = 0;
        let totalVoucherValue = 0;

        if (data && data.length > 0) {
            totalItems = data.length; // 第一欄總個數

            data.forEach(row => {
                // 假設第三欄的鍵名是 '股價' (請確保您的 opensheet 資料中此欄位名稱正確)
                // 檢查屬性是否存在且為有效數字
                if (row.hasOwnProperty('股價') && !isNaN(parseFloat(row.股價))) {
                    totalCost += parseFloat(row.股價);
                }

                // 假設第四欄的鍵名是 '備註' (請確保您的 opensheet 資料中此欄位名稱正確)
                if (row.hasOwnProperty('2025年') && typeof row.2025年 === 'string') {
                    const remark = row.2025年;
                    if (remark.includes('商品卡') || remark.includes('券') || remark.includes('王品')) {
                        // 嘗試從備註中提取數字 (例如: "商品卡100元" -> 100)
                        const match = remark.match(/(\d+)/);
                        if (match) {
                            totalVoucherValue += parseInt(match[1]);
                        }
                    }
                }
            });

            // 更新表格內容 (這部分邏輯不變，保持高效渲染)
            const headers = Object.keys(data[0]);
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
            
            const fragment = document.createDocumentFragment();
            data.forEach(rowData => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = rowData[header] || '';
                    tr.appendChild(td);
                });
                fragment.appendChild(tr);
            });
            tbody.appendChild(fragment);

            // 更新總結資訊
            summaryInfoDiv.innerHTML = `
                共(${totalItems})家，
                全買約(${totalCost.toLocaleString()})元，
                粗估發(${totalVoucherValue.toLocaleString()})元卡券
            `;

        } else {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
            summaryInfoDiv.innerHTML = '沒有可用的資料'; // 當沒有資料時顯示的總結狀態
        }
    } catch (error) {
        console.error('載入推薦資料時發生錯誤:', error);
        tbody.innerHTML = `<tr><td colspan="100%" class="text-danger text-center p-4">資料載入失敗，請確認試算表權限</td></tr>`;
        summaryInfoDiv.innerHTML = '資料載入失敗'; // 錯誤時顯示的總結狀態
    }
}
