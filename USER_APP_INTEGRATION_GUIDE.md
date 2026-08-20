# 📱 التوثيق الكامل والمطوّر لتطبيق وموقع العميل (Mobile & Web API Reference)

يقدم هذا التوثيق الشامل **لبرمجة وتكامل تطبيق الموبايل (Flutter / React Native / Native iOS & Android)** وجميع الواجهات المخصصة للعميل (User App) بأدق التفاصيل: العناوين (Endpoints)، أنواع الطلبات، الهيدرز (Headers)، المعاملات (Parameters)، صيغة الـ Body، الـ Response المتوقع، وأكواد الأخطاء لضمان بناء التطبيق وتجربة المستخدم بنسبة 100%.

---

## 🌐 1. القواعد العامة والتكوين الأساسي (Base Config & Standards)

### Base URL
```
http://localhost:5000/api/v1
```
*(أو رابط السيرفر المباشر)*

### Standard Headers
| Header Name | Type | Value / Description | Required |
|---|---|---|---|
| `Content-Type` | String | `application/json` (أو `multipart/form-data` للرفع) | نعم |
| `Authorization` | String | `Bearer <ACCESS_TOKEN>` | في الواجهات المحمية |
| `Accept-Language` | String | `ar` (الافتراضي) أو `en` لترجمة الرسائل | اختياري |

---

### 📦 الهيكل الموحد للاستجابة (Standard API Response Schema)

#### أ) استجابة النجاح (Success Response):
```json
{
  "statusCode": 200,
  "message": "DATA_FETCHED_SUCCESSFULLY",
  "data": { ... },
  "success": true
}
```

#### ب) استجابة الخطأ (Error Response):
```json
{
  "statusCode": 400,
  "message": "COMPLETED_BOOKING_REQUIRED_FOR_REVIEW",
  "data": null,
  "success": false
}
```

---

## 🔐 2. الحساب والملف الشخصي (Auth & User Profile)

### 2.1) تسجيل حساب جديد مع المحافظة (Register)
* **Endpoint**: `POST /auth/register`
* **Auth Required**: ❌ لا
* **Content-Type**: `multipart/form-data` (عند إرفاق صورة) أو `application/json`

#### Form / JSON Fields:
| Field Name | Type | Required | Description |
|---|---|---|---|
| `fullName` | String | نعم | الاسم الكامل للمستخدم |
| `email` | String | نعم | البريد الإلكتروني (فريد) |
| `phone` | String | نعم | رقم الموبايل (فريد) |
| `password` | String | نعم | كلمة المرور (6 أحرف على الأقل) |
| `governorate` | String | نعم | المحافظة (مثل: "القاهرة"، "الإسكندرية"، "الجيزة"...) |
| `profileImage` | File | اختياري | صورة البروفايل الشخصية |

#### Response (217 Created / 200 OK):
```json
{
  "statusCode": 201,
  "message": "USER_REGISTERED_SUCCESSFULLY",
  "data": {
    "user": {
      "_id": "685bc920f1882d21051b72a1",
      "fullName": "أسامة عصام",
      "email": "user@example.com",
      "phone": "+201099887766",
      "profileImage": "/uploads/profiles/user-123.jpg",
      "governorate": "القاهرة",
      "role": "user"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "success": true
}
```

---

### 2.2) تسجيل الدخول (Login)
* **Endpoint**: `POST /auth/login`
* **Auth Required**: ❌ لا
* **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "UserPassword123!"
}
```

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "LOGIN_SUCCESSFUL",
  "data": {
    "user": {
      "_id": "685bc920f1882d21051b72a1",
      "fullName": "أسامة عصام",
      "email": "user@example.com",
      "phone": "+201099887766",
      "governorate": "القاهرة",
      "role": "user"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "success": true
}
```

---

### 2.3) تسجيل الدخول عبر جوجل (Google Auth Login)
* **Endpoint**: `POST /auth/google`
* **Auth Required**: ❌ لا
* **Request Body**:
```json
{
  "idToken": "google_oauth_id_token_string..."
}
```

