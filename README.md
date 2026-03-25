Admin panel for Herd e-commerce. Built with Next.js (App Router), TypeScript, Tailwind v4, and shadcn/ui.

## Prerequisites
- Node 18+ (Next 16)
- npm (used by default)

## Setup
1) Install deps
```bash
npm install
```

2) Environment
- Copy `.env.example` to `.env.local` and fill backend endpoints:
  - `API_BASE_URL` – ecom-one backend (http://localhost:8000)
  - `AUTH_COOKIE_NAME` – cookie key for admin auth token
  - `ADMIN_LOGIN_PATH`/`ADMIN_ME_PATH`/`ADMIN_LOGOUT_PATH`
  - `ADMIN_PRODUCTS_PATH`/`ADMIN_SETTINGS_PATH`
  - `NEXT_PUBLIC_SITE_URL` – origin of this app (used for server fetches)

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – run built app
- `npm run lint` – lint

## Structure (high-level)
- `src/app/(auth)/login` – admin login
- `src/app/(protected)` – protected shell (dashboard, products, settings)
- `src/app/api` – proxy routes to backend (auth/products/settings)
- `src/lib` – api client, auth helpers, types
- `src/components` – UI + app shell

## Flows
- Auth: `/api/auth/login` proxies to backend, sets HTTP-only cookie; middleware guards protected routes.
- Products/Settings: `/api/admin/*` proxies to backend with bearer token from cookie.

## Login Instructions

### 1. Start the Admin Panel
```bash
cd ecom-one/admin
npm run dev
```
The admin panel will be available at `http://localhost:3000` (or the port shown in terminal).

### 2. Access Login Page
Navigate to: **`http://localhost:3000/login`**

### 3. Backend Requirements

**Important:** The backend must return the following format for admin login to work:

**Login Response Format** (`POST /api/auth/login`):
```json
{
  "token": "your-jwt-token",
  "refreshToken": "optional-refresh-token",
  "user": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Current Backend Issue:** The Laravel backend at `backend/app/Http/Controllers/Api/AuthController.php` currently returns:
```json
{
  "token": "...",
  "permissions": ["customer"]
}
```

**To Fix:** Update the `login` method in `AuthController.php` to return the user object with role:

```php
// In backend/app/Http/Controllers/Api/AuthController.php
public function login(Request $request)
{
    // ... existing validation ...
    
    $token = $user->createToken('auth_token')->accessToken;
    
    // Determine role (you'll need to add a 'role' field to users table)
    // For now, you can hardcode or check a flag
    $role = $user->is_admin ?? 'customer'; // or check a role column
    
    return response()->json([
        'token' => $token,
        'user' => [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $role === 'admin' ? 'admin' : 'customer',
        ],
    ]);
}
```

**Also update the `profile` method** (`GET /api/auth/me` or `/api/auth/profile`):
```php
public function profile(Request $request)
{
    $user = $request->user();
    return response()->json([
        'id' => (string) $user->id,
        'email' => $user->email,
        'name' => $user->name,
        'role' => $user->is_admin ? 'admin' : 'customer', // adjust based on your schema
    ]);
}
```

### 4. Create an Admin User

You'll need a user with admin privileges. Options:

**Option A: Add `is_admin` column to users table**
```bash
cd backend
php artisan make:migration add_is_admin_to_users_table
```

In the migration:
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('is_admin')->default(false);
});
```

Then set a user as admin:
```bash
php artisan tinker
>>> $user = App\Models\User::where('email', 'admin@example.com')->first();
>>> $user->is_admin = true;
>>> $user->save();
```

**Option B: Use a role column**
Add a `role` column (enum: 'customer', 'admin', etc.) and set it accordingly.

### 5. Environment Variables

Create `admin/.env.local`:
```env
# Backend API URL (adjust port if your Laravel backend runs on different port)
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Auth cookie name
AUTH_COOKIE_NAME=admin_session_token

# Backend API paths (defaults shown, adjust if different)
ADMIN_LOGIN_PATH=/api/auth/login
ADMIN_ME_PATH=/api/auth/profile
ADMIN_LOGOUT_PATH=/api/auth/logout
ADMIN_PRODUCTS_PATH=/api/admin/products
ADMIN_SETTINGS_PATH=/api/admin/settings

# Admin panel URL (for server-side fetches)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Login Credentials

Use any user account that:
- Has `email_verified_at` set (email verified)
- Has `role: 'admin'` (or `is_admin: true`) in the backend response

After logging in successfully, you'll be redirected to `/dashboard`.
