# Pemeriksaan visual halaman publik

## Pemeriksaan otomatis di CI dan pra-rilis

Workflow `.github/workflows/visual.yml` berjalan pada setiap pull request ke `main`, push ke `main`, dan pemicu manual `workflow_dispatch`. Tidak memakai filter berkas: perubahan TSX, dependensi, dan konfigurasi build juga dapat mengubah CSS. Job **Public application visual gate** menjalankan `npm ci`, pemeriksaan kontrak, `npm run visual:setup`, lalu `npm run visual:ci`. Tidak pernah menjalankan `visual:update`.

Lingkungan CI memakai Ubuntu 24.04, Node **20.20.0**, Chrome for Testing **138.0.7204.100**, serta arsip font Ubuntu **DejaVu core dan mono 2.37-8**. Versi browser mengikuti referensi awal. Ketiga arsip diperiksa SHA-256 sebelum diekstrak; konfigurasi fontconfig hanya membaca font tersebut, dengan hinting `hintslight`, RGB dan filter LCD yang eksplisit. Font runner/Google Fonts tidak dipakai. Skrip menolak versi browser yang berbeda. Paket JS dipasang dari `package-lock.json`.

Sebelum `npm ci`, runner GitHub menjalankan tes tanpa dependensi dan `scripts/prepare-visual-ci-lock.mjs`. Skrip hanya mengalihkan URL tarball `package-firewall.replit.local/npm/` ke `https://registry.npmjs.org/` dalam salinan checkout CI; versi, integrity, dan metadata dependensi tidak berubah. Alamat internal itu tidak dapat dipakai runner GitHub. Skrip menolak berjalan di luar GitHub Actions dan menolak entri internal tanpa integrity atau jalur yang tidak sesuai. Lockfile workspace tidak diubah, tidak ada upgrade paket atau pengabaian checksum. Sesudah pemasangan, import `express`, `puppeteer-core`, dan `vite` harus berhasil; exit code pemasang saja bukan bukti bahwa modul tersedia.

`visual:ci` membangun frontend aplikasi asli dengan konfigurasi Vite proyek, menyalakannya lewat server HTTP lokal pada port sementara, memeriksa kesiapan HTML, lalu menjalankan **`npm run visual:check`**. Server selalu ditutup setelah pemeriksaan. Ini bukan mockup sandbox. Backend tidak diimpor: tidak ada database, startup seed, worker, login, atau panggilan layanan berbayar. API lokal mengembalikan 401 untuk konteks anonim; pemeriksaan ini menilai tampilan publik, bukan perilaku API.

Artefak **visual-comparison-…** di halaman Actions diunggah bahkan jika pemeriksaan gagal, disimpan 14 hari, dan berisi `results/report.html`, gambar saat ini, diff magenta, serta `baselines/`. Unduh dan ekstrak seluruh artefak, lalu buka `results/report.html` agar tautan gambar relatif tetap bekerja. Kegagalan build/browser/heading juga menghasilkan laporan kesalahan; jika pemasangan dependensi atau unduhan gagal sebelum server berjalan, lihat log langkah Actions (belum ada gambar pembandingan).

Untuk pra-rilis lokal di Linux:

```sh
npm run visual:setup
npm run visual:ci
```

Diperlukan `curl`, `unzip`, `dpkg-deb`, `fontconfig`, dan pustaka runtime Chrome (daftarnya ada di workflow). Unduhan/build disimpan dalam `generated-artifacts/`, tidak masuk git atau deployment. Di workspace Nix, Chrome Linux unduhan mungkin tidak dapat memuat pustaka sistem. Gunakan Chromium sistem secara eksplisit jika **versinya sama**:

```sh
CHROME_PATH="$(which chromium)" npm run visual:ci
```