---

### 2.4) نسيت كلمة السر وإعادة الضبط (Forgot & Reset Password)
1. **طلب كود التحقق (OTP)**: `POST /auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```
2. **إعادة الضبط بكود التحقق**: `POST /auth/reset-password`
```json
{
  "email": "user@example.com",
  "otp": "482910",
  "newPassword": "NewSecurePassword123!"
}
```

---

### 2.5) جلب بيانات الملف الشخصي (Get Current User)
* **Endpoint**: `GET /auth/me`
* **Auth Required**: ✅ نعم (`Bearer <ACCESS_TOKEN>`)

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "PROFILE_FETCHED",
  "data": {
    "_id": "685bc920f1882d21051b72a1",
    "fullName": "أسامة عصام",
    "email": "user@example.com",
    "phone": "+201099887766",
    "profileImage": "/uploads/profiles/profile-123.jpg",
    "governorate": "القاهرة",
    "fcmTokens": ["token1", "token2"],
    "createdAt": "2026-08-18T21:00:00.000Z"
  },
  "success": true
}
```

---

### 2.6) تحديث بيانات الملف الشخصي والمحافظة (Update Profile)
* **Endpoint**: `PUT /auth/profile`
* **Auth Required**: ✅ نعم
* **Content-Type**: `multipart/form-data` أو `application/json`

#### Body / Form Fields:
```json
{
  "fullName": "أسامة عصام المعدل",
  "phone": "+201099887799",
  "governorate": "الإسكندرية"
}
```

---

### 2.7) تغيير كلمة المرور (Change Password)
* **Endpoint**: `PUT /auth/change-password`
* **Auth Required**: ✅ نعم
* **Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

### 2.8) تسجيل الخروج (Logout)
* **Endpoint**: `POST /auth/logout`
* **Auth Required**: ✅ نعم

---

## 🏠 3. صفحة الهوم بيج المجمعة (Home Screen Data)

### 3.1) جلب بيانات الهوم بيج كاملاً بطلب واحد
* **Endpoint**: `GET /home`
* **Auth Required**: 💡 اختياري (إذا كان مسجلاً يتم جلب رحلات محافظته تلقائياً)
* **Query Parameters**:
  - `governorate` (String): اسم المحافظة في حال كان العميل زائر غير مسجل (مثل `?governorate=القاهرة`)

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "HOME_DATA_FETCHED",
  "data": {
    "userGovernorate": "القاهرة",
    "featuredTrips": [
      {
        "_id": "685bc920f1882d21051b72b1",
        "title": "رحلة دهب وسانت كاترين VIP",
        "coverImage": "/uploads/trips/dahab.jpg",
        "price": 1850,
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-09-04T00:00:00.000Z",
        "durationDays": 4,
        "durationNights": 3,
        "availableSeats": 12,
        "averageRating": 4.9,
        "reviewsCount": 42,
        "isFavorite": true,
        "isBooked": false,
        "company": {
          "_id": "685bc920f1882d21051b7001",
          "name": "شركة رحلات مصر",
          "logo": "/uploads/companies/logo.png"
        }
      }
    ],
    "governorateTrips": [ ... ],
    "featuredCompanies": [
      {
        "_id": "685bc920f1882d21051b7001",
        "name": "شركة رحلات مصر",
        "logo": "/uploads/companies/logo.png",
        "coverImage": "/uploads/companies/cover.jpg",
        "averageRating": 4.8,
        "reviewsCount": 110,
        "governorate": "القاهرة"
      }
    ],
    "categories": [
      {
        "_id": "685bc920f1882d21051b7901",
        "nameAr": "رحلات بحرية",
        "nameEn": "Sea Trips",
        "slug": "sea",
        "image": "/uploads/categories/sea.png"
      }
    ],
    "offers": [
      {
        "_id": "685bc920f1882d21051b7999",
        "title": "خصم الصيف 20%",
        "image": "/uploads/offers/banner.png",
        "code": "SUMMER2026",
        "discountPercentage": 20
      }
    ]
  },
  "success": true
}
```

