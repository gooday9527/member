// =================================================================
//                  souvenir.js (最終穩定版 - 已修正事件綁定)
// =================================================================

// 狀態變數
let rawData = [], filteredData = [], currentPage = 1, rowsPerPage = 10;
let sortKey = "股號", sortAsc = true;
let headers = [];
let isDataFetched = false; // 用來標記資料是否已獲取

/**
 * 綁定控制項的事件監聽
 */
function bindControlEvents() {
    // 使用 querySelectorAll 來同時綁定桌機和手機版的控制項
    document.querySelectorAll('#rowsPerPageSelectDesktop, #rowsPerPageSelectMobile').forEach(select => {
        select.addEventListener('change', (e) => {
            rowsPerPage = parseInt(e.target.value);
            currentPage = 1;
            // 同步另一個下拉選單的值
            document.querySelectorAll('#rowsPerPageSelectDesktop, #rowsPerPageSelectMobile').forEach(s => s.value = e.target.value);
            renderTable();
        });
    });

    document.querySelectorAll('#searchInputDesktop, #searchInputMobile').forEach(input => {
        input.addEventListener('input', (e) => {
            currentPage = 1;
            // 同步另一個搜尋框的值
            document.querySelectorAll('#searchInputDesktop, #searchInputMobile').forEach(i => i.value = e.target.value);
            filterData(e.target.value);
            renderTable();
        });
    });
}

/**
 * ✅ 主要函數，匯出給 app.js 呼叫
 */
export function initializeSouvenirPage() {
    const controlsContainer = document.getElementById('souvenirControlsContainer');
    
    // 注入響應式的控制項 HTML (只在容器為空時執行)
    if (controlsContainer && !controlsContainer.hasChildNodes()) {
        controlsContainer.innerHTML = `
            <div class="d-none d-sm-flex flex-wrap align-items-center gap-3 w-100">
                <h3 class="mb-0 me-3 text-nowrap">🎁 紀念品</h3>
                <div class="d-flex align-items-center">
                    <label for="rowsPerPageSelectDesktop" class="form-label mb-0 me-1 text-nowrap">筆數:</label>
                    <select id="rowsPerPageSelectDesktop" class="form-select form-select-sm" style="width: 80px;">
                        <option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
                    </select>
                </div>
                <div class="d-flex align-items-center">
                    <label for="searchInputDesktop" class="form-label mb-0 me-1 text-nowrap">搜尋:</label>
                    <input type="text" id="searchInputDesktop" class="form-control form-control-sm" style="width: 150px;" placeholder="關鍵字...">
                </div>
            </div>
            <div class="d-flex d-sm-none flex-column gap-2 w-100">
                <h3 class="mb-2 text-center">🎁 紀念品</h3>
                <div class="d-flex justify-content-center gap-3">
                    <div class="d-flex align-items-center">
                        <label for="rowsPerPageSelectMobile" class="form-label mb-0 me-1">筆數:</label>
                        <select id="rowsPerPageSelectMobile" class="form-select form-select-sm" style="width: 80px;">
                            <option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
                        </select>
                    </div>
                    <div class="d-flex align-items-center">
                        <label for="searchInputMobile" class="form-label mb-0 me-1">搜尋:</label>
                        <input type="text" id="searchInputMobile" class="form-control form-control-sm" style="width: 150px;" placeholder="關鍵字...">
                    </div>
                </div>
            </div>`;
    }

    // ✅【關鍵修正】無論如何，每次初始化時都重新綁定事件
    bindControlEvents();
    
    // 如果資料還沒抓取過，才執行 fetch
    if (!isDataFetched) {
        fetchData();
    } else {
        // 如果資料已存在，直接重新渲染即可
        renderTable();
    }
}

// --- 以下為內部輔助函數 ---

const tblHead = document.querySelector('#souvenirTable thead');
const tblBody = document.querySelector('#souvenirTable tbody');
const pagContainer = document.getElementById('souvenirPagination');

