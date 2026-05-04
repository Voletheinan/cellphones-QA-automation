# Test Data

Thu muc nay chua du lieu test dung cho automation.

## Tai khoan dang nhap ca nhan

Khong nen dua mat khau that vao source code hoac file se nop kem bao cao. Hay tao file local theo mau:

```text
data/account.local.json
```

Noi dung:

```json
{
  "phone": "YOUR_PHONE_NUMBER",
  "password": "YOUR_PASSWORD"
}
```

File `data/account.local.json` da duoc them vao `.gitignore`, nen se khong bi day len Git. Khi can demo tren may ca nhan, helper `src/utils/testData.js` se doc file local nay.

Neu khong muon dung file JSON, co the set bien moi truong:

```bash
CELLPHONES_PHONE=YOUR_PHONE_NUMBER
CELLPHONES_PASSWORD=YOUR_PASSWORD
```
