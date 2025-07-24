// =================================================================
//                 app.js (最終結構修正版)
// =================================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { initializeRecommendPage } from './recommend.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };
export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbzfj7nkQe1QnKiRedfYKeMBAAKVKAi17b0rEirrgzNd2AcTmgQcVvneIg5IlqQDtWaF/exec",
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
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "📣 公告欄" }, { id: "delegation-manage", label: "📥 委託管理" }, { id: "souvenir-manage", label: "🧾 紀念品管理" }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "add-account-shares", label: "📊 新增帳號／持股" }, { id: "deposit-withdrawal", label: "💵 儲值 / 提款" }, { id: "account-query", label: "🔍 帳務查詢" } ] } ];

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
    // 如果沒有登入，就清空兩個位置的文字
    if (!email) {
        mobileUserName.innerText = "";
        desktopUserName.innerText = "";
        return;
    }

    // 提示正在載入
    mobileUserName.innerText = "載入中...";
    desktopUserName.innerText = "載入中...";
    
    try {
        const response = await fetch(`${APP_URLS.main}?view=getMemberInfo&email=${encodeURIComponent(email)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const info = await response.json();
        const memberText = `會員：${info.name || "未命名"}`;

        // ✅ 同時更新手機版和桌機版的會員名稱
        mobileUserName.innerText = memberText;
        desktopUserName.innerText = memberText;

    } catch (error) {
        console.error("取得會員資料失敗", error);
        const errorText = "會員：載入失敗";
        mobileUserName.innerText = errorText;
        desktopUserName.innerText = errorText;
    }
}

function updateLoginStatusLink(isLoggedIn) {
    if (isLoggedIn) {
        // 如果已登入，顯示登出連結
        // 注意 data-section="logout" 屬性，讓原本的點擊事件可以捕捉到
        loginStatus.innerHTML = `<a class="nav-link text-black" href="#" data-section="logout">登出</a>`;
    } else {
        // 如果未登入，顯示登入連結
        loginStatus.innerHTML = `<a class="nav-link text-black" href="#" data-section="login">登入</a>`;
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
// ✅ 修正：將三個核心監聽器，放在同一個層級，互不干擾

// 監聽器一：監聽整個頁面的點擊事件
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

// 監聽器二：監聽瀏覽器的上一頁/下一頁
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section, true);
    }
});

// 監聽器三：監聽 Firebase 登入狀態 (舊版邏輯)
onAuthStateChanged(auth, (user) => {
    const wasLoggedIn = !!loginEmail;
    loginEmail = user ? user.email : null;
    window.currentUserEmail = loginEmail;
    const isLoggedIn = !!user;

    // 只有在登入狀態改變，或這是頁面第一次載入時，才做事
    if (typeof window.initialLoad === 'undefined' || isLoggedIn !== wasLoggedIn) {
        window.initialLoad = true;
        renderNavTabs();
        loadMemberName(loginEmail);
        updateLoginStatusLink(isLoggedIn);

        // 決定要顯示哪個頁面
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view");
        
        // 如果是首次載入、未登入、且網址有指定頁面，則顯示該頁面
        if (view && !wasLoggedIn && !isLoggedIn) {
            navigateTo(view);
        } else {
            // 否則，根據登入狀態跳轉到預設頁面
            navigateTo(isLoggedIn ? "souvenir" : "souvenir");
        }
    }
});
