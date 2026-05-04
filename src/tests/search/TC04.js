const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC04() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC04: KIỂM TRA SỰ TỒN TẠI CỦA NÚT BỘ LỌC ---');

        // Bước 1: Mở trang chủ
        await homePage.open();
        console.log('Bước 1: Truy cập trang chủ thành công.');
        await webDriverUtil.hideCookieConsentIfPresent();

        // Bước 2: Tìm kiếm một từ khóa bất kỳ
        const keyword = 'samsung';
        await homePage.searchForProduct(keyword);
        console.log(`Bước 2: Tìm kiếm với từ khóa "${keyword}".`);

        // Bước 3: Tìm nút có class chứa chữ "filter"
        // Sử dụng hàm contains() trong XPath để linh hoạt hơn
        const filterButtonLocator = By.xpath("//button[contains(@class, 'filter')]");
        
        console.log('Bước 3: Đang quét tìm nút bộ lọc trên giao diện...');
        
        // Đợi tối đa 5 giây để chứng minh Bug (nút không xuất hiện khi search)
        await webDriverUtil.waitForElement(filterButtonLocator, 5000); 
        
        console.log('XÁC MINH: Tìm thấy nút bộ lọc. (Hệ thống hoạt động đúng).');
        console.log('==> KẾT QUẢ: TC04 [PASS]');

    } catch (error) {
        console.error('==> KẾT QUẢ: TC04 [FAIL]');
        console.error('Lý do: Không tìm thấy bất kỳ nút nào có class chứa "filter".');
        console.error('Ghi chú: Lỗi này chứng minh Bug thiếu bộ lọc khi search bằng từ khóa.');
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC04();