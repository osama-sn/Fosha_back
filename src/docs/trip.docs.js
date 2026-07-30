// =============================================
// TRIP ROUTES
// =============================================

/**
 * @swagger
 * /trips:
 *   get:
 *     tags: [Trips]
 *     summary: Get all published trips
 *     description: Returns a paginated list of published trips. Supports search, filtering, and sorting.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by trip title, origin, or destination
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *         description: Filter by status (admin only in admin route)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: '-createdAt'
 *         description: Sort field (prefix with - for descending)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Trips fetched successfully
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
 *                         trips:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Trip'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /trips/admin/all:
 *   get:
 *     tags: [Trips]
 *     summary: Get all trips (Admin)
 *     description: Returns all trips including drafts, cancelled, and completed. Admin only.
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All trips fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /trips/{id}:
 *   get:
 *     tags: [Trips]
 *     summary: Get trip by ID
 *     description: Returns detailed information about a specific trip.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Trip details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /trips:
 *   post:
 *     tags: [Trips]
 *     summary: Create a new trip (Admin)
 *     description: Creates a new trip with images upload. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - origin
 *               - destination
 *               - price
 *               - capacity
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: رحلة إلى الأقصر
 *               description:
 *                 type: string
 *                 example: رحلة ثقافية لزيارة المعابد والآثار
 *               origin:
 *                 type: string
 *                 example: القاهرة
 *               destination:
 *                 type: string
 *                 example: الأقصر
 *               price:
 *                 type: number
 *                 example: 3500
 *               capacity:
 *                 type: integer
 *                 example: 25
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-08-01T00:00:00.000Z'
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-08-04T00:00:00.000Z'
 *               category:
 *                 type: string
 *                 description: Category ID
 *               included:
 *                 type: string
 *                 description: JSON array string of included items
 *                 example: '["إفطار","مواصلات","إقامة"]'
 *               excluded:
 *                 type: string
 *                 description: JSON array string of excluded items
 *                 example: '["غداء","تذاكر دخول"]'
 *               cancelPolicy:
 *                 type: string
 *                 example: إلغاء مجاني قبل 48 ساعة
 *               days:
 *                 type: string
 *                 description: JSON array string of daily itinerary
 *                 example: '[{"dayNumber":1,"title":"يوم الوصول","activities":[{"time":"09:00","title":"الوصول","description":"الوصول والاستقبال"}]}]'
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Trip cover image
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images (multiple files)
 *     responses:
 *       201:
 *         description: Trip created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /trips/{id}:
 *   put:
 *     tags: [Trips]
 *     summary: Update a trip (Admin)
 *     description: Updates trip details and images. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               price:
 *                 type: number
 *               capacity:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *               included:
 *                 type: string
 *               excluded:
 *                 type: string
 *               cancelPolicy:
 *                 type: string
 *               days:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Trip updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /trips/{id}/publish:
 *   patch:
 *     tags: [Trips]
 *     summary: Publish a draft trip (Admin)
 *     description: Changes trip status from draft to published. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip published
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /trips/{id}/republish:
 *   patch:
 *     tags: [Trips]
 *     summary: Republish a completed/cancelled trip (Admin)
 *     description: Republishes a trip with new dates and optional capacity update. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-09-01T00:00:00.000Z'
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-09-05T00:00:00.000Z'
 *               capacity:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       200:
 *         description: Trip republished
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /trips/{id}:
 *   delete:
 *     tags: [Trips]
 *     summary: Delete a trip (Admin)
 *     description: Soft-deletes a trip. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Trip not found
 */
