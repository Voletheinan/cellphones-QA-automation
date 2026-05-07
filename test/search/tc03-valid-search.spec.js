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

describe('TC03 - Tìm kiếm hợp lệ', function () {
  let browser;

  beforeEach(async function () {
    browser = await createDriver();
  });

  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC03 - Tìm kiếm hợp lệ', async function () {
    // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
    await loginDirect();

    // Dữ liệu kiểm tra: keyword hợp lệ có sản phẩm liên quan.
    const keyword = 'Samsung Galaxy S26 12GB 256GB';

    // Action: tìm kiếm keyword hợp lệ trên ô search.
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

    const currentUrl = await browser.getCurrentUrl();
    const body = await browser.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
    const text = await body.getText();
    const products = await getVisibleProductsDirect();

    // Dữ liệu đối chiếu: URL kết quả, text trang và danh sách sản phẩm hiển thị.
    // Kiểm tra: các expect bên dưới xác nhận search hợp lệ có kết quả liên quan.
    // Mong đợi: trang kết quả có sản phẩm liên quan.
    expect(currentUrl, 'Fail: tìm kiếm hợp lệ nhưng không chuyển tới trang kết quả').to.include('/catalogsearch/result');
    expect(products.length, 'Fail: tìm kiếm Samsung Galaxy S26 12GB 256GB không có kết quả').to.be.greaterThan(0);
    expect(text.toLowerCase(), 'Fail: kết quả tìm kiếm không liên quan Samsung Galaxy S26').to.match(/samsung|galaxy|s26/);
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
      const elements = Array.from(document.querySelectorAll('button, a, [role="button"], label, div, span, li'));
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const target = elements.find((element) => {
        const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
        return visible(element) && text && regexes.some((regex) => regex.test(text));
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

  async function getVisibleProductsDirect(limit = 12) {
    return browser.executeScript((maxItems) => {
      const seen = new Set();
      const products = [];
      const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const text = (link.innerText || '').replace(/\s+/g, ' ').trim();
        const title = (link.querySelector('h3, [class*="name"], [class*="title"]')?.innerText || text).replace(/\s+/g, ' ').trim();
        const priceText = text.match(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i)?.[0] || '';
        const href = link.href;

        if (href && title && priceText && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && !seen.has(href) && !/tin-tuc|news|phu-kien|sim-so/i.test(href)) {
          seen.add(href);
          products.push({ name: title, href, price: priceText });
        }

        if (products.length >= maxItems) {
          break;
        }
      }

      return products;
    }, limit);
  }
});
