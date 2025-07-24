const STATIC_JSON_URL = "https://member.gooday9527.com/data/recommendations.json";

let isRecommendInitialized = false;
let recommendDataCache = {}; // 格式：{ 分類名稱: [...] }

export function initializeRecommendPage() {
    if (isRecommendInitialized) return; 
    isRecommendInitialized = true;

    const selectElement = document.getElementById('recommendSheet');
    if (!selectElement) return;

    // 🔄 一次性載入整份 JSON 資料
    fetch(STATIC_JSON_URL)
        .then(res => res.json())
        .then(json => {
            recommendDataCache = json;
            const categories = Object.keys(json);

            // 填入下拉選單
            selectElement.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                selectElement.appendChild(option);
            });
            selectElement.disabled = false;

            // 初始顯示第一組
            if (categories[0]) {
                selectElement.value = categories[0];
                renderRecommendTable(json[categories[0]]);
            }

            // 下拉選單切換時
            selectElement.addEventListener('change', () => {
                const selected = selectElement.value;
                renderRecommendTable(recommendDataCache[selected] || []);
            });
        })
        .catch(err => {
            console.error("推薦清單載入失敗", err);
            selectElement.disabled = true;
        });
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
