// Normalizes pagination/sort query params with safe bounds.
export function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limitRaw = parseInt(query.limit, 10) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildSort(query = {}, allowed = [], fallback = '-createdAt') {
  const sortBy = query.sortBy;
  const order = query.order === 'asc' ? '' : '-';
  if (sortBy && allowed.includes(sortBy)) return `${order}${sortBy}`;
  return fallback;
}

export function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