function fetchData() {
    tblBody.innerHTML = `<tr><td colspan="10" class="text-center p-4"><div class="spinner-border" role="status"></div></td></tr>`;
    fetch('https://opensheet.elk.sh/1z4SqcpGbhVtb5I6hQZ5aI9PQTNt2_64-ZFdc0_cV3kE/紀念品資訊')
        .then(res => res.ok ? res.json() : Promise.reject('Network response was not ok.'))
        .then(data => {
            isDataFetched = true; // 標記資料已成功獲取
            if (!data || data.length === 0) {
                tblBody.innerHTML = '<tr><td colspan="10">沒有可用的資料</td></tr>';
                return;
            }
            rawData = data;
            headers = Object.keys(rawData[0]);
            renderHeader();
            sortData();
            filterData('');
            renderTable();
        })
        .catch(error => {
            console.error('載入紀念品資料錯誤：', error);
            tblBody.innerHTML = '<tr><td colspan="10" class="text-danger text-center">資料載入失敗</td></tr>';
        });
}

function sortTable(key) {
    sortAsc = (sortKey === key) ? !sortAsc : true;
    sortKey = key;
    sortData();
    const currentKeyword = document.querySelector('#searchInputDesktop')?.value || '';
    filterData(currentKeyword);
    renderTable();
}

function sortData() {
    const isPureNumeric = (s) => /^-?\d+(\.\d+)?$/.test(String(s).trim());
    rawData.sort((a, b) => {
        const valA = a[sortKey] || '';
        const valB = b[sortKey] || '';
        if (isPureNumeric(valA) && isPureNumeric(valB)) {
            return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        } else {
            return sortAsc ? String(valA).localeCompare(String(valB), 'zh-Hant') : String(valB).localeCompare(String(valA), 'zh-Hant');
        }
    });
}

function filterData(keyword) {
    const lowerKeyword = keyword.trim().toLowerCase();
    filteredData = lowerKeyword ? rawData.filter(row => headers.some(h => String(row[h] || '').toLowerCase().includes(lowerKeyword))) : [...rawData];
}

function renderHeader() {
    tblHead.innerHTML = `<tr>${headers.map(h => `<th class="sortable" data-key="${h}" style="cursor: pointer; white-space: nowrap;">${h} <i class="fa-solid fa-sort sort-indicator"></i></th>`).join('')}</tr>`;
    tblHead.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.key));
    });
}

function renderTable() {
    if (!tblHead || !tblBody) return;
    tblHead.querySelectorAll('.sort-indicator').forEach(icon => {
        icon.className = 'fa-solid fa-sort sort-indicator';
        icon.style.color = '#aaa';
    });
    const activeIcon = tblHead.querySelector(`th[data-key="${sortKey}"] .sort-indicator`);
    if (activeIcon) {
        activeIcon.className = sortAsc ? 'fa-solid fa-sort-up sort-indicator' : 'fa-solid fa-sort-down sort-indicator';
        activeIcon.style.color = 'black';
    }
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);
    tblBody.innerHTML = pageData.length > 0 ? pageData.map(row => `<tr>${headers.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="text-center p-4">沒有符合條件的資料</td></tr>`;
    renderPagination();
}

function renderPagination() {
    if (!pagContainer) return;
    const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
    if (totalPages <= 1) {
        pagContainer.innerHTML = '';
        return;
    }
    let pageButtons = [];
    pageButtons.push(`<button class="btn btn-sm btn-outline-secondary me-1" ${currentPage === 1 ? 'disabled' : ''} onclick="window.souvenirTable.changePage(-1)">上頁</button>`);
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (startPage > 1) pageButtons.push(`<button class="btn btn-sm btn-outline-primary me-1" onclick="window.souvenirTable.goToPage(1)">1</button>`);
    if (startPage > 2) pageButtons.push(`<span class="align-self-center me-1">...</span>`);
    for (let i = startPage; i <= endPage; i++) {
        pageButtons.push(`<button class="btn btn-sm me-1 ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}" onclick="window.souvenirTable.goToPage(${i})">${i}</button>`);
    }
    if (endPage < totalPages - 1) pageButtons.push(`<span class="align-self-center me-1">...</span>`);
    if (endPage < totalPages) pageButtons.push(`<button class="btn btn-sm btn-outline-primary me-1" onclick="window.souvenirTable.goToPage(${totalPages})">${totalPages}</button>`);
    pageButtons.push(`<button class="btn btn-sm btn-outline-secondary" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.souvenirTable.changePage(1)">下頁</button>`);
    pagContainer.innerHTML = pageButtons.join('');
}

window.souvenirTable = {
    changePage: (offset) => {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
        currentPage = Math.min(Math.max(1, currentPage + offset), totalPages);
        renderTable();
    },
    goToPage: (page) => {
        currentPage = page;
        renderTable();
    }
};
