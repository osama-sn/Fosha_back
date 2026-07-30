// =============================================
// COUPON ROUTES
// =============================================

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Validate a coupon code
 *     description: Validates a coupon code and calculates the discount. Requires authentication.
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
 *               - code
 *               - originalPrice
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER25
 *               originalPrice:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Coupon is valid
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
 *                         discountPercentage:
 *                           type: number
 *                           example: 25
 *                         discountAmount:
 *                           type: number
 *                           example: 500
 *                         finalPrice:
 *                           type: number
 *                           example: 4500
 *       400:
 *         description: Invalid or expired coupon
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create a coupon (Admin)
 *     description: Creates a new promo coupon. Admin only.
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
 *               - code
 *               - discountPercentage
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *                 example: SUMMER25
 *               discountPercentage:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 25
 *               maxDiscountAmount:
 *                 type: number
 *                 description: Maximum discount cap (0 = no cap)
 *                 example: 500
 *               minTripPrice:
 *                 type: number
 *                 description: Minimum trip price to apply coupon
 *                 example: 1000
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-12-31T23:59:59.000Z'
 *               usageLimit:
 *                 type: integer
 *                 description: Max usage count (0 = unlimited)
 *                 example: 100
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Coupon created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Coupon code already exists
 */

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: Get all coupons (Admin)
 *     description: Returns all coupons. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Coupons fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Coupon'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete a coupon (Admin)
 *     description: Deletes a coupon. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Coupon not found
 */
