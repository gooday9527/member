// =================================================================
//                 app.js (最終修正版)
// =================================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
// ✅【修正】加回 recommend.js 的 import，以便初始化推薦清單頁面
import { initializeRecommendPage } from './recommend.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    // ✅ 新增這一行，專門給推薦清單使用
    recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
    
    // 未來如果您有 souvenir 的後端網址，也可以加在這裡
    // souvenir: "https://..."
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
// ✅【修正】明確定義推薦清單頁面的容器
const recommendPage = document.getElementById('page-recommend');
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

let isInitialLoad = true; 

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

async function loadMemberName(email) {
  if (!email) {
    document.getElementById("mobileUserName").innerText = "";
    document.getElementById("desktopUserName").innerText = "";
    return;
  }
  document.getElementById("mobileUserName").innerText = "載入中...";
  document.getElementById("desktopUserName").innerText = "載入中...";
try { // TRY 區塊開始
        const params = new URLSearchParams({
            view: 'getMemberInfo',
            email: email
        });
        const urlWithParams = `${APP_URLS.main}?${params.toString()}`;
        const response = await fetch(urlWithParams);

        // ✅【修正】把所有後續處理邏輯全部搬進來
        if (!response.ok) {
            // 如果網路回應不OK (例如 404, 500 錯誤)，就直接拋出錯誤
            throw new Error(`網路回應錯誤: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
            const memberText = `會員：${result.data.name}`;
            document.getElementById("mobileUserName").innerText = memberText;
            document.getElementById("desktopUserName").innerText = memberText;
        } else {
            // 如果後端回傳 success: false，也拋出錯誤
            throw new Error(result.message || "找不到會員名稱");
        }

    } catch (error) { // CATCH 區塊，用來捕捉上面所有可能發生的錯誤
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
    if (!sectionId || sectionId === 'null') {
      dynamicContentArea.innerHTML = '';
      return;
    }
    dynamicContentArea.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"></div></div>`;
    try {
        const response = await fetch(`${sectionId}.html`);
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
    // 讓所有頁面的載入邏輯都統一
    dynamicContentArea.innerHTML = ''; // 先清空內容
    loadExternalHtmlSection(id); // 直接交給外部載入函數處理

    // 更新網址列的邏輯保持不變
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        window.history.pushState({ section: id }, '', url);
    }
}

// --- 事件監聽與啟動邏輯 (其餘部分保持不變) ---
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
    } else {
        navigateTo('souvenir', true);
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

    if (isInitialLoad) {
        isInitialLoad = false;
        document.getElementById("initialLoading")?.remove();
        renderNavTabs();
        updateLoginStatusLink(isLoggedIn);
        if (isLoggedIn) {
            loadMemberName(loginEmail);
        }
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view") || "souvenir";
        navigateTo(view);
    }
});