---

## 🔍 4. البحث المتقدم والتصفية الذكية للرحلات (Search & Filters)

### 4.1) البحث وتصفية الرحلات (Search & Filter Trips)
* **Endpoint**: `GET /trips`
* **Auth Required**: ❌ لا

#### Query Parameters المتاحة بالتفصيل:
| Parameter | Type | Description | Example |
|---|---|---|---|
| `search` | String | بحث بالكلمة المفتاحية (عنوان، وصف، مدينة) | `?search=دهب` |
| `destination` | String | التصفية بوجهة الرحلة | `?destination=شرم الشيخ` |
| `origin` / `city` | String | التصفية بمدينة الانطلاق | `?city=القاهرة` |
| `governorate` | String | التصفية برحلات المحافظة | `?governorate=الإسكندرية` |
| `category` | String | التصنيف (ObjectId أو Slug) | `?category=safari` |
| `minPrice` | Number | الحد الأدنى للسعر | `?minPrice=500` |
| `maxPrice` | Number | الحد الأقصى للسعر | `?maxPrice=3000` |
| `minDate` | Date | تاريخ البداية من | `?minDate=2026-09-01` |
| `maxDate` | Date | تاريخ البداية إلى | `?maxDate=2026-09-30` |
| `durationDays` | Number | عدد أيام الرحلة بالضبط | `?durationDays=3` |
| `minDuration` | Number | الحد الأدنى لأيام الرحلة | `?minDuration=2` |
| `maxDuration` | Number | الحد الأقصى لأيام الرحلة | `?maxDuration=5` |
| `minRating` | Number | الحد الأدنى للتقييم (1-5) | `?minRating=4` |
| `sort` | String | خيارات الترتيب | `price_asc`, `price_desc`, `date_asc`, `date_desc`, `rating_desc` |
| `page` | Number | رقم الصفحة (الافتراضي 1) | `?page=1` |
| `limit` | Number | عدد النتائج (الافتراضي 10) | `?limit=10` |

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "TRIPS_FETCHED",
  "data": {
    "trips": [
      {
        "_id": "685bc920f1882d21051b72b1",
        "title": "رحلة دهب وسانت كاترين VIP",
        "origin": "القاهرة",
        "destination": "دهب",
        "price": 1850,
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-09-04T00:00:00.000Z",
        "durationDays": 4,
        "durationNights": 3,
        "availableSeats": 12,
        "averageRating": 4.9,
        "reviewsCount": 42,
        "coverImage": "/uploads/trips/dahab.jpg",
        "company": {
          "_id": "685bc920f1882d21051b7001",
          "name": "شركة رحلات مصر",
          "logo": "/uploads/companies/logo.png"
        }
      }
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  },
  "success": true
}
```

---

## 🚌 5. صفحة تفاصيل الرحلة الشاملة (Trip Details Page)

### 5.1) جلب تفاصيل الرحلة بالـ ID
* **Endpoint**: `GET /trips/:id`
* **Auth Required**: ❌ لا

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "TRIP_DETAILS_FETCHED",
  "data": {
    "trip": {
      "_id": "685bc920f1882d21051b72b1",
      "title": "رحلة دهب وسانت كاترين VIP",
      "description": "استمتع بأجمل 4 أيام في دهب وتشلق على الرمال وصعود جبل موسى",
      "origin": "القاهرة",
      "destination": "دهب",
      "price": 1850,
      "capacity": 30,
      "availableSeats": 12,
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": "2026-09-04T00:00:00.000Z",
      "durationDays": 4,
      "durationNights": 3,
      "coverImage": "/uploads/trips/cover.jpg",
      "gallery": [
        "/uploads/trips/cover.jpg",
        "/uploads/trips/img1.jpg",
        "/uploads/trips/img2.jpg"
      ],
      "included": ["الإقامة بالفندق", "الانتقالات بأوتوبيسات حديثة", "وجبة الإفطار"],
      "excluded": ["الأنشطة الاختيارية", "المشروبات إضافية"],
      "cancelPolicy": "إلغاء مجاني قبل موعد الرحلة بـ 72 ساعة",
      "pickupPoints": [
        { "location": "ميدان عبد المنعم رياض - التحرير", "time": "05:00 AM" },
        { "location": "نادي السكة - مدينة نصر", "time": "05:30 AM" }
      ],
      "days": [
        {
          "dayNumber": 1,
          "title": "اليوم الأول: الوصول والتسكين بالفندق",
          "activities": [
            {
              "time": "02:00 PM",
              "title": "الوصول للفندق والتسكين",
              "description": "استلام الغرف والاستراحة",
              "location": "فندق دهب بلازا",
              "image": "/uploads/trips/hotel.jpg"
            }
          ]
        }
      ],
      "company": {
        "_id": "685bc920f1882d21051b7001",
        "name": "شركة رحلات مصر",
        "description": "شركة متخصصة في الرحلات الداخلية والمغامرات",
        "logo": "/uploads/companies/logo.png",
        "coverImage": "/uploads/companies/cover.jpg",
        "contactPhone": "+201012345678",
        "contactEmail": "info@company.com",
        "averageRating": 4.8,
        "reviewsCount": 110,
        "paymentMethods": {
          "vodafoneCash": { "number": "01012345678", "instructions": "حول المبلغ ثم ارفق الصورة" },
          "orangeCash": { "number": "", "instructions": "" },
          "etisalatCash": { "number": "", "instructions": "" },
          "bankTransfer": { "bankName": "CIB", "accountNumber": "100029384", "iban": "EG99000100000000100029384", "accountHolder": "شركة رحلات مصر", "instructions": "تحويل بنكي مباشر" },
          "cash": { "instructions": "الدفع كاش بمقر الشركة أو عند التجمع" }
        }
      }
    },
    "reviews": [
      {
        "_id": "685bc920f1882d21051b7888",
        "rating": 5,
        "comment": "رحلة ممتازة والتنظيم رائع جداً",
        "user": {
          "fullName": "محمد أحمد",
          "profileImage": "/uploads/profiles/user-55.jpg"
        },
        "createdAt": "2026-08-10T12:00:00.000Z"
      }
    ],
    "upcomingSchedules": [ ... ]
  },
  "success": true
}
```

