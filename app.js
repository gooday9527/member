// =================================================================
//                 app.js (最終穩定版 v2 - 強化啟動邏輯)
// =================================================================

// 關閉自動 restore scroll
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// 匯入模組
import { initializeRecommendPage } from './recommend.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };
export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
};

// --- 初始化 Firebase App ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 全域變數 ---
let loginEmail = null;
window.currentUserEmail = null;
let isInitialLoad = true;
const navMenu = document.getElementById("navMenu");
const loginStatus = document.getElementById("loginStatus");
const mobileUserName = document.getElementById("mobileUserName");
const desktopUserName = document.getElementById("desktopUserName");
const dynamicContentArea = document.getElementById('dynamic-content-area');
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

// --- 函式定義區 ---
// (此處省略所有函式定義的程式碼，請保留您檔案中原有的函式，例如 renderNavTabs, loadMemberName, navigateTo, initializeDelegableListPage 等)
// ... 您的所有 function ...
function renderNavTabs() { /* ... 您的程式碼 ... */ }
function updateLoginStatusLink(isLoggedIn) { /* ... 您的程式碼 ... */ }
async function loadMemberName(email) { /* ... 您的程式碼 ... */ }
async function loadExternalHtmlSection(sectionId) { /* ... 您的程式碼 ... */ }
async function navigateTo(id, fromHistory = false) { /* ... 您的程式碼 ... */ }
function initializeDelegableListPage() { /* ... 您的程式碼 ... */ }
// ⬆️⬆️⬆️ 確保您所有的函式定義都在這裡 ⬆️⬆️⬆️


// =================================================================
//                      【核心修正】應用程式啟動邏輯
// =================================================================

// 這是應用程式的主要進入點
function startApp() {
    // 監聽使用者點擊導覽列的行為
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
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                bsCollapse.hide();
            }
        }
    });

    // 監聽瀏覽器的上一頁/下一頁
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            navigateTo(event.state.section, true);
        } else {
            navigateTo('souvenir', true); // 或您的預設頁面
        }
    });

    // 監聽 Firebase 登入狀態的變化
    onAuthStateChanged(auth, (user) => {
        const wasLoggedIn = !!loginEmail;
        loginEmail = user ? user.email : null;
        window.currentUserEmail = loginEmail;
        const isLoggedIn = !!user;

        // 當登入狀態改變時，更新UI
        if (isLoggedIn !== wasLoggedIn) {
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            loadMemberName(loginEmail);
            if (!isLoggedIn) {
                navigateTo("souvenir"); // 登出後跳轉到預設頁面
            }
        }

        // 只有在第一次載入時，才執行頁面初始化導航
        if (isInitialLoad) {
            isInitialLoad = false;
            const initialLoadingEl = document.getElementById("initialLoading");
            if(initialLoadingEl) initialLoadingEl.remove();

            // 確保首次載入時 UI 也正確
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            loadMemberName(loginEmail);
            
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get("view") || "souvenir";
            navigateTo(view);
        }
    });
}

// ✅ 新增的啟動器：等待 DOM 載入完成後，開始嘗試啟動 App
window.addEventListener('DOMContentLoaded', function() {
    // 由於 Firebase 初始化需要一點時間，我們給它一點緩衝
    // 這個函式會每 100 毫秒檢查一次 Firebase Auth 是否準備就緒
    const checkFirebaseReady = setInterval(() => {
        // 當 getAuth 和 onAuthStateChanged 都成為可用的函式時，代表 Firebase SDK 好了
        if (auth && typeof onAuthStateChanged === 'function') {
            clearInterval(checkFirebaseReady); // 停止檢查
            console.log("Firebase SDK is ready. Starting the app...");
            startApp(); // ✅ 正式啟動我們的 App 邏輯
        }
    }, 100);
});
