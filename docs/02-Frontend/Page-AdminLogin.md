# Page: Admin Login

**File**: `web/src/pages/admin/AdminLogin.tsx`

Agent login page at `/w/:slug/admin/login`.

---

## Login Flow

1. Agent enters email + password
2. POST to agent auth endpoint
3. Server validates bcrypt hash, returns agent JWT
4. JWT stored in localStorage
5. Redirected to `/w/:slug/admin`

---

## Password Reset

1. Agent clicks "Forgot Password"
2. Enters email → `POST /api/agent/request-password-reset`
3. Backend creates token in `password_reset_tokens` table
4. Sends `sendPasswordResetEmail()` with reset link
5. Agent clicks link → enters new password → `POST /api/agent/reset-password`

---

## Related Notes
- [[Service-Auth]]
- [[Route-Agent]]
- [[Page-AdminDashboard]]
