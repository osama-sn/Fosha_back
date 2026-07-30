// =============================================
// REVIEW ROUTES
// =============================================

/**
 * @swagger
 * /trips/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a trip
 *     description: Returns a paginated list of reviews for a specific trip.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
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
 *         description: Reviews fetched
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
 *                         reviews:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Review'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /trips/{id}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Add a review to a trip
 *     description: Creates a review for a specific trip. One review per user per trip.
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: رحلة ممتازة وتنظيم رائع!
 *     responses:
 *       201:
 *         description: Review added
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: User already reviewed this trip
 */
