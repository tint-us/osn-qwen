# Edge Cases — AUTH Module

## EC-AUTH-01: Token Expired

**Skenario:** User login, tinggal halaman terbuka > 7 hari, kembali dan mencoba aksi.

**Expected behavior:**
- Saat request berikutnya, middleware mendeteksi JWT expired
- User di-redirect ke `/login`
- Tidak ada error 500, tidak ada crash
- User bisa login kembali dengan normal

**Implementation note:** NextAuth menangani JWT expiry otomatis. Middleware cukup cek `session === null`.

---

## EC-AUTH-02: Brute Force Login

**Skenario:** Attacker mencoba login berulang dengan password berbeda untuk email yang sama.

**Expected behavior:**
- Setelah 5 percobaan gagal dalam 1 menit dari IP yang sama → response 429
- Tidak mengungkapkan apakah email terdaftar atau tidak (pesan sama: "Email atau password salah")
- Counter reset setelah 1 menit
- Tidak ada lock akun permanent (hanya rate limit per IP)

**Implementation note:** Rate limiting di level middleware atau API route, bukan di DB. Gunakan in-memory counter atau Redis (future).

---

## EC-AUTH-03: Akses Langsung URL Protected

**Skenario:** User belum login, mengetik URL `/exam/session/42` langsung di browser.

**Expected behavior:**
- Middleware intercept sebelum page render
- Redirect 302 ke `/login`
- Setelah login, redirect ke `/dashboard` (bukan kembali ke `/exam/session/42`)
- Tidak ada informasi halaman yang bocor

**Implementation note:** Middleware `redirect()` callback selalu ke `/login`, tidak menyimpan `callbackUrl` untuk security reasons.

---

## EC-AUTH-04: Akun Nonaktif Mencoba Login

**Skenario:** User yang isActive=false mencoba login.

**Expected behavior:**
- Email ditemukan di DB
- Cek isActive=false
- Return null di credentials callback → login gagal
- Pesan spesifik: "Akun Anda tidak aktif. Hubungi admin." (berbeda dari password salah)

**Implementation note:** Distinguish antara "user tidak ditemukan", "password salah", dan "akun nonaktif" untuk memberikan pesan yang tepat. Namun, untuk "user tidak ditemukan" dan "password salah", pesan harus sama (anti-enumeration).

---

## EC-AUTH-05: Admin Menonaktifkan Akun User yang Sedang Login

**Skenario:** Siswa A sedang login. Admin menonaktifkan akun Siswa A.

**Expected behavior:**
- Siswa A tetap bisa menggunakan aplikasi sampai JWT expired atau logout
- Saat JWT expired, Siswa A tidak bisa login lagi
- Tidak ada real-time session revocation (acceptable trade-off untuk simplicity)

**Implementation note:** Session revocation real-time membutuhkan session blacklist di DB, yang kompleks. Untuk fase pertama, approach passive expiration sudah cukup.

---

## EC-AUTH-06: Admin Mengubah Role User yang Sedang Login

**Skenario:** Siswa A sedang login di /study. Admin mengubah role Siswa A menjadi ADMIN.

**Expected behavior:**
- Siswa A tetap bisa menggunakan aplikasi dengan role SISWA sampai JWT expired atau logout
- Saat login kembali, role baru (ADMIN) akan dipakai
- Redirect setelah login berikutnya: `/admin` (bukan `/dashboard`)

---

## EC-AUTH-07: User Sudah Login Mengakses /login

**Skenario:** User yang sudah login mengetik `/login` di browser.

**Expected behavior:**
- Middleware cek session ada
- Redirect ke `/admin` (jika ADMIN) atau `/dashboard` (jika SISWA)
- Tidak menampilkan form login

---

## EC-AUTH-08: Double Submit Login Form

**Skenario:** User klik tombol "Login" dua kali dengan cepat.

**Expected behavior:**
- Tombol disabled setelah klik pertama
- Hanya satu request POST yang dikirim
- Tidak ada race condition di session creation

**Implementation note:** Client-side: `setIsSubmitting(true)` setelah klik. Button disabled saat `isSubmitting === true`.

---

## EC-AUTH-09: Password Tidak Memenuhi Minimum Length

**Skenario:** Admin membuat user baru dengan password < 8 karakter.

**Expected behavior:**
- Client-side validation: tampilkan error sebelum submit
- Server-side validation: return 400 jika lolos client
- Pesan: "Password minimal 8 karakter"

---

## EC-AUTH-10: Email Format Invalid

**Skenario:** User/Admin input email dengan format tidak valid (misal: "test@test", "halo").

**Expected behavior:**
- Client-side: HTML5 email input validation + Zod schema
- Server-side: Zod schema validation
- Return 400 dengan pesan: "Format email tidak valid"

