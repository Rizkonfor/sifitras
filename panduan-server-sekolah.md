# Panduan: Menyimpan Data di Server Sekolah

Setelah langkah ini selesai, semua data inventaris tersimpan di satu Google Spreadsheet milik sekolah. Siapa pun yang membuka aplikasi — dari HP Anda, laptop koordinator, atau komputer TU — melihat data yang sama, dan tidak perlu lagi mencadangkan secara manual.

Yang dibutuhkan: satu akun Google milik sekolah dan waktu sekitar 10 menit. Gratis, tanpa hosting berbayar.

---

## Langkah 1 — Buat spreadsheet penampung

1. Buka [sheets.google.com](https://sheets.google.com) dengan akun Google sekolah
2. Buat spreadsheet kosong, beri nama **Data Inventaris Sarpras**

Pakai akun sekolah, bukan akun pribadi. Kalau nanti Anda pindah tugas, datanya tetap milik sekolah.

## Langkah 2 — Pasang skripnya

1. Di spreadsheet itu, klik menu **Ekstensi → Apps Script**
2. Hapus semua tulisan yang ada di kotak editor (biasanya ada `function myFunction() {}`)
3. Salin seluruh kode di bawah ini, tempel ke kotak yang sudah kosong tadi

```javascript
/* SIMSAR — penyimpan data inventaris sarana & prasarana
   Tempel seluruh berkas ini di Apps Script milik spreadsheet sekolah. */

var KUNCI  = 'ganti-kunci-ini';   // <<< GANTI, lalu tulis kunci yang sama di aplikasi
var DATA   = '_data';
var TABEL  = 'Inventaris';
var POTONG = 40000;

function doGet(e) {
  try {
    var k = (e && e.parameter && e.parameter.k) || '';
    if (String(k) !== KUNCI) return balas({ ok: false, err: 'Kunci salah' });
    return balas({ ok: true, data: baca() });
  } catch (err) {
    return balas({ ok: false, err: String(err) });
  }
}

function doPost(e) {
  var kunci = LockService.getScriptLock();
  try {
    kunci.waitLock(25000);
    var body = JSON.parse(e.postData.contents);
    if (String(body.k || '') !== KUNCI) return balas({ ok: false, err: 'Kunci salah' });
    tulis(body.data);
    try { tabel(body.data); } catch (x) {}
    return balas({ ok: true });
  } catch (err) {
    return balas({ ok: false, err: String(err) });
  } finally {
    try { kunci.releaseLock(); } catch (x) {}
  }
}

function balas(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function lembar(nama, sembunyikan) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama);
    if (sembunyikan) sh.hideSheet();
  }
  return sh;
}

function baca() {
  var sh = lembar(DATA, true);
  var n = sh.getLastRow();
  if (!n) return null;
  var teks = sh.getRange(1, 1, n, 1).getValues().map(function (r) {
    return String(r[0]);
  }).join('');
  return teks ? JSON.parse(teks) : null;
}

function tulis(obj) {
  var j = JSON.stringify(obj);
  var sh = lembar(DATA, true);
  sh.clearContents();
  var baris = [], i = 0;
  while (i < j.length) {
    var n = Math.min(POTONG, j.length - i);
    while (i + n < j.length && n > 1 && '=+-@'.indexOf(j.charAt(i + n)) >= 0) n--;
    baris.push([j.substr(i, n)]);
    i += n;
  }
  if (baris.length) {
    var rg = sh.getRange(1, 1, baris.length, 1);
    rg.setNumberFormat('@');
    rg.setValues(baris);
  }
}

function tabel(db) {
  var sh = lembar(TABEL, false);
  sh.clear();
  var rn = {}, tn = {}, fn = {};
  (db.rooms || []).forEach(function (r) { rn[r.kode] = r.nama; });
  (db.types || []).forEach(function (t) { tn[t.kode] = t.nama; });
  (db.funds || []).forEach(function (f) { fn[f.kode] = f.nama; });
  var K = { B: 'Baik', RR: 'Rusak Ringan', RB: 'Rusak Berat' };
  var judul = ['Kode Aset', 'Nama Barang', 'Merk', 'Jenis', 'Ruangan',
               'Sumber Dana', 'Tanggal Perolehan', 'Harga', 'Kondisi', 'Keterangan'];
  var isi = (db.assets || []).slice().sort(function (a, b) {
    return String(a.kode).localeCompare(String(b.kode));
  }).map(function (a) {
    return [a.kode, a.nama, a.merk || '', tn[a.tipe] || a.tipe, rn[a.ruang] || a.ruang,
            fn[a.dana] || a.dana, a.tgl || '', Number(a.harga) || 0,
            K[a.kond] || 'Baik', a.ket || ''];
  });
  sh.getRange(1, 1, 1, judul.length).setValues([judul]).setFontWeight('bold');
  if (isi.length) sh.getRange(2, 1, isi.length, judul.length).setValues(isi);
  sh.setFrozenRows(1);
}
```

4. Di baris paling atas, ganti `ganti-kunci-ini` dengan kunci buatan Anda sendiri

   Contoh: `sarpras-alfitrah-2026`. Tulis di tempat aman — kunci ini yang nanti dimasukkan ke aplikasi. Panjang dan tidak mudah ditebak lebih baik.

5. Tekan ikon **disket** untuk menyimpan

## Langkah 3 — Terbitkan sebagai Web App

1. Klik tombol biru **Deploy → New deployment** (kanan atas)
2. Klik ikon gerigi di sebelah "Select type", pilih **Web app**
3. Isi seperti ini:

   | Kolom | Isi |
   |---|---|
   | Description | SIMSAR |
   | Execute as | **Me** (akun Anda) |
   | Who has access | **Anyone** |

4. Klik **Deploy**
5. Google akan minta izin. Klik **Authorize access** → pilih akun sekolah → muncul peringatan "Google hasn't verified this app" → klik **Advanced** → **Go to (nama proyek) (unsafe)** → **Allow**

   Peringatan itu wajar. Muncul karena skrip ini buatan sendiri, bukan aplikasi terdaftar di Google.

6. Salin **Web app URL** yang muncul. Bentuknya seperti:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Langkah 4 — Sambungkan aplikasinya

1. Buka aplikasi inventaris, masuk sebagai admin
2. **Pengaturan → Data → Sambungkan ke server sekolah**
3. Tempel Web app URL dan kunci yang tadi Anda buat
4. Tekan **Uji koneksi** dulu. Kalau muncul "Tersambung", tekan **Sambungkan**

Selesai. Titik hijau di kanan atas sekarang berbunyi **Tersimpan · server**.

Ulangi langkah 4 ini di setiap perangkat yang mau dipakai — HP Anda, laptop koordinator, komputer TU. URL dan kuncinya sama untuk semuanya.

---

## Setelah tersambung

**Spreadsheetnya jadi cadangan hidup.** Buka lembar **Inventaris** di spreadsheet tadi — seluruh barang tampil rapi dalam bentuk tabel dan ikut terbarui setiap kali ada perubahan di aplikasi. Bisa langsung dicetak atau dikirim ke dinas.

**Jangan mengetik langsung di spreadsheet.** Lembar `Inventaris` ditulis ulang setiap kali data berubah, jadi ketikan manual akan hilang. Lembar `_data` sengaja disembunyikan — itu penyimpanan mentahnya, jangan diutak-atik.

**Kalau internet mati,** aplikasi tetap bisa dipakai. Data disimpan dulu di perangkat, lalu naik sendiri begitu tersambung lagi. Titik status berubah merah selama terputus, jadi Anda tahu.

**Kalau nanti kode skripnya diubah,** perubahan tidak langsung berlaku. Harus **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**.

---

## Soal keamanan, apa adanya

Pilihan **Anyone** pada langkah 3 berarti siapa saja yang tahu URL-nya bisa memanggil skrip itu. Yang menahan mereka hanya kunci Anda. Jadi:

- Pilih kunci yang panjang, jangan `12345` atau nama sekolah saja
- Jangan tempel URL-nya di grup WhatsApp umum atau dokumen yang dibagikan luas
- Kalau kuncinya pernah bocor, ganti nilai `KUNCI` di skrip, deploy versi baru, lalu perbarui di setiap perangkat

Untuk data inventaris sekolah, tingkat pengamanan ini wajar. Kalau nanti aplikasinya dipakai untuk data yang lebih sensitif, sebaiknya pindah ke hosting sekolah dengan basis data sungguhan.

---

## Kalau "Uji koneksi" gagal

| Pesan | Artinya |
|---|---|
| Kunci salah | Kunci di aplikasi beda dengan yang di baris `KUNCI` pada skrip. Perhatikan spasi dan huruf besar-kecil |
| Server tidak bisa dihubungi dari sini | Biasanya karena aplikasi dibuka di dalam Claude, yang membatasi sambungan keluar. Unduh berkas HTML-nya lalu buka langsung dari perangkat, atau pasang di hosting |
| Server tidak menjawab | Koneksi internet, atau URL salah salin. Pastikan berakhiran `/exec`, bukan `/dev` |

Untuk memasang aplikasinya supaya bisa dibuka lewat alamat web, cara tercepat tanpa biaya: buka [app.netlify.com/drop](https://app.netlify.com/drop), seret berkas HTML-nya ke sana, dan Anda langsung dapat alamat yang bisa dibuka siapa saja. Cara lain: hosting sekolah sendiri, GitHub Pages, atau Cloudflare Pages.