---

## 🏢 6. بروفايل الشركة (Company Profile & Reviews)

### 6.1) جلب بروفايل الشركة
* **Endpoint**: `GET /companies/:id`
* **Auth Required**: ❌ لا

### 6.2) جلب تقييمات الشركة
* **Endpoint**: `GET /companies/:id/reviews?page=1&limit=10`
* **Auth Required**: ❌ لا

---

## 🎫 7. الحجز والدفع المباشر V1 (Booking & Payment Flow)

### الـ Flow التفاعلي على الموبايل:
```
Trip Details ➔ Pick Date ➔ Select Seats ➔ Enter Traveler Data ➔ Select Pickup Point ➔ Select Payment Method ➔ Review Summary ➔ Confirm
```

---

### 7.1) تقديم طلب الحجز (Create Booking)
* **Endpoint**: `POST /bookings`
* **Auth Required**: ✅ نعم (`Bearer <ACCESS_TOKEN>`)

#### Request Body:
```json
{
  "tripId": "685bc920f1882d21051b72b1",
  "numberOfSeats": 2,
  "pickupPoint": "ميدان عبد المنعم رياض - التحرير",
  "pickupTime": "05:00 AM",
  "paymentMethod": "vodafone_cash",
  "paymentNotes": "تم التحويل من رقم 01099887766",
  "notes": "يرجى توفير مقاعد متجورة بأول الأوتوبيس",
  "couponCode": "SUMMER2026",
  "passengers": [
    {
      "fullName": "أسامة عصام",
      "phone": "+201099887766",
      "age": 26,
      "gender": "male",
      "notes": "المسافر الرئيسي"
    },
    {
      "fullName": "علي عصام",
      "phone": "+201011223344",
      "age": 22,
      "gender": "male",
      "notes": "مسافر مرافق"
    }
  ]
}
```

