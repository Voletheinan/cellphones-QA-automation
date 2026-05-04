import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC04 - Boundary search rong', function () {
  const context = useCellphonesTestContext();

  it('TC04 - Boundary search rong khong duoc hien thi chu null cho nguoi dung', async function () {
    // Boundary Value Analysis: gia tri bien duoi cua o tim kiem la chuoi rong.
    await context.searchResultsPage.openWithQuery('');
    await takeScreenshot(context.driver, 'TC04-empty-search-boundary');

    const text = await context.searchResultsPage.getText();
    const foundCount = await context.searchResultsPage.getFoundProductCount();

    expect(foundCount).to.equal(0);
    expect(text).to.not.match(/Kết quả tìm kiếm cho:\s*'null'/i);
  });
});
