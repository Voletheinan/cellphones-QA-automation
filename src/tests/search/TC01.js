const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC01() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC01: KIỂM TRA HIỂN THỊ KẾT QUẢ TÌM KIẾM ---');

        // Bước 1: Truy cập trang chủ
        await homePage.open();
        console.log('Bước 1: Trang chủ đã load.');

        // Bước 2: Tìm kiếm iPhone 15
        const keyword = 'iPhone 15';
        await homePage.searchForProduct(keyword);
        console.log(`Bước 2: Đã tìm kiếm với từ khóa "${keyword}".`);

        // Bước 3: Đợi khung danh sách sản phẩm xuất hiện
        
        const resultContainer = By.xpath("//div[@class='product-list-filter']");
        await webDriverUtil.waitForElement(resultContainer);
        console.log('Bước 3: Khung kết quả "product-list-filter" đã hiển thị.');

        // Bước 4: Lấy text của sản phẩm đầu tiên xuất hiện
        
        const productTitleLocator = By.xpath("//div[@class='product-list-filter']//h3");
        const actualProductName = await webDriverUtil.getElementText(productTitleLocator);
        
        console.log(`Bước 4: Phát hiện sản phẩm: "${actualProductName}"`);

        // Bước 5: So sánh không phân biệt hoa thường (Case-insensitive)
        if (actualProductName.toLowerCase().includes(keyword.toLowerCase())) {
            console.log(`XÁC MINH: Tên sản phẩm chứa từ khóa "${keyword}" (Hợp lệ).`);
            console.log('==> KẾT QUẢ: TC01 [PASS]');
        } else {
            throw new Error(`Tên sản phẩm không chứa từ khóa tìm kiếm. Thực tế: "${actualProductName}"`);
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC01 [FAIL]');
        console.error('Lỗi thực tế:', error.message);
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC01();