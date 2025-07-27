// =================================================================
//                 recommend.js (最終動態版)
// =================================================================

const STATIC_JSON_URL = "https://member.gooday9527.com/data/recommendations_latest.json";

let isRecommendInitialized = false;
let recommendDataCache = {}; // 格式：{ 分類名稱: [...] }

export function initializeRecommendPage() {
    if (isRecommendInitialized) return;
    isRecommendInitialized = true;

    // 抓到所有帶 recommendSheet 的下拉（桌機 + 手機）
    const allSelects = document.querySelectorAll('#recommendSheet');
    if (allSelects.length === 0) {
        console.error("錯誤：在 recommend.html 中找不到任何 ID 為 'recommendSheet' 的下拉選單。");
        return;
    }

    // 🔄 一次性載入整份 JSON 資料，加時間戳避免快取問題
    fetch(`${STATIC_JSON_URL}?v=${Date.now()}`)
        .then(res => {
            if (!res.ok) throw new Error(`網路回應錯誤: ${res.status}`);
            return res.json();
        })
        .then(json => {
            recommendDataCache = json;
            const categories = Object.keys(json);

            //── 同時處理所有桌機＆手機版的 #recommendSheet 下拉
            allSelects.forEach(sel => {
              sel.innerHTML = '';
              categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                sel.appendChild(opt);
              });
              sel.disabled = false;

              // 綁定切換事件
              sel.addEventListener('change', () => {
                const v = sel.value;
                // 同步所有下拉的值
                allSelects.forEach(o => o.value = v);
                renderRecommendTable(recommendDataCache[v] || []);
              });
            });

            // 初始顯示第一組
            if (categories[0]) {
              allSelects.forEach(o => o.value = categories[0]);
              renderRecommendTable(recommendDataCache[categories[0]]);
            }
        })
        .catch(err => {
            console.error("推薦清單載入失敗", err);
            const tbody = document.querySelector('#recommendTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                  <tr>
                    <td colspan="100%" class="text-center p-4 text-danger">
                      推薦清單資料載入失敗，請檢查 JSON 檔案路徑是否正確。
                    </td>
                  </tr>`;
            }
            allSelects.forEach(sel => sel.disabled = true);
        });
}


function renderRecommendTable(data) {
  const tableElement = document.getElementById('recommendTable');
  const summaryElement = document.getElementById('summaryInfo');
  const mobileSummary = document.getElementById('summaryInfoMobile');

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
    if (mobileSummary)  mobileSummary.textContent  = `估計 0 元／0 家`;
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

      if (idx === 2) {
        const num = parseInt(value.toString().replace(/,/g, ""), 10);
        if (!isNaN(num)) totalAmount += num;
      }

      td.textContent = value;
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  // ➤ 顯示統計資訊
  const text = `估計 ${totalAmount.toLocaleString()} 元／${data.length} 家`;
  if (summaryElement) summaryElement.textContent = text;
  if (mobileSummary)  mobileSummary.textContent  = text;
}
