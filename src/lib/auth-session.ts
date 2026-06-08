export function setAuthCookie(name: 'authToken' | 'authRole', value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

export function clearAuthCookies() {
  document.cookie = 'authToken=; path=/; max-age=0';
  document.cookie = 'authRole=; path=/; max-age=0';
}

export function clearAuthStorage() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('authUser');
}

export function clearBrowserAuthSession() {
  clearAuthStorage();
  clearAuthCookies();
}
