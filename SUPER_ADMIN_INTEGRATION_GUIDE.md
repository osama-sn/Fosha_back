# 👑 دليل تكامل لوحة تحكم السوبر أدمن (Super Admin Integration Guide — V1)

يقدم هذا الدليل توثيقاً شاملاً لكافة الواجهات المخصصة **للسوبر أدمن (Super Admin)** لإدارة منصة **Rehala (رحالة / فسحة)** بالكامل وفقاً لمواصفات الإصدار الأول V1.

---

## 🔐 1. تسجيل الدخول والجلسة (Super Admin Auth)

* **الرابط**: `POST /api/v1/auth/login`
* **Body**:
```json
{
  "email": "admin@rehala.com",
  "password": "SuperAdminPassword123!"
}
```
* **Header المعتمد للطلبات**:
  `Authorization: Bearer <ACCESS_TOKEN>`

---

## 📊 2. لوحة التحكم الرئيسية (Main Dashboard)

* **الرابط**: `GET /api/v1/admin/stats`
* **المميزات**: يرجع كائناً متكاملاً لشاشة لوحة التحكم الرئيسية متضمناً الكروت المجمعة (الشركات، الرحلات النشطة، المستخدمين، الحجوزات، إجمالي مبيعات GMV، العمولات الكلية، العمولات المحصلة، والعمولات المتبقية)، بالإضافة إلى أحدث الحجوزات وآخر نشاطات النظام.

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "STATS_FETCHED",
  "data": {
    "companies": {
      "totalCompanies": 12,
      "activeCompanies": 10,
      "pendingCompanies": 1,
      "suspendedCompanies": 1
    },
    "users": {
      "totalUsers": 540,
      "regularUsers": 520,
      "totalCompanyAdmins": 18,
      "totalSuperAdmins": 2
    },
    "trips": {
      "totalTrips": 85,
      "publishedTrips": 60,
      "activeTrips": 60,
      "draftTrips": 15,
      "hiddenTrips": 5,
      "featuredTrips": 10
    },
    "bookings": {
      "totalBookings": 320,
      "pendingBookings": 15,
      "approvedBookings": 280,
      "rejectedBookings": 10,
      "cancelledBookings": 15,
      "confirmedBookingsToday": 12
    },
    "financials": {
      "totalGrossRevenue": 1500000,        // GMV (إجمالي قيمة الحجوزات)
      "totalAdminCommissions": 150000,     // إجمالي قيمة عمولات المنصة
      "collectedCommissions": 120000,     // 💵 العمولات المحصلة
      "remainingCommissions": 30000,      // ⏳ العمولات المتبقية
      "totalCompanyNetPayouts": 1350000,   // صافي مستحقات الشركات
      "totalMonthlySubscriptions": 30000   // الاشتراكات الشهرية
    },
    "topCompanies": [],
    "topTrips": [],
    "recentBookings": [],
    "recentActivities": [
      {
        "_id": "66bc119...",
        "action": "SETTLEMENT_PAYMENT_RECORDED",
        "userRole": "super_admin",
        "details": { "companyName": "شركة النيل", "amountPaid": 10000 },
        "createdAt": "2026-08-14T20:00:00.000Z"
      }
    ]
  }
}
```

---

## 🏢 3. إدارة الشركات (Company Management)

* **عرض الشركات**: `GET /api/v1/companies?status=all&search=...&page=1&limit=10`
* **عرض تفاصيل وأداء شركة**: `GET /api/v1/companies/:id`
* **إضافة شركة جديدة وتعيين حساب Company Admin**: `POST /api/v1/companies`
```json
{
  "name": "شركة النيل للسياحة",
  "contactPhone": "+201022334455",
  "contactEmail": "info@niletravel.com",
  "address": "القاهرة - مدينة نصر",
  "governorate": "القاهرة",
  "commissionType": "percentage",
  "commissionValue": 10,
  "monthlySubscriptionFee": 500,
  "isFeatured": true,
  "adminFullName": "أدمن شركة النيل",
  "adminEmail": "admin@niletravel.com",
  "adminPhone": "+201099887766",
  "adminPassword": "CompanyAdmin123!"
}
```
* **تعديل بيانات / نسبة عمولة / تفعيل / إيقاف / حظر شركة**: `PATCH /api/v1/companies/:id`
```json
{
  "commissionType": "percentage",
  "commissionValue": 12,
  "status": "suspended", // active | pending | suspended
  "isFeatured": false
}
```
* **مشاهدة رحلات الشركة**: `GET /api/v1/trips?company=:companyId`
* **مشاهدة حجوزات الشركة**: `GET /api/v1/bookings?company=:companyId`
* **مشاهدة تقييمات الشركة**: `GET /api/v1/companies/:id/reviews`

---

## 🚌 4. التحكم بالرحلات (Trips Control)

* **عرض جميع الرحلات**: `GET /api/v1/trips?status=all` (يرجع المقاعد وحالة الحجز لكل رحلة)
* **تعديل بيانات رحلة**: `PUT /api/v1/trips/:id`
* **التحكم في حالة وحظر/إخفاء الرحلة**: `PATCH /api/v1/admin/trips/:id/status`
```json
{
  "status": "hidden", // published | draft | hidden | cancelled | completed
  "isHidden": true
}
```
* **حذف رحلة**: `DELETE /api/v1/trips/:id`

---

## 🎫 5. التحكم بالحجوزات (Bookings Control)

* **عرض كل الحجوزات مع الفلترة والبحث**: `GET /api/v1/admin/bookings` أو `GET /api/v1/bookings`
  * **Query Params**: `status`, `paymentStatus`, `company`, `user`, `search`, `page`, `limit`
* **تفاصيل الحجز (يتضمن بيانات العميل كاملة وقيمة الحجز والعمولة)**: `GET /api/v1/bookings/:id`
* **تحديث حالة الدفع للحجز**: `PATCH /api/v1/admin/bookings/:id/payment-status`
```json
{
  "paymentStatus": "paid" // unpaid | paid | partially_paid | refunded
}
```

---

## 💰 6. العمولات والتصفية الشهرية (Commissions & Monthly Settlements)

* **عرض قائمة التصفية والعمولات الشهرية لكل الشركات**: `GET /api/v1/admin/settlements?month=8&year=2026`
### 📥 شكل الـ Response:
```json
{
  "success": true,
  "data": {
    "period": { "month": 8, "year": 2026 },
    "settlements": [
      {
        "_id": "66bc228...",
        "company": {
          "_id": "66bc01...",
          "name": "شركة النيل للسياحة",
          "commissionType": "percentage",
          "commissionValue": 10
        },
        "totalGrossSales": 100000,
        "totalCommissionAmount": 10000, // المبلغ المستحق
        "paidAmount": 6000,             // المبلغ المدفوع
        "remainingAmount": 4000,        // المبلغ المتبقي
        "status": "partially_paid",     // pending | partially_paid | settled
        "paymentHistory": [
          {
            "amount": 6000,
            "paymentDate": "2026-08-10T12:00:00.000Z",
            "paymentMethod": "bank_transfer",
            "referenceNumber": "TXN-998811",
            "notes": "دفعة جزئية عبر التحقيق البنكي"
          }
        ]
      }
    ]
  }
}
```

* **تسجيل دفعة تصفية للشركة (Record Company Payment)**: `POST /api/v1/admin/settlements/pay`
```json
{
  "companyId": "66bc01...",
  "month": 8,
  "year": 2026,
  "amount": 4000,
  "paymentMethod": "instapay",
  "referenceNumber": "INSTA-554433",
  "notes": "سداد باقي عمولة شهر أغسطس"
}
```

---

## 👥 7. إدارة المستخدمين (User Management)

* **عرض كافة المستخدمين مع إحصائيات الحجوزات والإنفاق**: `GET /api/v1/admin/users?page=1&limit=10&search=أحمد&role=user`
* **عرض تفاصيل مستخدم وحجوزاته**: `GET /api/v1/admin/users/:id`
* **حظر مستخدم (Block User)**: `PATCH /api/v1/admin/users/:id/block`
```json
{
  "reason": "مخالفة سياسة المنصة والتقييمات المسيئة"
}
```
* **إلغاء حظر مستخدم (Unblock User)**: `PATCH /api/v1/admin/users/:id/unblock`

---

## ⭐ 8. إدارة التقييمات (Reviews Control)

* **عرض كل التقييمات بالمنصة**: `GET /api/v1/admin/reviews?type=all` (`type` = `trip` | `company` | `all`)
* **إخفاء / إظهار التقييم المخالف**: `PATCH /api/v1/admin/reviews/:id/hide`
```json
{
  "type": "trip", // trip | company
  "isHidden": true,
  "reason": "تعليق يحتوي على ألفاظ غير لائمة"
}
```

---

## ⚙️ 9. إعدادات المنصة (Platform Settings)

* **عرض إعدادات وشروط المنصة الحالية (عام)**: `GET /api/v1/settings`
* **تحديث بيانات وإعدادات المنصة (Super Admin)**: `PUT /api/v1/settings`
```json
{
  "platformName": "Rehala - رحالة",
  "logo": "https://cdn.rehala.com/logo.png",
  "contactEmail": "support@rehala.com",
  "contactPhone": "+201000000000",
  "whatsAppNumber": "+201000000000",
  "defaultCommissionType": "percentage",
  "defaultCommissionValue": 10,
  "termsAndConditions": "الشروط والأحكام الخاصة بحجوزات رحالة...",
  "privacyPolicy": "سياسة الخصوصية وحماية البيانات...",
  "cancellationPolicy": "سياسة إلغاء الحجوزات وإعادة الأموال..."
}
```
