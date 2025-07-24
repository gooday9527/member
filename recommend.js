const OPENSHEET_URL = "https://opensheet.elk.sh/1WNSOI3l4AVk2h1kY0qj7xu4-9YdU_2fEj8xUf7lUSZk";

let isRecommendInitialized = false;
let categoriesList = ["我全都要（不需證件）", "高cp推薦", "禮券類", "小資族", "入門組"];
let recommendDataCache = {}; // ⏱️ 全部分類快取

export function initializeRecommendPage() {
    if (isRecommendInitialized) return; 
    isRecommendInitialized = true;

    const selectElement = document.getElementById('recommendSheet');
    if (!selectElement) return;

    // 填入下拉選單
    selectElement.innerHTML = '';
    categoriesList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });
    selectElement.disabled = false;

    selectElement.addEventListener('change', () => {
        const selected = selectElement.value;
        if (recommendDataCache[selected]) {
            renderRecommendTable(recommendDataCache[selected]);
        } else {
            loadAndCacheRecommendData(selected);
        }
    });

    // 🔄 初始化時一次載入全部分類
    Promise.all(categoriesList.map(loadAndCacheRecommendData)).then(() => {
        if (categoriesList[0]) {
            renderRecommendTable(recommendDataCache[categoriesList[0]]);
            selectElement.value = categoriesList[0];
        }
    });
}

async function loadAndCacheRecommendData(sheetName) {
    if (!sheetName || recommendDataCache[sheetName]) return;
    try {
        const url = `${OPENSHEET_URL}/${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`取得 ${sheetName} 資料失敗`);
        const data = await response.json();
        recommendDataCache[sheetName] = data;
    } catch (error) {
        console.error(`載入 ${sheetName} 推薦資料失敗：`, error);
        recommendDataCache[sheetName] = []; // 空值避免再 fetch
    }
}

function renderRecommendTable(data) {
    const tableElement = document.getElementById('recommendTable');
    if (!tableElement) return;

    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
        return;
    }

    const headers = Object.keys(data[0]);
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    const fragment = document.createDocumentFragment();
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h] || '';
            tr.appendChild(td);
        });
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
}
