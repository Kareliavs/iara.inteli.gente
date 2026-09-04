const SESSION_COOKIE_NAME = "city_hall_session";
const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;
const REMEMBERED_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf("=");
      if (separator === -1) return cookies;
      const key = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

function getSessionToken(req) {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME] || "";
}

function getSessionTtlSeconds(rememberAccess = false) {
  return rememberAccess ? REMEMBERED_SESSION_TTL_SECONDS : DEFAULT_SESSION_TTL_SECONDS;
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" ||
      String(process.env.COOKIE_SECURE || "").toLowerCase() === "true",
  };
}

function setSessionCookie(res, token, ttlSeconds) {
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions(ttlSeconds * 1000));
}

function clearSessionCookie(res) {
  const options = cookieOptions(0);
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE_NAME, options);
}

module.exports = {
  clearSessionCookie,
  getSessionToken,
  getSessionTtlSeconds,
  setSessionCookie,
};
