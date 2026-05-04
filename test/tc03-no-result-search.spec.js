import { expect } from 'chai';
import { takeScreenshot } from '../src/utils/screenshot.js';
import { useCellphonesTestContext } from './helpers/setup.js';

describe('TC03 - Tim kiem keyword khong ton tai', function () {
  const context = useCellphonesTestContext();

  it('TC03 - Tim kiem keyword khong ton tai hien thi 0 san pham va thong bao ro rang', async function () {
    // Equivalence Partitioning: keyword khong hop le nhung van la input an toan.
    const keyword = `zzzz_no_product_qa_${Date.now()}`;

    await context.searchResultsPage.openWithQuery(keyword);
    await takeScreenshot(context.driver, 'TC03-search-no-result');

    const text = await context.searchResultsPage.getText();
    const foundCount = await context.searchResultsPage.getFoundProductCount();

    expect(foundCount).to.equal(0);
    expect(text).to.match(/Không có (kết quả|sản phẩm) bạn cần tìm/i);
  });
});
