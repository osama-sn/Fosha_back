# 📱 دليل تكامل تطبيق وتجربة العميل (User App Integration Guide)

يقدم هذا الدليل توثيقاً شاملاً لجميع الواجهات (APIs) المخصصة **لتطبيق وموقع العميل (Client / Mobile App & Web)** لإنشاء حساب باختيار المحافظة، تصفح الهوم بيج المجمعة والبحث الذكي عن الرحلات، التفاصيل، الحجز، التقييم، المفضلة والإشعارات.

---

## 🔐 1. إنشاء الحساب وتحديث الملف الشخصي بالمحافظة (Auth & Profile)

### أ) تسجيل حساب جديد مع اختيار المحافظة (`POST /api/v1/auth/register`)
* **Body**:
```json
{
  "fullName": "أسامة عصام",
  "email": "osama@example.com",
  "phone": "+201099887766",
  "password": "UserPassword123!",
  "governorate": "القاهرة"
}
```

### ب) تسجيل الدخول (`POST /api/v1/auth/login`)
* **Body**:
```json
{
  "email": "osama@example.com",
  "password": "UserPassword123!"
}
```

### ج) جلب وتحديث بيانات الملف الشخصي والمحافظة (`GET /api/v1/auth/me` & `PUT /api/v1/auth/profile`)
* **Body للتحديث**:
```json
{
  "fullName": "أسامة عصام",
  "governorate": "الإسكندرية"
}
```

---

## 🏠 2. صفحة الهوم بيج المجمعة بطلب واحد (`GET /api/v1/home`)

* **الرابط**: `GET /api/v1/home`
* **Headers**: `Authorization: Bearer <ACCESS_TOKEN>` *(اختياري للزائر)*
* **Query Params**: `governorate` (مثل `?governorate=القاهرة` في حال لم يكن مسجلاً)
* **المكونات المرجعة بالـ Response**:
  - `userGovernorate`: محافظة العميل
  - `featuredTrips`: الرحلات المميزة
  - `governorateTrips`: رحلات محافظة المستخدم
  - `featuredCompanies`: الشركات المميزة
  - `categories`: الأقسام والتصنيفات (`sea`, `safari`, `cultural`...)
  - `offers`: البنرات والعروض الترويجية

---

## 🔍 3. البحث المتقدم والتصفية الذكية للرحلات (`GET /api/v1/trips`)

* **الرابط**: `GET /api/v1/trips`
* **Query Parameters المتاحة للبحث الفعال**:
  * `search`: بحث بالكلمة المفتاحية (عنوان الرحلة، الوصف، المدينة)
  * `origin` / `city`: التصفية بشرط مدينة الانطلاق
  * `destination`: التصفية بوجهة الرحلة (دهب، شرم، الغردقة...)
  * `governorate`: تصفية حسب رحلات المحافظة
  * `category`: تصفية حسب التصنيف (ObjectId أو Slug مثل `sea`/`safari`)
  * `minPrice` & `maxPrice`: نطاق السعر (مثلاً `?minPrice=500&maxPrice=3000`)
  * `minRating`: الحد الأدنى للتقييم
  * `sort`: الترتيب (`price_asc`, `price_desc`, `date_asc`, `rating_desc`)

---

## 🌴 4. صفحة تفاصيل الرحلة الشاملة (`GET /api/v1/trips/:id`)

يرجع هذا الـ API كائناً غنياً ومكتتملاً لصفحة تفاصيل الرحلة يحتوي على:
* **`trip`**: بيانات الرحلة كاملة + بيانات الشركة المُنظمة (`company`) والتصنيف (`category`).
* **`reviews`**: قائمة التقييمات والمراجعات مع صور وأسماء المراجعين.
* **`upcomingSchedules`**: رحلات الشركة القادمة لنفس الوجهة أو الشركة.

---

## 🎟️ 5. تقديم طلب حجز رحلة (`POST /api/v1/bookings`)

* **الرابط**: `POST /api/v1/bookings`
* **Body**:
```json
{
  "tripId": "6a6bb522bcf27f39324162bb",
  "numberOfSeats": 2,
  "notes": "يرجى توفير مقاعد جيدة بالأوتوبيس",
  "couponCode": "SUMMER2026"
}
```

### عرض حجوزاتي السابقة (`GET /api/v1/bookings/my`)
* يرجع قائمة حجوزات العميل وتفاصيل حالتها (`pending` قيد الانتظار / `approved` مقبولة / `rejected` مرفوضة).

---

## ⭐ 6. التقييمات والمفضلة والإشعارات (Reviews, Favorites & Notifications)

### أ) إضافة تقييم بعد الرحلة (`POST /api/v1/trips/:tripId/reviews`)
```json
{
  "rating": 5,
  "comment": "رحلة ممتازة وتنظيم رائع!"
}
```

### ب) إضافة / إزالة من المفضلة (`POST /api/v1/favorites/toggle/:tripId`)
### ج) عرض المفضلة (`GET /api/v1/favorites`)
### د) عرض الإشعارات (`GET /api/v1/notifications`)
### هـ) تحديث رمز الموبايل للإشعارات (`PATCH /api/v1/notifications/fcm-token`)
```json
{
  "fcmToken": "eXampleFcmToken123456"
}
```
