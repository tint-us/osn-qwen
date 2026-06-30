# Edge Cases — CONTENT PROCESSING Module

## EC-CONTENT-01: File Format Tidak Didukung

**Skenario:** Admin upload file .xlsx atau .txt.

**Expected behavior:**
- Error: "Format file tidak didukung. Gunakan .csv, .json, atau .xml"
- File tidak di-parse
- Upload area di-reset

---

## EC-CONTENT-02: File Lebih dari 5MB

**Skenario:** Admin upload file JSON 8MB.

**Expected behavior:**
- Error: "Ukuran file maksimal 5MB"
- File tidak di-parse
- Upload area di-reset

---

## EC-CONTENT-03: File Kosong

**Skenario:** Admin upload file CSV tanpa isi (hanya header atau kosong).

**Expected behavior:**
- CSV dengan header only: parse returns empty array
- Error: "Tidak ada soal dalam file"
- CSV kosong: parse error
- Error: "File kosong"

---

## EC-CONTENT-04: CSV dengan Header Tidak Lengkap

**Skenario:** CSV header hanya berisi: tingkat,level,matpel,questionType (missing content, explanation).

**Expected behavior:**
- Parse berhasil (papaparse parse by header)
- Setiap baris: content = undefined, explanation = undefined
- Validasi: "Field content wajib diisi", "Field explanation wajib diisi"
- Semua baris invalid
- Tampilkan di preview dengan error

---

## EC-CONTENT-05: JSON Bukan Array

**Skenario:** File JSON berisi object tunggal, bukan array.

```json
{
  "tingkat": "SMA",
  "level": "OSNP",
  "matpel": "Matematika",
  "questionType": "MULTIPLE_CHOICE",
  "content": "..."
}
```

**Expected behavior:**
- Parse error: "Format JSON tidak valid: expected array"
- Tidak lanjut ke preview

---

## EC-CONTENT-06: JSON dengan Syntax Error

**Skenario:** File JSON dengan trailing comma atau missing bracket.

**Expected behavior:**
- JSON.parse throws SyntaxError
- Error: "Format JSON tidak valid: {error message}"
- Tidak lanjut ke preview

---

## EC-CONTENT-07: XML dengan Tag Tidak Tertutup

**Skenario:** File XML dengan `<question>` yang tidak ditutup.

**Expected behavior:**
- fast-xml-parser throws error
- Error: "Format XML tidak valid: {error detail}"
- Tidak lanjut ke preview

---

## EC-CONTENT-08: Field Enum Tidak Valid

**Skenario:** Soal dengan `tingkat: "SMAA"` atau `level: "OSN"`.

**Expected behavior:**
- Validasi: "Tingkat harus SD/SMP/SMA" atau "Level harus OSNK/OSNP/SEMIFINAL/FINAL"
- Baris ditandai invalid di preview

---

## EC-CONTENT-09: MC dengan correctOption Out of Bounds

**Skenario:** MC dengan 4 options (index 0-3), correctOption = 5.

**Expected behavior:**
- Validasi: "correctOption harus index valid (0-3)"
- Baris ditandai invalid

---

## EC-CONTENT-10: MC dengan Options Kurang dari 2

**Skenario:** MC dengan `options: ["Hanya satu pilihan"]`.

**Expected behavior:**
- Validasi: "Options minimal 2 pilihan"
- Baris ditandai invalid

---

## EC-CONTENT-11: ESSAY dengan Jawaban Non-Numeric

**Skenario:** ESSAY dengan `acceptableAnswers: ["dua puluh"]`.

**Expected behavior:**
- Validasi: "Jawaban essay harus berupa angka"
- Baris ditandai invalid

---

## EC-CONTENT-12: Konten dengan HTML Tags

**Skenario:** Soal dengan `content: "<script>alert('xss')</script>Hitung $x^2$"`.

**Expected behavior:**
- Sanitasi: strip HTML tags → "Hitung $x^2$"
- Script tag dihapus sepenuhnya
- LaTeX notation ($x^2$) tetap dipertahankan
- Soal valid (jika field lain valid)

---

## EC-CONTENT-13: Bulk Insert Gagal

**Skenario:** Saat import 100 soal, soal ke-50 gagal insert (DB constraint error).

**Expected behavior:**
- Transaction rollback: tidak ada soal yang diinsert
- Error: "Import gagal: {error detail}. Tidak ada soal yang disimpan."
- Admin bisa perbaiki dan coba lagi

---

## EC-CONTENT-14: Soal Duplikat dalam File

**Skenario:** File berisi 2 soal dengan content yang sama persis.

**Expected behavior:**
- Kedua soal valid (tidak ada duplicate check saat import)
- Kedua soal diinsert ke DB
- Acceptable: soal duplikat diizinkan

---

## EC-CONTENT-15: File dengan 1000+ Soal

**Skenario:** Admin upload file dengan 1500 soal.

**Expected behavior:**
- Parse: berhasil (no limit)
- Preview: pagination 50/page (30 halaman)
- Bulk insert: transaction dengan 1500 records
- Jika timeout: increase timeout atau chunk insert
- Performance target: < 5 detik untuk 1000 soal
