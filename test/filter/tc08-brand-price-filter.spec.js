import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { hideCookieConsentIfPresent } from '../../src/support/overlays.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { getPersonalAccount } from '../../src/support/testData.js';

const LOGIN_IDENTIFIER_INPUT = 'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="số điện thoại"], input[placeholder*="Số điện thoại"], input[placeholder*="SĐT"], input[maxlength="10"], input[name*="email"], input[name*="phone"]';
const LOGIN_PASSWORD_INPUT = 'input[type="password"], input[placeholder*="mật khẩu"], input[placeholder*="Mật khẩu"]';

describe('TC08 - Lọc theo hãng và giá', function () {
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

  it('TC08 - Lọc theo hãng và giá', async function () {
    // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
    await loginDirect();

    // Action: chọn hãng Apple và khoảng giá 15 - 20 triệu.
    await browser.get(`${BASE_URL}/mobile/apple.html?price=15000000-20000000`);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const products = await getVisibleProductsDirect();
    const wrongBrandProducts = products.filter((product) => !/iphone|apple/i.test(product.name));
    const prices = products.map((product) => parseVndPrice(`${product.name} ${product.price}`)).filter(Boolean);
    const pricesOutsideRange = prices.filter((price) => price < 15000000 || price > 20000000);

    // Expected: sản phẩm đúng hãng Apple và trong khoảng giá đã chọn.
    expect(products.length, 'Fail: filter Apple + giá không trả về sản phẩm').to.be.greaterThan(0);
    expect(wrongBrandProducts, 'Fail: filter Apple nhưng có sản phẩm sai hãng').to.have.length(0);
    expect(pricesOutsideRange, 'Fail: filter giá 15-20 triệu nhưng có sản phẩm ngoài khoảng giá').to.have.length(0);
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

function parseVndPrice(text) {
  const match = `${text}`.match(/(\d{1,3}(?:\.\d{3}){1,}|\d{4,})\s*(?:đ|₫)/i);
  return match ? Number(match[1].replace(/\./g, '')) : null;
}
