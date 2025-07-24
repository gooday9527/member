// =================================================================
//                 app.js (修正版)
// =================================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { initializeRecommendPage } from './recommend.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };
// ✅ 請確保這裡的 main URL 是您最新部署的、統一後的後端網址
export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbzk_RKeBgLtWsVJe79WUIYklyOnLL94nVZ41rb_zG_bV-LOSsi9PtSHQX0H0a2hMId0/exec",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 全域變數 ---
let loginEmail = null;
window.currentUserEmail = null;
const navMenu = document.getElementById("navMenu");
const loginStatus = document.getElementById("loginStatus");
const mobileUserName = document.getElementById("mobileUserName");
const desktopUserName = document.getElementById("desktopUserName");
const dynamicContentArea = document.getElementById('dynamic-content-area');
const recommendPage = document.getElementById('page-recommend');
const pages = document.querySelectorAll('.page-container');
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

// --- 函數定義區 ---

const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }];
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "📣 公告欄" }, { id: "delegation-manage-dropdown", label: "委託管理", isDropdown: true, children: [ { id: "delegable-list", label: "可委託代領清單" }, { id: "delegated-query", label: "已委託代領查詢" } ] }, { id: "souvenir-manage-dropdown", label: "紀念品管理", isDropdown: true, children: [ { id: "souvenir-inventory", label: "紀念品總庫存" }, { id: "souvenir-transaction-query", label: "紀念品進出查詢" }, { id: "souvenir-withdrawal-query", label: "領出申請查詢" }, { id: "souvenir-album", label: "專屬紀念品相冊" } ] }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "add-account-shares", label: "📊 新增帳號／持股" }, { id: "deposit-withdrawal", label: "💵 儲值 / 提款" }, { id: "account-query", label: "🔍 帳務查詢" } ] } ];

function renderNavTabs() {
    navMenu.innerHTML = "";
    const tabs = loginEmail ? tabsAfterLogin : tabsBeforeLogin;
    tabs.forEach(tab => {
        const li = document.createElement("li");
        li.className = "nav-item";
        if (tab.isDropdown) {
            li.className = "nav-item dropdown";
            li.innerHTML = `<a class="nav-link dropdown-toggle" href="#" id="${tab.id}Link" role="button" data-bs-toggle="dropdown" aria-expanded="false">${tab.label}</a><ul class="dropdown-menu" aria-labelledby="${tab.id}Link">${tab.children.map(child => `<li><a class="dropdown-item" href="#" data-section="${child.id}">${child.label}</a></li>`).join('')}</ul>`;
        } else {
            li.innerHTML = `<a class="nav-link" href="#" data-section="${tab.id}">${tab.label}</a>`;
        }
        navMenu.appendChild(li);
    });
}

/**
 * 【已修正】讀取會員姓名並更新 UI
 * @param {string} email - 登入者的 Email
 */
async function loadMemberName(email) {
  if (!email) {
    document.getElementById("mobileUserName").innerText = "";
    document.getElementById("desktopUserName").innerText = "";
    return;
  }

  document.getElementById("mobileUserName").innerText = "載入中...";
  document.getElementById("desktopUserName").innerText = "載入中...";

  try {
    const response = await fetch(`${APP_URLS.main}?view=getMemberInfo&email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('網路回應錯誤');

    const result = await response.json();

    // ✅【修正】檢查後端回傳的 success 狀態，並從 result.data 中讀取會員資料
    if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
        const memberText = `會員：${result.data.name}`;
        document.getElementById("mobileUserName").innerText = memberText;
        document.getElementById("desktopUserName").innerText = memberText;
    } else {
        // 如果後端回傳 success: false 或找不到 name，則顯示預設文字
        throw new Error(result.message || "找不到會員名稱");
    }

  } catch (error) {
    console.error("取得會員資料失敗:", error);
    const errorText = "會員：載入失敗";
    document.getElementById("mobileUserName").innerText = errorText;
    document.getElementById("desktopUserName").innerText = errorText;
  }
}


function updateLoginStatusLink(isLoggedIn) {
    if (isLoggedIn) {
        loginStatus.innerHTML = `<a class="nav-link ms-2 me-2 text-red" href="#" data-section="logout">登出</a>`;
    } else {
        loginStatus.innerHTML = `<a class="nav-link ms-2 me-2 text-red" href="#" data-section="login">登入</a>`;
    }
}

async function loadExternalHtmlSection(sectionId) {
    if (!sectionId) return;
    dynamicContentArea.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"></div></div>`;
    try {
        const response = await fetch(`/${sectionId}.html`);
        if (!response.ok) throw new Error(`載入 ${sectionId}.html 失敗`);
        dynamicContentArea.innerHTML = await response.text();
        dynamicContentArea.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (error) {
        console.error('載入外部內容錯誤:', error);
        dynamicContentArea.innerHTML = `<h3 class="text-center text-danger">頁面載入失敗</h3>`;
    }
}

function navigateTo(id, fromHistory = false) {
    pages.forEach(p => p.style.display = 'none');
    if (id === 'recommend') {
        recommendPage.style.display = 'block';
        initializeRecommendPage();
    } else {
        dynamicContentArea.style.display = 'block';
        loadExternalHtmlSection(id);
    }
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        window.history.pushState({ section: id }, '', url);
    }
}
window.navigateTo = navigateTo;

// --- 事件監聽與啟動邏輯 ---
document.body.addEventListener("click", function (e) {
    const clickedLink = e.target.closest("a[data-section]");
    if (clickedLink) {
        e.preventDefault();
        const id = clickedLink.dataset.section;
        if (id === "logout") {
            signOut(auth).catch((error) => console.error("登出失敗:", error));
        } else {
            navigateTo(id);
        }
        if (navbarCollapse.classList.contains('show')) {
            bsCollapse.hide();
        }
    }
});

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section, true);
    }
});

onAuthStateChanged(auth, (user) => {
    const wasLoggedIn = !!loginEmail;
    loginEmail = user ? user.email : null;
    window.currentUserEmail = loginEmail;
    const isLoggedIn = !!user;

    // 只有在登入狀態改變時才執行，避免不必要的重繪
    if (isLoggedIn !== wasLoggedIn) {
        renderNavTabs();
        updateLoginStatusLink(isLoggedIn);
        
        if (isLoggedIn) {
            loadMemberName(loginEmail);
        } else {
            // 登出時清空會員名稱
            document.getElementById("mobileUserName").innerText = "";
            document.getElementById("desktopUserName").innerText = "";
            // 登出後預設跳回紀念品頁面
            navigateTo("souvenir");
        }
    }
    
    // 首次載入時的邏輯
    if (typeof window.initialLoad === 'undefined') {
        window.initialLoad = false; // 標記為已首次載入
        document.getElementById("initialLoading")?.remove();
        
        // 如果已登入，則執行一次初始載入
        if (isLoggedIn) {
            renderNavTabs();
            updateLoginStatusLink(true);
            loadMemberName(loginEmail);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view") || "souvenir";
        navigateTo(view);
    }
});