#### القيم المتاحة لـ `paymentMethod`:
- `vodafone_cash` (فودافون كاش)
- `orange_cash` (أورانج كاش)
- `etisalat_cash` (اتصالات كاش)
- `bank_transfer` (تحويل بنكي)
- `cash` (دفع كاش / عند الوصول)

#### Response (201 Created):
```json
{
  "statusCode": 201,
  "message": "BOOKING_CREATED",
  "data": {
    "_id": "685bc920f1882d21051b7999",
    "user": "685bc920f1882d21051b72a1",
    "trip": "685bc920f1882d21051b72b1",
    "company": {
      "_id": "685bc920f1882d21051b7001",
      "name": "شركة رحلات مصر",
      "contactPhone": "+201012345678",
      "paymentMethods": { ... }
    },
    "numberOfSeats": 2,
    "totalPrice": 3700,
    "status": "pending",
    "paymentMethod": "vodafone_cash",
    "paymentStatus": "pending_verification",
    "pickupPoint": "ميدان عبد المنعم رياض - التحرير",
    "pickupTime": "05:00 AM",
    "passengers": [ ... ],
    "tripSnapshot": {
      "title": "رحلة دهب وسانت كاترين VIP",
      "coverImage": "/uploads/trips/cover.jpg",
      "origin": "القاهرة",
      "destination": "دهب",
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": "2026-09-04T00:00:00.000Z",
      "pricePerSeat": 1850
    },
    "createdAt": "2026-08-18T21:40:00.000Z"
  },
  "success": true
}
```

---

### 7.2) رفع صورة إيصال التحويل / إثبات الدفع (Upload Payment Receipt)
* **Endpoint**: `PATCH /bookings/:id/payment`
* **Auth Required**: ✅ نعم
* **Content-Type**: `multipart/form-data`

#### Form Fields:
- `receiptImage`: (File - صورة شاشة الإيصال أو التحويل)
- `paymentMethod`: (String - اختياري للتحديث)
- `paymentNotes`: (String - ملاحظات التحويل رقم الحساب/العملية)

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "PAYMENT_INFO_UPDATED",
  "data": {
    "_id": "685bc920f1882d21051b7999",
    "paymentMethod": "vodafone_cash",
    "paymentStatus": "pending_verification",
    "paymentReceiptImage": "/uploads/payments/payment-1724012345.jpg",
    "paymentNotes": "إيصال رقم عملية 998811"
  },
  "success": true
}
```

---

## 🎟️ 8. شاشة حجوزاتي (My Bookings)

### 8.1) عرض قائمة حجوزات العميل (My Bookings List)
* **Endpoint**: `GET /bookings/my`
* **Auth Required**: ✅ نعم
* **Query Parameters**:
  - `tab`: `upcoming` (الحجوزات القادمة) | `completed` (المكتملة بعد انتهاء تاريخ الرحلة) | `cancelled` (الملغاة والمرفوضة)
  - `page`: رقم الصفحة (1)
  - `limit`: عدد النتائج (10)

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "BOOKINGS_FETCHED",
  "data": {
    "bookings": [
      {
        "_id": "685bc920f1882d21051b7999",
        "status": "approved",
        "paymentStatus": "paid",
        "numberOfSeats": 2,
        "totalPrice": 3700,
        "pickupPoint": "ميدان التحرير",
        "pickupTime": "05:00 AM",
        "isCompleted": true,
        "canReview": true,
        "isReviewed": false,
        "tripSnapshot": {
          "title": "رحلة دهب وسانت كاترين VIP",
          "coverImage": "/uploads/trips/cover.jpg",
          "origin": "القاهرة",
          "destination": "دهب",
          "startDate": "2026-08-01T00:00:00.000Z",
          "endDate": "2026-08-04T00:00:00.000Z"
        },
        "company": {
          "_id": "685bc920f1882d21051b7001",
          "name": "شركة رحلات مصر",
          "logo": "/uploads/companies/logo.png",
          "contactPhone": "+201012345678",
          "whatsapp": "+201012345678"
        }
      }
    ],
    "pagination": { ... }
  },
  "success": true
}
```

