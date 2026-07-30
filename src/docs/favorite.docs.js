// =============================================
// FAVORITE ROUTES
// =============================================

/**
 * @swagger
 * /favorites/toggle/{tripId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Toggle favorite
 *     description: Adds or removes a trip from favorites based on current state.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Favorite toggled
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
 *                         isFavorite:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trip not found
 */

/**
 * @swagger
 * /favorites/{tripId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Add to favorites
 *     description: Adds a trip to user's favorites.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       201:
 *         description: Added to favorites
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Already in favorites
 */

/**
 * @swagger
 * /favorites/{tripId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove from favorites
 *     description: Removes a trip from user's favorites.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Removed from favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Get user favorites
 *     description: Returns the authenticated user's favorite trips with pagination.
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
 *         description: Favorites fetched
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
 *                         favorites:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Favorite'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /favorites/check/{tripId}:
 *   get:
 *     tags: [Favorites]
 *     summary: Check if trip is favorited
 *     description: Checks whether a trip is in the user's favorites.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Check result
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
 *                         isFavorite:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized
 */
