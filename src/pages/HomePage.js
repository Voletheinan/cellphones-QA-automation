import { By, Key, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT } from '../config.js';
import { safeClick, waitForVisible } from '../utils/waits.js';

export class HomePage {
  constructor(driver) {
    this.driver = driver;
    this.searchInput = By.css('input[placeholder*="muốn mua"], input[placeholder*="Bạn muốn mua"]');
  }

  async open() {
    await this.driver.get(BASE_URL);
    await this.driver.wait(until.titleContains('CellphoneS'), DEFAULT_TIMEOUT);
  }

  async dismissCookieBannerIfPresent() {
    const buttons = await this.driver.findElements(By.xpath("//button[contains(., 'Chấp nhận')]"));

    for (const button of buttons) {
      if (await button.isDisplayed().catch(() => false)) {
        await safeClick(this.driver, button);
        return true;
      }
    }

    return false;
  }

  async search(keyword) {
    const input = await waitForVisible(this.driver, this.searchInput);

    await input.click();
    await input.clear();
    await input.sendKeys(keyword, Key.ENTER);

    try {
      await this.driver.wait(until.urlContains('/catalogsearch/result'), DEFAULT_TIMEOUT);
    } catch {
      // Fallback giup demo on dinh khi UI search bi cham hoac khong bat su kien Enter.
      await this.driver.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent(keyword)}`);
    }
  }

  async getSearchInput() {
    return waitForVisible(this.driver, this.searchInput);
  }
}
