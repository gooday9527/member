// notice.js

// 函數：用來綁定 Q&A 的點擊事件
function initializeQaToggles() {
    const questions = document.querySelectorAll('.qa-question');
    questions.forEach(question => {
        // 先移除舊的監聽器，避免重複綁定
        question.removeEventListener('click', toggleQaItem); 
        // 再加上新的監聽器
        question.addEventListener('click', toggleQaItem);
    });
}

// 函數：處理點擊後的開闔邏輯
function toggleQaItem(event) {
    // 使用 event.currentTarget 來確保我們總是選到有監聽器的那個元素
    const item = event.currentTarget.parentElement;
    item.classList.toggle('active');
}

// 函數：載入 Q&A 的 HTML 內容
async function loadQaContent() {
    const qaContainer = document.querySelector('.qa-container');
    if (!qaContainer) return;

    // 您可以將 Q&A 的 HTML 內容另外存成一個檔案，例如 qa-content.html
    // 這裡為了簡單，我們先直接用字串的方式定義
    const qaHtmlContent = `
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>1. 為什麼要找你們代領？</span> </div>
            <div class="qa-answer"> <p>便宜又方便。我們的代領費用約在 12 元至 16 元之間，自行找銀行券商領取費用通常為單筆 25~30 元。 我們透過一次領取所有會員的紀念品來節省成本，因此可以提供較低的費用。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>2. 你們是詐騙嗎？會不會證券帳戶被冒用？</span> </div>
            <div class="qa-answer"> <p>絕對不是。上市櫃公司每年會準備股東會紀念品，除了鼓勵股東們參加之外，也是感謝股東對於公司的支持。買一股零股即可領取，公開資訊都查得到，絕對不是詐騙。<br>請您放心，代領紀念品只需要電子投票截圖或是身份證明，絕對不會有任何風險。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>3. 我(有)(無)證券戶，該如何開始? 未成年小孩能開證券戶嗎？</span> </div>
            <div class="qa-answer"> <p>建議選擇<strong class="text-danger">手續費1元+有匯入功能</strong>的券商，如: <strong class="text-primary">新光、永豐、富邦</strong>。<br>未成年小孩，雙親能幫小孩開證券戶。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>4. 一檔一檔買太麻煩了，有沒有快一點的方法？</span> </div>
            <div class="qa-answer"> <p>請參考我們的<strong>推薦套組</strong>，證券戶需有匯入功能<span style="color: #0d6efd;">(新光、永豐、富邦)</span>。<br>我們將會為您提供專業的服務，最多一次掛滿超過 500 檔。<br><br><a href="https://line.me/ti/p/aWJd9KCJMj"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png" alt="加入好友" height="36" border="0"></a></p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>5. 最晚何時要買進股票才有領紀念品資格? 什麼時候可以知道送什麼紀念品?</span> </div>
            <div class="qa-answer"> <p>公司會公告<strong>「最後過戶日」</strong>，通常在股東會前62天。因此在「最後過戶日」前2個交易日買進該檔股票，就有領取紀念品的權利。<br>公司大多會在股東會前1~2個月公告有沒有送紀念品及送什麼。股東會大部份都集中在3~6月，因此最好在前一年12月到隔年3月前把零股買好。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>6. 如何委託? 整張也能委託代領嗎?</span> </div>
            <div class="qa-answer"> <p>可以。 整張(1000股) 和 零股(1~999股)，都必須在<strong class="text-danger">有效時間內</strong>上<a href="https://stockservices.tdcc.com.tw/evote/index.html" target="_blank" rel="noopener noreferrer">股東e服務平台</a>投票+截圖，並在本站<strong class="text-danger">上傳截圖</strong>才算完成委託。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>7. 如何電子投票? 代電投服務是什麼?</span> </div>
            <div class="qa-answer">
                <p>
                    <strong>電子投票開始日:</strong> 股東會(常會)前30天，股東會(臨時會)前15天。<br>
                    <strong>電子投票截止日:</strong> 股東會前3天止。<br><br>
                    ▶︎進入<a href="https://stockservices.tdcc.com.tw/evote/index.html" target="_blank" rel="noopener noreferrer">股東e服務平台</a>， <strong>"投票"</strong>後按<strong>"查詢"</strong> ，並<strong>截圖</strong>如下畫面。<br>
                    ❤️因電子投票有時間限制，步驟繁瑣。 <strong class="text-danger">上傳憑證</strong> 即能享受小管家<span style="color: #FF69B4;">代電投＋截圖服務</span>。自動委託，讓您免煩惱。<small style="color: #6c757d;">憑證只能投票用，並無法買賣您的股票。</small>
                </p>
                <img src="images/截圖範例1.jpg" alt="截圖範例(手機板)" style="display: block; width: 200px; max-width: 100%; height: auto; margin: 10px auto;">
                <img src="images/截圖範例2.jpg" alt="截圖範例(電腦版)" style="display: block; width: 200px; max-width: 100%; height: auto; margin: 10px auto;">
            </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>8. 何時能領到紀念品?</span> </div>
            <div class="qa-answer"> <p>一般來說，等到股東會旺季結束後統一出貨（大約會在8~9月附近，每年不太一定），若您有相當喜愛的紀念品希望提早寄送，請參考我們的提早出貨申請。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>9. 不想要物品，可以都換成現金嗎?</span> </div>
            <div class="qa-answer"> <p>我們可以直接回收。收購價可抵扣代領費用。<br>平台收購之物品，是與盤商配合，大盤批發價格與市價有顯著差異，可自由選擇領出紀念品後自行販售，以取得較好的收益。<br><strong>「代領後收購」</strong>，如遇發放替代品，無論替代品價值高於/低於原紀念品，或物品變為點數卡，均不影響原定收購價格。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>10. 為什麼領到的紀念品和公告的不同?</span> </div>
            <div class="qa-answer"> <p>股東會紀念品數量不足時，公司會以其他商品代替。</p> </div>
        </div>
        <div class="qa-item">
            <div class="qa-question"> <span class="toggle-icon">+</span> <span>11. 為什麼有不開放委託的情況?</span> </div>
            <div class="qa-answer"> <ol> <li>沒發紀念品。</li> <li>不發給零股股東 (常見於興櫃公司)。</li> <li>可以自已兌換 (如大魯閣、 HiTi inPhoto 相片沖印卷，自行到公司網站APP/股東專區/股東會贈品/獲取兌換碼)。</li> <li>領取地點在中南部且又要身份證件正本。因需要證件的紀念品我一定是親自領取，跑一趟中南部成本太高，除非紀念品超值。</li> </ol> </div>
        </div>
    `;

    qaContainer.innerHTML = qaHtmlContent;

    // 內容載入後，重新綁定一次點擊事件
    initializeQaToggles();
}

// 當 notice.js 被載入時，就立刻執行載入內容的函數
loadQaContent();
