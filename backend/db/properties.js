const { query, queryOne } = require('./postgres');

function toProperty(row) {
  if (!row) return null;
  const ai = typeof row.ai_metrics === 'string' ? JSON.parse(row.ai_metrics) : (row.ai_metrics || {});
  const images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);
  const amenities = typeof row.amenities === 'string' ? JSON.parse(row.amenities) : (row.amenities || []);
  const nearby = typeof row.nearby_facilities === 'string' ? JSON.parse(row.nearby_facilities) : (row.nearby_facilities || {});

  return {
    id: row.id,
    _id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    location: row.location,
    address: row.address,
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    price_lakhs: Number(row.price_lakhs),
    area_sqft: Number(row.area_sqft),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    age_years: Number(row.age_years) || 0,
    parking: Number(row.parking) || 1,
    floor: Number(row.floor) || 1,
    total_floors: Number(row.total_floors) || 1,
    furnished: row.furnished,
    status: row.status,
    isFeatured: !!row.is_featured,
    images,
    amenities,
    nearby_facilities: nearby,
    predicted_price_5y: ai.predicted_price_5y || null,
    roi_5y_pct: ai.roi_5y_pct || null,
    ai_rating: ai.ai_rating || 9.0,
    crime_score: ai.crime_score || 2.2,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

async function findProperties(filters = {}) {
  let conditions = [];
  let params = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  } else {
    conditions.push(`status = 'Approved'`);
  }

  if (filters.city && filters.city !== 'All') {
    conditions.push(`LOWER(city) = LOWER($${idx++})`);
    params.push(filters.city);
  }

  if (filters.bedrooms && filters.bedrooms !== 'All') {
    conditions.push(`bedrooms = $${idx++}`);
    params.push(parseInt(filters.bedrooms, 10));
  }

  if (filters.furnished && filters.furnished !== 'All') {
    conditions.push(`furnished = $${idx++}`);
    params.push(filters.furnished);
  }

  if (filters.minPrice) {
    conditions.push(`price_lakhs >= $${idx++}`);
    params.push(parseFloat(filters.minPrice));
  }

  if (filters.maxPrice) {
    conditions.push(`price_lakhs <= $${idx++}`);
    params.push(parseFloat(filters.maxPrice));
  }

  if (filters.search) {
    conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(location) LIKE $${idx} OR LOWER(city) LIKE $${idx})`);
    params.push(`%${filters.search.toLowerCase()}%`);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM properties ${whereClause} ORDER BY created_at DESC LIMIT 100`;
  const result = await query(sql, params);
  return result.rows.map(toProperty);
}

async function findPropertyById(id) {
  const row = await queryOne(`SELECT * FROM properties WHERE id = $1`, [id]);
  return toProperty(row);
}

async function insertProperty(p) {
  const now = Date.now();
  const id = p.id || ('prop-' + now);
  const imagesJson = JSON.stringify(p.images || []);
  const amenitiesJson = JSON.stringify(p.amenities || []);
  const nearbyJson = JSON.stringify(p.nearby_facilities || {});
  const aiJson = JSON.stringify({
    predicted_price_5y: p.predicted_price_5y,
    roi_5y_pct: p.roi_5y_pct,
    ai_rating: p.ai_rating,
    crime_score: p.crime_score
  });

  const sql = `
    INSERT INTO properties (
      id, seller_id, title, description, city, location, address,
      lat, lng, price_lakhs, area_sqft, bedrooms, bathrooms,
      age_years, parking, floor, total_floors, furnished, status,
      is_featured, images, amenities, nearby_facilities, ai_metrics,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24,
      $25, $26
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      price_lakhs = EXCLUDED.price_lakhs,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at
    RETURNING *;
  `;

  // Verify or safely default seller_id to null if not referencing a real user UUID
  let validSellerId = null;
  if (p.seller?.userId && p.seller.userId.length > 20) {
    validSellerId = p.seller.userId;
  }

  const params = [
    id,
    validSellerId,
    p.title,
    p.description || '',
    p.city,
    p.location,
    p.address || '',
    p.lat || 0,
    p.lng || 0,
    p.price_lakhs || 0,
    p.area_sqft || 0,
    p.bedrooms || 1,
    p.bathrooms || 1,
    p.age_years || 0,
    p.parking || 1,
    p.floor || 1,
    p.total_floors || 1,
    p.furnished || 'Semi-Furnished',
    p.status || 'Approved',
    !!p.isFeatured,
    imagesJson,
    amenitiesJson,
    nearbyJson,
    aiJson,
    now,
    now
  ];

  const res = await query(sql, params);
  return toProperty(res.rows[0]);
}

async function updatePropertyStatus(id, status) {
  const sql = `UPDATE properties SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`;
  const res = await query(sql, [status, Date.now(), id]);
  return toProperty(res.rows[0]);
}

async function countProperties() {
  const res = await queryOne(`SELECT COUNT(*) as count FROM properties`);
  return parseInt(res?.count || 0, 10);
}

async function getAdminMetrics() {
  const counts = await queryOne(`
    SELECT
      COUNT(*) as total_properties,
      COUNT(*) FILTER (WHERE status = 'Approved') as approved_properties,
      COUNT(*) FILTER (WHERE status = 'Pending') as pending_properties
    FROM properties
  `);

  const userCounts = await queryOne(`
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE role = 'Seller') as active_sellers
    FROM users
  `);

  return {
    totalProperties: parseInt(counts?.total_properties || 0, 10),
    approvedProperties: parseInt(counts?.approved_properties || 0, 10),
    pendingProperties: parseInt(counts?.pending_properties || 0, 10),
    totalUsers: parseInt(userCounts?.total_users || 0, 10),
    activeSellers: parseInt(userCounts?.active_sellers || 0, 10),
    platformRevenueLakhs: 18.5
  };
}

module.exports = {
  findProperties,
  findPropertyById,
  insertProperty,
  updatePropertyStatus,
  countProperties,
  getAdminMetrics
};