---

## EC-AUTH-11: Admin Menghapus Akun Sendiri (mencoba nonaktifkan)

**Skenario:** Admin mencoba menonaktifkan akunnya sendiri.

**Expected behavior:**
- Client-side: disable tombol untuk akun sendiri
- Server-side: return 403 dengan pesan "Tidak bisa menonaktifkan akun sendiri"
- Akun tetap aktif

---

## EC-AUTH-12: Database Connection Error Saat Login

**Skenario:** PostgreSQL mati saat user mencoba login.

**Expected behavior:**
- API route catch error, return 500
- Pesan user: "Terjadi kesalahan. Silakan coba lagi."
- Tidak mengungkap detail error database
- Server log mencatat error untuk debugging

---

## EC-AUTH-13: Cookie Dihapus Manual dari Browser

**Skenario:** User menghapus cookie session dari DevTools.

**Expected behavior:**
- Request berikutnya: middleware tidak menemukan session
- Redirect ke `/login`
- User bisa login kembali dengan normal

---

## EC-AUTH-14: Concurrent Login (Multi-Device)

**Skenario:** Siswa login di laptop, lalu login lagi di HP.

**Expected behavior:**
- Kedua session valid (JWT stateless, tidak ada session store)
- Kedua device bisa digunakan bersamaan
- Logout di satu device tidak menghapus session di device lain (acceptable untuk fase pertama)

---

## EC-AUTH-15: Username Sudah Digunakan Saat Registrasi atau Ubah Username

**Skenario:** Admin membuat akun baru dengan username yang sudah dipakai, atau siswa mengubah username ke yang sudah dimiliki orang lain.

**Expected behavior:**
- Server-side validation: cek uniqueness sebelum insert/update
- Jika username sudah ada: return 400 dengan pesan "Username sudah terdaftar"
- Tidak ada perubahan pada data user yang sudah ada
- Validasi dilakukan di server, bukan hanya client-side

---

## EC-AUTH-16: Format Username Tidak Valid

**Skenario:** Username yang diinput mengandung spasi, karakter khusus, atau terlalu pendek (< 4 karakter) / terlalu panjang (> 30 karakter).

**Expected behavior:**
- Client-side validation: tampilkan error sebelum submit
- Server-side validation: return 400 jika lolos client
- Regex validasi: `^[a-zA-Z0-9_]{4,30}$`
- Pesan: "Username hanya boleh mengandung huruf, angka, dan underscore (4-30 karakter)"

---

## EC-AUTH-17: Identifier Tidak Ditemukan Saat Login

**Skenario:** Pengguna memasukkan identifier yang tidak cocok dengan username atau email manapun di sistem.

**Expected behavior:**
- Backend mencari user berdasarkan username, lalu email
- Jika tidak ditemukan: return error yang sama dengan password salah (anti-enumeration)
- Pesan: "Identifier atau password salah"
- Tidak mengungkapkan apakah identifier adalah username atau email

---

## EC-AUTH-18: Siswa Mengubah Username ke Username Yang Sudah Dimiliki Orang Lain

**Skenario:** Siswa A mencoba mengubah username-nya ke "siswa_b" yang sudah dipakai oleh Siswa B.

**Expected behavior:**
- Server-side cek uniqueness: temukan bahwa "siswa_b" sudah dipakai
- Return 400 dengan pesan "Username sudah terdaftar"
- Username lama Siswa A tetap tidak berubah
- Tidak ada informasi tentang siapa pemilik username "siswa_b" (anti-enumeration)

---

## EC-AUTH-19: Email Dikosongkan Setelah Sebelumnya Diisi

**Skenario:** Siswa yang sebelumnya memiliki email mencoba mengosongkan field email saat update profil.

**Expected behavior:**
- Diperbolehkan karena email bersifat opsional
- Field email di-set menjadi `null` di database
- Tidak ada validasi yang menolak perubahan ini
- `@unique` constraint pada nullable field tetap valid (PostgreSQL mengizinkan multiple NULLs)

---

## EC-AUTH-20: Race Condition — Dua Pengguna Mendaftar dengan Username Sama Secara Bersamaan

**Skenario:** Dua request pembuatan akun dengan username yang sama datang dalam waktu hampir bersamaan, melewati validasi uniqueness sebelum salah satunya tersimpan.

**Expected behavior:**
- Database unique constraint pada `username` menangkap konflik
- Request kedua gagal dengan error constraint violation (Prisma `P2002`)
- Server menangkap error dan return 400 dengan pesan "Username sudah terdaftar"
- Hanya satu akun yang berhasil dibuat
- Tidak perlu locking tambahan — unique constraint di DB sudah cukup
