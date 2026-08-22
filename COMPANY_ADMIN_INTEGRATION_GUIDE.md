# 🏢 دليل تكامل ودكومنتيشن لوحة تحكم شركة السياحة (Company Admin Integration Guide)

يقدم هذا الدليل توثيقاً **كاملاً وتفصيلياً الشامل بحذافيره** لكافة الواجهات المبرمجة (APIs) والنماذج (Models) المخصصة **لإدارة شركة السياحة والرحلات (Company Admin)** لإدارة الرحلات، الحجوزات، العملاء، قائمة المسافرين، المصروفات، الأرباح، الشات، وتحديثات الرحلات.

---

## 🔑 Header المعتمد لكافة طلبات المحمية
```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json (أو multipart/form-data في حالة رفع الملفات والصور)
```

---

## 📌 فهرس وجدول جميع الـ Endpoints المتاحة لأدمن الشركة (Complete Endpoints Reference Table)

| Category | HTTP Method | API Endpoint | Content-Type | Purpose / الوصف |
| :--- | :---: | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | `JSON` | تسجيل الدخول كـ Company Admin واستلام التوكن |
| **Dashboard** | `GET` | `/api/v1/admin/company-stats` | `JSON` | إحصائيات المبيعات، المصروفات، صافي الربح الفعلي، والعملاء |
| **Profile** | `PATCH` / `PUT` | `/api/v1/companies/:id` | `multipart/form-data` | تعديل بيانات الشركة، الواتساب، التواصل الاجتماعي، واللوجو/الغلاف |
| **Trips** | `POST` | `/api/v1/trips` | `multipart/form-data` | إنشاء رحلة جديدة بنقاط ومواعيد التجمع والبرنامج |
| | `POST` | `/api/v1/trips/:id/duplicate` | `JSON` | تكرار ونسخ رحلة قائمة كمسودة جديدة تلقائياً |
| | `GET` | `/api/v1/trips` | `JSON` | عرض رحلات الشركة الخاصة |
| | `GET` | `/api/v1/trips/:id` | `JSON` | عرض تفاصيل رحلة معينة |
| | `PUT` / `PATCH` | `/api/v1/trips/:id` | `multipart/form-data` | تعديل بيانات رحلة قائمة |
| | `DELETE` | `/api/v1/trips/:id` | `JSON` | حذف رحلة (Soft delete) |
| **Passenger List** | `GET` | `/api/v1/trips/:id/passengers` | `JSON` | مانفيست وقائمة ركاب الرحلة ونقاط التجمع يوم الحركة |
| **Announcements** | `POST` | `/api/v1/trips/:id/announcements` | `JSON` | إرسال إشعار وتحديث عاجل لجميع ركاب الرحلة الحاجزين |
| **Bookings** | `GET` | `/api/v1/bookings` | `JSON` | عرض طلبات حجوزات رحلات الشركة |
| | `GET` | `/api/v1/bookings/:id` | `JSON` | تفاصيل حجز معين |
| | `PATCH` | `/api/v1/bookings/:id/approve` | `JSON` | موافقة وقبول طلب حجز |
| | `PATCH` | `/api/v1/bookings/:id/reject` | `JSON` | رفض طلب حجز مع سبب الرفض |
| | `PATCH` | `/api/v1/bookings/:id/cancel` | `JSON` | إلغاء حجز وإرجاع المقاعد للرحلة |
| **Customers** | `GET` | `/api/v1/admin/company-customers` | `JSON` | عرض العملاء الذين حجزوا مع الشركة والرحلات السابقة |
| **Expenses** | `POST` | `/api/v1/expenses` | `multipart/form-data` | إضافة مصروف رحلة/شركة جديد مع صوره الفاتورة |
| | `GET` | `/api/v1/expenses` | `JSON` | عرض مصروفات الشركة وتصفيتها |
| | `GET` | `/api/v1/expenses/summary` | `JSON` | ملخص المصروفات مجمعة حسب الفئات |
| | `PUT` / `PATCH` | `/api/v1/expenses/:id` | `multipart/form-data` | تعديل بند مصروف |
| | `DELETE` | `/api/v1/expenses/:id` | `JSON` | حذف بند مصروف |
| **Financial Report**| `GET` | `/api/v1/admin/company-financial-report` | `JSON` | التقرير المالي وصافي الربح الحقيقي بالمدة الزمنية |
| **Chat & WebSockets**| `WS` | `ws://localhost:3000` | `WebSockets` | اتصال المحادثات الحي المباشر (Events: `join_chat`, `send_message`, `typing`) |
| | `POST` | `/api/v1/chats` | `JSON` | بدء أو جلب محادثة قائمة مع عميل |
| | `GET` | `/api/v1/chats` | `JSON` | عرض قائمة المحادثات النشطة |
| | `GET` | `/api/v1/chats/:id/messages` | `JSON` | عرض رسائل المحادثة |
| | `POST` | `/api/v1/chats/:id/messages` | `multipart/form-data` | إرسال رسالة نصية أو صورة عبر HTTP |
| **Reviews** | `GET` | `/api/v1/companies/:id/reviews` | `JSON` | عرض تقييمات الشركة |
| | `GET` | `/api/v1/trips/:id/reviews` | `JSON` | عرض تقييمات الرحلة |
| **Offers & Coupons**| `GET` | `/api/v1/offers/admin/all` | `JSON` | عرض عروض الشركة |
| | `POST` | `/api/v1/offers` | `multipart/form-data` | إنشاء عرض بنر جديد مع صورة |
| | `PUT` / `DELETE` | `/api/v1/offers/:id` | `multipart/form-data` | تعديل أو حذف عرض |
| | `POST` | `/api/v1/coupons` | `JSON` | إنشاء كوبون خصم لرحلات الشركة |
| | `GET` | `/api/v1/coupons` | `JSON` | عرض كوبونات الشركة |
| | `DELETE` | `/api/v1/coupons/:id` | `JSON` | حذف كوبون خصم |

