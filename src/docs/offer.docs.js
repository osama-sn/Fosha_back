// =============================================
// OFFER / BANNER ROUTES
// =============================================

/**
 * @swagger
 * /offers:
 *   get:
 *     tags: [Offers]
 *     summary: Get active offers for client home screen
 *     description: Returns active and date-valid promotional offers/banners to display on the client home screen, sorted by priority.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       200:
 *         description: Active offers list fetched successfully
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
 *                         $ref: '#/components/schemas/Offer'
 */

/**
 * @swagger
 * /offers/admin/all:
 *   get:
 *     tags: [Offers]
 *     summary: Get all offers (Admin)
 *     description: Returns all offers (active and inactive) for admin management. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Offers list fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get offer details
 *     description: Returns single offer details by ID.
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer details fetched successfully
 *       404:
 *         description: Offer not found
 */

/**
 * @swagger
 * /offers:
 *   post:
 *     tags: [Offers]
 *     summary: Create an offer/banner (Admin)
 *     description: Creates a new promotional offer banner with image upload. Admin only.
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
 *               - titleEn
 *               - titleAr
 *               - image
 *             properties:
 *               titleEn:
 *                 type: string
 *                 example: Summer Special Discount
 *               titleAr:
 *                 type: string
 *                 example: عرض الصيف الخاص
 *               descriptionEn:
 *                 type: string
 *                 example: Get 20% off all beach trips this summer!
 *               descriptionAr:
 *                 type: string
 *                 example: احصل على خصم 20% على جميع الرحلات الشاطئية!
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file (JPEG, PNG, WebP)
 *               trip:
 *                 type: string
 *                 example: 6650a1b2c3d4e5f6a7b8c9d0
 *                 description: Optional linked Trip ID
 *               discountPercentage:
 *                 type: number
 *                 example: 20
 *               promoCode:
 *                 type: string
 *                 example: SUMMER20
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: integer
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /offers/{id}:
 *   put:
 *     tags: [Offers]
 *     summary: Update an offer (Admin)
 *     description: Updates an existing offer banner. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titleEn:
 *                 type: string
 *               titleAr:
 *                 type: string
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               trip:
 *                 type: string
 *               discountPercentage:
 *                 type: number
 *               promoCode:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Offer not found
 */

/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     tags: [Offers]
 *     summary: Delete an offer (Admin)
 *     description: Deletes an offer banner. Admin only.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Offer not found
 */
