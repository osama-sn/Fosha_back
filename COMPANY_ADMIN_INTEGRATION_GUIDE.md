# 🏢 دليل تكامل لوحة تحكم شركة السياحة (Company Admin Integration Guide)

يقدم هذا الدليل توثيقاً لكافة الواجهات (APIs) المخصصة **لإدارة شركة السياحة والرحلات (Company Admin)** لإنشاء وإدارة رحلات الشركة الخاصة، التحكم بطلبات الحجوزات (قبول/رفض)، متابعة المبيعات، وتعديل ملف الشركة.

---

## 🔐 1. تسجيل الدخول (Company Admin Auth)

* **الرابط**: `POST /api/v1/auth/login`
* **Body**:
```json
{
  "email": "admin@fashny.com",
  "password": "CompanyPassword123!"
}
```
* **Header المعتمد للطلبات**: `Authorization: Bearer <ACCESS_TOKEN>`

---

## 📊 2. إحصائيات وأرباح الشركة (Company Dashboard & Profits)

* **الرابط**: `GET /api/v1/admin/company-stats`
* **وصف الاستجابة**: يرجع إحصائيات ورحلات ومبيعات وصافي أرباح الشركة الحالية بعد استقطاع عمولة المنصة.

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "COMPANY_STATS_FETCHED",
  "data": {
    "company": {
      "name": "شركة فسحني شكرا",
      "commissionType": "percentage",
      "commissionValue": 10,
      "monthlySubscriptionFee": 500,
      "subscriptionStatus": "active"
    },
    "trips": {
      "totalTrips": 5,
      "publishedTrips": 4,
      "draftTrips": 1
    },
    "bookings": {
      "totalBookings": 20,
      "pendingBookings": 3,
      "approvedBookings": 15,
      "rejectedBookings": 2
    },
    "financials": {
      "totalGrossRevenue": 50000,          // إجمالي المبيعات
      "totalAdminCommissionPaid": 5000,    // عمولة المنصة المدفوعة
      "totalCompanyNetRevenue": 45000      // 💵 صافي أرباح الشركة الفعلي
    }
  }
}
```

---

## 🌴 3. إضافة وتعديل رحلات الشركة (Manage Trips with File Uploads)

### أ) إضافة رحلة جديدة (`POST /api/v1/trips`)
* **Content-Type**: `multipart/form-data`
* **Form-Data Fields**:
  * `title`: "رحلة إلى دهب وشرم الشيخ" (Text)
  * `description`: "رحلة 4 أيام شاملة الإقامة والأنشطة" (Text)
  * `origin`: "القاهرة" (Text)
  * `destination`: "دهب" (Text)
  * `price`: "2500" (Text)
  * `capacity`: "30" (Text)
  * `startDate`: "2026-08-15T00:00:00.000Z" (Text)
  * `endDate`: "2026-08-19T00:00:00.000Z" (Text)
  * `category`: "sea" (Text - ObjectId أو Slug مثل sea/safari)
  * `status`: "published" (Text)
  * `included`: `'["الإقامة بالإفطار", "الانتقالات"]'` (JSON string)
  * `excluded`: `'["المشروبات"]'` (JSON string)
  * `days`: `'[{"dayNumber":1,"title":"الوصول والتسكين","activities":[{"time":"10:00 AM","title":"الوصول"}]}]'` (JSON string)
  * `coverImage`: صورة غلاف الرحلة (File)
  * `gallery`: صور معرض الرحلة (File Array)

### ب) عرض رحلات الشركة الخاصة فقط (`GET /api/v1/trips?status=published`)
* يتم تصفية الرحلات تلقائياً بناءً على الشركة المسجلة.

### ج) تعديل بيانات ورحلة قائمة (`PUT /api/v1/trips/:id`)
* **Content-Type**: `multipart/form-data` (يتم إرسال الحقول المراد تعديلها فقط).

### د) حذف رحلة (`DELETE /api/v1/trips/:id`)

---

## 🎟️ 4. إدارة طلبات الحجز والقبول والرفض (Bookings Control)

### أ) عرض طلبات الحجز الخاصة برحلات الشركة (`GET /api/v1/bookings`)
* **Query Params**: `status` (`pending`, `approved`, `rejected`), `page`, `limit`

### ب) قبول أو رفض طلب حجز (`PATCH /api/v1/bookings/:id/status`)
* **Body (قبول الحجز)**:
```json
{
  "status": "approved"
}
```
* **Body (رفض الحجز)**:
```json
{
  "status": "rejected",
  "rejectionReason": "عذراً، اكتمل عدد المقاعد المتاحة لهذه الرحلة"
}
```

---

## ⚙️ 5. تعديل بيانات ملف الشركة (Company Profile Settings)

* **الرابط**: `PUT /api/v1/companies/:id`
* **Body**:
```json
{
  "name": "شركة فسحني شكرا للسياحة",
  "description": "شركة متخصصة في رحلات البحر الأحمر وسيناء",
  "contactPhone": "+201011111111",
  "contactEmail": "info@fasheny.com",
  "address": "المنيا - كورنيش النيل",
  "governorate": "المنيا"
}
```

---

## 🏷️ 6. إدارة عروض الشركة (Company Offers)

تستطيع أدمن الشركة إنشاء وتحديث وحذف العروض الترويجية الخاصة بشركتها أو المرتبطة برحلاتها.

### أ) عرض كافة عروض الشركة (`GET /api/v1/offers/admin/all`)
* **Header**: `Authorization: Bearer <COMPANY_ADMIN_TOKEN>`
* يرجع فقط العروض التابعة لشركة الأدمن المسجل.

### ب) إنشاء عرض جديد (`POST /api/v1/offers`)
* **Content-Type**: `multipart/form-data`
* **Form-Data**:
  * `titleEn`: "Summer Discount 20%" (مطلوب)
  * `titleAr`: "خصم الصيف 20%" (مطلوب)
  * `descriptionEn`: "Special summer offer"
  * `descriptionAr`: "عرض خاص لفصل الصيف"
  * `image`: صورة العرض (مطلوب - File)
  * `trip`: `<TRIP_ID>` (اختياري - يربط العرض برحلة معينة للشركة)
  * `discountPercentage`: `20`
  * `promoCode`: `SUMMER20`
  * `startDate`: `2026-08-01`
  * `endDate`: `2026-08-31`
  * `priority`: `1`

### ج) تعديل عرض قائم (`PUT /api/v1/offers/:id`)
### د) حذف عرض (`DELETE /api/v1/offers/:id`)

---

## 🎁 7. إدارة كوبونات الخصم للشركة (Company Coupons)

تستطيع أدمن الشركة إنشاء كوبونات خصم تطبق خصيصاً على رحلات شركتها فقط.

### أ) إنشاء كوبون خصم جديد (`POST /api/v1/coupons`)
* **Header**: `Authorization: Bearer <COMPANY_ADMIN_TOKEN>`
* **Body**:
```json
{
  "code": "COMPANY20",
  "discountPercentage": 20,
  "maxDiscountAmount": 200,
  "minTripPrice": 500,
  "validUntil": "2026-12-31T23:59:59.000Z",
  "usageLimit": 50
}
```

### ب) عرض كوبونات الشركة (`GET /api/v1/coupons`)
* يرجع الكوبونات التي أنشأتها هذه الشركة فقط.

### ج) حذف كوبون (`DELETE /api/v1/coupons/:id`)

