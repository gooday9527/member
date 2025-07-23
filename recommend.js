// =================================================================
//                 recommend.js (推薦清單的獨立程式)
// =================================================================

// ✅【請填寫這裡】請將引號內的文字，換成您「推薦清單後端」的部署網址
const RECOMMEND_BACKEND_URL = "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec";

let isRecommendInitialized = false;

// ✅ 將初始化函數匯出，讓 app.js 可以呼叫
export function initializeRecommendPage() {
    if (isRecommendInitialized) return; 
    isRecommendInitialized = true;
    
    const selectElement = document.getElementById('recommendSheet');
    if (!selectElement) return;
    selectElement.disabled = true;
    selectElement.innerHTML = '<option>分類載入中...</option>';

    const url = `${RECOMMEND_BACKEND_URL}?action=getRecommendationCategories`;
    jsonpRequest(url, (error, result) => {
        if (error || result.status === 'error') {
            console.error('載入分類時發生錯誤:', error || result.data.message);
            selectElement.innerHTML = `<option>分類載入失敗</option>`;
            return;
        }
        const categories = result.data.categories;
        selectElement.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
        selectElement.addEventListener('change', () => loadRecommendData(selectElement.value));
        if (categories.length > 0) {
            loadRecommendData(categories[0]);
        }
    });
}

function loadRecommendData(sheetName) {
    const table = document.getElementById('recommendTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = `<tr><td colspan="100%" class="text-center p-4">資料載入中...</td></tr>`;
    const url = `${RECOMMEND_BACKEND_URL}?action=getRecommendations&sheetName=${encodeURIComponent(sheetName)}`;
    jsonpRequest(url, (error, result) => {
        const thead = table.querySelector('thead');
        if (error || result.status === 'error') {
            tbody.innerHTML = `<tr><td colspan="100%" class="text-danger text-center p-4">資料載入失敗</td></tr>`;
            return;
        }
        const data = result.data.data;
        tbody.innerHTML = '';
        if (data && data.length > 0) {
            const headers = Object.keys(data[0]);
            thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
            tbody.innerHTML = data.map(row => `<tr>${headers.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>`).join('');
        } else {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
        }
    });
}

function jsonpRequest(url, callback) {
    const name = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[name] = data => {
        delete window[name];
        document.body.removeChild(script);
        callback(null, data);
    };
    const script = document.createElement('script');
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + name;
    script.onerror = () => {
        delete window[name];
        document.body.removeChild(script);
        callback(new Error('JSONP failed'));
    };
    document.body.appendChild(script);
}