Override ini hanya berlaku lokal; dalam CI, skrip selalu memilih binary unduhan yang diverifikasi. Tidak ada pembaruan referensi otomatis atau bypass ambang perubahan. Untuk benar-benar melarang merge yang gagal, pengelola repositori perlu menetapkan job tersebut sebagai required status check pada perlindungan branch; workflow ini tidak mengubah pengaturan repositori atau melakukan deployment.

## Aktivasi larangan merge di GitHub

**Status: belum aktif.** Audit baca-saja pada `penshopx/landing-page`, branch `main`, menemukan respons `Branch not protected` dari API branch protection, daftar ruleset kosong (termasuk aturan induk), dan tidak ada aturan efektif pada branch. Workflow `visual.yml`, direktori `tests/visual`, skrip visual, serta perintah npm visual belum tersedia di `main` GitHub saat audit. Keberadaan workflow di workspace bukan bukti bahwa GitHub menjalankannya.

Pengelola menyetujui aktivasi **setelah workflow tersedia di GitHub**, bukan aktivasi segera. Jangan memasang required check yang belum dapat dijalankan karena seluruh PR biasa akan menunggu hasil yang tidak pernah muncul. Audit dan persetujuan ini tidak berarti pengaturan sudah berubah atau pemblokiran sudah terbukti.

### Prasyarat dan perubahan terbatas

1. Kirim paket visual lengkap melalui PR yang ditinjau: `.github/workflows/visual.yml`, `scripts/check-visual.mjs`, `scripts/run-visual-ci.mjs`, `scripts/setup-visual-env.sh`, `tests/visual-ci.test.mjs`, `tests/visual-negative.test.mjs`, fixture dan delapan PNG referensi di `tests/visual/`, serta keenam perintah npm visual di `package.json`. Pastikan versi frontend/CSS sesuai dengan referensi yang ditinjau; jangan menyalin referensi baru untuk menyembunyikan kegagalan pada kode lama. Jangan mengganti seluruh `package.json` GitHub dengan versi workspace hanya untuk menambahkan perintah ini.
2. Setelah workflow tersedia di `main`, pastikan run sungguhan menghasilkan check dengan nama tepat **`Public application visual gate`** dan penyedia **GitHub Actions**. Nama workflow `Visual regression` bukan nama required check. Catat URL run dan identitas aplikasi dari check run, bukan tebakan ID penyedia.
3. Dengan akses administrasi yang sesuai, baca kembali perlindungan branch klasik, semua ruleset termasuk induk, dan aturan efektif `main`. Simpan konfigurasi sebelum perubahan. Jangan menganggap hasil audit lama masih berlaku.
4. Tambahkan hanya check tersebut ke daftar required status checks untuk `main`, terikat ke GitHub Actions bila tersedia. Pertahankan seluruh check lama, persyaratan review, pembatasan push, pengaturan branch terbaru/strict, force-push, penghapusan, dan daftar bypass. Jangan memakai permintaan penggantian konfigurasi dengan nilai kosong/default. Jika belum ada perlindungan sama sekali, gunakan ruleset branch aktif dengan target hanya `refs/heads/main` dan aturan required status check tersebut; jangan memperluas target ke semua branch. Periksa daftar bypass secara eksplisit.
5. Baca ulang konfigurasi dan aturan efektif setelah penyimpanan. Bandingkan dengan konfigurasi awal: perbedaannya hanya penambahan gate yang disetujui (atau ruleset khusus yang baru). Catat URL aturan, nama check, penyedia, dan jalur bypass yang benar-benar berlaku. Jika API menolak akses, laporkan kegagalan; jangan menganggap aturan aktif.

Dokumentasi GitHub: [required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging), [aturan branch efektif](https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch), dan [pembuatan ruleset](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset).

### Bukti bahwa PR gagal benar-benar terblokir

