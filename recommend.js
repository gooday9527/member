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
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td colspan="100%" class="text-center p-4">資料載入中...</td></tr>`;

    try {
        const url = `${OPENSHEET_URL}/${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('無法從 opensheet.elk.sh 取得資料');
        
        const data = await response.json();
        
        tbody.innerHTML = ''; 
        if (data && data.length > 0) {
            const headers = Object.keys(data[0]);
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
            
            // 使用最高效的渲染方式
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

        } else {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
        }
    } catch (error) {
        console.error('載入推薦資料時發生錯誤:', error);
        tbody.innerHTML = `<tr><td colspan="100%" class="text-danger text-center p-4">資料載入失敗，請確認試算表權限</td></tr>`;
    }
}
