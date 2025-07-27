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
  const summaryElement = document.getElementById('summaryInfo');

  if (!tableElement) {
    console.error("錯誤：找不到 #recommendTable");
    return;
  }

  const thead = tableElement.querySelector('thead');
  const tbody = tableElement.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
    if (summaryElement) summaryElement.textContent = `估計 0 元／0 家`;
    return;
  }

  // ➤ 取得表頭
  const headers = Object.keys(data[0]);
  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

  // ➤ 統計總金額（假設第 3 欄為金額）
  let totalAmount = 0;

  const fragment = document.createDocumentFragment();
  data.forEach(row => {
    const tr = document.createElement("tr");

    headers.forEach((key, idx) => {
      const td = document.createElement("td");
      const value = row[key] || '';

      // 統計第 3 欄金額（index 2）
      if (idx === 2) {
        const amount = parseInt(value.toString().replace(/,/g, ""), 10);
        if (!isNaN(amount)) totalAmount += amount;
      }

      td.textContent = value;
      tr.appendChild(td);
    });

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  // ➤ 顯示統計資訊
  if (summaryElement) {
    summaryElement.textContent = `估計 ${totalAmount.toLocaleString()} 元／${data.length} 家`;
  }
}
