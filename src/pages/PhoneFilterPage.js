import { until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT } from '../config/environment.js';
import { clickBestMatch, waitUntilReady } from '../support/domActions.js';
import { hideCookieConsentIfPresent } from '../support/overlays.js';

export class PhoneFilterPage {
  constructor(driver) {
    this.driver = driver;
  }

  async openHome() {
    await this.driver.get(BASE_URL);
    await this.ready();
  }

  async ready() {
    await waitUntilReady(this.driver);
    await hideCookieConsentIfPresent(this.driver);
  }

  async openPhoneCategory() {
    await clickBestMatch(this.driver, {
      selector: 'a[href], button, [role="button"], div, span',
      text: 'điện thoại|dien thoai',
      href: '/mobile(?:\\.html)?(?:$|[?#])',
      sortBy: 'smallest'
    });
    await this.driver.wait(until.urlContains('/mobile'), DEFAULT_TIMEOUT);
    await this.ready();
  }

  async selectIphoneBrand() {
    await this.driver.executeScript('window.scrollTo(0, 0);');
    await this.driver.sleep(300);

    await clickBestMatch(this.driver, {
      selector: 'a[href], button, [role="button"], label, div, span',
      text: '^iphone$',
      href: '/mobile/apple\\.html',
      area: 'brand'
    });
    await this.ready();
  }

  async selectAvailableStock() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await clickBestMatch(this.driver, {
        selector: 'button.btn-filter',
        text: '^san hang$',
        requiredClass: 'button__filter-parent',
        normalizeVietnamese: true
      });

      await this.driver.sleep(500);

      if (await this.hasAvailableStockFilter()) {
        break;
      }
    }

    await this.driver.wait(() => this.hasAvailableStockFilter(), DEFAULT_TIMEOUT);
    await this.ready();
  }

  async currentUrl() {
    return this.driver.getCurrentUrl();
  }

  async hasAvailableStockFilter() {
    return this.driver.executeScript(() => {
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

  async visibleProducts(limit = 12) {
    return this.driver.executeScript((maxItems) => {
      const seen = new Set();
      const products = [];
      const links = Array.from(document.querySelectorAll('.product-list-filter a[href*=".html"], a[href*=".html"]'));

      for (const link of links) {
        const rect = link.getBoundingClientRect();
        const style = window.getComputedStyle(link);
        const text = (link.innerText || '').replace(/\s+/g, ' ').trim();
        const name = (link.querySelector('h3, [class*="name"], [class*="title"]')?.innerText || text).replace(/\s+/g, ' ').trim();
        const price = text.match(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:đ|₫)/i)?.[0] || '';
        const href = link.href;

        if (href && name && price && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && !seen.has(href) && !/tin-tuc|news|phu-kien|sim-so/i.test(href)) {
          seen.add(href);
          products.push({ name, href, price });
        }

        if (products.length >= maxItems) {
          break;
        }
      }

      return products;
    }, limit);
  }
}
