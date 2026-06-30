# Business Rules — AUTH Module

## BR-AUTH-01: Session Duration

| Aturan | Nilai |
|---|---|
| Session lifetime | 7 hari (604800 detik) |
| Session strategy | JWT (stateless) |
| Refresh behavior | Session diperpanjang otomatis saat user aktif (sliding expiration) |
| Cookie attributes | `HttpOnly: true`, `Secure: true` (production), `SameSite: 'lax'` |
| Token storage | Cookie-based (tidak di localStorage) |

## BR-AUTH-02: Password Policy

| Aturan | Nilai |
|---|---|
| Minimum length | 8 karakter |
| Hashing algorithm | bcrypt |
| Salt rounds | 10 |
| Password di plain text | Tidak pernah disimpan atau di-log |
| Password reset | Out of scope — hubungi admin untuk reset manual |

## BR-AUTH-03: Account Status

| Aturan | Keterangan |
|---|---|
| `isActive = true` | Akun aktif, bisa login |
| `isActive = false` | Akun nonaktif, tidak bisa login. Pesan: "Akun Anda tidak aktif. Hubungi admin." |
| Admin menonaktifkan akun | Session user yang sedang login tetap valid sampai JWT expired atau logout |
| Admin mengaktifkan kembali | User bisa login kembali seperti biasa |
| Admin tidak bisa nonaktifkan diri sendiri | Validasi di server side |
| Admin tidak bisa ubah role diri sendiri | Validasi di server side |

## BR-AUTH-04: Registration Policy

| Aturan | Keterangan |
|---|---|
| Registrasi publik | TIDAK ADA. Hanya admin yang bisa membuat akun. |
| Default role akun baru | `SISWA` |
| Admin bisa membuat akun admin lain | Ya, via ubah role setelah create |
| Username wajib diisi | Saat pembuatan akun, username wajib diisi dan harus unik |
| Email opsional | Email tidak wajib, tetapi jika diisi harus unik dan format valid |

## BR-AUTH-05: Role-Based Access Control (RBAC)

| Route Pattern | Role Required | Behavior jika tidak punya akses |
|---|---|---|
| `/` (landing) | Publik | Semua bisa akses |
| `/login` | Publik | Jika sudah login → redirect ke dashboard/admin |
| `/admin/*` | `ADMIN` | SISWA → redirect `/dashboard`; tidak login → redirect `/login` |
| `/dashboard` | `SISWA` | ADMIN → redirect `/admin`; tidak login → redirect `/login` |
| `/study/*` | `SISWA` | ADMIN → redirect `/admin`; tidak login → redirect `/login` |
| `/exam/*` | `SISWA` | ADMIN → redirect `/admin`; tidak login → redirect `/login` |
| `/history/*` | `SISWA` | ADMIN → redirect `/admin`; tidak login → redirect `/login` |
| `/api/admin/*` | `ADMIN` | 403 Forbidden jika bukan admin |
| `/api/study/*` | `SISWA` | 403 Forbidden jika bukan siswa |
| `/api/exam/*` | `SISWA` | 403 Forbidden jika bukan siswa |

## BR-AUTH-06: Rate Limiting

| Aturan | Nilai |
|---|---|
| Maksimal login attempt | 5 per menit per IP |
| Setelah 5 gagal | Response 429 Too Many Requests |
| Reset counter | 1 menik setelah attempt pertama |

## BR-AUTH-07: JWT Payload

| Field | Keterangan |
|---|---|
| `sub` (subject) | User ID |
| `username` | User username |
| `email` | User email (opsional, bisa null) |
| `name` | User name |
| `role` | `ADMIN` atau `SISWA` |
| `iat` | Issued at timestamp |
| `exp` | Expiration timestamp |

**Tidak boleh ada di JWT:** password hash, isActive, streak, lastActiveDate (diambil dari DB saat perlu)

## BR-AUTH-08: Error Messages

| Skenario | Pesan yang ditampilkan |
|---|---|
| Identifier/password salah | "Identifier atau password salah" |
| Akun nonaktif | "Akun Anda tidak aktif. Hubungi admin." |
| Username sudah terdaftar (create user) | "Username sudah terdaftar" |
| Email sudah terdaftar (create user) | "Email sudah terdaftar" |
| Rate limit exceeded | "Terlalu banyak percobaan. Coba lagi dalam 1 menit." |
| Tidak bisa nonaktifkan akun sendiri | "Tidak bisa menonaktifkan akun sendiri" |
| Tidak bisa ubah role diri sendiri | "Tidak bisa mengubah role diri sendiri" |

## BR-AUTH-09: Aturan Username

| Aturan | Keterangan |
|---|---|
| Wajib diisi | Username wajib diisi saat pembuatan akun |
| Panjang minimal | 4 karakter |
| Panjang maksimal | 30 karakter |
| Karakter yang diizinkan | Huruf, angka, dan underscore (_) — tidak boleh ada spasi atau karakter khusus lain |
| Unik | Harus unik di seluruh sistem |
| Ubah username | Siswa dapat mengubah username sendiri kapan saja, dengan validasi aturan yang sama |
| Email opsional | Email bersifat opsional. Jika diisi, harus berformat valid dan unik |

## BR-AUTH-10: Login dengan Identifier

| Aturan | Keterangan |
|---|---|
| Field input login | Disebut "identifier" di backend, bukan "email" |
| Metode login | Pengguna dapat masuk menggunakan username ATAU email (salah satu) |
| Pencarian user | Backend mencari user berdasarkan username terlebih dahulu, jika tidak ditemukan cek email |
| Anti-enumeration | Pesan error sama baik identifier tidak ditemukan maupun password salah |
