# CellphoneS QA Automation

Bo test tu dong hoa cho website `https://cellphones.com.vn/` bang JavaScript, Selenium WebDriver, Mocha va Chai.

## Cau truc thu muc

```text
cellphones-QA-automation/
  src/
    config/
      environment.js    # URL, timeout, browser settings
    data/
      README.md         # Huong dan tao du lieu local
      account.example.json
    pages/              # Page Object Model
    support/            # Driver, wait, overlay, screenshot, test data helpers
  test/
    helpers/setup.js    # Setup Chrome, Page Object va screenshot cuoi test
    site/               # Trang chu, newsletter, responsive
    auth/               # Dang nhap va tai khoan
    search/             # Tim kiem, sap xep, loc danh sach san pham
    product-detail/     # Trang chi tiet san pham
  screenshots/          # Tu dong sinh khi chay test
  reports/              # Tu dong sinh khi chay test:report
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

Chay rieng nhom search/product:

```bash
npm run test:search-product
```

Chay rieng nhom site hoac auth:

```bash
npm run test:site
npm run test:auth
```

## 18 Test Cases

1. `test/site/tc01-homepage.spec.js` - Trang chu load dung HTTPS va hien thi o tim kiem.
2. `test/search/tc02-valid-search.spec.js` - Tim kiem keyword hop le `iphone 15` tra ve san pham.
3. `test/search/tc03-no-result-search.spec.js` - Tim kiem keyword khong ton tai tra ve 0 san pham va thong bao ro rang.
4. `test/search/tc04-empty-search-boundary.spec.js` - Boundary search rong khong duoc hien thi chu `null`.
5. `test/search/tc05-long-search-boundary.spec.js` - Boundary search 256 ky tu khong duoc tra ve trang bao tri.
6. `test/search/tc06-script-payload-security.spec.js` - Security input script khong duoc gay loi 403 va khong execute alert.
7. `test/search/tc07-sort-price.spec.js` - Sap xep `Gia thap` phai tang dan theo gia.
8. `test/site/tc08-newsletter-validation.spec.js` - Newsletter validate email va so dien thoai khong hop le.
9. `test/auth/tc09-login-validation.spec.js` - Dang nhap voi so dien thoai khong hop le phai hien thi validation.
10. `test/auth/tc10-login-valid-account.spec.js` - Dang nhap bang tai khoan hop le tu `src/data/account.local.json` hoac bien moi truong.
11. `test/site/tc11-responsive-small-viewport.spec.js` - Responsive layout viewport `200x800` khong duoc tran ngang, vuot viewport hoac chong lan header/navigation.
12. `test/search/tc12-search-autocomplete.spec.js` - Goi y tim kiem hien thi noi dung lien quan.
13. `test/search/tc13-search-filter-button.spec.js` - Kiem tra nut bo loc trong trang ket qua tim kiem.
14. `test/product-detail/tc21-product-detail-navigation.spec.js` - Click san pham dau tien mo dung trang chi tiet.
15. `test/product-detail/tc22-product-variant-price.spec.js` - Gia thay doi khi chon bien the dung luong.
16. `test/product-detail/tc23-product-specifications.spec.js` - Trang chi tiet hien thi bang thong so ky thuat.
17. `test/product-detail/tc24-product-color-variants.spec.js` - Bien the mau sac co anh san pham tuong ung.
18. `test/search/tc25-laptop-brand-filter.spec.js` - Loc laptop Apple va dem danh sach san pham.

## Bug candidates de dua vao bao cao

- `TC04`: Search rong hien thi `Kết quả tìm kiếm cho: 'null'`, gay loi usability/data rendering.
- `TC05`: Search 256 ky tu co the tra ve trang `Website đang bảo trì`, gay loi boundary handling.
- `TC06`: Payload HTML/script co the bi day sang trang 403 thay vi hien thi thong bao input khong hop le, gay loi usability/security hardening.
- `TC11`: Viewport nho `200x800` lam trang bi horizontal overflow, co element vuot viewport.

Moi test deu co assertion bang Chai va screenshot tu dong trong thu muc `screenshots/` sau moi buoc quan trong va sau Pass/Fail.
