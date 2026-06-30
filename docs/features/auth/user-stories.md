# User Stories — AUTH Module

## US-AUTH-01: Login sebagai Siswa

**As a** siswa,
**I want to** login dengan email dan password,
**So that** saya bisa mengakses dashboard dan mulai belajar.

### Acceptance Criteria
- [ ] Halaman login tersedia di `/login`
- [ ] Form memiliki field: email, password
- [ ] Password minimal 8 karakter (client-side validation)
- [ ] Jika kredensial benar: redirect ke `/dashboard`
- [ ] Jika kredensial salah: tampilkan pesan "Email atau password salah"
- [ ] Tombol login disabled saat proses login berlangsung
- [ ] Loading indicator visible saat proses login

---

## US-AUTH-02: Login sebagai Admin

**As an** admin,
**I want to** login dengan email dan password,
**So that** saya bisa mengakses admin dashboard.

### Acceptance Criteria
- [ ] Halaman login sama dengan siswa (tidak ada form terpisah)
- [ ] Jika kredensial benar dan role = ADMIN: redirect ke `/admin`
- [ ] Jika kredensial salah: tampilkan pesan "Email atau password salah"

---

## US-AUTH-03: Logout

**As a** user yang sudah login,
**I want to** logout dari sistem,
**So that** sesi saya diakhiri dan akun saya aman.

### Acceptance Criteria
- [ ] Tombol logout tersedia di navbar/sidebar
- [ ] Klik logout menghapus session NextAuth
- [ ] Setelah logout: redirect ke landing page (`/`)
- [ ] Setelah logout, tombol back browser tidak bisa kembali ke halaman protected

---

## US-AUTH-04: Akses route protected tanpa login

**As an** pengunjung yang belum login,
**I want to** dilarikan ke halaman login jika mengakses halaman protected,
**So that** halaman saya tetap aman.

### Acceptance Criteria
- [ ] Akses `/admin/*` tanpa login → redirect ke `/login`
- [ ] Akses `/study/*` tanpa login → redirect ke `/login`
- [ ] Akses `/exam/*` tanpa login → redirect ke `/login`
- [ ] Akses `/history/*` tanpa login → redirect ke `/login`
- [ ] Akses `/dashboard` tanpa login → redirect ke `/login`

---

## US-AUTH-05: Akses route dengan role salah

**As a** siswa,
**I want to** dilarikan jika mencoba mengakses halaman admin,
**So that** saya tidak bisa mengutak-atik konfigurasi sistem.

### Acceptance Criteria
- [ ] Siswa akses `/admin/*` → redirect ke `/dashboard` (sudah login, tapi role salah)
- [ ] Admin akses `/study/*` atau `/exam/*` → redirect ke `/admin` (sudah login, tapi role salah)
- [ ] Tidak ada error page, langsung redirect

---

## US-AUTH-06: Admin membuat akun siswa

**As an** admin,
**I want to** membuat akun siswa baru,
**So that** siswa tersebut bisa login dan mulai belajar.

### Acceptance Criteria
- [ ] Form pembuatan user di admin dashboard: name, email, password
- [ ] Email harus unik (tidak boleh duplikat)
- [ ] Password minimal 8 karakter
- [ ] Role default: SISWA
- [ ] Setelah berhasil: user muncul di daftar user
- [ ] Jika email sudah terdaftar: tampilkan pesan error
- [ ] Password disimpan sebagai bcrypt hash

---

## US-AUTH-07: Admin melihat daftar user

**As an** admin,
**I want to** melihat daftar semua user,
**So that** saya bisa mengelola akun siswa.

### Acceptance Criteria
- [ ] Tabel menampilkan: name, email, role, isActive, createdAt
- [ ] Bisa search/filter by name atau email
- [ ] Bila user banyak: pagination (20 per halaman)

---

## US-AUTH-08: Admin mengubah role user

**As an** admin,
**I want to** mengubah role user (SISWA → ADMIN atau sebaliknya),
**So that** saya bisa memberi atau mencabut akses admin.

### Acceptance Criteria
- [ ] Dropdown/option untuk ubah role: ADMIN / SISWA
- [ ] Konfirmasi sebelum ubah (modal konfirmasi)
- [ ] Admin tidak bisa ubah role dirinya sendiri
- [ ] Setelah ubah: update daftar user, session user yang diubah tetap valid

---

## US-AUTH-09: Admin menonaktifkan akun

**As an** admin,
**I want to** menonaktifkan akun siswa,
**So that** siswa yang sudah tidak aktif tidak bisa login.

### Acceptance Criteria
- [ ] Tombol toggle active/nonactive di daftar user
- [ ] Admin tidak bisa menonaktifkan akunnya sendiri
- [ ] User dengan isActive=false tidak bisa login
- [ ] Pesan error saat login dengan akun nonaktif: "Akun Anda tidak aktif. Hubungi admin."
- [ ] User yang sedang login saat dinonaktifkan: session tetap valid sampai JWT expired atau logout

---

## US-AUTH-10: Redirect setelah login

**As a** user yang sudah login,
**I want to** diarahkan ke halaman yang sesuai,
**So that** saya langsung di halaman yang tepat untuk role saya.

### Acceptance Criteria
- [ ] ADMIN setelah login → `/admin`
- [ ] SISWA setelah login → `/dashboard`
- [ ] Jika user sudah login dan akses `/login` → redirect ke halaman sesuai role
- [ ] Redirect menggunakan Next.js redirect (server-side), bukan client-side

---

## US-AUTH-11: Akun nonaktif mencoba login

**As a** user dengan akun nonaktif,
**I want to** mendapat pesan yang jelas saat login,
**So that** saya tahu mengapa tidak bisa login.

### Acceptance Criteria
- [ ] Login dengan akun isActive=false → pesan "Akun Anda tidak aktif. Hubungi admin."
- [ ] Pesan berbeda dari password salah
- [ ] Session tidak dibuat untuk akun nonaktif
