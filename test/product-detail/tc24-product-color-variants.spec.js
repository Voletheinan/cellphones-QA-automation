import { expect } from 'chai';
import { takeScreenshot } from '../../src/utils/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC24 - Bien the mau sac san pham', function () {
  const context = useCellphonesTestContext();

  it('TC24 - Moi bien the mau phai co anh tuong ung hien thi', async function () {
    await context.searchResultsPage.openWithQuery('iphone 15');
    await context.homePage.dismissCookieBannerIfPresent();
    await context.searchResultsPage.openFirstProduct();
    await context.productDetailPage.waitUntilLoaded();

    const allVariantsHaveImages = await context.productDetailPage.verifyColorVariantsHaveMatchingImages();
    await takeScreenshot(context.driver, 'TC24-product-color-variants');

    expect(allVariantsHaveImages).to.equal(true);
  });
});
