const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC21() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC21: KIỂM TRA TÍNH ĐÚNG ĐẮN KHI ĐIỀU HƯỚNG ---');

        // Bước 1: Mở trang chủ
        await homePage.open();
        console.log('Bước 1: Trang chủ CellphoneS đã sẵn sàng.');

        // Bước 2: Tìm kiếm iPhone 15
        const keyword = 'iPhone 15';
        await homePage.searchForProduct(keyword);
        console.log(`Bước 2: Đã thực hiện tìm kiếm từ khóa "${keyword}".`);

        // Bước 3: Lấy toàn bộ tiêu đề sản phẩm đầu tiên từ thẻ h3
        const productInListLocator = By.xpath("//div[@class='product-list-filter']//h3");
        await webDriverUtil.waitForElement(productInListLocator, 10000);
        const expectedName = await webDriverUtil.getElementText(productInListLocator);
        console.log(`Bước 3: Tên sản phẩm ghi nhận tại danh sách: "${expectedName}"`);

        // Bước 4: Click vào sản phẩm để chuyển sang trang chi tiết
        await driver.findElement(productInListLocator).click();
        console.log('Bước 4: Đã click điều hướng vào trang chi tiết.');

        // Bước 5: Tìm tiêu đề h1 trong div.box-product-name tại trang mới
        const detailTitleLocator = By.xpath("//div[@class='box-product-name']//h1");
        await webDriverUtil.waitForElement(detailTitleLocator, 10000);
        const actualDetailName = await webDriverUtil.getElementText(detailTitleLocator);
        console.log(`Bước 5: Tên sản phẩm ghi nhận tại trang chi tiết: "${actualDetailName}"`);

        // Bước 6: Đối chiếu hai giá trị (không phân biệt hoa thường và khoảng trắng thừa)
        const isMatch = actualDetailName.toLowerCase().trim() === expectedName.toLowerCase().trim();

        if (isMatch) {
            console.log('XÁC MINH: Dữ liệu khớp 100%. Hệ thống mở đúng trang sản phẩm đã chọn.');
            console.log('==> KẾT QUẢ: TC21 [PASS]');
        } else {
            // Nếu không khớp hoàn toàn, thử kiểm tra xem có bao hàm nhau không (tránh lỗi do format text)
            if (actualDetailName.toLowerCase().includes(expectedName.toLowerCase())) {
                console.log('XÁC MINH: Tên sản phẩm trùng khớp phần chính. (Chấp nhận kết quả).');
                console.log('==> KẾT QUẢ: TC21 [PASS]');
            } else {
                throw new Error(`Sai lệch điều hướng! Danh sách là "${expectedName}" nhưng trang chi tiết hiện "${actualDetailName}"`);
            }
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC21 [FAIL]');
        console.error('Lỗi chi tiết:', error.message);
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC21();