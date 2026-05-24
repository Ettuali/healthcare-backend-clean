const db = require("../config/db"); // Adjust the path to your database config file

/**
 * A reusable function to handle database pagination, searching, and sorting.
 * @param {object} options - Configuration for the database query.
 * @param {string} options.select - The columns to select (e.g., "u.id, u.name, r.roleName").
 * @param {string} options.from - The FROM and JOIN clauses (e.g., "user u LEFT JOIN roles r ON ...").
 * @param {string} [options.where=""] - The optional WHERE clause (e.g., "WHERE u.name LIKE ?").
 * @param {Array} [options.params=[]] - The parameters for the WHERE clause.
 * @param {string} options.orderBy - The ORDER BY clause (e.g., "ORDER BY u.name ASC").
 * @param {number} options.limit - The number of records per page.
 * @param {number} options.offset - The number of records to skip.
 * @returns {Promise<{data: Array<any>, totalCount: number}>} - An object with the data and total count.
 */
const paginate = async ({
  select,
  from,
  where = "",
  params = [],
  orderBy,
  limit,
  offset,
}) => {
  try {
    // 1. Get the total count of records that match the filter
    const countQuery = `SELECT COUNT(*) as totalCount FROM ${from} ${where}`;
    const [[{ totalCount }]] = await db.query(countQuery, params);

    // 2. Get the actual data for the current page
    const dataQuery = `SELECT ${select} FROM ${from} ${where} ${orderBy} LIMIT ? OFFSET ?`;
    
    // Combine the filter params with the pagination params
    const finalParams = [...params, limit, offset];
    
    const [data] = await db.query(dataQuery, finalParams);

    return { data, totalCount };
  } catch (error) {
    console.error(`Error in pagination helper: ${error.message}`);
    throw error;
  }
};

module.exports = { paginate };