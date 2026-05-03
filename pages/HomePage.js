const { By, Key } = require('selenium-webdriver');
const WebDriverUtil = require('../utils/WebDriverUtil');

class HomePage {
    constructor(driver) {
        this.driver = driver;
        this.webDriverUtil = new WebDriverUtil();
        this.webDriverUtil.driver = driver;

        // Định vị bằng data-slot để tránh sai sót do class quá dài
        this.searchBar = By.css('input[data-slot="input"]');
    }

    async open() {
        await this.webDriverUtil.navigateTo('https://cellphones.com.vn/');
    }

    async searchForProduct(keyword) {
        // Chờ ô tìm kiếm xuất hiện và nhập liệu
        await this.webDriverUtil.sendKeys(this.searchBar, keyword);
        const input = await this.webDriverUtil.waitForElement(this.searchBar);
        // Nhấn Enter để thực hiện tìm kiếm
        await input.sendKeys(Key.RETURN);
    }
}

module.exports = HomePage;