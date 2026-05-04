import { expect } from 'chai';
import { takeScreenshot } from '../../src/support/screenshot.js';
import { useCellphonesTestContext } from '../helpers/setup.js';

describe('TC12 - Goi y tim kiem autocomplete', function () {
  const context = useCellphonesTestContext();

  it('TC12 - Nhap keyword hop le phai hien thi khung goi y lien quan', async function () {
    await context.homePage.open();
    await context.homePage.dismissCookieBannerIfPresent();
    await context.homePage.typeSearchKeyword('iphone');
    await takeScreenshot(context.driver, 'TC12-search-autocomplete');

    const suggestionText = await context.homePage.getAutocompleteText();

    expect(suggestionText.toLowerCase()).to.include('iphone');
    expect(suggestionText).to.match(/Có phải bạn muốn tìm|Sản phẩm gợi ý|Khách hàng thường tìm kiếm/i);
  });
});
