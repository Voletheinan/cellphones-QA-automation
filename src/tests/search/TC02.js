const { By, until } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC02() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC02: KIỂM TRA GỢI Ý TÌM KIẾM (AUTOCOMPLETE) ---');

        // Bước 1: Mở trang chủ CellphoneS
        await homePage.open();
        console.log('Bước 1: Truy cập trang chủ thành công.');

        // Bước 2: Nhập từ khóa để kích hoạt gợi ý
        const keyword = 'samsung';
        const searchInput = await webDriverUtil.waitForElement(homePage.searchBar);
        
        // Click và chờ một chút để đảm bảo ô nhập liệu đã sẵn sàng
        await searchInput.click();
        await webDriverUtil.sleep(500);
        
        await searchInput.sendKeys(keyword);
        console.log(`Bước 2: Đã nhập "${keyword}", đang đợi khung gợi ý load...`);

        // Bước 3: Đợi khung search_autocomplete hiển thị
        const suggestionBoxLocator = By.id('search_autocomplete');
        
        // Đợi phần tử xuất hiện trong DOM (tối đa 15s)[cite: 4]
        await driver.wait(until.elementLocated(suggestionBoxLocator), 15000);
        
        // Đợi phần tử thực sự hiển thị trên màn hình (Visible)[cite: 4]
        const suggestionBox = await driver.findElement(suggestionBoxLocator);
        await driver.wait(until.elementIsVisible(suggestionBox), 5000);
        
        console.log('Bước 3: Khung "search_autocomplete" đã hiển thị trên giao diện.');

        // Bước 4: Lấy text và xác minh nội dung
        const suggestionText = await webDriverUtil.getElementText(suggestionBoxLocator);
        console.log(`Bước 4: Nội dung gợi ý phát hiện: "${suggestionText.split('\n')[0]}..."`);

        if (suggestionText.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`XÁC MINH: Gợi ý chứa từ khóa "${keyword}" thành công.`);
            console.log('==> KẾT QUẢ: TC02 [PASS]');
        } else {
            throw new Error(`Nội dung gợi ý không khớp. Thực tế: ${suggestionText}`);
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC02 [FAIL]');
        console.error('Lỗi thực tế:', error.message);
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC02();