---
name: Reconciler vs boot seed boundaries
description: Cara membuktikan reconciler sempit tidak mengubah atribut agent yang dikelola seed boot lain.
---

Untuk reconciler yang hanya boleh mengubah relasi tertentu, ambil snapshot atribut terlarang tepat sebelum dan sesudah transaksi reconciler, lalu lakukan audit kedua setelah seluruh boot selesai.

**Why:** Boot aplikasi menjalankan beberapa seed dan repair independen secara berurutan. Snapshot pasca-boot saja dapat menuduh reconciler atas perubahan prompt, model, atau visibilitas yang sebenarnya dibuat seed lain setelah transaksi reconciler selesai.

**How to apply:** Bandingkan snapshot per slug di batas transaksi untuk membuktikan ruang lingkup mutasi. Setelah restart, verifikasi lagi keadaan operasional akhir dan baca urutan log untuk mengatribusikan perbedaan secara benar.

Untuk one-time reconciler yang mengganti bagian dari graph editable, jangan hanya memeriksa node/edge yang akan diubah. Cocokkan seluruh legacy graph beserta metadata induknya, lalu tahan write lock sejak sebelum validasi sampai commit.

**Why:** Pemeriksaan parsial tetap dapat menimpa graph yang sudah diedit di bagian downstream. Transaksi tanpa lock juga masih memiliki celah antara validasi dan write, sehingga perubahan admin yang terjadi bersamaan bisa ikut terhapus.

**How to apply:** Fail closed bila ada row tambahan, field berbeda, atau relasi berbeda di mana pun pada graph legacy. Gunakan lock yang berkonflik dengan INSERT/UPDATE/DELETE dari jalur admin selama transaksi rekonsiliasi yang singkat.