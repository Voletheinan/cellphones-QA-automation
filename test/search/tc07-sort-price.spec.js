import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC07 - Sap xep gia thap', function () {
  const context = useCellphonesTestContext();

  it('TC07 - Sap xep Gia thap phai hien thi san pham theo thu tu tang dan', async function () {
    // Functional test: kiem tra tinh dung dan cua bo sap xep theo gia.
    await context.searchResultsPage.openWithQuery('iphone 15');
    await context.searchResultsPage.clickSortBy('Giá thấp');
    await takeScreenshot(context.driver, 'TC07-sort-low-price');

    const prices = await context.searchResultsPage.getVisibleProductPrices(6);
    const sortedPrices = [...prices].sort((a, b) => a - b);

    expect(prices).to.have.length.greaterThan(3);
    expect(prices).to.deep.equal(sortedPrices);
  });
});
