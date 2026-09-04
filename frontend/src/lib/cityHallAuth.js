const AUTH_STORAGE_KEY = "city-hall-auth";
const EMAIL_STORAGE_KEY = "city-hall-user-email";

export function getCityHallHomePath(usuario) {
  if (usuario?.usuario_funcao === "admin") return "/prefeitura/admin";
  if (usuario?.usuario_funcao === "prefeitura") return "/prefeitura/pos-login";
  return "/prefeitura";
}

function getStorages() {
  return [window.localStorage, window.sessionStorage];
}

export function getCityHallAuth() {
  for (const storage of getStorages()) {
    const rawValue = storage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) continue;
    try {
      const auth = JSON.parse(rawValue);
      if (auth?.usuario) return auth;
    } catch {
      storage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  return null;
}

export function saveCityHallAuth(auth, rememberAccess) {
  const storage = rememberAccess ? window.localStorage : window.sessionStorage;
  const temporaryStorage = rememberAccess ? window.sessionStorage : window.localStorage;
  const safeAuth = { usuario: auth.usuario };

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeAuth));
  storage.setItem(EMAIL_STORAGE_KEY, auth.usuario.usuario_login);
  temporaryStorage.removeItem(AUTH_STORAGE_KEY);
  temporaryStorage.removeItem(EMAIL_STORAGE_KEY);
}

export function clearCityHallAuth() {
  getStorages().forEach((storage) => {
    storage.removeItem(AUTH_STORAGE_KEY);
    storage.removeItem(EMAIL_STORAGE_KEY);
  });
}

export async function fetchCityHallSession() {
  const response = await fetch("/api/auth/session", { credentials: "include" });
  if (!response.ok) {
    clearCityHallAuth();
    return null;
  }
  const auth = await response.json();
  saveCityHallAuth(auth, Boolean(localStorage.getItem(EMAIL_STORAGE_KEY)));
  return auth;
}

export async function logoutCityHall() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // A sessão local deve ser encerrada mesmo se a API estiver indisponível.
  } finally {
    clearCityHallAuth();
  }
}
