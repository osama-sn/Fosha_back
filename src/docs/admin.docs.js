// =============================================
// ADMIN ROUTES
// =============================================

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     description: Returns analytics data for the admin dashboard including user count, trip count, booking stats, revenue, etc. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Dashboard stats fetched
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
 *                         totalUsers:
 *                           type: integer
 *                           example: 150
 *                         totalTrips:
 *                           type: integer
 *                           example: 25
 *                         totalBookings:
 *                           type: integer
 *                           example: 320
 *                         totalRevenue:
 *                           type: number
 *                           example: 125000
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /admin/cleanup-demo-data:
 *   post:
 *     tags: [Admin]
 *     summary: Cleanup demo data
 *     description: Removes auto-generated demo data older than specified hours. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: Delete demo data older than this many hours (default 24)
 *                 default: 24
 *                 example: 48
 *     responses:
 *       200:
 *         description: Demo data cleaned up
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
 *                         deletedUsers:
 *                           type: integer
 *                         deletedTrips:
 *                           type: integer
 *                         deletedBookings:
 *                           type: integer
 *                         deletedReviews:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
