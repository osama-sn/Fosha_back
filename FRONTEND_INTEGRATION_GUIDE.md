# 📖 الدليل الشامل لربط وتكامل فرونت إند منصة "فسحة" (Fosha Frontend Integration Guide)

أهلاً بك في الدليل الفني الشامل لربط تطبيق الموبايل / فرونت إند منصة **فسحة (Fosha)**.
تم إعداد هذا الدليل لمساعدة مطوري الفرونت إند وتطبيق الموبايل (Flutter / React Native / React / Next.js) على فهم واستخدام جميع الـ APIs وهيكلية النظام الموحدة.

---

## 📌 1. معلومات السيرفر والهيكلية العامة (Base Configuration)

* **رابط السيرفر الرئيسي (Base URL)**: `http://localhost:3000/api/v1`
* **نظام الأداء (Architecture)**: Multi-Tenant Architecture (سوبر أدمن + شركات الرحلات + العملاء).
* **نظام التشفير والتوكن**: JSON Web Token (JWT) باستخدام `Bearer Token`.

### 📚 أدلة الربط المخصصة حسب كل لوحة وتطبيق (Dedicated Role Guides):
1. 👑 **[دليل تكامل لوحة تحكم السوبر أدمن (SUPER_ADMIN_INTEGRATION_GUIDE.md)](file:///d:/programming/Back_end/Fosha_back/SUPER_ADMIN_INTEGRATION_GUIDE.md)**
2. 🏢 **[دليل تكامل لوحة تحكم شركة السياحة (COMPANY_ADMIN_INTEGRATION_GUIDE.md)](file:///d:/programming/Back_end/Fosha_back/COMPANY_ADMIN_INTEGRATION_GUIDE.md)**
3. 📱 **[دليل تكامل تطبيق وموقع العميل (USER_APP_INTEGRATION_GUIDE.md)](file:///d:/programming/Back_end/Fosha_back/USER_APP_INTEGRATION_GUIDE.md)**

---

## 🌐 2. الهيدرز المطلوبة وتعدد اللغات (Headers & i18n Localization)

### الهيدرز الأساسية بكل request:
```http
Authorization: Bearer <ACCESS_TOKEN>
Accept-Language: ar  (أو en لترجمة الرسائل للإنجليزية)
Content-Type: application/json
```

> [!TIP]
> **طريقة اختيار اللغة:**
> يمكن للفرونت إند إرسال اللغة إما عبر الهيدر `Accept-Language: ar` أو `Accept-Language: en` أو عبر Query Parameter في الرابط مثل: `?lang=ar`.

---

## 📐 3. شكل الاستجابة الموحد (Unified Response Standard)

جميع الـ Responses القادمة من السيرفر (سواء نجاح أو خطأ) تأتي بهيكل ثابت وموحد لتسهيل عرض الرسائل والتنبيهات للمستخدم:

### ✅ 1. استجابة النجاح (Success Response):
```json
{
  "success": true,
  "statusCode": 200,
  "code": "OPERATION_SUCCESS",
  "message": "تمت العملية بنجاح.",
  "data": {
    ...
  }
}
```

### ❌ 2. استجابة الخطأ (Error Response):
```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "فشل التحقق من البيانات.",
  "errors": [
    {
      "field": "email",
      "message": "يرجى إدخال بريد إلكتروني صالح."
    }
  ],
  "data": null
}
```

---

## 👥 4. جدول الأدوار والصلاحيات (RBAC Roles Matrix)

| الدور (Role) | الوصف والصلاحيات |
| :--- | :--- |
| **`user`** (عميل) | تصفح الشركات والرحلات والرحلات المميزة، حجز الرحلات، إضافة رحلات للمفضلة، وتقييم الرحلات والشركات. |
| **`company_admin`** (أدمن شركة) | إضافة وتحديث ورحلات شركته الخاصة، الموافقة والرفض على حجوزات رحلاته، تصفح تقييمات شركته، ومشاهدة لوحة تحكم أرباح الشركة. |
| **`super_admin`** (سوبر أدمن) | إنشاء وتعديل وحظر الشركات، تحديد نسبة العمولة والاشتراكات الشهرية، تفعيل وضع المميز (Featured)، وإحصائيات النظام المالية الشاملة. |

---

## 🔑 5. بيانات الحسابات الافتراضية للتجربة (Seed Accounts)

* **👑 Super Admin**:
  * **Email**: `admin@fosha.com`
  * **Password**: `AdminPassword123!`
* **🏢 Default Company Admin**:
  * **Email**: `admin@niletravel.com`
  * **Password**: `CompanyAdmin123!`

---

## 📑 6. تفاصيل الـ APIs المسارات (Detailed Endpoint Reference)

### 🔐 أولاً: الحسابات والهوية (Authentication)

#### 1. تسجيل حساب عميل جديد (`POST /auth/register`)
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "fullName": "أحمد محمود",
  "email": "ahmed@example.com",
  "phone": "+201012345678",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "governorate": "الإسكندرية"
}
```

#### 2. تسجيل الدخول (`POST /auth/login`)
- **Body**:
```json
{
  "email": "ahmed@example.com",
  "password": "Password123!"
}
```
- **Response Data**: يحتوي على `accessToken` و `refreshToken` وبيانات المستخدم (شاملة المحافظة `governorate`).

#### 3. تسجيل الدخول بجوجل (`POST /auth/google`)
> ⚠️ **تنبيه:** يقتصر على الحسابات المسجلة سابقاً بالنظام فقط.
- **Body**:
```json
{
  "idToken": "GOOGLE_ID_TOKEN_STRING"
}
```

#### 4. جلب البروفايل الحالي (`GET /auth/me`)
- **Auth Required**: `Bearer Token`

#### 5. تحديث البروفايل (`PUT /auth/profile`)
- **Body**:
```json
{
  "fullName": "أحمد محمود علي",
  "phone": "+201012345678",
  "governorate": "القاهرة"
}
```

#### 6. تغيير كلمة المرور (`PATCH /auth/change-password`)
- **Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecretPassword123!",
  "confirmPassword": "NewSecretPassword123!"
}
```

---

### 🏠 الهوم بيج والصفحة الرئيسية (Home Page API)

#### 1. API صفحة الهوم الشامل المجمع (`GET /home`)
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>` *(اختياري)*
- **Query Params**:
  - `governorate`: اسم المحافظة (في حال لم يكن المستخدم مسجلاً الدخول، مثلاً `?governorate=القاهرة`)
- **وصف الاستجابة**: يرجع كائن متكامل لصفحة الهوم بيج يحتوي على:
  - `userGovernorate`: المحافظة المستهدفة للمستخدم
  - `featuredTrips`: الرحلات المميزة
  - `governorateTrips`: الرحلات المنطلقة من أو المتوفرة في محافظة المستخدم
  - `featuredCompanies`: الشركات المميزة
  - `categories`: قائمة التصنيفات
  - `offers`: البانرات والعروض الترويجية النشطة

---

### 🏢 ثانياً: شركات الرحلات والسياحة (Companies)

#### 1. عرض قائمة الشركات والبحث فيها (`GET /companies`)
- **Query Params**:
  - `page`: رقم الصفحة (افتراضي 1)
  - `limit`: عدد العناصر (افتراضي 10)
  - `status`: حالة الشركة (`active`)
  - `sortBy`: الترتيب (`featured` لظهور المميزة أولاً، `rating` للتقييم، `newest`)
  - `search`: بحث بالاسم أو الوصف أو العنوان أو المحافظة
  - `governorate`: تصفية الشركات حسب المحافظة (مثلاً `?governorate=الإسكندرية`)
  - `minRating`: تصفية حسب الحد الأدنى للتقييم (مثلاً `?minRating=4`)

#### 2. جلب تفاصيل شركة برقمها (`GET /companies/:id`)

#### 3. إضافة شركة جديدة وإصدار حساب مديرها (`POST /companies`) — *Super Admin Only*
- **Body**:
```json
{
  "name": "شركة النيل للسياحة والرحلات",
  "description": "شركة متخصصة في رحلات النيل وسيناء والغردقة",
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

#### 4. تحديث بيانات وعمولات الشركة (`PATCH /companies/:id`) — *Super Admin / Company Admin*
- **Body**:
```json
{
  "governorate": "الإسكندرية",
  "commissionType": "percentage",
  "commissionValue": 12,
  "monthlySubscriptionFee": 600,
  "isFeatured": true,
  "status": "active"
}
```

#### 5. إضافة تقييم ومراجعة للشركة (`POST /companies/:id/reviews`) — *Client Only*
- **Body**:
```json
{
  "rating": 5,
  "comment": "تنظيم ممتاز ورحلات ممتازة جداً!"
}
```

#### 6. عرض تقييمات الشركة (`GET /companies/:id/reviews`)

---

### 🌴 ثالثاً: الرحلات والبحث المتقدم (Trips)

#### 1. تصفح الرحلات والبحث المتقدم بكل التفاصيل (`GET /trips`)
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>` *(اختياري لفلترة محافظة المستخدم تلقائياً)*
- **Query Params**:
  - `page`: 1
  - `limit`: 10
  - `search`: بحث عام بالكلمة المفتاحية (عنوان الرحلة، الوصف، نقطة الانطلاق، الوجهة)
  - `city` / `origin`: تصفية حسب نقطة الانطلاق أو المحافظة
  - `destination`: تصفية حسب وجهة الرحلة (مثل: شرم الشيخ، الغردقة، دهب)
  - `minPrice` & `maxPrice`: نطاق سعر الرحلة (مثلاً `?minPrice=500&maxPrice=3000`)
  - `minDate` / `startDate` & `maxDate` / `endDate`: نطاق تواريخ الرحلة (`YYYY-MM-DD`)
  - `minRating`: تصفية حسب الحد الأدنى لتقييم الرحلة (`?minRating=4`)
  - `category`: ID التصنيف أو الـ slug
  - `governorate`: تصفية الرحلات المنطلقة من المحافظة أو الشركات المسجلة فيها
  - `myGovernorateOnly`: تصفية الرحلات الخاصة بمحافظة المستخدم المسجل دخول فقط (`true`)
  - `sort`: `price_asc`, `price_desc`, `date_asc`, `date_desc`, `rating_desc`

#### 2. عرض الرحلات المميزة (`GET /trips/featured`)
- يرجع قائمة الرحلات المميزة (`isFeatured: true`) الخاصة بالشركات المشتركة في باقة الظهور.

#### 3. جلب تفاصيل رحلة كاملة لصفحة الرحلة (`GET /trips/:id`)
- **الاستجابة الهيكلية**:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "TRIP_FETCHED",
  "message": "تمت العملية بنجاح.",
  "data": {
    "trip": {
      "_id": "66a0123456789",
      "title": "رحلة دهب وسفاري ووادي الوشواشي",
      "description": "تفاصيل الرحلة الكاملة...",
      "origin": "القاهرة",
      "destination": "دهب",
      "price": 2500,
      "capacity": 30,
      "availableSeats": 12,
      "startDate": "2026-08-15T00:00:00.000Z",
      "endDate": "2026-08-19T00:00:00.000Z",
      "averageRating": 4.8,
      "reviewsCount": 15,
      "company": {
        "name": "شركة النيل للسياحة",
        "logo": "/uploads/logos/nile.png",
        "contactPhone": "+201012345678"
      },
      "category": {
        "_id": "66b...",
        "nameAr": "رحلات بحرية",
        "nameEn": "Sea Trips",
        "slug": "sea",
        "image": "/uploads/categories/sea.jpg"
      },
      "days": []
    },
    "reviews": [
      {
        "_id": "77b...",
        "rating": 5,
        "comment": "رحلة خيالية والتنظيم رائع جداً",
        "user": {
          "fullName": "محمد أحمد",
          "profileImage": "/uploads/profiles/user.jpg"
        },
        "createdAt": "2026-07-20T10:00:00.000Z"
      }
    ],
    "upcomingSchedules": [
      {
        "_id": "88c...",
        "title": "رحلة دهب الأفواج القادمة",
        "startDate": "2026-09-01T00:00:00.000Z",
        "price": 2600,
        "availableSeats": 20
      }
    ]
  }
}
```

#### 4. إضافة رحلة جديدة (`POST /trips`) — *Company Admin / Super Admin*
- **Content-Type**: `multipart/form-data` *(أو `application/json`)*
- **ملاحظة التصنيف (`category`)**: يقبل الـ Category ID، أو الـ Slug (مثل: `sea`, `safari`, `cultural`), أو الاسم بالعربي (مثل: `"رحلات بحرية"`).
- **Body / FormData**:
```json
{
  "title": "رحلة إلى دهب وشرم الشيخ",
  "description": "رحلة 4 أيام شاملة الإقامة والأنشطة البحرية وسفاري الشروق",
  "origin": "القاهرة",
  "destination": "دهب",
  "category": "sea",
  "price": 2500,
  "capacity": 30,
  "startDate": "2026-08-15T00:00:00.000Z",
  "endDate": "2026-08-19T00:00:00.000Z",
  "status": "published",
  "isFeatured": true,
  "included": ["الإقامة بالإفطار", "الانتقالات"],
  "excluded": ["المشروبات الشخصية"],
  "coverImage": "File (صورة الغلاف)",
  "gallery": "Files (صور المعرض)",
  "days": [
    {
      "dayNumber": 1,
      "title": "الوصول والتسكين بالفندق",
      "activities": [
        {
          "time": "10:00 AM",
          "title": "الوصول لدهب والتسكين",
          "location": "فندق دهب بلازا"
        }
      ]
    }
  ]
}
```

#### 5. تعديل وحذف رحلة (`PUT /trips/:id` & `DELETE /trips/:id`)

---

### 🎫 رابعاً: الحجوزات (Bookings)

#### 1. تقديم حجز جديد (`POST /bookings`) — *Client Only*
- **Body**:
```json
{
  "tripId": "66a0123456789abcdef01234",
  "numberOfSeats": 2,
  "notes": "يرجى توفير غرفتين متجاورين",
  "couponCode": "SUMMER2026"
}
```

#### 2. عرض حجوزات العميل الحالية (`GET /bookings/my`)

#### 3. عرض جميع الحجوزات (`GET /bookings`) — *Super Admin / Company Admin*
- للسوبر أدمن: يرجع جميع الحجوزات بكافة الشركات.
- لأدمن الشركة: يرجع فقط الحجوزات الخاصة برحلات شركته.

#### 4. الموافقة والرفض على الحجز (`PATCH /bookings/:id/approve` & `PATCH /bookings/:id/reject`)
- **Body للرفض**:
```json
{
  "rejectionReason": "عذراً، اكتملت السعة الإجمالية بالكامل."
}
```

---

### 📊 خامساً: لوحات التحكم والستاتسكس (Analytics Dashboards)

#### 1. داشبورد السوبر أدمن الشاملة (`GET /admin/stats`) — *Super Admin Only*
- **ترجع**:
  - إجمالي عدد الشركات والحالات (`active`, `pending`, `suspended`).
  - إجمالي المبيعات الكلية (`totalGrossRevenue`).
  - إجمالي عمولات السوبر أدمن المحسوبة (`totalAdminCommissions`).
  - إجمالي رسوم الاشتراكات الشهرية (`totalMonthlySubscriptions`).
  - قائمة أعلى 5 شركات مبيعاً وأعلى 5 رحلات إقبالاً.

#### 2. التقرير المالي والإيرادات الشهرية الشاملة (`GET /admin/monthly-reports`) — *Super Admin Only*
- **Query Params**: `month` (1-12) & `year` (مثل: `?month=7&year=2026`)
- **وصف الاستجابة**: يرجع تفاصيل الإيرادات الشهرية المحققة:
  - `subscriptionsRevenue`: إجمالي رسوم الاشتراكات الشهرية للشركات النشطة هذا الشهر.
  - `bookingCommissionsRevenue`: إجمالي عمولات الحجوزات المقبولة هذا الشهر.
  - `totalPlatformRevenue`: مجموع أرباح المنصة بالكامل لهذا الشهر (`subscriptionsRevenue + bookingCommissionsRevenue`).
  - `totalGrossSales`: إجمالي قيمة مبيعات الحجوزات المقبولة هذا الشهر.
  - `totalCompanyNetPayouts`: إجمالي صافي المبالغ المستحقة للشركات هذا الشهر.

#### 3. إحصائيات الشركات الشهرية التفصيلية (`GET /admin/company-monthly-stats`) — *Super Admin Only*
- **Query Params**: `month` (1-12) & `year` (مثل: `?month=7&year=2026`), `page`, `limit`, `search`
- **وصف الاستجابة**: يرجع قائمة الشركات شاملاً لكل شركة إحصائيات الشهر المني المحدد:
  - `monthlyTripsCount`: عدد الرحلات المنشورة التي أنشأتها الشركة هذا الشهر.
  - `monthlyBookingsCount`: عدد الحجوزات المقبولة للشركة هذا الشهر.
  - `monthlySeatsBooked`: عدد المقاعد المحجوزة هذا الشهر.
  - `monthlyGrossSales`: إجمالي مبيعات الشركة هذا الشهر.
  - `monthlyAdminCommission`: عمولة المنصة المستقطعة هذا الشهر.
  - `monthlyCompanyNet`: الصافي المالي المستلم للشركة هذا الشهر ("خد كام").

#### 4. داشبورد أرباح أدمن الشركة (`GET /admin/company-stats`) — *Company Admin Only*
- **ترجع**:
  - عدد رحلات وحجوزات الشركة وحالاتها.
  - إجمالي المبيعات، الصافي المتبقي للشركة بعد الخصم (`totalCompanyNetRevenue`) والعمولات المدفوعة.

---

### 🏷️ سادساً: التصنيفات، العروض والكوبونات (Categories, Offers & Coupons)

* `GET /categories`: عرض أقسام الرحلات.
* `POST /coupons/validate`: فحص كود الخصم كعميلقبل الحجز.
* `GET /offers`: عرض عروض وبنرات الهوم بيج.

---

### ❤️ سابعاً: المفضلة والإشعارات (Favorites & Notifications)

* `GET /favorites`: قائمة الرحلات المفضلة.
* `POST /favorites/toggle/:tripId`: إضافة / إزالة من المفضلة.
* `GET /notifications`: عرض الإشعارات مع زر `PATCH /notifications/read-all`.
* `PATCH /notifications/fcm-token`: تحديث رمز الجهاز (FCM Token) لإشعارات الموبايل.

---

## 🎯 7. نصائح وإرشادات هامة لمطور الفرونت إند

1. **التعامل مع التوكن**:
   - احفظ `accessToken` و `refreshToken` في Secure Storage في الموبايل.
   - عند استقبال خطأ `401 TOKEN_EXPIRED` قم باستدعاء `POST /auth/refresh-token` لتجديد الجلسة تلقائياً.
2. **عرض الأخطاء للمستخدم**:
   - في حال كان كود الاستجابة `VALIDATION_ERROR` يمكنك قراءة مصفوفة `errors` وعرض كل خطأ تحت الحقل المخصص له في شاشة التسجيل أو المدخلات.
3. **تطبيق الملف في Postman**:
   - يوجد كولكشن كامل وجاهز في المشروع باسم `Fosha_API_Postman_Collection.json` يمكنك استيراده لتجربة كافة الـ APIs مباشرة!
