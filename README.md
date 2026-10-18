# SIFITRAS — Sarana & Prasarana SMPIT Al-Fitrah

*Data Akurat, Fasilitas Terawat.*

Aplikasi: **https://rizkonfor.github.io/sifitras/**

## Memasang di GitHub Pages (sekali saja)

1. Di GitHub, buat repo baru bernama **`sifitras`** (Public). Jangan centang "Add a README".
2. Buka repo itu → **Add file → Upload files** → pilih **semua berkas** dari zip ini (ekstrak dulu zip-nya), termasuk `.nojekyll` → **Commit changes**.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main**, folder **/(root)** → **Save**.
4. Tunggu 1–2 menit, lalu buka **https://rizkonfor.github.io/sifitras/** di Chrome HP.
5. Muat ulang sekali, lalu menu titik tiga → **Instal aplikasi**.

## Memperbarui aplikasi

Repo → **Add file → Upload files** → unggah `index.html` yang baru → **Commit changes**. Berkas lama otomatis tertimpa. Tunggu 1–2 menit, lalu buka aplikasinya di HP dan muat ulang.

## Server data (Apps Script + Google Spreadsheet)

Ikuti `panduan-server-sekolah.md`. Setelah dapat alamat `https://script.google.com/macros/s/…/exec`, tempel di SIFITRAS: **Pengaturan → Server sekolah → Uji koneksi → Sambungkan**. Semua HP yang memakai alamat yang sama akan berbagi data.

## Pindah dari Netlify

Data tersimpan per alamat situs, jadi data di versi Netlify **tidak otomatis muncul** di github.io.
- Kalau sudah tersambung ke server Apps Script: cukup masukkan alamat server yang sama di versi GitHub — data ikut turun.
- Kalau belum: di versi lama **Pengaturan → Cadangkan data**, lalu di versi GitHub **Pengaturan → Pulihkan dari cadangan**.

## Catatan

- Jangan unggah berkas cadangan atau berkas impor (`.json` data barang) ke repo ini — repo Public bisa dilihat siapa saja. Data barang cukup disimpan di Google Spreadsheet lewat Apps Script.
- Satu alamat `rizkonfor.github.io` dipakai bersama paranada. Penyimpanan dan cache SIFITRAS sudah diberi awalan `sifitras` supaya tidak saling mengganggu.