---

## 🔐 1. تسجيل الدخول (Company Admin Auth)

* **الرابط**: `POST /api/v1/auth/login`
* **Body**:
```json
{
  "email": "company@admin.com",
  "password": "CompanyPassword123!"
}
```
* **Response**: يرجع بيانات الحساب والـ `token` بالإضافة لبيانات الشركة المرتبطة بالحساب.

---

## 📊 2. لوحة التحكم والإحصائيات الشاملة (Company Dashboard)

* **الرابط**: `GET /api/v1/admin/company-stats`
* **وصف الاستجابة**: يرجع إحصائيات شاملة تتضمن عدد الرحلات، الحجوزات، عدد العملاء، الرحلات القادمة، إجمالي المبيعات، إجمالي المصروفات، عمولة المنصة، **صافي الربح الفعلي** (Sales - Expenses - Commission)، أفضل الرحلات مبيعاً، آخر 5 حجوزات، وآخر 5 محادثات نشطة.

### 📥 شكل الـ Response:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "COMPANY_STATS_FETCHED",
  "data": {
    "company": {
      "_id": "66bc123456789abcdef00111",
      "name": "شركة فسحني للسياحة",
      "logo": "/uploads/companies/company-logo.jpg",
      "coverImage": "/uploads/companies/company-cover.jpg",
      "description": "شركة متخصصة في الرحلات البحرية والسفاري",
      "contactPhone": "+201012345678",
      "contactEmail": "info@fasheny.com",
      "address": "المنيا - كورنيش النيل",
      "whatsapp": "+201012345678",
      "socialMedia": {
        "facebook": "https://facebook.com/fasheny",
        "instagram": "https://instagram.com/fasheny"
      },
      "averageRating": 4.8,
      "reviewsCount": 15
    },
    "trips": {
      "totalTrips": 12,
      "publishedTrips": 8,
      "draftTrips": 4,
      "upcomingTripsCount": 5
    },
    "bookings": {
      "totalBookings": 120,
      "pendingBookings": 10,
      "approvedBookings": 100,
      "rejectedBookings": 5,
      "cancelledBookings": 5,
      "customersCount": 85
    },
    "financials": {
      "totalGrossRevenue": 300000,          // إجمالي المبيعات (GMV)
      "totalExpenses": 190000,              // إجمالي المصروفات (Expenses)
      "totalAdminCommissionPaid": 30000,    // عمولة المنصة
      "netProfit": 80000,                   // 💵 صافي الربح = Revenue - Commission - Expenses
      "companyNetRevenue": 270000           // Sales - Commission
    },
    "topTrips": [
      {
        "_id": "66bc987654321fedcba00222",
        "title": "رحلة دهب وسانت كاترين",
        "destination": "دهب",
        "price": 2500,
        "coverImage": "/uploads/trips/dahab.jpg",
        "bookingCount": 40,
        "totalSeatsBooked": 85,
        "totalRevenue": 100000
      }
    ],
    "recentBookings": [
      {
        "_id": "66bd11122233344455566677",
        "user": { "fullName": "أحمد محمود", "phone": "+201000000000" },
        "trip": { "title": "رحلة دهب وسانت كاترين" },
        "numberOfSeats": 2,
        "totalPrice": 5000,
        "status": "pending",
        "createdAt": "2026-08-16T12:00:00.000Z"
      }
    ],
    "recentMessages": [
      {
        "_id": "66bd99887766554433221100",
        "user": { "fullName": "أحمد محمود" },
        "lastMessage": "هل متاح حجز 3 مقاعد للأسبوع القادم؟",
        "lastMessageAt": "2026-08-16T15:30:00.000Z"
      }
    ]
  }
}
```

---

## 🏢 3. تعديل ملف الشركة (Company Profile)

* **الرابط**: `PATCH /api/v1/companies/:id` (أو `PUT /api/v1/companies/:id`)
* **Content-Type**: `multipart/form-data` (يدعم رفع اللوجو وصورة الغلاف مباشرة)

### 📥 Form-Data Fields:
* `name`: اسم الشركة
* `description`: وصف الشركة
* `contactPhone`: رقم الهاتف
* `contactEmail`: البريد الإلكتروني
* `address`: العنوان
* `governorate`: المحافظة
* `whatsapp`: رقم الواتساب (+2010XXXXXXXX)
* `socialMedia`: JSON String مثل `'{"facebook":"https://fb.com/page","instagram":"https://inst.com/page"}'`
* `logo`: ملف صورة اللوجو (File - `logo`)
* `coverImage`: ملف صورة الغلاف (File - `coverImage`)

---

## 🚌 4. إدارة الرحلات (Trips Management)

### أ) إنشاء رحلة جديدة (`POST /api/v1/trips`)
* **Content-Type**: `multipart/form-data`
* **Fields**:
  * `title`: "رحلة شرم الشيخ وراس محمد" (مطلوب)
  * `description`: "رحلة 4 أيام شاملة الإقامة والأنشطة والوجبات" (مطلوب)
  * `origin`: "القاهرة" (مطلوب)
  * `destination`: "شرم الشيخ" (مطلوب)
  * `price`: "3000" (مطلوب - سعر الفرد)
  * `capacity`: "40" (مطلوب - إجمالي عدد المقاعد)
  * `startDate`: "2026-09-01T00:00:00.000Z" (مطلوب)
  * `endDate`: "2026-09-05T00:00:00.000Z" (مطلوب)
  * `status`: "published" أو "draft"
  * `pickupPoints`: `'[{"location":"ميدان عبد المنعم رياض","time":"06:00 AM"},{"location":"مصر الجديدة - النادي الأهلي","time":"06:45 AM"}]'` (JSON String)
  * `pickupTimes`: `'["06:00 AM", "06:45 AM"]'` (JSON String)
  * `included`: `'["الإقامة 4 نجوم", "الوجبات", "الانتقالات أتوبيس حديث"]'` (JSON String)
  * `excluded`: `'["المشروبات الروحية", "المصاريف الشخصية"]'` (JSON String)
  * `cancelPolicy`: "إلغاء مجاني قبل الرحلة بـ 72 ساعة"
  * `days`: `'[{"dayNumber":1,"title":"الوصول والتسكين","activities":[{"time":"10:00 AM","title":"الوصول للفندق والتسكين"}]}]'` (JSON String)
  * `coverImage`: صورة غلاف الرحلة (File)
  * `gallery`: صور المعرض (File Array - max 15)

### ب) نسخ وتكرار رحلة (`POST /api/v1/trips/:id/duplicate`)
* يقوم بتكرار الرحلة الحالية بكافة تفاصيلها (البرنامج، المشتملات، الأسعار، نقاط التجمع) وإنشائها كمسودة جديدة باسم `"اسم الرحلة (نسخة)"`.

### ج) إدارة الرحلات (تعديل، إخفاء، حذف)
* **تعديل رحلة**: `PUT /api/v1/trips/:id` (مع `multipart/form-data`)
* **حذف رحلة**: `DELETE /api/v1/trips/:id`
* **عرض رحلات الشركة**: `GET /api/v1/trips?status=published` أو `status=draft`

---

## 📋 5. قائمة المسافرين لكل رحلة (Passenger List Manifest)

مفيدة جداً يوم حركة الرحلة لمشرفي الشركة.

* **الرابط**: `GET /api/v1/trips/:id/passengers`
* **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "PASSENGER_LIST_FETCHED",
  "data": {
    "trip": {
      "_id": "66bc987654321fedcba00222",
      "title": "رحلة دهب وسانت كاترين",
      "startDate": "2026-09-01T00:00:00.000Z",
      "capacity": 40,
      "availableSeats": 10,
      "totalSeatsBooked": 30
    },
    "passengersCount": 15,
    "totalSeatsBooked": 30,
    "passengers": [
      {
        "bookingId": "66bd11122233344455566677",
        "user": {
          "fullName": "أحمد محمود",
          "email": "ahmed@gmail.com",
          "phone": "+201011111111"
        },
        "numberOfSeats": 2,
        "pickupPoint": "ميدان عبد المنعم رياض",
        "pickupTime": "06:00 AM",
        "status": "approved",
        "paymentStatus": "paid",
        "totalPrice": 5000,
        "notes": "نريد المقاعد الأمامية إن أمكن"
      }
    ]
  }
}
```

