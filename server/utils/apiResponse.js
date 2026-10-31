export function sendSuccess(res, { data = null, message = 'OK', meta = null, status = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(res, { status = 500, message = 'Error', details = null } = {}) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}
