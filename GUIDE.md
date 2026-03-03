# 📘 Privcey Edu — Panduan Penggunaan

> Platform e-learning all-in-one untuk persiapan ujian: Try Out CBT, Video Belajar, E-Modul, Live Class, analitik performa, dan modul penguatan otomatis.

---

## Daftar Isi

- [Pendahuluan](#pendahuluan)
- [Kebutuhan Sistem](#kebutuhan-sistem)
- [Instalasi & Setup](#instalasi--setup)
- [Peran Pengguna](#peran-pengguna)
- [Panduan Siswa (Student)](#panduan-siswa-student)
  - [1. Registrasi Akun](#1-registrasi-akun)
  - [2. Login](#2-login)
  - [3. Dashboard Siswa](#3-dashboard-siswa)
  - [4. Try Out (CBT)](#4-try-out-cbt)
  - [5. Latihan Soal Harian](#5-latihan-soal-harian)
  - [6. Video Belajar (VOD)](#6-video-belajar-vod)
  - [7. E-Modul](#7-e-modul)
  - [8. Live Class](#8-live-class)
  - [9. Nilai Saya (Score Tracker)](#9-nilai-saya-score-tracker)
  - [10. Leaderboard](#10-leaderboard)
  - [11. STRENGTHENS](#11-strengthens)
  - [12. Pembayaran](#12-pembayaran)
- [Panduan Admin](#panduan-admin)
  - [1. Dashboard Admin](#1-dashboard-admin)
  - [2. Manajemen Siswa](#2-manajemen-siswa)
  - [3. Manajemen Try Out](#3-manajemen-try-out)
  - [4. Bank Soal](#4-bank-soal)
  - [5. Manajemen Konten](#5-manajemen-konten)
  - [6. Kehadiran (Silent Attendance)](#6-kehadiran-silent-attendance)
  - [7. Pengumuman](#7-pengumuman)
  - [8. Analitik & Item Analysis](#8-analitik--item-analysis)
- [Panduan Tutor](#panduan-tutor)
  - [1. Dashboard Tutor](#1-dashboard-tutor)
  - [2. Try Out Saya](#2-try-out-saya)
  - [3. Nilai Siswa](#3-nilai-siswa)
  - [4. Kehadiran Siswa](#4-kehadiran-siswa)
- [Alur Sistem](#alur-sistem)
  - [Alur Pembayaran](#alur-pembayaran)
  - [Alur Auto-grading](#alur-auto-grading)
  - [Alur Silent Attendance](#alur-silent-attendance)
  - [Alur STRENGTHENS](#alur-strengthens)
- [FAQ](#faq)

---

## Pendahuluan

**Privcey Edu** adalah platform e-learning berbasis web yang dirancang untuk membantu siswa mempersiapkan ujian dengan fitur-fitur lengkap:

| Fitur | Deskripsi |
|---|---|
| Try Out CBT | Ujian online dengan timer, navigasi soal, flag soal, dan auto-grading instan |
| Video Belajar | Materi video YouTube yang bisa ditonton kapan saja |
| E-Modul | Modul digital PDF terintegrasi Google Drive |
| Live Class | Kelas online via Google Meet / Zoom dengan absensi otomatis |
| Score Tracker | Grafik trendline untuk pantau perkembangan nilai |
| Leaderboard | Ranking real-time antar siswa |
| STRENGTHENS | Modul penguatan otomatis untuk materi yang belum dikuasai |
| Latihan Harian | Soal latihan harian per mata pelajaran |

---

## Kebutuhan Sistem

### Untuk Pengguna (Siswa/Admin/Tutor)
- Browser modern (Chrome, Firefox, Safari, Edge — versi terbaru)
- Koneksi internet stabil
- Resolusi layar minimal 360px (responsif untuk mobile)

### Untuk Developer
- **Node.js** v18+ (disarankan v25 via nvm)
- **npm** v9+
- Akun **Supabase** (gratis)

---

## Instalasi & Setup

### 1. Clone & Install

```bash
git clone <repository-url> privcey-edu
cd privcey-edu
npm install
```

### 2. Konfigurasi Environment

Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Connection Pooling (Supavisor)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Cara mendapatkan kredensial Supabase:**
> 1. Buka [supabase.com](https://supabase.com) → buat project baru
> 2. Buka **Settings > API** → salin `Project URL` dan `anon public` key
> 3. Salin `service_role` key (jaga kerahasiaannya!)
> 4. Buka **Settings > Database** → salin connection string untuk `DATABASE_URL`

### 3. Setup Database

Jalankan file `supabase/schema.sql` di Supabase SQL Editor:

1. Buka **Supabase Dashboard > SQL Editor**
2. Paste seluruh isi `supabase/schema.sql`
3. Klik **Run**

File ini akan membuat 16 tabel beserta:
- Row Level Security (RLS) policies
- Trigger auto-grading untuk jawaban Try Out
- Data awal (4 mata pelajaran, 4 kelas)

### 4. Buat Akun Admin

1. Daftar akun melalui halaman `/auth/register`
2. Buka **Supabase Dashboard > Authentication > Users**
3. Cari user yang baru dibuat
4. Buka **Table Editor > profiles** → ubah `role` dari `student` menjadi `admin`

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser.

---

## Peran Pengguna

| Peran | Akses | Deskripsi |
|---|---|---|
| **Student** | `/dashboard/*` | Mengerjakan Try Out, menonton video, mengakses e-modul, mengikuti live class |
| **Admin** | `/dashboard/admin/*` | Mengelola seluruh operasional: siswa, konten, Try Out, analitik |
| **Tutor** | `/dashboard/tutor/*` | Membuat Try Out & soal, melihat nilai dan kehadiran siswa |

> Semua pengguna baru otomatis mendapat peran **Student**. Untuk mengubah peran menjadi Admin atau Tutor, ubah kolom `role` di tabel `profiles` melalui Supabase Dashboard.

---

## Panduan Siswa (Student)

### 1. Registrasi Akun

1. Buka halaman utama → klik **"Daftar"** (pojok kanan atas)
2. Isi formulir pendaftaran:
   - **Nama Lengkap** — nama yang akan ditampilkan di leaderboard
   - **Email** — gunakan email aktif (untuk verifikasi)
   - **Password** — minimal 6 karakter
   - **Konfirmasi Password** — ulangi password yang sama
3. Klik **"Daftar"**
4. Cek inbox email → klik link verifikasi
5. Setelah verifikasi, klik **"Ke Halaman Login"**

> ⚠️ Jika password dan konfirmasi tidak cocok, akan muncul pesan error "Password tidak cocok".

### 2. Login

1. Buka `/auth/login` atau klik **"Masuk"** di halaman utama
2. Masukkan **Email** dan **Password**
3. Klik **"Masuk"**
4. Anda akan diarahkan ke Dashboard Siswa

> Gunakan ikon mata 👁 di sebelah kolom password untuk menampilkan/menyembunyikan password.

### 3. Dashboard Siswa

Setelah login, Anda akan melihat halaman utama dashboard dengan:

**Ringkasan Statistik (4 kartu):**
| Kartu | Isi |
|---|---|
| Total Try Out | Jumlah Try Out yang sudah dikerjakan |
| Rata-rata Nilai | Nilai rata-rata dari semua Try Out |
| Nilai Tertinggi | Skor terbaik yang pernah dicapai |
| Mata Pelajaran | Jumlah mata pelajaran yang tersedia |

**Bagian Lainnya:**
- **Pengumuman** — banner informasi dari admin (jika ada)
- **Nilai Terbaru** — 5 nilai terakhir dengan kode warna:
  - 🟢 Hijau: skor ≥ 80
  - 🟡 Kuning: skor 60–79
  - 🔴 Merah: skor < 60
- **Rata-rata Performa** — lingkaran skor visual dengan pesan motivasi
- **Try Out Mendatang** — daftar Try Out yang belum dikerjakan
- **Aksi Cepat** — tombol pintas ke "Kerjakan Try Out" dan "Latihan Harian"

**Navigasi Sidebar (kiri):**

| Menu | Fungsi |
|---|---|
| Dashboard | Halaman utama |
| Try Out | Daftar & kerjakan Try Out |
| Latihan Soal | Latihan harian |
| E-Modul | Modul belajar PDF |
| Video Belajar | Video pembelajaran |
| Live Class | Jadwal kelas online |
| Nilai Saya | Riwayat & trendline nilai |
| Leaderboard | Ranking siswa |
| STRENGTHENS | Modul penguatan |

> Klik **"Keluar"** di bagian bawah sidebar untuk logout.

### 4. Try Out (CBT)

#### Melihat Daftar Try Out
1. Klik **"Try Out"** di sidebar
2. Gunakan filter tab: **Semua** / **Aktif** / **Selesai**
3. Setiap kartu Try Out menampilkan:
   - Judul & mata pelajaran
   - Durasi (dalam menit)
   - KKM (Kriteria Ketuntasan Minimal)
   - Waktu mulai (jika dijadwalkan)

#### Mengerjakan Try Out
1. Klik kartu Try Out yang ingin dikerjakan
2. Di halaman detail, periksa informasi:
   - Jumlah soal
   - Durasi
   - KKM
   - Status (sudah/belum dikerjakan)
3. Klik **"Mulai Ujian"** (atau **"Kerjakan Ulang"** jika pernah mengerjakan)
4. Antarmuka ujian akan muncul:

**Fitur Ujian CBT:**

| Fitur | Cara Menggunakan |
|---|---|
| Timer | Ditampilkan di pojok atas — hitung mundur otomatis |
| Navigasi Soal | Klik nomor soal di panel samping untuk berpindah |
| Flag/Ragu-ragu | Klik ikon bendera di soal untuk menandai |
| Pilih Jawaban | Klik opsi A–E untuk memilih jawaban |
| Sebelumnya/Selanjutnya | Tombol navigasi di bawah soal |
| Panel Nomor Soal | Warna hijau = sudah dijawab, kuning = ditandai, abu = belum |

5. Setelah selesai, klik **"Selesai & Kumpulkan"**
6. Konfirmasi pengumpulan
7. Hasil ditampilkan langsung:
   - Skor total
   - Jumlah benar / salah / kosong
   - Review jawaban per soal

> ⏱ Jika waktu habis, ujian otomatis dikumpulkan.

#### Melihat Hasil Sebelumnya
- Buka halaman detail Try Out yang sudah dikerjakan
- Di sisi kanan, lihat **"Hasil Sebelumnya"** berisi skor dan rincian
- Jika skor di bawah KKM, akan muncul link ke modul STRENGTHENS

### 5. Latihan Soal Harian

1. Klik **"Latihan Soal"** di sidebar
2. Lihat daftar latihan — latihan hari ini diberi label **"Hari ini"**
3. Klik **"Kerjakan"** pada latihan yang diinginkan
4. Antarmuka latihan:
   - Soal ditampilkan satu per satu dengan animasi transisi
   - Pilih jawaban A–E
   - Gunakan navigasi **"Sebelumnya"** / **"Selanjutnya"**
   - Panel nomor soal di samping menunjukkan progres
5. Klik **"Selesai & Lihat Hasil"** setelah selesai
6. Halaman hasil menampilkan:
   - **Skor** (persentase)
   - **Review tiap soal:**
     - ✅ Hijau = jawaban benar
     - ❌ Merah = jawaban salah
     - Pembahasan/penjelasan (jika tersedia)
7. Klik **"Kembali ke Daftar Latihan"** untuk kembali

### 6. Video Belajar (VOD)

1. Klik **"Video Belajar"** di sidebar
2. Gunakan kotak pencarian (**"Cari video..."**) untuk filter berdasarkan judul atau mata pelajaran
3. Klik salah satu video di grid untuk memutar
4. Video diputar langsung di halaman (embed YouTube)
5. Informasi yang ditampilkan: judul, mata pelajaran, durasi, deskripsi

> 📊 Kehadiran dicatat otomatis saat Anda menonton video.

### 7. E-Modul

1. Klik **"E-Modul"** di sidebar
2. Cari modul menggunakan kotak pencarian (**"Cari modul..."**) — bisa filter berdasarkan judul, mata pelajaran, atau bab
3. Setiap kartu modul menampilkan: judul, mata pelajaran, bab, dan deskripsi
4. Klik **"Buka Modul"** → file PDF terbuka di tab baru (Google Drive)

> 📊 Kehadiran dicatat otomatis saat Anda membuka modul.

### 8. Live Class

1. Klik **"Live Class"** di sidebar
2. Halaman menampilkan dua bagian:

**Akan Datang:**
- Kelas yang belum dimulai atau sedang berlangsung
- Label **"LIVE"** (merah berkedip) muncul jika kelas sedang berlangsung (dalam rentang 15 menit sebelum hingga 2 jam setelah jadwal)
- Klik **"Gabung Sekarang"** (saat live) atau **"Buka Link"** → terbuka Google Meet/Zoom di tab baru
- Informasi: tanggal, waktu (WIB), mata pelajaran, nama tutor, deskripsi

**Sudah Berlalu:**
- Kelas yang sudah selesai ditampilkan dengan tampilan pudar
- Label **"Selesai"**

> 📊 Kehadiran dicatat otomatis saat Anda mengklik tombol gabung.

### 9. Nilai Saya (Score Tracker)

1. Klik **"Nilai Saya"** di sidebar
2. Ringkasan ditampilkan dalam 4 kartu:

| Kartu | Isi |
|---|---|
| Rata-rata | Nilai rata-rata beserta lingkaran visual |
| Nilai Tertinggi | Skor terbaik yang dicapai |
| Total Try Out | Jumlah Try Out yang dikerjakan |
| Tren Terakhir | Perubahan skor terakhir (naik ⬆ / turun ⬇) |

3. **Trendline Performa** — grafik area menampilkan riwayat skor dari waktu ke waktu (muncul jika >1 data)
4. **Riwayat Nilai** — tabel lengkap:

| Kolom | Isi |
|---|---|
| Try Out | Nama Try Out |
| Mapel | Mata pelajaran |
| Benar | Jumlah jawaban benar |
| Salah | Jumlah jawaban salah |
| Kosong | Jumlah tidak dijawab |
| Nilai | Skor akhir |
| Tanggal | Waktu pengerjaan |

### 10. Leaderboard

1. Klik **"Leaderboard"** di sidebar
2. **Podium Top 3** ditampilkan di atas:
   - 🥇 Peringkat 1 (mahkota emas)
   - 🥈 Peringkat 2 (medali perak)
   - 🥉 Peringkat 3 (medali perunggu)
3. **Peringkat Lengkap** — tabel seluruh siswa:
   - Posisi ranking (#1, #2, ...)
   - Nama (dengan label **"Kamu"** jika itu akun Anda)
   - Kelas
   - Jumlah Try Out
   - Rata-rata skor

> Skor ditampilkan dengan kode warna: hijau (≥80), kuning (60–79), merah (<60).

### 11. STRENGTHENS

1. Klik **"STRENGTHENS"** di sidebar
2. Modul penguatan muncul **otomatis** ketika skor Try Out Anda di bawah KKM
3. Halaman menampilkan:

| Bagian | Isi |
|---|---|
| Modul Terbuka | Modul yang bisa diakses (karena skor di bawah KKM) — klik "Buka Materi →" |
| Modul Terkunci | Modul yang belum terbuka (tampilan pudar) — terbuka jika nilai di bawah KKM |

4. Klik **"Buka Materi →"** untuk mengakses konten penguatan

> ℹ️ Info banner kuning menjelaskan: "Modul ini terbuka otomatis jika nilai Try Out kamu di bawah KKM."

### 12. Pembayaran

Beberapa fitur premium memerlukan status pembayaran aktif:
- Try Out
- E-Modul
- Video Belajar
- Live Class

**Jika pembayaran expired:**
1. Anda akan diarahkan ke halaman **"Akses Terkunci"**
2. Informasi iuran: **Rp70.000/bulan**
3. Klik **"Hubungi Admin via WhatsApp"** untuk memperbarui pembayaran
4. Setelah admin mengaktifkan kembali, Anda bisa mengakses fitur premium

> Sistem otomatis memeriksa status pembayaran setiap kali Anda mengakses fitur premium. Expired otomatis terdeteksi berdasarkan tanggal `payment_expires_at`.

---

## Panduan Admin

### 1. Dashboard Admin

Akses: **"Overview"** di sidebar admin

**Ringkasan Statistik (4 kartu):**

| Kartu | Isi |
|---|---|
| Total Siswa | Jumlah seluruh siswa terdaftar |
| Siswa Aktif | Siswa dengan pembayaran aktif (+ persentase) |
| Iuran Tertunggak | Jumlah siswa dengan pembayaran belum aktif |
| Total Try Out | Jumlah Try Out yang tersedia |

**Grafik:**
- **Distribusi Kelas** — Grafik batang menampilkan jumlah siswa per kelas (Kelas 9A, 9B, 8A, 8B, dll)
- **Status Pembayaran** — Grafik donat:
  - 🟢 Hijau: Aktif
  - 🔴 Merah: Expired
  - 🟡 Kuning: Pending

### 2. Manajemen Siswa

Akses: **"Siswa"** di sidebar admin

#### Melihat Data Siswa
1. Daftar siswa ditampilkan dalam tabel dengan jumlah total di header
2. Gunakan **filter**:
   - **Pencarian** — ketik nama atau email
   - **Kelas** — pilih kelas spesifik atau "Semua Kelas"
   - **Status** — pilih "Semua Status" / "Aktif" / "Expired" / "Pending"

#### Kolom Tabel

| Kolom | Isi |
|---|---|
| Nama | Nama lengkap siswa |
| Email | Alamat email |
| Kelas | Kelas yang diikuti |
| Pembayaran | Badge status: Aktif (hijau) / Expired (merah) / Pending (kuning) |
| Status | Aktif / Nonaktif |
| Aksi | Tombol tindakan |

#### Mengubah Status Pembayaran
1. Klik **"Toggle Bayar"** di kolom Aksi
2. Efek:
   - Jika **expired** → berubah menjadi **active** (berlaku 30 hari ke depan)
   - Jika **active** → berubah menjadi **expired**

#### Export Data Siswa
1. Klik tombol **"Export CSV"** di pojok kanan atas
2. File `siswa-privcey-edu.csv` akan terunduh otomatis

### 3. Manajemen Try Out

Akses: **"Try Out"** di sidebar admin

#### Membuat Try Out Baru
1. Klik **"Buat Try Out"**
2. Isi formulir:

| Field | Keterangan |
|---|---|
| Judul | Nama Try Out (contoh: "Try Out IPA Semester 2") |
| Mata Pelajaran | Pilih dari dropdown (Matematika, B. Indonesia, B. Inggris, IPA) |
| Kelas (opsional) | Pilih kelas target atau biarkan "Semua Kelas" |
| Durasi (menit) | Waktu pengerjaan (default: 60 menit) |
| KKM | Batas nilai minimal kelulusan (default: 70) |
| Deskripsi | Keterangan tambahan tentang Try Out |

3. Klik **"Simpan"**

#### Mengedit Try Out
1. Klik ikon pensil ✏️ di baris Try Out yang ingin diedit
2. Form akan terisi otomatis dengan data Try Out
3. Ubah field yang diinginkan
4. Klik **"Update"**

#### Mengelola Status (Aktif/Nonaktif)
- Klik ikon mata 👁 di kolom Aksi → toggle status aktif/nonaktif
- Try Out nonaktif tidak tampil di halaman siswa

#### Menghapus Try Out
1. Klik ikon sampah 🗑 di kolom Aksi
2. Konfirmasi penghapusan → **semua soal dan jawaban terkait ikut terhapus**

> ⚠️ Penghapusan bersifat permanen dan tidak bisa dibatalkan.

### 4. Bank Soal

Akses: **"Bank Soal"** di sidebar admin

#### Memilih Try Out
1. Pilih Try Out dari dropdown **"Pilih Try Out:"**
2. Daftar soal untuk Try Out tersebut akan ditampilkan

#### Menambah Soal
1. Klik **"Tambah Soal"**
2. Isi formulir:

| Field | Keterangan |
|---|---|
| Soal | Teks pertanyaan |
| Opsi A | Pilihan jawaban A (wajib) |
| Opsi B | Pilihan jawaban B (wajib) |
| Opsi C | Pilihan jawaban C (wajib) |
| Opsi D | Pilihan jawaban D (wajib) |
| Opsi E | Pilihan jawaban E (opsional) |
| Jawaban Benar | Pilih A, B, C, D, atau E |
| Tingkat Kesulitan | Mudah / Sedang / Sulit |
| Pembahasan (opsional) | Penjelasan jawaban benar |

3. Klik **"Simpan Soal"**

#### Mengedit Soal
1. Klik ikon pensil ✏️ di soal yang ingin diedit
2. Form terisi otomatis dengan data soal
3. Ubah field yang diinginkan
4. Klik **"Update Soal"**

#### Menghapus Soal
- Klik ikon sampah 🗑 → konfirmasi penghapusan

#### Tampilan Soal
Setiap soal menampilkan:
- Nomor urut
- Badge tingkat kesulitan (Mudah=hijau, Sedang=kuning, Sulit=merah)
- Badge jawaban benar
- Teks soal dan semua opsi

### 5. Manajemen Konten

Akses: **"Konten"** di sidebar admin

Halaman ini mengelola 3 jenis konten melalui **tab**:

#### Tab Video (VOD)

**Menambah Video:**
1. Klik **"Tambah Video"**
2. Isi: **Judul**, **YouTube URL**, **Mata Pelajaran**, **Durasi** (format: "25:30"), **Deskripsi**
3. Klik **"Simpan"**

**Mengelola:**
- Daftar video menampilkan thumbnail YouTube, judul, mata pelajaran, durasi
- Toggle aktif/nonaktif (ikon mata)
- Hapus (ikon sampah)

> 💡 Gunakan URL YouTube lengkap (contoh: `https://www.youtube.com/watch?v=xxxxx`). Thumbnail diambil otomatis.

#### Tab E-Modul

**Menambah Modul:**
1. Klik **"Tambah Modul"**
2. Isi: **Judul**, **Google Drive URL**, **Mata Pelajaran**, **Bab**, **Deskripsi**
3. Klik **"Simpan"**

**Mengelola:**
- Daftar modul menampilkan judul, mata pelajaran, bab
- Klik ikon link external untuk membuka Google Drive
- Toggle aktif/nonaktif
- Hapus

> 💡 Pastikan file PDF di Google Drive disetel ke "Anyone with the link can view".

#### Tab Live Class

**Menjadwalkan Live Class:**
1. Klik **"Jadwalkan Live"**
2. Isi: **Judul**, **Link Meet/Zoom**, **Jadwal** (tanggal & waktu), **Mata Pelajaran**, **Deskripsi**
3. Klik **"Simpan"**

**Mengelola:**
- Kelas mendatang ditandai badge "Upcoming"
- Menampilkan jadwal, mata pelajaran, nama tutor
- Toggle aktif/nonaktif
- Hapus

### 6. Kehadiran (Silent Attendance)

Akses: **"Kehadiran"** di sidebar admin

Sistem mencatat kehadiran siswa **secara otomatis** (silent) saat mereka:
- Menonton video (VOD)
- Mengikuti Live Class
- Mengerjakan Try Out
- Membuka E-Modul
- Mengerjakan Latihan Soal

#### Melihat Data Kehadiran
- Tabel menampilkan: **Siswa**, **Aktivitas** (badge berwarna), **Judul**, **Waktu**
- Filter berdasarkan nama siswa atau jenis aktivitas
- Dropdown filter: **Semua Aktivitas** / **Video** / **Live Class** / **Try Out** / **E-Modul**

#### Export Kehadiran
- Klik **"Export CSV"** → file `kehadiran-{tanggal}.csv` terunduh

### 7. Pengumuman

Akses: **"Pengumuman"** di sidebar admin

#### Membuat Pengumuman
1. Klik **"Buat Pengumuman"**
2. Isi formulir:

| Field | Keterangan |
|---|---|
| Judul | Judul pengumuman |
| Tipe | Info / Peringatan / Sukses / Urgent |
| Target Kelas | "Semua Kelas" atau kelas spesifik |
| Isi Pengumuman | Konten pengumuman |

3. Klik **"Publikasikan"**

#### Mengelola Pengumuman
- Toggle aktif/nonaktif (ikon mata) — pengumuman nonaktif tidak tampil di dashboard siswa
- Hapus pengumuman (ikon sampah + konfirmasi)

> Pengumuman aktif ditampilkan sebagai banner di Dashboard Siswa.

### 8. Analitik & Item Analysis

Akses: **"Analitik"** di sidebar admin

**Grafik yang tersedia:**

| Grafik | Isi |
|---|---|
| Rata-rata per Mapel | Grafik batang — nilai rata-rata per mata pelajaran (skala 0–100) |
| Tingkat Kebenaran per Kesulitan | Grafik batang — persentase jawaban benar untuk soal Mudah/Sedang/Sulit |

**Top 10 Siswa Berperforma Tinggi:**
- Tabel ranking 10 siswa terbaik
- Kolom: Posisi, Nama (🥇🥈🥉 untuk top 3), Rata-rata nilai, Jumlah Try Out

---

## Panduan Tutor

### 1. Dashboard Tutor

Akses: **"Overview"** di sidebar tutor

**Ringkasan (3 kartu):**

| Kartu | Isi |
|---|---|
| Try Out Saya | Jumlah Try Out yang dibuat oleh tutor |
| Total Pengerjaan | Jumlah kali Try Out dikerjakan siswa |
| Bank Soal | Total soal yang sudah dibuat |

**Pengerjaan Terbaru:**
- Tabel menampilkan: Siswa, Try Out, Skor
- Skor hijau (≥70) atau merah (<70)

### 2. Try Out Saya

Akses: **"Try Out"** di sidebar tutor

#### Membuat Try Out
1. Klik **"Buat Try Out"**
2. Isi: **Judul**, **Mata Pelajaran**, **Kelas** (opsional), **Durasi (menit)**
3. Klik **"Simpan"**

#### Mengelola Soal
1. Klik kartu Try Out untuk membuka panel soal di sebelah kanan
2. Panel menampilkan **"Soal ({N})"** dengan jumlah soal saat ini
3. Klik **"Tambah Soal"** → isi: pertanyaan, opsi A–E, jawaban benar
4. Klik **"Simpan"**
5. Hapus soal dengan klik ikon sampah

#### Toggle Status
- Klik ikon mata di kartu Try Out untuk mengaktifkan/menonaktifkan

### 3. Nilai Siswa

Akses: **"Nilai Siswa"** di sidebar tutor

- Tabel menampilkan semua pengerjaan Try Out oleh siswa
- Kolom: **Siswa**, **Try Out**, **Skor**, **Status** (Lulus hijau / Belum Lulus merah)
- Gunakan kotak pencarian untuk filter berdasarkan nama siswa atau Try Out
- Status ditentukan berdasarkan KKM (passing_grade) Try Out terkait

### 4. Kehadiran Siswa

Akses: **"Kehadiran"** di sidebar tutor

- Tampilan read-only (hanya melihat, tidak bisa mengubah)
- Tabel: **Siswa**, **Aktivitas** (badge), **Judul**, **Waktu**
- Filter berdasarkan nama siswa

---

## Alur Sistem

### Alur Pembayaran

```
Siswa mendaftar → Status: "pending"
         │
    Admin klik "Toggle Bayar"
         │
   Status → "active" (berlaku 30 hari)
         │
  ┌──────┴──────┐
  │  30 hari    │
  │  berlalu    │
  └──────┬──────┘
         │
 Middleware auto-check → Status: "expired"
         │
 Siswa akses fitur premium → Redirect ke "Akses Terkunci"
         │
 Siswa hubungi admin → Admin toggle bayar lagi
```

### Alur Auto-grading

```
Siswa klik "Selesai & Kumpulkan"
         │
 Data jawaban disimpan ke tabel "student_answers"
         │
 Database trigger menghitung:
   - Jawaban benar: cocok dengan "correct_answer" di tabel questions
   - Skor = (benar / total) × 100
         │
 Skor disimpan ke "tryout_attempts.score"
         │
 Jika skor < KKM → STRENGTHENS module terbuka
```

### Alur Silent Attendance

```
Siswa melakukan aktivitas:
  ├── Menonton Video      → Log "vod_watch"
  ├── Buka E-Modul        → Log "emod_access"
  ├── Gabung Live Class   → Log "live_class"
  ├── Kerjakan Try Out    → Log "tryout"
  └── Kerjakan Latsol     → Log "daily_exercise"
         │
 Dicatat otomatis di "attendance_logs"
         │
 Admin/Tutor bisa melihat & export di halaman Kehadiran
```

### Alur STRENGTHENS

```
Siswa kerjakan Try Out → Skor dihitung
         │
 Skor < KKM (passing_grade)?
    ├── Ya  → Modul STRENGTHENS terbuka (unlocked)
    └── Tidak → Modul tetap terkunci (locked)
         │
 Siswa buka halaman STRENGTHENS
         │
 Klik "Buka Materi →" → Akses konten penguatan
```

---

## FAQ

### Umum

**Q: Apakah Privcey Edu gratis?**
A: Siswa memerlukan pembayaran iuran bulanan Rp70.000 untuk mengakses fitur premium (Try Out, Video, E-Modul, Live Class). Dashboard, Leaderboard, dan Score Tracker bisa diakses gratis.

**Q: Browser apa yang didukung?**
A: Chrome, Firefox, Safari, dan Edge versi terbaru. Disarankan menggunakan Chrome untuk pengalaman terbaik.

**Q: Apakah bisa diakses dari HP?**
A: Ya, Privcey Edu responsif dan bisa diakses dari smartphone, tablet, maupun desktop.

### Siswa

**Q: Bagaimana jika waktu Try Out habis?**
A: Ujian otomatis dikumpulkan dan dinilai. Jawaban yang sudah diisi tetap dihitung.

**Q: Bisakah mengerjakan ulang Try Out?**
A: Ya, klik **"Kerjakan Ulang"** di halaman detail Try Out. Nilai terbaru yang dicatat.

**Q: Apa itu STRENGTHENS?**
A: Modul penguatan yang terbuka otomatis ketika skor Try Out Anda di bawah KKM. Berisi materi tambahan untuk memperkuat pemahaman.

**Q: Kenapa saya tidak bisa mengakses Video/E-Modul/Try Out?**
A: Status pembayaran Anda mungkin expired. Hubungi admin melalui tombol WhatsApp di halaman "Akses Terkunci".

**Q: Apakah kehadiran saya dicatat?**
A: Ya, secara otomatis (silent attendance) saat Anda menonton video, membuka e-modul, mengikuti live class, atau mengerjakan Try Out/latihan.

### Admin

**Q: Bagaimana cara membuat akun admin baru?**
A: Daftar akun biasa melalui halaman registrasi, lalu ubah kolom `role` menjadi `admin` di tabel `profiles` melalui Supabase Dashboard.

**Q: Bagaimana cara mengatur masa berlaku pembayaran?**
A: Klik **"Toggle Bayar"** di halaman Manajemen Siswa. Status berubah ke "active" dengan masa berlaku 30 hari otomatis.

**Q: Data apa saja yang bisa di-export?**
A: Daftar siswa (CSV) dan data kehadiran (CSV).

**Q: Apakah data Try Out terhapus jika Try Out dihapus?**
A: Ya, semua soal dan jawaban siswa terkait Try Out tersebut ikut terhapus secara permanen.

### Tutor

**Q: Apakah tutor bisa melihat semua Try Out?**
A: Tutor hanya bisa mengelola Try Out yang dibuatnya sendiri, tetapi bisa melihat seluruh nilai dan kehadiran siswa.

**Q: Apakah tutor bisa mengelola pembayaran?**
A: Tidak, hanya admin yang bisa mengelola status pembayaran siswa.

---

> **Privcey Edu** — Belajar Lebih Cerdas, Raih Hasil Terbaik! 🎓