---

## 📢 6. إرسال تحديث/إشعار لمسافري الرحلة (Trip Announcement)

تستطيع الشركة إرسال تحديث عاجل لجميع العملاء الذين حجزوا الرحلة (مثل: تغيير موعد التحرك).

* **الرابط**: `POST /api/v1/trips/:id/announcements`
* **Body**:
```json
{
  "title": "تعديل موعد التحرك",
  "message": "تم تغيير موعد التحرك إلى الساعة 7:00 صباحاً بدلاً من 6:00 صباحاً من نقطة عبد المنعم رياض. يرجى التواجد قبل الموعد بـ 15 دقيقة."
}
```
* **Response**: يرجع عدد الإشعارات التي تم إرسالها بنجاح للعملاء الحاجزين.

---

## 🎫 7. إدارة الحجوزات (Bookings Control)

* **عرض الحجوزات**: `GET /api/v1/bookings?status=pending` (أو `approved` / `rejected`)
* **قبول حجز**: `PATCH /api/v1/bookings/:id/approve`
* **رفض حجز**: `PATCH /api/v1/bookings/:id/reject`
  ```json
  {
    "rejectionReason": "عذراً، اكتمل عدد المقاعد المتاحة لهذه الرحلة"
  }
  ```
* **إلغاء حجز**: `PATCH /api/v1/bookings/:id/cancel`

