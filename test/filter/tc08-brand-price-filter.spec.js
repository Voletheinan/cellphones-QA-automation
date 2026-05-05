import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT, SMEMBER_URL } from '../../src/config/environment.js';
import { createDriver } from '../../src/support/driver.js';
import { hideCookieConsentIfPresent } from '../../src/support/overlays.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { getPersonalAccount } from '../../src/support/testData.js';

const LOGIN_IDENTIFIER_INPUT = 'input[type="email"], input[placeholder*="email"], input[placeholder*="Email"], input[placeholder*="số điện thoại"], input[placeholder*="Số điện thoại"], input[placeholder*="SĐT"], input[maxlength="10"], input[name*="email"], input[name*="phone"]';
const LOGIN_PASSWORD_INPUT = 'input[type="password"], input[placeholder*="mật khẩu"], input[placeholder*="Mật khẩu"]';

describe('TC08 - Lọc iPhone theo Sẵn hàng', function () {
  let browser;

  // Tạo browser mới cho từng test để trạng thái được tách biệt.
  beforeEach(async function () {
    browser = await createDriver();
  });

  // Lưu screenshot sau test rồi đóng browser.
  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC08 - Lọc iPhone theo Sẵn hàng', async function () {
    // Precondition: đăng nhập đúng tài khoản trước khi kiểm tra chức năng chính.
    await loginDirect();

    // Action: vào trang chủ, chọn danh mục Điện thoại, chọn iPhone, rồi chọn bộ lọc Sẵn hàng trên giao diện.
    await browser.get(BASE_URL);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
    await clickPhoneCategoryDirect();
    await browser.wait(until.urlContains('/mobile'), DEFAULT_TIMEOUT);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
    await clickIphoneBrandDirect();
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);
    await clickAvailableStockFilterDirect();
    await browser.wait(async () => isAvailableStockFilterActiveDirect(), DEFAULT_TIMEOUT);
    await waitUntilReady();
    await hideCookieConsentIfPresent(browser);

    const currentUrl = await browser.getCurrentUrl();
    const products = await getVisibleProductsDirect();
    const wrongBrandProducts = products.filter((product) => !/iphone|apple/i.test(product.name));

    // Expected: trang đang ở danh mục Điện thoại, hiển thị iPhone và bộ lọc Sẵn hàng đang active.
    expect(currentUrl, 'Fail: chọn danh mục Điện thoại nhưng URL không cập nhật').to.include('/mobile');
    expect(currentUrl, 'Fail: chưa áp dụng filter Sẵn hàng vào URL').to.match(/stock_available_id=/i);
    expect(products.length, 'Fail: filter iPhone + Sẵn hàng không trả về sản phẩm').to.be.greaterThan(0);
    expect(wrongBrandProducts, 'Fail: filter iPhone nhưng có sản phẩm sai hãng').to.have.length(0);
    expect(await isAvailableStockFilterActiveDirect(), 'Fail: nút Sẵn hàng chưa được chọn active').to.equal(true);
  });

  // Đợi trang tải đủ trước khi tìm/click element.
  async function waitUntilReady() {
    await browser.wait(async () => {
      const readyState = await browser.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, DEFAULT_TIMEOUT);
  }

  // Tìm element visible, tránh thao tác vào element ẩn cùng selector.
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

  // Click theo text hiển thị khi phần tử không có selector riêng ổn định.
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

  // Đăng nhập trước để các bộ lọc và trang danh mục hoạt động đúng điều kiện test.
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

  // Click danh mục Điện thoại trên trang chủ.
  async function clickPhoneCategoryDirect() {
    await browser.wait(async () => {
      const clicked = await browser.executeScript(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const candidates = Array.from(document.querySelectorAll('a[href], button, [role="button"], div, span'))
          .map((element) => {
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const href = element.href || element.closest('a[href]')?.href || '';
            const rect = element.getBoundingClientRect();

            if (!visible(element) || !/điện thoại|dien thoai/i.test(text) || !/\/mobile(\.html)?/i.test(href)) {
              return null;
            }

            return {
              element: element.closest('a[href]') || element,
              area: rect.width * rect.height,
              top: rect.top
            };
          })
          .filter(Boolean)
          .sort((left, right) => left.area - right.area || left.top - right.top);
        const target = candidates[0]?.element;

        if (!target) {
          return false;
        }

        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      });

      return clicked;
    }, DEFAULT_TIMEOUT);
  }

  // Chọn brand iPhone trong khu vực bộ lọc thương hiệu.
  async function clickIphoneBrandDirect() {
    await browser.executeScript('window.scrollTo(0, 0);');
    await browser.sleep(300);
    await browser.wait(async () => {
      const clicked = await browser.executeScript(() => {
        const normalizeText = (value) => `${value}`.replace(/\s+/g, ' ').trim().toLowerCase();
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const candidates = Array.from(document.querySelectorAll('a[href], button, [role="button"], label, div, span'))
          .map((element) => {
            const text = normalizeText(element.innerText || element.textContent || '');
            const href = element.href || element.closest('a[href]')?.href || '';
            const rect = element.getBoundingClientRect();
            const inBrandArea = rect.top > 260 && rect.top < 620 && rect.left < window.innerWidth * 0.85;
            const isIphoneBrand = text === 'iphone' || /\/mobile\/apple\.html/i.test(href);

            if (!visible(element) || !inBrandArea || !isIphoneBrand) {
              return null;
            }

            return {
              element: element.closest('a[href], button, [role="button"], label') || element,
              area: rect.width * rect.height,
              top: rect.top
            };
          })
          .filter(Boolean)
          .sort((left, right) => left.top - right.top || left.area - right.area);
        const target = candidates[0]?.element;

        if (!target) {
          return false;
        }

        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      });

      return clicked;
    }, DEFAULT_TIMEOUT);
  }

  // Chọn filter Sẵn hàng trên danh sách sản phẩm.
  async function clickAvailableStockFilterDirect() {
    await browser.wait(async () => {
      const clicked = await browser.executeScript(() => {
        const normalizeText = (value) => `${value}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const candidates = Array.from(document.querySelectorAll('button.btn-filter'))
          .map((element) => {
            const text = normalizeText(element.innerText || element.textContent || '');
            const rect = element.getBoundingClientRect();
            const isAvailableStockButton = text === 'san hang'
              && element.classList.contains('button__filter-parent')
              && rect.width >= 80
              && rect.width <= 180
              && rect.height >= 30
              && rect.height <= 60;

            if (!visible(element) || !isAvailableStockButton) {
              return null;
            }

            return {
              element,
              area: rect.width * rect.height,
              top: rect.top
            };
          })
          .filter(Boolean)
          .sort((left, right) => left.top - right.top || left.area - right.area);
        const target = candidates[0]?.element;

        if (!target) {
          return false;
        }

        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      });

      return clicked;
    }, DEFAULT_TIMEOUT);
  }

  // Kiểm tra cả nút filter, chip đang chọn và URL đều thể hiện trạng thái Sẵn hàng.
  async function isAvailableStockFilterActiveDirect() {
    return browser.executeScript(() => {
      const normalizeText = (value) => `${value}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const activeButton = Array.from(document.querySelectorAll('button.btn-filter.button__filter-parent.active'))
        .some((button) => visible(button) && normalizeText(button.innerText || button.textContent || '') === 'san hang');
      const activeChip = Array.from(document.querySelectorAll('.filter-sort__list-filter.filtered button.btn-filter.active'))
        .some((button) => visible(button) && normalizeText(button.innerText || button.textContent || '') === 'san hang');

      return activeButton && activeChip && /stock_available_id=/i.test(window.location.search);
    });
  }

  // Lấy một số sản phẩm đang hiển thị để assert tên và giá sau khi lọc.
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
