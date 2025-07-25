// =================================================================
//                 app.js (改用 POST 請求)
// =================================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbw7BQrq9T7l-BMxUIQqPbwK6RwUad09JRmP5BmkmD0T1jkV1lwA7FxJ1DTBledjz6S-mw/exec",
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
const pages = document.querySelectorAll('.page-container');
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

// --- 函數定義區 ---

const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }];
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "📣 公告欄" }, { id: "delegation-manage-dropdown", label: "📥 委託管理", isDropdown: true, children: [ { id: "delegable-list", label: "可委託代領清單" }, { id: "delegated-query", label: "已委託代領查詢" } ] }, { id: "souvenir-manage-dropdown", label: "🧾 紀念品管理", isDropdown: true, children: [ { id: "souvenir-inventory", label: "紀念品總庫存" }, { id: "souvenir-transaction-query", label: "紀念品進出查詢" }, { id: "souvenir-withdrawal-query", label: "領出申請查詢" }, { id: "souvenir-album", label: "專屬紀念品相冊" } ] }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "add-account-shares", label: "📊 新增帳號／持股" }, { id: "deposit-withdrawal", label: "💵 儲值 / 提款" }, { id: "account-query", label: "🔍 帳務查詢" } ] } ];

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
 * 【已修正】改用 POST 方法讀取會員姓名
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
    // ✅【重大修改】改用 POST 方法發送請求
    const response = await fetch(APP_URLS.main, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // 使用 text/plain 避免 CORS 預檢
        body: JSON.stringify({
            action: 'getMemberInfo', // 新增一個 action 給 doPost 辨識
            email: email
        })
    });

    if (!response.ok) throw new Error('網路回應錯誤');

    const result = await response.json();

    if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
        const memberText = `會員：${result.data.name}`;
        document.getElementById("mobileUserName").innerText = memberText;
        document.getElementById("desktopUserName").innerText = memberText;
    } else {
        throw new Error(result.message || "找不到會員名稱");
    }

  } catch (error) {
    console.error("取得會員資料失敗:", error);
    const errorText = "會員：載入失敗";
    document.getElementById("mobileUserName").innerText = errorText;
    document.getElementById("desktopUserName").innerText = errorText;
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

    if (isLoggedIn !== wasLoggedIn) {
        renderNavTabs();
        updateLoginStatusLink(isLoggedIn);
        
        if (isLoggedIn) {
            loadMemberName(loginEmail);
        } else {
            document.getElementById("mobileUserName").innerText = "";
            document.getElementById("desktopUserName").innerText = "";
            navigateTo("souvenir");
        }
    }
    
    if (typeof window.initialLoad === 'undefined') {
        window.initialLoad = false;
        document.getElementById("initialLoading")?.remove();
        
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