- Gunakan PR uji non-draft ke `main` tanpa konflik, tanpa kegagalan lain, dan tanpa mengubah baseline/workflow. Buat perubahan visual yang jelas pada halaman yang ditangkap. Jangan merge PR uji.
- Tunggu check pada revisi PR terbaru selesai dengan kesimpulan **failure** akibat pembandingan visual, bukan kegagalan instalasi/build/browser. Simpan URL PR, revisi, dan URL check run.
- Dari akun tanpa bypass, pastikan halaman PR menyatakan required check ini gagal dan merge biasa diblokir. Respons REST `mergeable: true` hanya berarti tidak ada konflik; itu bukan bukti izin merge. Catat juga status blokir GitHub jika tersedia. Jangan mencoba API merge dengan akun admin sebagai cara menguji: jika aturan keliru, PR justru bisa tergabung.
- Pulihkan perubahan pada PR uji dan pastikan run revisi baru lulus; hasil hijau revisi lama tidak cukup. Tutup PR tanpa merge setelah bukti dikumpulkan. Simpan tautan hasil gagal/terblokir dan hasil pulih di catatan audit. Sampai langkah ini selesai, nyatakan verifikasi pemblokiran **belum dilakukan**, bukan selesai berdasarkan tes lokal.

### Batas perlindungan

Required check berlaku pada jalur GitHub yang tercakup aturan aktif. Perlindungan branch klasik dapat mengecualikan admin bila penerapan ke admin tidak diaktifkan; ruleset dapat memberi bypass kepada role, tim, atau aplikasi tertentu. Pemilik hak administrasi juga dapat mengubah atau menonaktifkan aturan. Jangan mengklaim gate tidak dapat dilewati, dan jangan mengubah kebijakan bypass tanpa persetujuan terpisah.

Aturan GitHub tidak dengan sendirinya memeriksa atau menghentikan deployment dari workspace, CLI, layanan lain, atau salinan kode yang tidak melalui PR terlindungi. Run pada `push` ke `main` hanya mendeteksi masalah setelah push tersebut terjadi. Prosedur rilis di luar GitHub tetap perlu menjalankan `npm run visual:ci` terhadap revisi yang akan dirilis dan menolak rilis saat gagal; task ini tidak memasang atau menjanjikan penguncian deployment tersebut.

## Pemeriksaan manual terhadap server yang sudah berjalan

Mulai aplikasi (`npm run dev`), lalu jalankan `npm run visual:check` **sebelum merilis pembaruan CSS**. Pemeriksaan memakai Chromium (`CHROME_PATH` bila `which chromium` tidak tersedia), delapan referensi yang dilacak di `baselines/`, dan tidak berjalan dalam `npm test` biasa. `VISUAL_BASE_URL` boleh menunjuk ke server pengembangan lain yang menjalankan versi kode yang sedang diperiksa; jangan arahkan ke akun login/produksi. Laporan lokal ada di `results/report.html` (buka di browser), beserta gambar terbaru dan diff magenta. Kode keluar 1 jika halaman/heading hilang atau selisih melewati 1,2% piksel (per kanal warna di atas 20). Hasil lama dibersihkan setiap kali pembandingan dimulai.

Beranda dan `/kontraktor` menguji viewport awal; `/documentation` memotret elemen isi kartu hierarki (`prose`); `/pricing` memotret elemen kartu Paket Bisnis (`ring-2`). Setiap halaman dirender di viewport 1280×800 dan 390×844 (elemen boleh lebih tinggi dari viewport). Browser menggunakan konteks anonim baru, tema bawaan aplikasi (gelap), pixel ratio 1, animasi nonaktif; widget chat dan nomor kontak dinamis disembunyikan. Aset pihak ketiga (termasuk Google Fonts) diblokir agar hasil tidak tergantung jaringan. Pembandingan menggunakan font fallback lokal: jalankan di lingkungan Chromium dan font sistem yang sama agar konsisten. Ini mendeteksi perubahan CSS pada area yang tertangkap, bukan semua bagian halaman. Permintaan API dinamis tidak dipakai untuk menunggu kesiapan halaman.

## Pembaruan referensi: manual dan ditinjau

