const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge'); 
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
            .addArguments('--disable-blink-features=AutomationControlled');
            
        this.driver = await new Builder()
            .forBrowser('MicrosoftEdge') 
            .setEdgeOptions(options)
            .build();

        try { await this.driver.manage().window().maximize(); } catch (_) {}
        
        await this.driver.executeScript(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        );
        return this.driver;
    }

    // --- PHƯƠNG THỨC XỬ LÝ COOKIES & POPUP ---
    async hideCookieConsentIfPresent() {
        if (!this.driver) return;
        
        console.log("Đang quét và dọn dẹp cookies/popup tiềm ẩn...");
        for (let attempt = 0; attempt < 5; attempt += 1) {
            // 1. Tìm và nhấn các nút đồng ý bằng XPath[cite: 4]
            const cookieButtons = await this.driver.findElements(
                By.xpath("//button[contains(., 'Chấp nhận') or contains(., 'Đồng ý') or contains(., 'Accept') or contains(., 'OK')]")
            );

            for (const button of cookieButtons) {
                if (await button.isDisplayed().catch(() => false)) {
                    await this.driver.executeScript('arguments[0].click();', button);
                    await this.driver.sleep(300);
                    break;
                }
            }

            // 2. Chạy JavaScript để ẩn các thành phần đè lên giao diện (overlays)[cite: 4]
            await this.driver.executeScript(() => {
                const cookiePattern = /cookie|cookies|chấp nhận|đồng ý|accept|quyền riêng tư|privacy|tải app|tai app|liên hệ|lien he|hotline|chat|zalo/i;
                const elements = Array.from(document.querySelectorAll('body *'));

                elements.forEach((el) => {
                    const text = el.innerText || '';
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const isOverlay = style.position === 'fixed'
                        || style.position === 'sticky'
                        || Number(style.zIndex) > 10;
                    const isVisible = rect.width > 0
                        && rect.height > 0
                        && style.display !== 'none'
                        && style.visibility !== 'hidden';

                    if (isVisible && isOverlay && cookiePattern.test(text)) {
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('pointer-events', 'none', 'important');
                    }
                });

                // 3. Ẩn các banner nổi ở dưới cùng màn hình[cite: 4]
                elements.forEach((el) => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    const isBottomFloating = style.position === 'fixed'
                        && rect.bottom > window.innerHeight - 220
                        && rect.height < 220
                        && rect.width < window.innerWidth;

                    if (isBottomFloating) {
                        el.style.setProperty('display', 'none', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('pointer-events', 'none', 'important');
                    }
                });
            });

            await this.driver.sleep(300);
        }
    }

    async navigateTo(url) {
        await this.driver.get(url);
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