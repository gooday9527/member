// =================================================================
//                 recommend.js (最終動態版)
// =================================================================

const STATIC_JSON_URL = "https://member.gooday9527.com/data/recommendations_latest.json";

let isRecommendInitialized = false;
let recommendDataCache = {}; // 格式：{ 分類名稱: [...] }

export function initializeRecommendPage() {
    if (isRecommendInitialized) return; 
    isRecommendInitialized = true;

    const selectElement = document.getElementById('recommendSheet');
    if (!selectElement) {
        console.error("錯誤：在 recommend.html 中找不到 ID 為 'recommendSheet' 的下拉選單。");
        return;
    }

    // 🔄 一次性載入整份 JSON 資料
    // 加上時間戳來避免快取問題
    fetch(`${STATIC_JSON_URL}?v=${new Date().getTime()}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`網路回應錯誤: ${res.status}`);
            }
            return res.json();
        })
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
            const tableBody = document.querySelector('#recommendTable tbody');
            if(tableBody) {
                tableBody.innerHTML = '<tr><td colspan="100%" class="text-center p-4 text-danger">推薦清單資料載入失敗，請檢查 JSON 檔案路徑是否正確。</td></tr>';
            }
            selectElement.disabled = true;
        });
}


function renderRecommendTable(data) {
    const tableElement = document.getElementById('recommendTable');
    if (!tableElement) {
        console.error("錯誤：在 recommend.html 中找不到 ID 為 'recommendTable' 的表格。");
        return;
    }

    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
        return;
    }

    // 動態產生表頭
    const headers = Object.keys(data[0]);
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    // 動態產生表格內容
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

function renderRecommendTable(data) {
  const tbody = document.querySelector("#recommendTable tbody");
  tbody.innerHTML = "";

  let totalAmount = 0;

  data.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });

    // 第三欄是金額
    const amount = parseInt((row[2] || "").toString().replace(/,/g, ""), 10);
    if (!isNaN(amount)) totalAmount += amount;

    tbody.appendChild(tr);
  });

  // 更新統計區塊
  const summaryText = `估計 ${totalAmount.toLocaleString()} 元／${data.length} 家`;
  document.getElementById("summaryInfo").textContent = summaryText;
}