Jika perubahan disengaja, tinjau ketiga kolom laporan dan gunakan lingkungan font/browser yang dipin. Terhadap frontend/server lokal yang menjalankan kode baru:

```sh
CHROME_PATH="$(which chromium)" \
FONTCONFIG_FILE="$PWD/generated-artifacts/visual-env/fonts.conf" \
VISUAL_EXPECTED_CHROME=138.0.7204.100 \
VISUAL_BASE_URL=http://127.0.0.1:5000 \
npm run visual:update
```

Pada Linux biasa, `CHROME_PATH` dapat menunjuk ke `$PWD/generated-artifacts/visual-env/chrome-linux64/chrome`. Periksa **semua** PNG yang berubah sebelum menyimpannya ke git, ajukan perubahan dalam PR untuk ditinjau, lalu jalankan pembandingan tanpa `--update`. Jangan memperbarui referensi hanya untuk membuat pemeriksaan lulus. `visual:update` menolak dijalankan ketika `CI` aktif; `visual:ci` menolak semua argumen termasuk `--update`. Pembaruan browser/font juga harus diperlakukan sebagai perubahan referensi yang ditinjau, bukan pembaruan otomatis.

`npm run test:visual-ci` memeriksa pemicu CI, pin/checksum font dan browser, unggahan laporan, serta penolakan pembaruan referensi dan laporan ketika lingkungan belum siap. Hasil di `results/` sengaja tidak dilacak.

## Uji negatif terisolasi: warna kartu dan ring

```sh
CHROME_PATH="$(which chromium)" npm run test:visual-negative
```

Uji menjalankan **skrip `check-visual.mjs` asli**, bukan pembanding tiruan, terhadap fixture HTML lokal `fixtures/cards.html` yang melayani empat rute pada port sementara. Tidak membutuhkan aplikasi, build, database, login, atau aset eksternal. Delapan referensi fixture dibuat di direktori kerja unik `generated-artifacts/visual-negative-*/`; delapan referensi aplikasi yang ditinjau di `tests/visual/baselines/` tidak dipakai sebagai referensi fixture dan hash-nya diperiksa tetap sama setelah uji.

Kondisi normal wajib menghasilkan kode keluar **0** dan delapan hasil **LULUS** dengan selisih nol. Perubahan warna latar kartu `prose` serta warna ring inset kartu `ring` masing-masing wajib menghasilkan kode keluar **1**, dua hasil **BERUBAH** (desktop/mobile) di atas ambang 1,2%, dan enam hasil lain tetap lulus. Ring sengaja berada di dalam area tangkapan agar pengujian tidak bergantung pada pemotongan bayangan luar elemen. Setiap mutasi diulang dua kali dan hash semua diff harus identik. Error browser/heading tidak dianggap bukti bahwa regresi CSS terdeteksi.

Uji juga memastikan PNG referensi, gambar saat ini, dan diff tersedia serta ditautkan di laporan HTML. Semua laporan dipertahankan di `tests/visual/results-normal/`, `results-color-1/`, `results-color-2/`, `results-ring-1/`, dan `results-ring-2/` **di dalam direktori artefak unik**, bukan direktori hasil aplikasi. Buka `report.html` di salah satu direktori tersebut untuk melihat tiga kolom, termasuk diff magenta. Keluaran terminal menunjukkan direktori artefaknya.

CI menjalankan uji ini setelah penyiapan browser/font yang dipin dan mengunggah artefak **visual-negative-…** bahkan ketika uji gagal. Ekstrak seluruh artefak agar tautan `../baselines/` tetap bekerja. Perintah uji keseluruhan sukses justru ketika kegagalan visual yang disengaja terbukti; pembuatan referensi fixture hanya memakai `--update` dalam direktori sementara, sedangkan pembandingan tetap berjalan dengan `CI=true`. Tidak ada pembaruan referensi aplikasi, perubahan ambang, atau pengecualian kelulusan.