import { createDriver } from '../../src/support/driver.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { HomePage } from '../../src/pages/HomePage.js';
import { SearchResultsPage } from '../../src/pages/SearchResultsPage.js';
import { LoginPage } from '../../src/pages/LoginPage.js';
import { ProductDetailPage } from '../../src/pages/ProductDetailPage.js';

export function useCellphonesTestContext() {
  const context = {
    driver: null,
    homePage: null,
    loginPage: null,
    productDetailPage: null,
    searchResultsPage: null
  };

  beforeEach(async function () {
    context.driver = await createDriver();
    context.homePage = new HomePage(context.driver);
    context.loginPage = new LoginPage(context.driver);
    context.productDetailPage = new ProductDetailPage(context.driver);
    context.searchResultsPage = new SearchResultsPage(context.driver);
  });

  afterEach(async function () {
    if (!context.driver) {
      return;
    }

    // Screenshot cuoi moi test case giup lay minh chung Pass/Fail cho bao cao.
    const state = this.currentTest.state || 'unknown';
    await takeScreenshot(context.driver, `${this.currentTest.title}-${state}`);
    await context.driver.quit();
    context.driver = null;
  });

  return context;
}
