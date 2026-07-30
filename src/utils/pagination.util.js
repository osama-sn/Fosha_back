/**
 * Extracts pagination parameters from query string.
 * @param {Object} query - req.query
 * @param {number} defaultLimit - default items per page (10)
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Formats paginated response payload.
 * @param {Array} items - Array of documents
 * @param {number} totalItems - Total count of documents matching query
 * @param {number} page - Current page
 * @param {number} limit - Page size limit
 * @param {string} dataKey - Name of the payload key (default: 'items')
 * @returns {Object} Paginated response object
 */
const getPagingData = (items, totalItems, page, limit, dataKey = 'items') => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: limit,
    [dataKey]: items,
  };
};

module.exports = {
  getPagination,
  getPagingData,
};
