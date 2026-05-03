const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC03() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC03: TÌM KIẾM TỪ KHÓA KHÔNG CÓ KẾT QUẢ ---');

        // Bước 1: Truy cập trang chủ
        await homePage.open();
        console.log('Bước 1: Truy cập trang chủ thành công.');

        // Bước 2: Nhập từ khóa vô nghĩa và nhấn Enter
        const invalidKeyword = 'asdfghjkl12345';
        await homePage.searchForProduct(invalidKeyword);
        console.log(`Bước 2: Người dùng thực hiện tìm kiếm với chuỗi "${invalidKeyword}".`);

        // Bước 3: Đợi khung "no-result" hiển thị trên giao diện
        // Sử dụng đúng XPath bạn cung cấp
        const noResultBox = By.xpath("//div[@class='no-result']");
        await webDriverUtil.waitForElement(noResultBox, 10000);
        console.log('Bước 3: Khung thông báo "no-result" đã hiển thị.');

        // Bước 4: Lấy text hiển thị bên trong khung đó và xác minh
        const actualMessage = await webDriverUtil.getElementText(noResultBox);
        console.log(`Bước 4: Nội dung hiển thị thực tế: "${actualMessage}"`);

        // Xác minh nội dung có chứa chữ "Không có kết quả" (không phân biệt hoa thường)
        const expectedText = "Không có kết quả";
        if (actualMessage.toLowerCase().includes(expectedText.toLowerCase())) {
            console.log(`XÁC MINH: Thông báo chứa đúng nội dung "${expectedText}".`);
            console.log('==> KẾT QUẢ: TC03 [PASS]');
        } else {
            throw new Error(`Thông báo không khớp. Kỳ vọng chứa "${expectedText}" nhưng thực tế là: "${actualMessage}"`);
        }

    } catch (error) {
        console.error('==> KẾT QUẢ: TC03 [FAIL]');
        console.error('Chi tiết lỗi:', error.message);
        process.exitCode = 1;
    } finally {
        // Đóng trình duyệt
        await webDriverUtil.quit();
    }
}

TC03(); // Bạn có thể sửa thành TC03() để đồng nhất tên hàm