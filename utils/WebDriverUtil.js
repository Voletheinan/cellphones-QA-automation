const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge'); // Chuyển từ chrome sang edge
const config = require('../config/config');

class WebDriverUtil {
    constructor() {
        this.driver = null;
    }

    // Khởi tạo WebDriver cho Edge
    async initDriver() {
        const options = new edge.Options()
            .addArguments('--window-size=1920,1080')
            .addArguments('--disable-popup-blocking')
            // Tránh bị phát hiện là bot trên các trang bảo mật như CellphoneS
            .addArguments('--disable-blink-features=AutomationControlled');
            
        this.driver = await new Builder()
            .forBrowser('MicrosoftEdge') // Chạy trên Edge
            .setEdgeOptions(options)
            .build();

        try { await this.driver.manage().window().maximize(); } catch (_) {}
        
        // Ẩn navigator.webdriver
        await this.driver.executeScript(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        );
        return this.driver;
    }

    async navigateTo(url) {
        await this.driver.get(url);
        // Chờ cho đến khi URL chứa domain mong muốn
        await this.driver.wait(until.urlContains(url.split('/')[2]), config.timeout);
    }

    async waitForElement(locator, timeout = config.timeout) {
        return await this.driver.wait(until.elementLocated(locator), timeout);
    }

    async clickElement(locator) {
        const element = await this.waitForElement(locator);
        await element.click();
    }

    async sendKeys(locator, text) {
        const element = await this.waitForElement(locator);
        await element.clear();
        await element.sendKeys(text);
    }

    async getElementText(locator) {
        const element = await this.waitForElement(locator);
        return await element.getText();
    }

    async quit() {
        if (this.driver) {
            await this.driver.quit();
        }
    }
}

module.exports = WebDriverUtil;