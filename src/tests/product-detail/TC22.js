const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC22() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC22: KIỂM TRA THAY ĐỔI GIÁ KHI ĐỔI BIẾN THỂ ---');

        // Bước 1: Mở trang chủ
        await homePage.open();
        console.log('Bước 1: Trang chủ CellphoneS đã load.');

        // Bước 2: Tìm kiếm iPhone 15 (Sản phẩm này luôn có nhiều biến thể RAM/ROM)
        const keyword = 'iPhone 15';
        await homePage.searchForProduct(keyword);
        console.log(`Bước 2: Đã thực hiện tìm kiếm từ khóa "${keyword}".`);

        // Bước 3: Click vào sản phẩm đầu tiên từ danh sách (Giống TC21)
        const productInListLocator = By.xpath("//div[@class='product-list-filter']//h3");
        await webDriverUtil.waitForElement(productInListLocator, 10000);
        await driver.findElement(productInListLocator).click();
        console.log('Bước 3: Đã điều hướng vào trang chi tiết sản phẩm.');

        // Bước 4: Đợi tiêu đề trang chi tiết xuất hiện để đảm bảo trang đã load xong
        const detailTitleLocator = By.xpath("//div[@class='box-product-name']//h1");
        await webDriverUtil.waitForElement(detailTitleLocator, 10000);

        // Bước 5: Lấy giá bán hiện tại (sale-price) trước khi đổi biến thể
        const salePriceLocator = By.xpath("//div[@class='sale-price']");
        const initialPriceText = await webDriverUtil.getElementText(salePriceLocator);
        console.log(`Bước 5: Giá bán mặc định ban đầu: ${initialPriceText.trim()}`);

        // Bước 6: Tìm các biến thể RAM/ROM trong khung list-linked
        // Chúng ta chọn biến thể không có class 'active' để đảm bảo có sự thay đổi
        const variantLocator = By.xpath("//div[@class='list-linked']//a[not(contains(@class, 'active'))]"); 
        const variants = await driver.findElements(variantLocator);

        if (variants.length > 0) {
            console.log(`Bước 6: Tìm thấy ${variants.length} biến thể khác. Đang click chọn...`);
            await variants[0].click(); 
            
            // Đợi một chút để script của website cập nhật giá mới trên giao diện
            await driver.sleep(3000);
        } else {
            throw new Error("Không tìm thấy biến thể dung lượng khác để kiểm tra.");
        }

        // Bước 7: Lấy giá bán sau khi đã đổi biến thể
        const updatedPriceText = await webDriverUtil.getElementText(salePriceLocator);
        console.log(`Bước 7: Giá bán sau khi đổi biến thể: ${updatedPriceText.trim()}`);

        // Bước 8: Xác minh giá phải khác nhau
        if (initialPriceText.trim() !== updatedPriceText.trim()) {
            console.log('XÁC MINH: Giá đã thay đổi khớp với cấu hình mới.');
            console.log('==> KẾT QUẢ: TC22 [PASS]');
        } else {
            throw new Error(`LỖI: Giá không đổi (Vẫn là ${updatedPriceText}). Kiểm tra lại logic giá của web.`);
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC22 [FAIL]');
        console.error('Lỗi chi tiết:', error.message);
        process.exitCode = 1; 
    } finally {
        await webDriverUtil.quit();
    }
}

TC22();