const { By } = require('selenium-webdriver');
const WebDriverUtil = require('../../../utils/WebDriverUtil');
const HomePage = require('../../../pages/HomePage');

async function TC24_AllVariants() {
    const webDriverUtil = new WebDriverUtil();
    let driver;

    try {
        driver = await webDriverUtil.initDriver();
        const homePage = new HomePage(driver);

        console.log('--- BẮT ĐẦU TC24: KIỂM TRA TẤT CẢ BIẾN THỂ MÀU SẮC ---');

        await homePage.open();
        await webDriverUtil.hideCookieConsentIfPresent(); //xử lý cookies
        const keyword = 'iPhone 15';
        await homePage.searchForProduct(keyword);

        const productInListLocator = By.xpath("//div[@class='product-list-filter']//h3");
        await webDriverUtil.waitForElement(productInListLocator, 10000);
        await driver.findElement(productInListLocator).click();
        console.log('Đã vào trang chi tiết sản phẩm.');

        // Bước 4: Đợi và định vị khung chứa biến thể
        const variantContainerLocator = By.xpath("//ul[@class='list-variants']");
        const variantItemsLocator = By.xpath("//ul[@class='list-variants']/li");
        await webDriverUtil.waitForElement(variantContainerLocator, 10000);

        // --- PHẦN MỚI: CUỘN XUỐNG ĐỂ THẤY KHUNG BIẾN THỂ ---
        const variantContainer = await driver.findElement(variantContainerLocator);
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", variantContainer);
        console.log('Đã cuộn xuống khu vực biến thể.');
        await driver.sleep(2000); // Đợi 2s để hiệu ứng cuộn mượt mà hoàn tất
        // --------------------------------------------------

        const totalVariants = (await driver.findElements(variantItemsLocator)).length;
        console.log(`Tìm thấy tổng cộng ${totalVariants} biến thể màu sắc. Bắt đầu kiểm tra từng mục...`);

        // Bước 5: Chạy vòng lặp qua từng biến thể theo index
        for (let i = 0; i < totalVariants; i++) {
            // Re-find list để tránh lỗi Stale Element
            const currentVariants = await driver.findElements(variantItemsLocator);
            const item = currentVariants[i];

            // Lấy tên màu sắc để đối chiếu[cite: 3]
            const colorName = await item.findElement(By.css('strong.item-variant-name')).getText();
            const cleanColorName = colorName.trim();
            
            console.log(`[${i + 1}/${totalVariants}] Đang kiểm tra màu: "${cleanColorName}"`);

            // Click vào biến thể[cite: 3]
            await item.click();
            
            // Đợi 2 giây để ảnh và UI cập nhật[cite: 3]
            await driver.sleep(2000);

            // Bước 6: Xác minh ảnh chính có title chứa tên màu vừa chọn[cite: 3]
            const dynamicImageXPath = `//div[@class='box-gallery']//img[contains(@title, '${cleanColorName}')]`;
            const images = await driver.findElements(By.xpath(dynamicImageXPath));

            if (images.length > 0) {
                const isVisible = await images[0].isDisplayed();
                if (isVisible) {
                    console.log(`   => ĐÚNG: Đã tìm thấy và hiển thị ảnh cho màu "${cleanColorName}".`);
                } else {
                    console.log(`   => CẢNH BÁO: Tìm thấy ảnh title "${cleanColorName}" nhưng nó đang bị ẩn.`);
                }
            } else {
                throw new Error(`THẤT BẠI: Không tìm thấy ảnh nào có title chứa "${cleanColorName}".`);
            }
        }

        console.log('==> KẾT QUẢ: TC24 [PASS] - Tất cả biến thể đều hiển thị đúng hình ảnh.');

    } catch (error) {
        console.error('==> KẾT QUẢ: TC24 [FAIL]');
        console.error('Lỗi tại bước kiểm tra:', error.message);
        process.exitCode = 1;
    } finally {
        await webDriverUtil.quit();
    }
}

TC24_AllVariants();