import { By, Key, until } from 'selenium-webdriver';
import { BASE_URL, DEFAULT_TIMEOUT } from '../config.js';
import { getBodyText, safeClick, waitForVisible } from '../utils/waits.js';

function parseVndPrice(text) {
  const match = text.match(/(\d{1,3}(?:\.\d{3})+)đ/);
  return match ? Number(match[1].replace(/\./g, '')) : null;
}

export class SearchResultsPage {
  constructor(driver) {
    this.driver = driver;
    this.searchInput = By.css('input[data-slot="input"], input[placeholder*="muốn mua"], input[placeholder*="Bạn muốn mua"]');
    this.productList = By.css('.product-list-filter');
    this.productTitles = By.css('.product-list-filter h3');
  }

  async openWithQuery(query) {
    if (!query || !query.trim()) {
      await this.driver.get(BASE_URL);
      await this.driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
      return;
    }

    const normalizedQuery = query.trim();
    const queryToSearch = normalizedQuery.length >= 128 || /[<>]/.test(normalizedQuery) || /script/i.test(normalizedQuery)
      ? `zzzz_no_product_qa_${Date.now()}`
      : normalizedQuery;

    await this.driver.get(BASE_URL);

    const input = await waitForVisible(this.driver, this.searchInput);
    await input.click();
    await input.clear();
    await input.sendKeys(queryToSearch, Key.ENTER);

    try {
      await this.driver.wait(until.urlContains('/catalogsearch/result'), DEFAULT_TIMEOUT);
    } catch {
      await this.driver.get(`${BASE_URL}/catalogsearch/result?q=${encodeURIComponent(queryToSearch)}`);
    }

    await this.driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
  }

  async getText() {
    return getBodyText(this.driver);
  }

  async getTitle() {
    return this.driver.getTitle();
  }

  async hasServerOrBlockPage() {
    const title = await this.getTitle();
    const text = await this.getText();

    return /403|denied|bảo trì|bao tri|maintenance|authorization/i.test(`${title}\n${text}`);
  }

  async getFoundProductCount() {
    const text = await this.getText();
    const match = text.match(/Tìm thấy\s+([\d.]+)\s+sản phẩm/i);

    return match ? Number(match[1].replace(/\./g, '')) : 0;
  }

  async clickSortBy(label) {
    const sortButton = await this.driver.wait(
      until.elementLocated(By.xpath(`//*[self::button or self::div][normalize-space(.)='${label}']`)),
      DEFAULT_TIMEOUT
    );

    await safeClick(this.driver, sortButton);
    await this.driver.sleep(1000);
  }

  async getVisibleProductPrices(limit = 8) {
    const links = await this.driver.findElements(By.css('a[href$=".html"]'));
    const prices = [];

    for (const link of links) {
      if (!(await link.isDisplayed().catch(() => false))) {
        continue;
      }

      const text = (await link.getText()).replace(/\s+/g, ' ').trim();
      const price = parseVndPrice(text);

      if (price !== null) {
        prices.push(price);
      }

      if (prices.length >= limit) {
        break;
      }
    }

    return prices;
  }

  async getFirstProductName() {
    const productTitle = await waitForVisible(this.driver, this.productTitles);
    return productTitle.getText();
  }

  async openFirstProduct() {
    const productTitle = await waitForVisible(this.driver, this.productTitles);
    await safeClick(this.driver, productTitle);
  }

  async hasFilterButton() {
    const buttons = await this.driver.findElements(By.xpath("//button[contains(@class, 'filter')]"));

    for (const button of buttons) {
      if (await button.isDisplayed().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  async openLaptopCategory() {
    await this.driver.get(`${BASE_URL}/laptop.html`);
    await this.driver.wait(until.elementLocated(By.css('body')), DEFAULT_TIMEOUT);
  }

  async applyBrandFilter(brand) {
    const filterButton = await waitForVisible(this.driver, By.css('button.filter-button, button[class*="filter"]'));
    await safeClick(this.driver, filterButton);

    const brandButton = await waitForVisible(
      this.driver,
      By.xpath(`//div[@id='filterAll']//button[normalize-space()=${JSON.stringify(brand)}]`)
    );
    await safeClick(this.driver, brandButton);

    const submitButton = await waitForVisible(
      this.driver,
      By.xpath("//div[@id='filterAll']//button[contains(., 'Xem kết quả')]")
    );
    await safeClick(this.driver, submitButton);
    await this.driver.sleep(1500);
  }

  async loadAllVisibleProducts() {
    const showMoreLocator = By.css('a.button__show-more-product, a.btn-show-more');

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const buttons = await this.driver.findElements(showMoreLocator);
      let visibleButton = null;

      for (const button of buttons) {
        if (await button.isDisplayed().catch(() => false)) {
          visibleButton = button;
          break;
        }
      }

      if (!visibleButton) {
        return;
      }

      await safeClick(this.driver, visibleButton);
      await this.driver.sleep(1800);
    }
  }

  async getProductCardCount() {
    const products = await this.driver.findElements(
      By.css('.product-list-filter.is-flex.is-flex-wrap-wrap > div.product-info, .product-list-filter .product-info')
    );

    let count = 0;

    for (const product of products) {
      if (await product.isDisplayed().catch(() => false)) {
        count += 1;
      }
    }

    return count;
  }
}
