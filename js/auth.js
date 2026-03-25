/**
 * AgriConnect Auth State Management
 *
 * Handles JWT token storage, user session, and auth-aware navigation.
 * Uses localStorage for persistence across page reloads.
 */
const Auth = {
  TOKEN_KEY: 'agri_access_token',
  REFRESH_KEY: 'agri_refresh_token',
  USER_KEY: 'agri_user',

  // ─── Token Management ─────────────────────────────
  saveSession(data) {
    if (data.accessToken) localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(this.REFRESH_KEY, data.refreshToken);
    if (data.user) localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'login.html';
  },

  // ─── Navigation Update ────────────────────────────
  // Call this on every page load to update header nav
  updateNav() {
    const nav = document.querySelector('header nav ul');
    if (!nav) return;

    const user = this.getUser();
    const isLoggedIn = this.isLoggedIn();

    // Find and remove existing auth links (Sign Up, Log In, Join Now, dashboard, logout)
    const authClasses = ['nav-cta', 'nav-login', 'nav-user', 'nav-logout'];
    nav.querySelectorAll('li').forEach(li => {
      const a = li.querySelector('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const cls = a.className || '';
      if (
        href.includes('signup.html') ||
        href.includes('login.html') ||
        authClasses.some(c => cls.includes(c)) ||
        cls.includes('nav-dashboard') ||
        a.textContent.includes('Log Out')
      ) {
        li.remove();
      }
    });

    if (isLoggedIn && user) {
      // Dashboard link
      const dashLi = document.createElement('li');
      dashLi.innerHTML = '<a href="dashboard.html" class="nav-dashboard">Dashboard</a>';
      nav.appendChild(dashLi);

      // User greeting + logout
      const userLi = document.createElement('li');
      const firstName = user.full_name ? user.full_name.split(' ')[0] : 'User';
      userLi.innerHTML =
        '<a href="#" class="nav-cta" onclick="Auth.logout(); return false;">' +
        firstName + ' (Log Out)</a>';
      nav.appendChild(userLi);
    } else {
      // Login link
      const loginLi = document.createElement('li');
      loginLi.innerHTML = '<a href="login.html" class="nav-login">Log In</a>';
      nav.appendChild(loginLi);

      // Sign up link
      const signupLi = document.createElement('li');
      signupLi.innerHTML = '<a href="signup.html" class="nav-cta">Join Now</a>';
      nav.appendChild(signupLi);
    }
  },

  // ─── Route Guard ──────────────────────────────────
  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // Redirect to dashboard if already logged in (for login/signup pages)
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  },
};

// Auto-update navigation on every page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNav();
});
