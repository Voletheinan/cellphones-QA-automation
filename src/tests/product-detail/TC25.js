const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC25_Final() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC25: LỌC VÀ ĐẾM SẢN PHẨM TRONG KHUNG ---');

        // Bước 1: Mở trang chủ và xử lý Cookies/Popup
        await homePage.open();
        await webDriverUtil.hideCookieConsentIfPresent();

        // Bước 2: Chọn Laptop từ danh mục trang chủ
        const laptopSidebar = By.xpath("//a[@href='/laptop.html']");
        await webDriverUtil.waitForElement(laptopSidebar, 10000);
        await driver.executeScript("arguments[0].click();", await driver.findElement(laptopSidebar));
        
        await driver.sleep(3000); 
        await webDriverUtil.hideCookieConsentIfPresent();

        // Bước 3: Mở bộ lọc và chọn Apple
        const filterBtn = By.xpath("//button[contains(@class, 'filter-button')]");
        await webDriverUtil.waitForElement(filterBtn, 10000);
        await driver.findElement(filterBtn).click();

        const appleOption = By.xpath("//div[@id='filterAll']//button[normalize-space()='Apple']");
        await webDriverUtil.waitForElement(appleOption, 10000);
        await driver.findElement(appleOption).click();

        const submitBtn = By.xpath("//div[@id='filterAll']//button[contains(text(), 'Xem kết quả')]");
        await driver.findElement(submitBtn).click();
        console.log('Đã áp dụng lọc Apple. Bắt đầu nhấn "Xem thêm" để tải toàn bộ...');

        // Bước 4: Vòng lặp nhấn "Xem thêm" cho đến khi hết sản phẩm[cite: 3]
        const showMoreLocator = By.xpath("//a[@class='button btn-show-more button__show-more-product']");
        let hasMore = true;

        while (hasMore) {
            try {
                const buttons = await driver.findElements(showMoreLocator);
                if (buttons.length > 0 && await buttons[0].isDisplayed()) {
                    // Cuộn tới nút để đảm bảo nó nằm trong vùng tương tác[cite: 3]
                    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", buttons[0]);
                    await driver.sleep(1000);
                    // Dùng JS Click để chắc chắn "ăn" lệnh[cite: 4]
                    await driver.executeScript("arguments[0].click();", buttons[0]);
                    await driver.sleep(2500); // Đợi sản phẩm mới tải về[cite: 3]
                } else {
                    hasMore = false;
                }
            } catch (e) {
                hasMore = false;
            }
        }

        // Bước 5: Đếm sản phẩm CHỈ trong khung quy định
        const containerLocator = By.xpath("//div[@class='product-list-filter is-flex is-flex-wrap-wrap']");
        const container = await driver.findElement(containerLocator);
        
        // Sử dụng "./div" để chỉ đếm các thẻ con trực tiếp trong khung này[cite: 1, 5]
        const products = await container.findElements(By.xpath("./div[contains(@class, 'product-info')]"));
        const finalCount = products.length;

        console.log('--------------------------------------------------');
        console.log(`TỔNG SỐ SẢN PHẨM TRONG KHUNG: ${finalCount}`);
        console.log('--------------------------------------------------');

        if (finalCount > 0) {
            console.log('==> KẾT QUẢ: TC25 [PASS]');
        } else {
            throw new Error("Không tìm thấy sản phẩm nào trong khung sản phẩm chính.");
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC25 [FAIL]');
        console.error('Lỗi chi tiết:', error.message);
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC25_Final();