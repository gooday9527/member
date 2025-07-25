// =================================================================
//                 app.js (重新整理即登出版)
// =================================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ✅【重大修改】在腳本一開始就執行強制登出
// 為了避免畫面閃爍 (先顯示登入再變登出)，
// 我們將整個應用程式的啟動邏輯，都放在登出成功後才執行。
signOut(auth).catch((error) => {
    // 即使登出失敗 (例如離線)，也繼續初始化 App
    console.error("啟動時強制登出失敗:", error);
}).finally(() => {
    // 無論登出成功或失敗，都啟動主應用程式
    initializeAppLogic();
});


/**
 * 將所有應用程式邏輯包裝在這個函數中，確保它在登出後才執行
 */
function initializeAppLogic() {
    // --- 全域變數 ---
    let loginEmail = null;
    window.currentUserEmail = null; // 確保 window 物件上的 email 也是 null
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

    async function loadMemberName(email) {
      if (!email) {
        mobileUserName.innerText = "";
        desktopUserName.innerText = "";
        return;
      }
      mobileUserName.innerText = "載入中...";
      desktopUserName.innerText = "載入中...";
      try {
        const response = await fetch(APP_URLS.main, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'getMemberInfo', email: email })
        });
        if (!response.ok) throw new Error('網路回應錯誤');
        const result = await response.json();
        if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
            const memberText = `會員：${result.data.name}`;
            mobileUserName.innerText = memberText;
            desktopUserName.innerText = memberText;
        } else {
            throw new Error(result.message || "找不到會員名稱");
        }
      } catch (error) {
        console.error("取得會員資料失敗:", error);
        const errorText = "會員：載入失敗";
        mobileUserName.innerText = errorText;
        desktopUserName.innerText = errorText;
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
        dynamicContentArea.style.display = 'block';
        loadExternalHtmlSection(id);
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
        } else {
            navigateTo('souvenir', true);
        }
    });

    // onAuthStateChanged 現在的主要作用是處理「使用者手動登入/登出」的狀態變化
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
                mobileUserName.innerText = "";
                desktopUserName.innerText = "";
                navigateTo("souvenir");
            }
        }
    });

    // 頁面首次載入的啟動邏輯
    // 因為已經被強制登出，所以直接顯示登出狀態的 UI
    document.getElementById("initialLoading")?.remove();
    renderNavTabs(); // 顯示登出前的導覽列
    updateLoginStatusLink(false); // 顯示「登入」連結

    // 根據 URL 參數決定要顯示哪個頁面
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view") || "souvenir";
    navigateTo(view);
}
