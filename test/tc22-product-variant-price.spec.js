import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC22 - Gia thay doi theo bien the san pham', function () {
  const context = useCellphonesTestContext();

  it('TC22 - Chon bien the dung luong khac phai cap nhat gia ban', async function () {
    await context.searchResultsPage.openWithQuery('iphone 15');
    await context.homePage.dismissCookieBannerIfPresent();
    await context.searchResultsPage.openFirstProduct();
    await context.productDetailPage.waitUntilLoaded();

    const initialPrice = await context.productDetailPage.getSalePrice();
    const variantSelected = await context.productDetailPage.chooseFirstInactiveStorageVariant();

    expect(variantSelected).to.equal(true);

    const updatedPrice = await context.productDetailPage.getSalePrice();
    await takeScreenshot(context.driver, 'TC22-product-variant-price');

    expect(updatedPrice).to.not.equal(initialPrice);
  });
});
