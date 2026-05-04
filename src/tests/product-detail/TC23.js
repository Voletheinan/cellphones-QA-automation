const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC23() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC23: KIỂM TRA HIỂN THỊ BẢNG THÔNG SỐ KỸ THUẬT ---');

        // Bước 1: Mở trang chủ
        await homePage.open();
        await webDriverUtil.hideCookieConsentIfPresent();
        console.log('Bước 1: Trang chủ CellphoneS đã load.');

        // Bước 2: Tìm kiếm sản phẩm (vd: iPhone 15)
        const keyword = 'iPhone 15';
        await homePage.searchForProduct(keyword);
        console.log(`Bước 2: Đã thực hiện tìm kiếm từ khóa "${keyword}".`);

        // Bước 3: Click vào sản phẩm đầu tiên từ danh sách
        const productInListLocator = By.xpath("//div[@class='product-list-filter']//h3");
        await webDriverUtil.waitForElement(productInListLocator, 10000);
        await driver.findElement(productInListLocator).click();
        console.log('Bước 3: Đã điều hướng vào trang chi tiết sản phẩm.');

        // Bước 4: Đợi tiêu đề trang chi tiết xuất hiện để đảm bảo trang đã load xong
        const detailTitleLocator = By.xpath("//div[@class='box-product-name']//h1");
        await webDriverUtil.waitForElement(detailTitleLocator, 10000);

        // Bước 5: Kiểm tra khối thông số kỹ thuật có tồn tại không
        const specContainerLocator = By.xpath("//div[@id='thong-so-ky-thuat']");
        await webDriverUtil.waitForElement(specContainerLocator, 10000);
        const isContainerDisplayed = await driver.findElement(specContainerLocator).isDisplayed();
        console.log('Bước 5: Khối "Thông số kỹ thuật" đã hiển thị trên giao diện.');

        // Bước 6: Kiểm tra bảng dữ liệu chi tiết bên trong
        const specTableLocator = By.xpath("//table[@class='technical-content']");
        const specTable = await driver.findElement(specTableLocator);
        
        // Lấy tất cả các dòng (tr) trong bảng để kiểm tra dữ liệu không rỗng
        const rows = await specTable.findElements(By.css('tr'));
        console.log(`Bước 6: Tìm thấy bảng thông số với ${rows.length} mục dữ liệu.`);

        // Bước 7: Xác minh điều kiện Pass
        if (isContainerDisplayed && rows.length > 0) {
            console.log('XÁC MINH: Bảng thông số kỹ thuật tồn tại và có chứa nội dung chi tiết.');
            console.log('==> KẾT QUẢ: TC23 [PASS]');
        } else {
            throw new Error("Bảng thông số kỹ thuật hiển thị nhưng không có dữ liệu bên trong.");
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC23 [FAIL]');
        console.error('Lỗi chi tiết:', error.message);
        process.exitCode = 1; 
    } finally {
        await webDriverUtil.quit();
    }
}

TC23();