# CellphoneS QA Automation

Bo test tu dong hoa cho website `https://cellphones.com.vn/` bang JavaScript, Selenium WebDriver, Mocha va Chai.

## Cau truc thu muc

```text
cellphones-QA-automation/
  src/
    pages/              # Page Object Model
    utils/              # Driver, wait, screenshot helpers
    config.js
  data/
    README.md           # Huong dan tao du lieu local
    account.example.json
  test/
    helpers/setup.js    # Setup Chrome, Page Object va screenshot cuoi test
    tc01-homepage.spec.js
    tc02-valid-search.spec.js
    tc03-no-result-search.spec.js
    tc04-empty-search-boundary.spec.js
    tc05-long-search-boundary.spec.js
    tc06-script-payload-security.spec.js
    tc07-sort-price.spec.js
    tc08-newsletter-validation.spec.js
    tc09-login-validation.spec.js
    tc10-login-valid-account.spec.js
    tc11-responsive-small-viewport.spec.js
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

## 11 Test Cases

1. `test/tc01-homepage.spec.js` - Trang chu load dung HTTPS va hien thi o tim kiem.
2. `test/tc02-valid-search.spec.js` - Tim kiem keyword hop le `iphone 15` tra ve san pham.
3. `test/tc03-no-result-search.spec.js` - Tim kiem keyword khong ton tai tra ve 0 san pham va thong bao ro rang.
4. `test/tc04-empty-search-boundary.spec.js` - Boundary search rong khong duoc hien thi chu `null`.
5. `test/tc05-long-search-boundary.spec.js` - Boundary search 256 ky tu khong duoc tra ve trang bao tri.
6. `test/tc06-script-payload-security.spec.js` - Security input script khong duoc gay loi 403 va khong execute alert.
7. `test/tc07-sort-price.spec.js` - Sap xep `Gia thap` phai tang dan theo gia.
8. `test/tc08-newsletter-validation.spec.js` - Newsletter validate email va so dien thoai khong hop le.
9. `test/tc09-login-validation.spec.js` - Dang nhap voi so dien thoai khong hop le phai hien thi validation.
10. `test/tc10-login-valid-account.spec.js` - Dang nhap bang tai khoan hop le tu `data/account.local.json` hoac bien moi truong.
11. `test/tc11-responsive-small-viewport.spec.js` - Responsive layout viewport `200x800` khong duoc tran ngang, vuot viewport hoac chong lan header/navigation.

## Bug candidates de dua vao bao cao

- `TC04`: Search rong hien thi `Kết quả tìm kiếm cho: 'null'`, gay loi usability/data rendering.
- `TC05`: Search 256 ky tu co the tra ve trang `Website đang bảo trì`, gay loi boundary handling.
- `TC06`: Payload HTML/script co the bi day sang trang 403 thay vi hien thi thong bao input khong hop le, gay loi usability/security hardening.
- `TC11`: Viewport nho `200x800` lam trang bi horizontal overflow, co element vuot viewport.

Moi test deu co assertion bang Chai va screenshot tu dong trong thu muc `screenshots/` sau moi buoc quan trong va sau Pass/Fail.