---

## 👥 8. إدارة عملاء الشركة (Customers)

عرض قائمة العملاء الذين حجزوا مع الشركة سابقاً وتفاصيل تواصلهم وحجوزاتهم.

* **الرابط**: `GET /api/v1/admin/company-customers`
* **Query Params**: `page`, `limit`, `search`
* **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "COMPANY_CUSTOMERS_FETCHED",
  "data": {
    "customers": [
      {
        "_id": "66ba11122233344455566677",
        "fullName": "محمد علي",
        "email": "mohamed@gmail.com",
        "phone": "+201099998888",
        "totalBookings": 4,
        "totalSpent": 12000,
        "lastBookingDate": "2026-08-10T14:00:00.000Z",
        "previousTrips": [
          { "title": "رحلة دهب" },
          { "title": "رحلة شرم الشيخ" }
        ]
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

## 💰 9. الإدارة المالية والمصروفات (Financials & Expenses)

تسجيل ومتابعة مصروفات رحلات الشركة وحساب **صافي الربح**.

### أ) إضافة مصروف جديد (`POST /api/v1/expenses`)
* **Content-Type**: `multipart/form-data` (في حال إرفاق فاتورة)
* **Fields**:
  * `title`: "حجز فندق سويس إن دهب" (مطلوب)
  * `amount`: "45000" (مطلوب)
  * `category`: `"hotel"` (خيارات: `transportation`, `hotel`, `food`, `activities`, `staff`, `other`)
  * `tripId`: `<TRIP_ID>` (اختياري - لربط المصروف برحلة معينة)
  * `expenseDate`: "2026-08-15"
  * `notes`: "تسكين 30 فرد شامل الإفطار"
  * `receiptImage`: صورة الفاتورة/الإيصال (File - optional)

### ب) عرض مصروفات الشركة (`GET /api/v1/expenses`)
* **Query Params**: `tripId`, `category`, `startDate`, `endDate`, `page`, `limit`

### ج) تقرير الأرباح والمبيعات المالي المفصل (`GET /api/v1/admin/company-financial-report`)
* **Query Params**: `startDate`, `endDate`, `month`, `year`
* **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "code": "COMPANY_FINANCIAL_REPORT_FETCHED",
  "data": {
    "financials": {
      "totalGrossRevenue": 150000,
      "totalExpenses": 90000,
      "totalAdminCommissionPaid": 15000,
      "netProfit": 45000,                    // 💵 صافي الربح الحقيقي
      "totalBookings": 50,
      "totalSeats": 110,
      "averageBookingValue": 3000
    },
    "expensesByCategory": [
      { "_id": "hotel", "totalAmount": 50000, "count": 2 },
      { "_id": "transportation", "totalAmount": 25000, "count": 3 },
      { "_id": "food", "totalAmount": 15000, "count": 4 }
    ],
    "perTripPerformance": [
      {
        "_id": "66bc987654321fedcba00222",
        "title": "رحلة دهب وسانت كاترين",
        "totalRevenue": 75000,
        "totalCommission": 7500,
        "totalBookings": 25,
        "totalSeats": 55
      }
    ]
  }
}
```

---

## 💬 10. نظام المحادثات المباشرة والشات الحي (Live Real-time WebSockets & Chat)

يدعم النظام محادثات حية ومباشرة بين العميل والشركة عبر **WebSockets (Socket.io)** مع وجود REST APIs احتياطية.

### 🔌 1. الاتصال بالسيرفر عبر WebSockets
* **URL Connection**: `ws://localhost:3000` (أو رابط الدومين الرئيسي)
* **Auth Credentials**: إرسال `token` عبر `auth`:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "<USER_OR_COMPANY_ADMIN_ACCESS_TOKEN>"
  },
  transports: ["websocket", "polling"]
});
```

---

### 📡 2. أحداث المحادثة الحية (Socket Events)

#### أ) الانضمام لغرفة محادثة (`join_chat`)
عند فتح الشات، يرسل العميل أو أدمن الشركة:
```javascript
socket.emit("join_chat", { chatId: "66bd99887766554433221100" });
```

#### ب) إرسال رسالة حية في التو واللحظة (`send_message`)
```javascript
socket.emit("send_message", {
  chatId: "66bd99887766554433221100",
  text: "أهلاً بك، هل يمكن تعديل نقطة التجمع؟",
  image: "" // اختياري
}, (response) => {
  console.log("تم تسليم الرسالة:", response.data);
});
```

#### ج) الاستماع للرسائل الجديدة المفاجئة (`new_message`)
يستمع الطرفان (العميل وأدمن الشركة) لاستقبال الرسالة فوراً:
```javascript
socket.on("new_message", (message) => {
  console.log("رسالة جديدة:", message.text, message.sender);
});
```

#### د) مؤشر الكتابة الحية (`typing` & `user_typing`)
```javascript
// عند البدء في الكتابة
socket.emit("typing", { chatId: "66bd99887766554433221100", isTyping: true });