#### 🔥 ميزة حقول زر التقييم على الموبايل:
- إذا كان `canReview: true` ➔ يظهر للمستخدم زر **"تقييم الرحلة والشركة"**.
- إذا كان `isReviewed: true` ➔ يُعرض للمستخدم زر **"تم التقييم"**.
- إذا كان `isCompleted: false` ➔ يُمنع التقييم ويظهر زر **"التواصل مع الشركة"**.

---

### 8.2) تفاصيل حجز معين (Get Booking Details)
* **Endpoint**: `GET /bookings/:id`
* **Auth Required**: ✅ نعم

---

### 8.3) إلغاء حجز (Cancel Booking)
* **Endpoint**: `PATCH /bookings/:id/cancel`
* **Auth Required**: ✅ نعم
* **Request Body**:
```json
{
  "cancellationReason": "ظروف طارئة تمنع من السفر"
}
```

---

## 💬 9. الشات والمحادثات المباشرة (Chat System)

### 9.1) بدء أو فتح محادثة (Start / Get Chat Room)
* **Endpoint**: `POST /chats`
* **Auth Required**: ✅ نعم
* **Request Body**:
```json
{
  "companyId": "685bc920f1882d21051b7001",
  "tripId": "685bc920f1882d21051b72b1",
  "bookingId": "685bc920f1882d21051b7999",
  "type": "booking_related"
}
```

#### Response (200 OK):
```json
{
  "statusCode": 200,
  "message": "CHAT_RETRIEVED_SUCCESSFULLY",
  "data": {
    "_id": "685bc920f1882d21051b7chat",
    "type": "booking_related",
    "user": "685bc920f1882d21051b72a1",
    "company": {
      "_id": "685bc920f1882d21051b7001",
      "name": "شركة رحلات مصر",
      "logo": "/uploads/companies/logo.png"
    },
    "trip": { ... },
    "unreadCountUser": 0,
    "lastMessage": "أهلاً بك، تم تأكيد نقطة التجمع"
  },
  "success": true
}
```

---

### 9.2) جلب الرسائل داخل المحادثة (Get Chat Messages)
* **Endpoint**: `GET /chats/:chatId/messages?page=1&limit=50`
* **Auth Required**: ✅ نعم

---

### 9.3) إرسال رسالة نصية أو صورة (Send Message)
* **Endpoint**: `POST /chats/:chatId/messages`
* **Auth Required**: ✅ نعم
* **Content-Type**: `multipart/form-data`

#### Form Fields:
- `text`: "السلام عليكم، متى موعد التحرك بالتحديد؟"
- `image`: (File - اختياري لإرسال صورة استفسار أو تحويل)

---

## ⭐ 10. نظام التقييم المشروط بالانتهاء (Reviews)

> ⚠️ **قاعدة صارمة**: يُقبل التقييم **فقط للعميل الذي يمتلك حجزاً مكتتملاً وتجاوز تاريخ انتهاء الرحلة**.

### 10.1) تقييم الرحلة والشركة بعد انتهاء الحجز
* **Endpoint**: `POST /trips/:tripId/reviews`
* **Auth Required**: ✅ نعم

#### Request Body:
```json
{
  "rating": 5,
  "comment": "رحلة ممتعة جداً، الباص كان مريحاً والمواعيد مضبوطة",
  "companyRating": 5,
  "companyComment": "شركة ممتازة في التعامل والخدمة"
}
```

