# CellphoneS QA Automation

Bo test tu dong hoa cho `https://cellphones.com.vn/` bang JavaScript, Selenium WebDriver, Mocha va Chai.

## Nguyen tac code test

- Moi test case ghi ro `Action`, `Expected` va fail condition ngay trong cac `expect(...)`.
- TC01 den TC10 khong import `src/helpers/*`; Selenium action duoc viet truc tiep trong tung file spec.
- Input test quan trong duoc viet truc tiep trong test case de de doc va de bao tri.

## Cau truc hien tai

```text
cellphones-QA-automation/
  src/
    config/environment.js
    data/account.local.json
    support/driver.js
    support/overlays.js
    support/screenshot.js
    support/testData.js
  test/
    auth/
      tc01-login-success.spec.js
      tc02-login-failed.spec.js
    search/
      tc03-valid-search.spec.js
      tc04-search-254-characters.spec.js
      tc05-no-result-search.spec.js
    product-detail/
      tc06-product-detail.spec.js
    filter/
      tc07-category-filter.spec.js
      tc08-brand-price-filter.spec.js
    cart/
      tc09-add-to-cart.spec.js
      tc10-update-cart-quantity.spec.js
  screenshots/
  reports/
```

## Chay test

```bash
npm test
```

Chay co hien trinh duyet de demo:

```bash
npm run test:headed
```

Tao HTML report:

```bash
npm run test:report
```

Chay rieng mot nhom:

```bash
npm run test:auth
npm run test:search
npm run test:cart
```

## Du lieu dang nhap

TC01 can tai khoan hop le va ten user du kien. Tao file local, khong commit:

```text
src/data/account.local.json
```

Theo mau:

```json
{
  "email": "YOUR_EMAIL",
  "phone": "YOUR_PHONE_NUMBER",
  "password": "YOUR_PASSWORD",
  "expectedName": "YOUR_DISPLAY_NAME"
}
```

Neu thieu tai khoan, TC01 va cac TC chuc nang sau dang nhap se khong chay dung. `expectedName` la tuy chon.

TC03 den TC10 se dang nhap bang `src/data/account.local.json` truoc khi kiem tra action chinh. TC01 la test dang nhap thanh cong, TC02 la test dang nhap that bai nen khong co pre-login.

## 10 Test Cases

1. `test/auth/tc01-login-success.spec.js` - Dang nhap thanh cong bang email/so dien thoai + password hop le, chuyen khoi login va hien thi ten user.
2. `test/auth/tc02-login-failed.spec.js` - Dang nhap that bai bang tai khoan sai, hien thi loi va khong redirect sai.
3. `test/search/tc03-valid-search.spec.js` - Tim kiem hop le `Samsung Galaxy S26 12GB 256GB`, co danh sach san pham lien quan.
4. `test/search/tc04-search-254-characters.spec.js` - Tim kiem chuoi 254 ky tu `a`, trang van phan hoi va khong crash/500/maintenance.
5. `test/search/tc05-no-result-search.spec.js` - DDT tim kiem keyword khong ton tai, khong co san pham va co thong bao khong tim thay.
6. `test/product-detail/tc06-product-detail.spec.js` - Click `Laptop ASUS Vivobook S 14 FLIP TP3402VA-LZ632W`, mo trang chi tiet dung san pham, co ten, gia, anh, mo ta/thong so.
7. `test/filter/tc07-category-filter.spec.js` - Chon danh muc Dien thoai, danh sach chi gom san pham dien thoai.
8. `test/filter/tc08-brand-price-filter.spec.js` - Loc hang Apple va khoang gia 15-20 trieu, san pham dung hang va dung gia.
9. `test/cart/tc09-add-to-cart.spec.js` - Them `Vong deo tay thong minh Huawei Band 11` vao gio, gio co dung san pham, gia va so luong.
10. `test/cart/tc10-update-cart-quantity.spec.js` - Sau khi dang nhap, vao gio hang co san pham san, bam `+` mot lan neu so luong hien tai nho hon 5.
