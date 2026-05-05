import { expect } from 'chai';
import { By, Key, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { hideCookieConsentIfPresent } from '../../src/support/overlays.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { getPersonalAccount } from '../../src/support/testData.js';

const SEARCH_INPUT = 'input[data-slot="input"], input[placeholder*="muốn mua"], input[placeholder*="Bạn muốn mua"]';
const LOGIN_IDENTIFIER_INPUT = 'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="số điện thoại"], input[placeholder*="Số điện thoại"], input[placeholder*="SĐT"], input[maxlength="10"], input[name*="email"], input[name*="phone"]';
const LOGIN_PASSWORD_INPUT = 'input[type="password"], input[placeholder*="mật khẩu"], input[placeholder*="Mật khẩu"]';
const noResultSearchData = [
  'abcxyz123_not_exist',
  'zzzz_no_cellphones_result_987654'
];

describe('TC05 - Tìm kiếm không tồn tại', function () {
  let browser;

  beforeEach(async function () {
    browser = await createDriver();
  });

  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`);
    await browser.quit();
    browser = null;
  });

  noResultSearchData.forEach((keyword) => {
    it(`TC05 - DDT tìm kiếm không tồn tại: ${keyword}`, async function () {
      // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
      await loginDirect();

      // Action: tìm kiếm keyword chắc chắn không tồn tại theo data test.
      await browser.get(BASE_URL);
      await waitUntilReady();
      await hideCookieConsentIfPresent(browser);

      const input = await findVisibleElement(SEARCH_INPUT);
      await input.click();
      await input.clear();
      await input.sendKeys(keyword, Key.ENTER);

      try {
        await browser.wait(until.urlContains('/catalogsearch/result'), 8000);
      } catch {
        await browser.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent(keyword)}`);
      }

      await waitUntilReady();
      await hideCookieConsentIfPresent(browser);

      const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
      const text = await body.getText();
      const products = await browser.executeScript(() => {
        const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));

        return links.filter((link) => {
          const rect = link.getBoundingClientRect();
          const style = window.getComputedStyle(link);
          const text = (link.innerText || '').replace(/\s+/g, ' ').trim();
          const href = link.href;
          return href && text && /(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i.test(text) && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && !/tin-tuc|news|phu-kien|sim-so/i.test(href);
        });
      });

      // Expected: không có sản phẩm và có thông báo không tìm thấy.
      expect(products.length, `Fail: keyword ${keyword} không tồn tại nhưng vẫn hiển thị sản phẩm`).to.equal(0);
      expect(text, `Fail: keyword ${keyword} không có sản phẩm nhưng thiếu thông báo không tìm thấy`).to.match(/không tìm thấy|khong tim thay|không có kết quả|khong co ket qua|0\s+sản phẩm/i);
    });
  });

  async function waitUntilReady() {
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);
  }

  async function findVisibleElement(cssSelector) {
    await browser.wait(async () => {
      const elements = await browser.findElements(By.css(cssSelector));

      for (const element of elements) {
        if (await element.isDisplayed().catch(() => false)) {
          return true;
        }
      }

      return false;
    }, DEFAULT_TIMEOUT);

    const elements = await browser.findElements(By.css(cssSelector));

    for (const element of elements) {
      if (await element.isDisplayed().catch(() => false)) {
        return element;
      }
    }

    throw new Error(`Không tìm thấy element visible: ${cssSelector}`);
  }

  async function clickVisibleText(textPatterns) {
    await browser.wait(async () => browser.executeScript((patterns) => {
      const regexes = patterns.map((pattern) => new RegExp(pattern, 'i'));
      const target = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li')).find((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        return text && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && regexes.some((regex) => regex.test(text));
      });

      if (!target) {
        return false;
      }

      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    }, textPatterns), DEFAULT_TIMEOUT);
  }

  async function loginDirect() {
    const account = getPersonalAccount();

    if (!account.identifier || !account.password) {
      throw new Error('Thiếu tài khoản hợp lệ trong src/data/account.local.json');
    }

    await browser.get(`${SMEMBER_URL}/login`);
    await waitUntilReady();

    const identifierInput = await findVisibleElement(LOGIN_IDENTIFIER_INPUT);
    const passwordInput = await findVisibleElement(LOGIN_PASSWORD_INPUT);

    await identifierInput.clear();
    await identifierInput.sendKeys(account.identifier);
    await passwordInput.clear();
    await passwordInput.sendKeys(account.password);
    await clickVisibleText(['^đăng\\s+nhập$', '^dang\\s+nhap$', 'login']);

    await browser.wait(async () => {
      const currentUrl = await browser.getCurrentUrl();
      const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
      const text = await body.getText();
      return !currentUrl.includes('/login') && /đăng nhập thành công|dang nhap thanh cong/i.test(text);
    }, DEFAULT_TIMEOUT);
  }
});