#### Response في حال عدم وجود حجز مكتمل (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "COMPLETED_BOOKING_REQUIRED_FOR_REVIEW",
  "data": null,
  "success": false
}
```

#### Response عند النجاح (201 Created):
```json
{
  "statusCode": 201,
  "message": "REVIEW_CREATED_SUCCESSFULLY",
  "data": {
    "_id": "685bc920f1882d21051b7rev",
    "trip": "685bc920f1882d21051b72b1",
    "rating": 5,
    "comment": "رحلة ممتعة جداً",
    "user": {
      "fullName": "أسامة عصام",
      "profileImage": "/uploads/profiles/user-123.jpg"
    }
  },
  "success": true
}
```

---

### 10.2) تقييم تجربة الشركة بشكل مباشر
* **Endpoint**: `POST /companies/:companyId/reviews`
* **Auth Required**: ✅ نعم
* **Request Body**:
```json
{
  "rating": 5,
  "comment": "شركة ممتازة جداً وأسعارها مناسبة"
}
```

---

## 🔔 11. الإشعارات والمفضلة (Notifications & Favorites)

### 11.1) المفضلة (Favorites)
- **إضافة / إزالة رحلة من المفضلة**: `POST /favorites/toggle/:tripId`
- **جلب قائمة المفضلة**: `GET /favorites`

#### Response (`GET /favorites`):
```json
{
  "statusCode": 200,
  "message": "FAVORITES_FETCHED",
  "data": {
    "favorites": [
      {
        "_id": "685bc920f1882d21051b7fav1",
        "user": "685bc920f1882d21051b72a1",
        "trip": {
          "_id": "685bc920f1882d21051b72b1",
          "title": "رحلة دهب وسانت كاترين VIP",
          "coverImage": "/uploads/trips/dahab.jpg",
          "price": 1850,
          "isFavorite": true,
          "isBooked": false
        }
      }
    ]
  },
  "success": true
}
```

---

### 11.2) الإشعارات (Notifications)
- **جلب إشعارات العميل**: `GET /notifications?page=1&limit=20`
- **تحديث رمز جهاز الموبايل (FCM Token for Push Notifications)**:
  * **Endpoint**: `PATCH /notifications/fcm-token`
  ```json
  {
    "fcmToken": "eXampleFcmDeviceToken123456789..."
  }
  ```
- **تحديد جميع الإشعارات كُمقروءة**: `PATCH /notifications/read-all`
- **تحديد إشعار واحد كُمقروء**: `PATCH /notifications/:id/read`
- **حذف إشعار**: `DELETE /notifications/:id`

---

## 🔴 12. جدول أكواد الأخطاء الشائعة (Mobile Error Code Reference)

يمكن لمطور الموبايل استخدام كود `message` في الـ JSON لعرض رسائل متوافقة ومترجمة للمستخدم:

| Error Message Code | HTTP Status | Meaning / Solution |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | البريد الإلكتروني مُسجل بالفعل |
| `PHONE_ALREADY_EXISTS` | 409 | رقم الهاتف مُسجل بالفعل |
| `INVALID_CREDENTIALS` | 401 | البريد أو كلمة المرور غير صحيحة |
| `COMPLETED_BOOKING_REQUIRED_FOR_REVIEW` | 400 | التقييم متاح فقط بعد انتهاء رحلتك المحجوزة |
| `REVIEW_ALREADY_EXISTS` | 400 | لقد قمت بتقييم هذه الرحلة سابقاً |
| `ALREADY_BOOKED` | 400 | لديك حجز قيد الانتظار أو مقبول في هذه الرحلة بالفعل |
| `NOT_ENOUGH_SEATS` | 400 | لا توجد مقاعد كافية متبقية بالرحلة |
| `TRIP_NOT_AVAILABLE_FOR_BOOKING` | 400 | هذه الرحلة غير متاح حجزها الآن |
| `INVALID_OR_EXPIRED_OTP` | 400 | كود التحقق غير صحيح أو انتهت صلاحيته |
| `TOKEN_EXPIRED` | 401 | انتهت صلاحية الجلسة، يلزم عمل Refresh Token |