// الاستماع لمؤشر كتابة الطرف الآخر
socket.on("user_typing", (data) => {
  console.log(`${data.fullName} يكتب الآن...`, data.isTyping);
});
```

#### هـ) تحديث قائمة المحادثات النشطة (`chat_updated`)
يستمع أدمن الشركة لهذا الحدث لتحديث قائمة الشات والرسائل غير المقروءة فور وصول رسالة من أي عميل:
```javascript
socket.on("chat_updated", (data) => {
  console.log("تم تحديث الشات:", data.chatId, data.lastMessage);
});
```

---

### 🌐 3. واجهات HTTP الاحتياطية (REST APIs)
* **البدء أو الحصول على غرفة محادثة**: `POST /api/v1/chats` (`{"companyId": "...", "tripId": "..."}`)
* **عرض المحادثات النشطة**: `GET /api/v1/chats`
* **عرض رسائل المحادثة**: `GET /api/v1/chats/:id/messages`
* **إرسال رسالة نصية أو صورة عبر REST API**: `POST /api/v1/chats/:id/messages` (مع `multipart/form-data` لارسال الصور).

---

## ⭐ 11. التقييمات (Company & Trip Reviews)

* **تقييمات الشركة**: `GET /api/v1/companies/:id/reviews`
* **تقييمات الرحلة**: `GET /api/v1/trips/:id/reviews`

---

## 🎁 12. العروض والكوبونات (Offers & Coupons)

* **إنشاء عرض ترويجي للشركة**: `POST /api/v1/offers` (مع رفع صورة العرض)
* **إنشاء كوبون خصم للرحلات**: `POST /api/v1/coupons`

---

## 💳 13. إدارة حسابات الدفع للمحافظ و InstaPay (Company Payment Accounts)

تستطيع الشركة إضافة أكثر من رقم محفظة إلكترونية أو حساب InstaPay مع إمكانية تفعيل أو إيقاف أي حساب بسهولة.

### 13.1) عرض قائمة حسابات الدفع للشركة
* **الرابط**: `GET /api/v1/companies/:companyId/payment-accounts`
* **Auth**: ✅ مطلوب لأدمن الشركة (يسترجع جميع الحسابات المفعلة والمعطلة).

### 13.2) إضافة حساب دفع جديد (Add Payment Account)
* **الرابط**: `POST /api/v1/companies/:companyId/payment-accounts`
* **Body**:
```json
{
  "provider": "instapay",
  "title": "حساب انستا باي الرئيسي",
  "handle": "company@instapay",
  "number": "01012345678",
  "instructions": "برجاء كتابة اسمك في الملاحظات عند التحويل",
  "isActive": true
}
```
* **أنواع `provider` المتاحة**: `instapay`, `wallet`, `vodafone_cash`, `orange_cash`, `etisalat_cash`, `bank_transfer`, `cash`

### 13.3) تعديل بيانات حساب دفع (Update Payment Account)
* **الرابط**: `PATCH /api/v1/companies/:companyId/payment-accounts/:accountId`
* **Body**: (أي حقول مراد تعديلها)
```json
{
  "title": "حساب انستا باي المحدث",
  "handle": "newcompany@instapay"
}
```

### 13.4) تفعيل / إيقاف حساب دفع (Toggle Active Status)
* **الرابط**: `PATCH /api/v1/companies/:companyId/payment-accounts/:accountId/toggle`
* **الوصف**: يقوم بتبديل حالة الحساب تلقائياً بين مفعل (`isActive: true`) ومعطل (`isActive: false`).

### 13.5) حذف حساب دفع (Delete Payment Account)
* **الرابط**: `DELETE /api/v1/companies/:companyId/payment-accounts/:accountId`

