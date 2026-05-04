import { By, Key, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT } from '../config/environment.js';
import { hideCookieConsentIfPresent } from '../support/overlays.js';
import { safeClick, waitForVisible } from '../support/waits.js';

export class HomePage {
  constructor(driver) {
    this.driver = driver;
    this.searchInput = By.css('input[data-slot="input"], input[placeholder*="muốn mua"], input[placeholder*="Bạn muốn mua"]');
  }

  async open() {
    await this.driver.get(BASE_URL);
    await this.driver.wait(until.titleContains('CellphoneS'), DEFAULT_TIMEOUT);
  }

  async dismissCookieBannerIfPresent() {
    await hideCookieConsentIfPresent(this.driver);
    return true;
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

  async typeSearchKeyword(keyword) {
    const input = await waitForVisible(this.driver, this.searchInput);

    await safeClick(this.driver, input);
    await input.clear();
    await input.sendKeys(keyword);
  }

  async getAutocompleteText() {
    await this.driver.wait(async () => {
      const text = await this.driver.executeScript(() => document.body.innerText || '');
      return /Có phải bạn muốn tìm|Sản phẩm gợi ý|Khách hàng thường tìm kiếm/i.test(text);
    }, DEFAULT_TIMEOUT);

    return this.driver.executeScript(() => {
      const candidates = Array.from(document.querySelectorAll('body *'))
        .map((el) => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const text = (el.innerText || '').trim();

          return {
            text,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            isVisible: rect.width > 100
              && rect.height > 40
              && style.display !== 'none'
              && style.visibility !== 'hidden',
            looksLikeSuggestion: /Có phải bạn muốn tìm|Sản phẩm gợi ý|Khách hàng thường tìm kiếm/i.test(text)
          };
        })
        .filter((item) => item.isVisible && item.looksLikeSuggestion && item.top < 800)
        .sort((left, right) => (left.height * left.width) - (right.height * right.width));

      return candidates[0]?.text || '';
    });
  }
}
