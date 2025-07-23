// =================================================================
//                 recommend.js (最終渲染優化版)
// =================================================================

const RECOMMEND_BACKEND_URL = "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec";

let isRecommendInitialized = false;

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


/**
 * ✅【核心優化】
 * 修改此函數，使用最高效的 DocumentFragment 方式來渲染表格，
 * 避免因一次性寫入大量 innerHTML 導致的瀏覽器卡頓。
 */
function loadRecommendData(sheetName) {
    const tableElement = document.getElementById('recommendTable');
    if (!tableElement || !sheetName) return;
    const thead = tableElement.querySelector('thead');
    const tbody = tableElement.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td colspan="100%" class="text-center p-4">資料載入中...</td></tr>`;

    const url = `${RECOMMEND_BACKEND_URL}?action=getRecommendations&sheetName=${encodeURIComponent(sheetName)}`;
    jsonpRequest(url, (error, result) => {
        if (error || result.status === 'error') {
            tbody.innerHTML = `<tr><td colspan="100%" class="text-danger text-center p-4">資料載入失敗</td></tr>`;
            return;
        }
        
        const data = result.data.data;
        
        // --- 渲染優化開始 ---
        thead.innerHTML = ''; 
        tbody.innerHTML = ''; 

        if (data && data.length > 0) {
            // 1. 建立表頭
            const headers = Object.keys(data[0]);
            const headerRow = document.createElement('tr');
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // 2. 建立一個「文件碎片」，這是一個輕量級的虛擬容器
            const fragment = document.createDocumentFragment();

            // 3. 遍歷所有資料，建立每一行(tr)和儲存格(td)，但先將它們全部加入到虛擬容器中
            data.forEach(rowData => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = rowData[header] || '';
                    tr.appendChild(td);
                });
                fragment.appendChild(tr);
            });

            // 4. 最後，將包含了所有新行列的虛擬容器，一次性地、高效地加入到真正的 tbody 中
            tbody.appendChild(fragment);

        } else {
            tbody.innerHTML = '<tr><td colspan="100%" class="text-center p-4">這個分類目前沒有資料</td></tr>';
        }
        // --- 渲染優化結束 ---
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
