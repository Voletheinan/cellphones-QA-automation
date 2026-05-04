import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC21 - Dieu huong tu ket qua tim kiem sang chi tiet san pham', function () {
  const context = useCellphonesTestContext();

  it('TC21 - Click san pham dau tien phai mo dung trang chi tiet', async function () {
    await context.searchResultsPage.openWithQuery('iphone 15');
    await context.homePage.dismissCookieBannerIfPresent();

    const expectedName = await context.searchResultsPage.getFirstProductName();
    await context.searchResultsPage.openFirstProduct();
    await context.productDetailPage.waitUntilLoaded();
    await takeScreenshot(context.driver, 'TC21-product-detail-navigation');

    const actualName = await context.productDetailPage.getTitle();
    const normalizedExpectedName = expectedName.toLowerCase().trim();
    const normalizedActualName = actualName.toLowerCase().trim();

    expect(normalizedActualName).to.satisfy((name) => (
      name === normalizedExpectedName
      || name.includes(normalizedExpectedName)
      || normalizedExpectedName.includes(name)
    ));
  });
});
