# 👑 دليل تكامل لوحة تحكم السوبر أدمن (Super Admin Integration Guide)

يقدم هذا الدليل توثيقاً شاملاً لجميع الواجهات الإيجابية (APIs) المخصصة **للسوبر أدمن (Super Admin)** لإدارة منصة فسحة بالكامل، وتشمل التقارير المالية، إحصائيات الداشبورد، إدارة الشركات والرحلات، ومتابعة العمولات والاشتراكات.

---

## 🔐 1. تسجيل الدخول والجلسة (Super Admin Auth)

* **الرابط**: `POST /api/v1/auth/login`
* **Body**:
```json
{
  "email": "admin@fosha.com",
  "password": "SuperAdminPassword123!"
}
```
* **تخزين التوكن**: يجب حفظ الـ `accessToken` وإرساله في جميع الطلبات التالية في الـ Headers:
  `Authorization: Bearer <ACCESS_TOKEN>`

---

## 📊 2. إحصائيات لوحة التحكم الرئيسية (Main Dashboard Stats)

* **الرابط**: `GET /api/v1/admin/stats`
* **وصف الاستجابة**: يرجع كائناً متكاملاً لشاشة لوحة التحكم الرئيسية متضمناً الكروت الكبيرة، جدول أحدث الحجوزات، وجدول أعلى الرحلات والشركات.

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "STATS_FETCHED",
  "data": {
    "companies": {
      "totalCompanies": 10,
      "activeCompanies": 8,
      "pendingCompanies": 1,
      "suspendedCompanies": 1
    },
    "bookings": {
      "totalBookings": 150,
      "pendingBookings": 14,
      "approvedBookings": 130,
      "rejectedBookings": 6,
      "cancelledBookings": 4,
      "confirmedBookingsToday": 18
    },
    "financials": {
      "totalGrossRevenue": 1235000,        // إجمالي المبيعات الكلية (Gross)
      "totalAdminCommissions": 148200,     // عمولات السوبر أدمن المحسوبة
      "totalCompanyNetPayouts": 1086800,   // صافي مستحقات الشركات
      "totalMonthlySubscriptions": 27000   // إجمالي الاشتراكات الشهرية للشركات
    },
    "topCompanies": [
      {
        "_id": "6a6b4bad6190648914d8e09c",
        "name": "شركة النيل للسياحة",
        "logo": "",
        "totalBookings": 45,
        "totalRevenue": 225000,
        "totalCommission": 22500
      }
    ],
    "topTrips": [
      {
        "_id": "6a6bb522bcf27f39324162bb",
        "title": "رحلة إلى دهب وشرم الشيخ الشاملة",
        "price": 2500,
        "bookingCount": 245,
        "totalRevenue": 612500,
        "company": {
          "_id": "6a6b4bad6190648914d8e09c",
          "name": "شركة النيل للسياحة",
          "logo": ""
        }
      }
    ],
    "recentBookings": [
      {
        "_id": "6a6bc1198b1a2c3d4e5f6789",
        "totalPrice": 5000,
        "status": "pending",
        "user": {
          "fullName": "أحمد محمود العبد",
          "phone": "+201099999999"
        },
        "trip": {
          "title": "رحلة إلى دهب وشرم الشيخ"
        },
        "company": {
          "name": "شركة فسحني شكرا"
        },
        "createdAt": "2026-07-30T20:00:00.000Z"
      }
    ]
  }
}
```

---

## 💰 3. التقرير المالي وأرباح السوبر أدمن الشهرية (Monthly Financial Report)

* **الرابط**: `GET /api/v1/admin/monthly-reports`
* **Query Params**: `month` (1-12) & `year` (مثل `?month=7&year=2026`)

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "data": {
    "period": {
      "month": 7,
      "year": 2026
    },
    "superAdminNetProfit": {
      "subscriptionEarnings": 500,        // أرباح اشتراكات الشركات
      "bookingCommissionsEarnings": 500,  // أرباح عمولات الحجوزات
      "approvedCommissionsOnly": 0,       // عمولات مقبولة
      "pendingCommissionsExpected": 500,  // عمولات معلقة متوقعة
      "totalNetProfit": 1000               // 🏆 صافي أرباح السوبر أدمن الكلية
    },
    "financialSummary": {
      "subscriptionsRevenue": 500,
      "bookingCommissionsRevenue": 500,
      "totalPlatformRevenue": 1000,
      "totalGrossSales": 5000,
      "totalCompanyNetPayouts": 4500
    }
  }
}
```

---

## 📈 4. إحصائيات الشركات الشهرية التفصيلية (Company Monthly Analytics)

* **الرابط**: `GET /api/v1/admin/company-monthly-stats`
* **Query Params**: `month`, `year`, `page`, `limit`, `search`

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "_id": "6a6b4bad6190648914d8e09c",
        "name": "شركة فسحني شكرا",
        "monthlySubscriptionFee": 500,
        "commissionType": "percentage",
        "commissionValue": 10,
        "monthlyStats": {
          "month": 7,
          "year": 2026,
          "monthlyTripsCount": 1,           // كم رحلة عملتها الشركة هذا الشهر
          "monthlyBookingsCount": 1,        // كم حجز
          "monthlyGrossSales": 5000,        // إجمالي المبيعات
          "monthlyAdminCommission": 500,    // عمولة المنصة
          "monthlyCompanyNet": 4500         // 💵 صافي الشركة المستلم ("خدت كام")
        }
      }
    ]
  }
}
```

---

## 🏢 5. إدارة الشركات (Company Management)

* **عرض الشركات**: `GET /api/v1/companies?search=...&governorate=...&status=active`
* **إضافة شركة جديدة وتعيين مديرها**: `POST /api/v1/companies`
```json
{
  "name": "شركة النيل للسياحة والرحلات",
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
* **تحديث عمولة أو اشتراك أو حالة شركة**: `PATCH /api/v1/companies/:id`
```json
{
  "commissionType": "percentage",
  "commissionValue": 12,
  "monthlySubscriptionFee": 600,
  "status": "active",
  "isFeatured": true
}
```

---

## 🌴 6. التحكم بالرحلات والحجوزات (Trips & Bookings Control)

* **عرض جميع الرحلات بالمنصة**: `GET /api/v1/trips`
* **تمييز رحلة كـ Featured**: `PATCH /api/v1/trips/:id` (إرسال `"isFeatured": true`)
* **حذف رحلة**: `DELETE /api/v1/trips/:id`
* **عرض جميع الحجوزات**: `GET /api/v1/bookings`
