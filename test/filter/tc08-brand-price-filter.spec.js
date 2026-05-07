import { expect } from 'chai';
import { createDriver } from '../../src/support/driver.js';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { loginWithPersonalAccount } from '../../src/helpers/authActions.js';
import { PhoneFilterPage } from '../../src/pages/PhoneFilterPage.js';

describe('TC08 - Lọc iPhone theo Sẵn hàng', function () {
  let browser;
  let phoneFilterPage;

  beforeEach(async function () {
    browser = await createDriver();
    phoneFilterPage = new PhoneFilterPage(browser);
  });

  afterEach(async function () {
    if (!browser) {
      return;
    }

    await takeScreenshot(browser, `${this.currentTest.title}-${this.currentTest.state || 'unknown'}`, this);
    await browser.quit();
    browser = null;
  });

  it('TC08 - Lọc iPhone theo Sẵn hàng', async function () {
    await loginWithPersonalAccount(browser);

    // Dữ liệu kiểm tra: danh mục Điện thoại, hãng iPhone/Apple và filter Sẵn hàng.
    await phoneFilterPage.openHome();
    await phoneFilterPage.openPhoneCategory();
    await phoneFilterPage.selectIphoneBrand();
    await phoneFilterPage.selectAvailableStock();

    // Dữ liệu đối chiếu: URL sau lọc, danh sách sản phẩm và trạng thái active của filter.
    const currentUrl = await phoneFilterPage.currentUrl();
    const products = await phoneFilterPage.visibleProducts();
    const wrongBrandProducts = products.filter((product) => !/iphone|apple/i.test(product.name));

    // Kiểm tra + mong đợi: URL có filter, có sản phẩm, đúng hãng và nút Sẵn hàng active.
    expect(currentUrl, 'Fail: chọn danh mục Điện thoại nhưng URL không cập nhật').to.include('/mobile');
    expect(currentUrl, 'Fail: chưa áp dụng filter Sẵn hàng vào URL').to.match(/stock_available_id=/i);
    expect(products.length, 'Fail: filter iPhone + Sẵn hàng không trả về sản phẩm').to.be.greaterThan(0);
    expect(wrongBrandProducts, 'Fail: filter iPhone nhưng có sản phẩm sai hãng').to.have.length(0);
    expect(await phoneFilterPage.hasAvailableStockFilter(), 'Fail: nút Sẵn hàng chưa được chọn active').to.equal(true);
  });
});
