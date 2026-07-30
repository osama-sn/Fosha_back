// =============================================
// NOTIFICATION ROUTES
// =============================================

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     description: Returns the authenticated user's notifications with pagination.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Notifications fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         notifications:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Notification'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     description: Marks all of the user's notifications as read.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     description: Deletes a specific notification.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /notifications/fcm-token:
 *   patch:
 *     tags: [Notifications]
 *     summary: Update FCM token
 *     description: Registers or updates the user's Firebase Cloud Messaging token for push notifications.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: dGhpcyBpcyBhIGZjbSB0b2tlbg...
 *     responses:
 *       200:
 *         description: FCM token updated
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /notifications/fcm-token:
 *   delete:
 *     tags: [Notifications]
 *     summary: Remove FCM token
 *     description: Removes a specific FCM token from the user's device tokens.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 example: dGhpcyBpcyBhIGZjbSB0b2tlbg...
 *     responses:
 *       200:
 *         description: FCM token removed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /notifications/admin/send:
 *   post:
 *     tags: [Notifications]
 *     summary: Send custom notification (Admin)
 *     description: Sends a custom or broadcast notification. If userId is provided, sends to that user. Otherwise, broadcasts to all users. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID (omit for broadcast)
 *                 example: 6650a1b2c3d4e5f6a7b8c9d0
 *               title:
 *                 type: string
 *                 example: عرض خاص 🎉
 *               body:
 *                 type: string
 *                 example: خصم 30% على جميع الرحلات هذا الأسبوع!
 *               type:
 *                 type: string
 *                 enum: [booking, trip, promo, system, general]
 *                 default: promo
 *                 example: promo
 *               data:
 *                 type: object
 *                 description: Additional data payload
 *                 example: { "promoCode": "SUMMER30" }
 *     responses:
 *       201:
 *         description: Notification sent
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
