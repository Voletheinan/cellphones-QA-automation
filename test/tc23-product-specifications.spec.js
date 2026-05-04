import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC23 - Thong so ky thuat san pham', function () {
  const context = useCellphonesTestContext();

  it('TC23 - Trang chi tiet phai hien thi bang thong so co du lieu', async function () {
    await context.searchResultsPage.openWithQuery('iphone 15');
    await context.homePage.dismissCookieBannerIfPresent();
    await context.searchResultsPage.openFirstProduct();
    await context.productDetailPage.waitUntilLoaded();

    const specRowCount = await context.productDetailPage.getSpecificationRowCount();
    await takeScreenshot(context.driver, 'TC23-product-specifications');

    expect(specRowCount).to.be.greaterThan(0);
  });
});
