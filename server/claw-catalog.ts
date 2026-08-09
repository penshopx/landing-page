// ─────────────────────────────────────────────────────────────────────────────
// KATALOG CLAW — daftar produk premium yang di-seed oleh Claw Factory.
//
// Produk baru = tambahkan SATU entri di array ini (bukan file seed baru).
// Alur produksi dari prompt aiforwork:
//   1. User menempelkan JSON prompt mentah (tidak perlu dipotong/diterjemahkan)
//   2. Agent mengonversinya jadi entri ClawDef: terjemahkan → buang semua
//      link/branding aiforwork → pecah jadi misi orkestrator + 2–3 alat bantu
//      spesifik → petakan criteria ke evaluatorCriteria (evaluator dibuat
//      otomatis oleh factory, tidak perlu ditulis)
//   3. Boot berikutnya: factory seed → produk tampil di Store (Premium Privat)
//
// Konvensi harga: OpenClaw spesialis = K2 / 2.5jt / 199rb ·
//                 MultiClaw = K3 / 5jt / 299rb (ubah per entri bila perlu).
// Slug alat bantu harus unik GLOBAL (awali dengan singkatan claw-nya).
// 4 produk pertama (desain-proyek-claw, rencana-proyek-claw,
// studi-kelayakan-claw, persiapan-proyek-multiclaw) tetap di file seed lamanya.
// ─────────────────────────────────────────────────────────────────────────────
import type { CatalogEntry } from "./lib/claw-factory";

export const CLAW_CATALOG: CatalogEntry[] = [
  // ── Batch 1 (aiforwork civil-engineer, konstruksi) ─────────────────────────
  {
    kind: "openclaw",
    slug: "estimasi-biaya-claw",
    name: "Estimasi Biaya Claw — Spesialis Laporan Estimasi Biaya Konstruksi",
    tagline: "Wawancara → Takeoff Volume → Harga Satuan → Laporan Estimasi → Evaluasi Rubrik",
    avatar: "🧮",
    category: "construction",
    docLabel: "Laporan Estimasi Biaya (Cost Estimate Report)",
    mission:
      "Membantu pengguna menyusun Laporan Estimasi Biaya proyek konstruksi yang akurat, rinci, dan terorganisir baik — mencakup material, upah, alat, overhead, dan biaya tak terduga — sebagai dasar keputusan anggaran dan pembiayaan bagi manajer proyek dan pemangku kepentingan. Terapkan praktik terbaik estimasi: takeoff kuantitas yang teliti, klasifikasi biaya yang jelas, indeks/eskalasi harga, pemanfaatan data historis dan acuan harga resmi (AHSP/SNI atau basis data harga daerah), serta penyesuaian lokasi.",
    interviewTopics: [
      "jenis, lokasi, dan skala proyek",
      "kelengkapan gambar/desain & spesifikasi yang tersedia",
      "acuan harga satuan yang dipakai (AHSP PUPR, jurnal harga daerah, data historis)",
      "metode pengadaan & jadwal pelaksanaan (pengaruh eskalasi)",
      "target anggaran dan format keluaran yang dibutuhkan",
    ],
    structure: [
      "Ringkasan Eksekutif & Total Estimasi",
      "Basis Estimasi (lingkup, acuan harga, tanggal harga, tingkat akurasi)",
      "Uraian Volume Pekerjaan (Quantity Takeoff)",
      "Analisis Harga Satuan per Item",
      "Rekapitulasi per Divisi/Paket Pekerjaan",
      "Biaya Tak Langsung, Overhead & Kontingensi",
      "Penyesuaian Lokasi & Eskalasi",
      "Asumsi, Pengecualian & Risiko Biaya",
    ],
    tools: [
      {
        slug: "eb-takeoff",
        role: "EB-TAKEOFF",
        name: "EB-TAKEOFF — Penghitung Volume Pekerjaan",
        mission:
          "Susun uraian volume pekerjaan (quantity takeoff) per item dari data desain/gambar yang diberikan pengguna: identifikasi item pekerjaan per divisi, hitung volume dengan satuan yang benar, tandai item yang datanya belum cukup dengan [ASUMSI] beserta basis perhitungannya.",
      },
      {
        slug: "eb-harga",
        role: "EB-HARGA",
        name: "EB-HARGA — Analis Harga Satuan & Eskalasi",
        mission:
          "Susun analisis harga satuan per item (upah, bahan, alat, koefisien) mengacu AHSP/acuan yang dipilih pengguna; terapkan penyesuaian lokasi, indeks harga, dan eskalasi sesuai jadwal pelaksanaan; sebutkan sumber acuan dan tanggal harga untuk setiap angka.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua komponen biaya (material, upah, alat, overhead, kontingensi) tercakup tanpa item besar terlewat",
      "Kerincian — setiap komponen ada rincian, breakdown, dan penjelasan basis angkanya sehingga dapat ditelusuri",
      "Organisasi — struktur laporan logis, judul/sub-judul jelas, mudah dinavigasi manajer proyek",
      "Kacamata Praktisi Ahli — kedalaman estimator senior sesuai standar industri, bukan angka generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-struktur-claw",
    name: "Analisis Struktur Claw — Spesialis Laporan Analisis Struktur",
    tagline: "Wawancara → Analisis Beban → Pemodelan & Perhitungan → Rekomendasi → Evaluasi Rubrik",
    avatar: "🏗️",
    category: "construction",
    docLabel: "Laporan Analisis Struktur (Structural Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Struktur yang komprehensif untuk memastikan keamanan dan kestabilan struktur — mencakup perhitungan yang akurat, analisis perilaku struktur terhadap berbagai beban (gravitasi, angin, gempa, suhu), dan rekomendasi yang dapat ditindaklanjuti oleh arsitek, kontraktor, dan pemangku kepentingan. Terapkan prinsip analisis struktur klasik dan matriks (metode kekakuan/fleksibilitas), tinjau balok, rangka, dan portal, serta perhatikan aspek keselamatan (safety) dan kelayanan (serviceability) sesuai standar rekayasa yang berlaku (SNI terkait bila konteks Indonesia).",
    interviewTopics: [
      "jenis struktur & fungsi bangunan (gedung, jembatan, bertingkat tinggi, dll.)",
      "material struktur (beton, baja, komposit, kayu) & sistem struktur",
      "data beban & kondisi lingkungan (angin, zona gempa, beban hidup)",
      "hasil perhitungan/model yang sudah ada (software yang dipakai)",
      "standar acuan & keluaran yang dibutuhkan pemangku kepentingan",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesimpulan Keamanan",
      "Deskripsi Struktur & Sistem Penahan Beban",
      "Kriteria Desain & Standar Acuan",
      "Analisis Pembebanan (mati, hidup, angin, gempa, suhu)",
      "Metode Analisis & Pemodelan",
      "Hasil Perhitungan & Pemeriksaan Kapasitas",
      "Evaluasi Keselamatan & Kelayanan (defleksi, getaran)",
      "Rekomendasi Prioritas & Tindak Lanjut",
    ],
    tools: [
      {
        slug: "as-beban",
        role: "AS-BEBAN",
        name: "AS-BEBAN — Analis Pembebanan Struktur",
        mission:
          "Susun analisis pembebanan lengkap untuk struktur yang dibahas: identifikasi kombinasi beban (mati, hidup, angin, gempa, suhu) sesuai standar acuan, hitung besaran beban per elemen, dan tandai parameter yang belum dikonfirmasi pengguna dengan [ASUMSI].",
      },
      {
        slug: "as-model",
        role: "AS-MODEL",
        name: "AS-MODEL — Analis Pemodelan & Perhitungan",
        mission:
          "Susun kerangka analisis dan perhitungan struktur: pilih metode yang tepat (klasik/matriks, statis/dinamis), uraikan langkah perhitungan kapasitas elemen kritis (balok, kolom, sambungan), periksa rasio kapasitas-permintaan, dan jelaskan perilaku struktur pada titik lemah potensial.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — semua aspek struktur (material, desain, beban, titik gagal potensial) dikaji tuntas",
      "Akurasi Perhitungan — prinsip & rumus rekayasa diterapkan benar, konsisten, dan mencerminkan perilaku struktur nyata",
      "Kejelasan Rekomendasi — spesifik, dapat ditindaklanjuti, dan diprioritaskan berdasarkan dampak keselamatan",
      "Kacamata Praktisi Ahli — kedalaman insinyur struktur senior sesuai standar rekayasa, bukan generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "uji-material-claw",
    name: "Uji Material Claw — Spesialis Laporan Pengujian Material",
    tagline: "Wawancara → Metode & Standar Uji → Interpretasi Hasil → Laporan → Evaluasi Rubrik",
    avatar: "🔬",
    category: "construction",
    docLabel: "Laporan Pengujian Material (Materials Testing Report)",
    mission:
      "Membantu pengguna menyusun Laporan Pengujian Material konstruksi yang akurat, terdokumentasi baik, dan ilmiah — memberikan informasi andal tentang sifat dan kinerja material (beton, baja, kayu, pasangan, aspal, agregat, polimer) untuk keputusan pemilihan material, desain, dan proses konstruksi oleh manajer proyek, arsitek, dan pemangku kepentingan. Patuhi standar industri dan metode uji yang diakui (SNI/ASTM/ISO sesuai konteks), perhatikan hubungan struktur-sifat material, dan komunikasikan informasi teknis dengan jelas.",
    interviewTopics: [
      "jenis material yang diuji & aplikasinya di proyek",
      "sifat yang perlu dievaluasi (kekuatan, durabilitas, deformasi, termal)",
      "standar & metode uji yang dipakai (SNI, ASTM, ISO)",
      "data hasil uji yang sudah ada (lab, jumlah sampel, kondisi)",
      "siapa pembaca laporan & keputusan apa yang akan diambil",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesimpulan Kelayakan",
      "Identifikasi Material & Tujuan Pengujian",
      "Standar Acuan & Metode Uji",
      "Prosedur Sampling & Kondisi Pengujian",
      "Hasil Uji & Data Terdokumentasi",
      "Analisis & Interpretasi (kesesuaian spesifikasi)",
      "Implikasi untuk Pemilihan Material & Konstruksi",
      "Rekomendasi & Batasan Pengujian",
    ],
    tools: [
      {
        slug: "um-metode",
        role: "UM-METODE",
        name: "UM-METODE — Perancang Metode & Standar Uji",
        mission:
          "Susun rancangan pengujian untuk material yang dibahas: pilih metode uji dan standar acuan yang tepat (SNI/ASTM/ISO), tentukan jumlah sampel, prosedur sampling, dan kondisi uji; jelaskan alasan pemilihan setiap metode dan tandai pilihan yang perlu konfirmasi lab dengan [ASUMSI].",
      },
      {
        slug: "um-interpretasi",
        role: "UM-INTERPRETASI",
        name: "UM-INTERPRETASI — Analis Interpretasi Hasil Uji",
        mission:
          "Interpretasikan data hasil uji yang diberikan pengguna: bandingkan dengan nilai spesifikasi/standar, identifikasi pola dan anomali, nilai kesesuaian material untuk aplikasi yang dimaksud, dan terjemahkan temuan teknis menjadi implikasi praktis yang mudah dipahami pemangku kepentingan non-teknis.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Standar — metode uji dan pelaporan mengikuti standar industri & praktik terbaik yang diakui",
      "Ketelitian Detail — pengumpulan, analisis, dan dokumentasi data teliti sehingga laporan komprehensif dan andal",
      "Komunikasi Teknis — informasi teknis kompleks disajikan jelas dan mudah dipahami pengambil keputusan",
      "Kacamata Praktisi Ahli — kedalaman ahli material senior, bukan uraian generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "andalalin-claw",
    name: "Andalalin Claw — Spesialis Studi Dampak Lalu Lintas",
    tagline: "Wawancara → Data Lalu Lintas → Analisis Kapasitas → Rekomendasi Mitigasi → Evaluasi Rubrik",
    avatar: "🚦",
    category: "construction",
    docLabel: "Studi Dampak Lalu Lintas (Andalalin / Traffic Impact Study)",
    mission:
      "Membantu pengguna menyusun Studi Dampak Lalu Lintas (Andalalin) yang komprehensif untuk suatu kawasan/pengembangan — menganalisis potensi kemacetan, masalah keselamatan, dan kebutuhan infrastruktur, lalu merekomendasikan penanganan yang efektif bagi perencana kota, pengembang, dan instansi perhubungan. Terapkan prinsip rekayasa lalu lintas: pengumpulan data volume/kecepatan, analisis kapasitas dan tingkat pelayanan (Level of Service), bangkitan-tarikan perjalanan, manajemen kebutuhan transportasi, serta solusi inovatif yang melampaui pendekatan konvensional.",
    interviewTopics: [
      "jenis & skala pengembangan yang memicu studi (fungsi, luas, kapasitas)",
      "lokasi & jaringan jalan terdampak (simpang kritis, akses)",
      "data lalu lintas yang tersedia (volume, survei, jam puncak)",
      "horizon analisis & tahun rencana",
      "instansi tujuan & persyaratan format (Andalalin resmi atau kajian internal)",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesimpulan Dampak",
      "Deskripsi Pengembangan & Wilayah Studi",
      "Kondisi Lalu Lintas Eksisting (data & survei)",
      "Bangkitan & Distribusi Perjalanan",
      "Analisis Kapasitas & Tingkat Pelayanan (eksisting vs rencana)",
      "Analisis Keselamatan & Titik Konflik",
      "Rekomendasi Penanganan & Mitigasi (fisik dan manajemen)",
      "Rencana Pemantauan & Evaluasi",
    ],
    tools: [
      {
        slug: "al-data",
        role: "AL-DATA",
        name: "AL-DATA — Perancang Pengumpulan Data Lalu Lintas",
        mission:
          "Susun rencana dan rekap data lalu lintas untuk wilayah studi: tentukan titik survei, jenis data (volume terklasifikasi, kecepatan, antrean, hambatan samping), waktu pengamatan jam puncak, dan olah data mentah pengguna menjadi tabel siap analisis; tandai data yang belum tersedia dengan [ASUMSI].",
      },
      {
        slug: "al-kapasitas",
        role: "AL-KAPASITAS",
        name: "AL-KAPASITAS — Analis Kapasitas & Tingkat Pelayanan",
        mission:
          "Hitung kapasitas ruas dan simpang serta tingkat pelayanan (LoS) untuk kondisi eksisting dan rencana: terapkan metode kapasitas jalan yang berlaku (MKJI/PKJI atau acuan yang dipilih), bandingkan skenario dengan-dan-tanpa pengembangan, dan identifikasi titik yang melewati ambang layanan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Pengumpulan Data — data lalu lintas relevan lengkap, sumber jelas, tidak ada aspek krusial terlewat",
      "Akurasi Analisis — teknik analisis diterapkan benar, tren data ditafsirkan tepat, kesimpulan bermakna",
      "Inovasi Solusi — rekomendasi kreatif melampaui pendekatan konvensional dan memberi manfaat nyata bagi komunitas",
      "Kacamata Praktisi Ahli — kedalaman ahli rekayasa lalu lintas senior sesuai standar industri",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kajian-risiko-claw",
    name: "Kajian Risiko Claw — Spesialis Laporan Penilaian Risiko Proyek",
    tagline: "Wawancara → Identifikasi Risiko → Prioritas & Mitigasi → Laporan → Evaluasi Rubrik",
    avatar: "⚠️",
    category: "construction",
    docLabel: "Laporan Penilaian Risiko (Risk Assessment Report)",
    mission:
      "Membantu pengguna menyusun Laporan Penilaian Risiko proyek yang komprehensif, akurat, dan terstruktur — mengidentifikasi, menganalisis, dan memprioritaskan risiko agar manajer proyek, pemangku kepentingan, dan otoritas regulasi dapat mengambil keputusan tepat dan memitigasi risiko. Terapkan kerangka manajemen risiko proyek: identifikasi risiko umum maupun tidak umum, analisis kualitatif dan kuantitatif, pelibatan seluruh pemangku kepentingan, komunikasi risiko yang jelas (termasuk matriks risiko), rekomendasi praktis yang layak biaya, dan penekanan pada pemantauan berkelanjutan sepanjang siklus proyek.",
    interviewTopics: [
      "jenis proyek, tahap, dan lingkupnya",
      "konteks risiko utama yang dikhawatirkan (teknis, K3, finansial, jadwal, hukum/regulasi)",
      "pemangku kepentingan & otoritas yang akan membaca laporan",
      "data historis/insiden atau register risiko yang sudah ada",
      "kerangka atau standar acuan yang diminta (ISO 31000, SMKK, internal)",
    ],
    structure: [
      "Ringkasan Eksekutif & Risiko Prioritas Tertinggi",
      "Konteks Proyek & Metodologi Penilaian",
      "Identifikasi Risiko (register lengkap per kategori)",
      "Analisis Risiko (kemungkinan × dampak, kualitatif & kuantitatif)",
      "Matriks Risiko & Prioritas",
      "Rencana Mitigasi & Penanggung Jawab",
      "Rencana Pemantauan & Pemutakhiran Berkala",
      "Kesimpulan & Rekomendasi Keputusan",
    ],
    tools: [
      {
        slug: "kr-identifikasi",
        role: "KR-IDENTIFIKASI",
        name: "KR-IDENTIFIKASI — Pengidentifikasi & Penganalisis Risiko",
        mission:
          "Susun register risiko lengkap untuk proyek yang dibahas: identifikasi risiko per kategori (teknis, K3, finansial, jadwal, lingkungan, hukum) termasuk risiko tidak umum, nilai kemungkinan dan dampak masing-masing, dan susun matriks prioritas; tandai penilaian yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "kr-mitigasi",
        role: "KR-MITIGASI",
        name: "KR-MITIGASI — Perancang Mitigasi & Pemantauan",
        mission:
          "Susun rencana mitigasi untuk risiko-risiko prioritas: usulkan langkah pencegahan dan respons yang realistis, layak biaya, dan sesuai praktik terbaik; tetapkan indikator pemantauan, pemicu eskalasi, dan jadwal peninjauan ulang sepanjang siklus proyek.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Analisis Risiko — identifikasi mendalam mencakup risiko umum dan tidak umum beserta faktor penyebabnya",
      "Kejelasan Komunikasi Risiko — bahasa jelas, informasi terorganisir, matriks/visual membantu pemahaman semua pembaca",
      "Kepraktisan Rekomendasi — langkah mitigasi realistis, layak biaya, dan selaras praktik terbaik industri",
      "Kacamata Praktisi Ahli — kedalaman manajer risiko senior, bukan daftar generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rk3-claw",
    name: "RK3 Claw — Spesialis Rencana Keselamatan & Kesehatan Kerja",
    tagline: "Wawancara → Identifikasi Bahaya → Prosedur & Tanggap Darurat → RK3 → Evaluasi Rubrik",
    avatar: "🦺",
    category: "construction",
    docLabel: "Rencana Keselamatan & Kesehatan Kerja (Health and Safety Plan / RK3)",
    mission:
      "Membantu pengguna menyusun Rencana Keselamatan dan Kesehatan Kerja (RK3) proyek yang menjamin perlindungan semua pihak yang terlibat — mencakup langkah keselamatan menyeluruh, penilaian risiko bahaya, prosedur tanggap darurat, dan pedoman praktik kerja aman — untuk dipakai tim proyek, kontraktor, dan pemangku kepentingan demi kepatuhan regulasi K3 dan pencegahan kecelakaan. Terapkan prinsip manajemen keselamatan konstruksi: identifikasi bahaya, APD, proteksi jatuh, safety meeting/toolbox talk, pelatihan, inspeksi & audit berkala, dokumentasi kepatuhan, dan budaya keselamatan (acuan SMKK/Permen PUPR atau regulasi yang berlaku di lokasi proyek).",
    interviewTopics: [
      "jenis proyek & pekerjaan berisiko tinggi yang ada (ketinggian, galian, alat berat, listrik)",
      "regulasi/standar yang harus dipatuhi (SMKK, Permen PUPR, kebijakan internal)",
      "struktur organisasi K3 & sumber daya yang tersedia",
      "kondisi lokasi kerja & fasilitas darurat terdekat",
      "format keluaran & pihak yang akan menyetujui dokumen",
    ],
    structure: [
      "Kebijakan & Komitmen Keselamatan",
      "Organisasi K3 & Tanggung Jawab",
      "Identifikasi Bahaya & Penilaian Risiko (IBPRP)",
      "Pengendalian Risiko & APD per Jenis Pekerjaan",
      "Prosedur Kerja Aman & Izin Kerja Khusus",
      "Prosedur Tanggap Darurat & Evakuasi",
      "Pelatihan, Safety Meeting & Komunikasi K3",
      "Inspeksi, Audit, Pelaporan Insiden & Dokumentasi",
    ],
    tools: [
      {
        slug: "k3-bahaya",
        role: "K3-BAHAYA",
        name: "K3-BAHAYA — Pengidentifikasi Bahaya & Penilai Risiko",
        mission:
          "Susun tabel identifikasi bahaya dan penilaian risiko (IBPRP) untuk setiap jenis pekerjaan proyek: uraikan bahaya per aktivitas, nilai tingkat risiko, tetapkan hierarki pengendalian (eliminasi → APD) dan APD wajib; tandai aktivitas yang detailnya belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "k3-darurat",
        role: "K3-DARURAT",
        name: "K3-DARURAT — Perancang Prosedur Tanggap Darurat",
        mission:
          "Susun prosedur tanggap darurat proyek: skenario darurat (kecelakaan kerja, kebakaran, cuaca ekstrem, keruntuhan), alur pelaporan dan evakuasi, daftar kontak darurat, kebutuhan fasilitas P3K, serta jadwal simulasi/drill; pastikan langkahnya jelas dan bisa diikuti pekerja lapangan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — semua aspek perlindungan tercakup: analisis risiko, langkah keselamatan, prosedur darurat, praktik kerja aman, tanpa celah ambigu",
      "Kejelasan — bahasa ringkas dan mudah dipahami semua pihak termasuk pekerja lapangan, bebas jargon yang membingungkan",
      "Kepatuhan Standar — selaras regulasi K3 dan standar industri yang berlaku, memenuhi atau melampaui persyaratan minimum",
      "Kacamata Praktisi Ahli — kedalaman ahli K3 konstruksi senior, bukan templat generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "investigasi-lahan-claw",
    name: "Investigasi Lahan Claw — Spesialis Laporan Penyelidikan Lokasi",
    tagline: "Wawancara → Penyelidikan Geoteknik → Analisis Risiko Lahan → Rekomendasi → Evaluasi Rubrik",
    avatar: "🕳️",
    category: "construction",
    docLabel: "Laporan Penyelidikan Lokasi (Site Investigation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Penyelidikan Lokasi (Site Investigation Report) yang akurat, rinci, dan terorganisir — memberikan gambaran menyeluruh kondisi lahan dan potensi risikonya untuk pengambilan keputusan pada tahap perencanaan dan desain proyek konstruksi oleh arsitek, kontraktor, dan pemangku kepentingan. Terapkan prinsip geoteknik: tanpa penyelidikan lokasi, tanah adalah bahaya. Rencanakan metode penyelidikan (pengeboran, sampling, uji lab, sondir/SPT), kaji kondisi tanah, muka air tanah, dan faktor lingkungan, analisis risiko lahan, serta beri rekomendasi fondasi dan tindakan pencegahan berbasis temuan.",
    interviewTopics: [
      "lokasi & rencana bangunan/konstruksi di atasnya",
      "data penyelidikan yang sudah ada (bor log, sondir, SPT, uji lab)",
      "kondisi lingkungan sekitar (bangunan tetangga, lereng, air tanah, banjir)",
      "riwayat lahan (bekas timbunan, rawa, industri) bila diketahui",
      "tahap keputusan yang akan didukung laporan (kelayakan, desain fondasi, izin)",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesesuaian Lahan",
      "Deskripsi Lokasi & Rencana Pembangunan",
      "Metodologi Penyelidikan (titik, kedalaman, metode uji)",
      "Kondisi Geologi & Stratigrafi Tanah",
      "Muka Air Tanah & Faktor Lingkungan",
      "Hasil Uji Lapangan & Laboratorium",
      "Analisis Risiko Lahan (daya dukung, penurunan, kestabilan)",
      "Rekomendasi Fondasi & Tindakan Pencegahan",
    ],
    tools: [
      {
        slug: "il-geoteknik",
        role: "IL-GEOTEKNIK",
        name: "IL-GEOTEKNIK — Analis Data Geoteknik",
        mission:
          "Rencanakan dan/atau olah data penyelidikan geoteknik: tentukan jumlah-kedalaman titik selidik dan metode uji yang sesuai skala bangunan, interpretasikan bor log/sondir/SPT/uji lab menjadi profil stratigrafi dan parameter tanah; tandai parameter yang diestimasi dengan [ASUMSI].",
      },
      {
        slug: "il-rekomendasi",
        role: "IL-REKOMENDASI",
        name: "IL-REKOMENDASI — Perumus Risiko Lahan & Rekomendasi Fondasi",
        mission:
          "Analisis risiko lahan dari profil tanah yang tersedia (daya dukung, penurunan, likuifaksi, kestabilan lereng, air tanah) dan rumuskan rekomendasi tipe fondasi serta tindakan pencegahan/modifikasi yang diprioritaskan berdasarkan dampaknya terhadap keamanan dan biaya proyek.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Pengumpulan Data — semua data relevan kondisi lahan dan potensi risiko terkumpul tanpa aspek krusial terlewat",
      "Presisi Analisis — data ditafsirkan akurat dan logis berbasis prinsip geoteknik yang sehat, pola dan risiko teridentifikasi",
      "Kejelasan Penyajian Temuan — struktur laporan koheren, informasi kompleks disampaikan ringkas dengan dukungan visual/tabel",
      "Kacamata Praktisi Ahli — kedalaman ahli geoteknik senior sesuai praktik industri, bukan generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  // ── Batch 2 (aiforwork civil-engineer, konstruksi) ─────────────────────────
  {
    kind: "openclaw",
    slug: "laporan-geoteknik-claw",
    name: "Laporan Geoteknik Claw — Spesialis Laporan Geoteknik & Desain Fondasi",
    tagline: "Wawancara → Data Tanah & Batuan → Analisis Fondasi & Lereng → Laporan → Evaluasi Rubrik",
    avatar: "⛰️",
    category: "construction",
    docLabel: "Laporan Geoteknik (Geotechnical Report)",
    mission:
      "Membantu pengguna menyusun Laporan Geoteknik yang komprehensif — analisis dan evaluasi sifat tanah dan batuan untuk proyek konstruksi, dengan rekomendasi rinci desain fondasi, kestabilan lereng, dan pekerjaan tanah yang menjamin keamanan dan kestabilan struktur — untuk digunakan arsitek, insinyur struktur, dan tim konstruksi dalam tahap desain dan pelaksanaan. Terapkan prinsip mekanika tanah dan praktik geoteknik: pengumpulan data lapangan/lab yang akurat, pemilihan tipe fondasi (dangkal, dalam, khusus) berbasis parameter tanah dan beban, analisis kestabilan lereng dan metode stabilisasi (dinding penahan, soil nailing, perbaikan tanah), memperhatikan air tanah, kegempaan, dan geometri lereng, serta penyajian temuan yang jelas dengan tabel dan visual.",
    interviewTopics: [
      "lokasi proyek & jenis struktur yang direncanakan (beban, jumlah lantai)",
      "data penyelidikan tanah yang tersedia (bor log, SPT/sondir, uji lab)",
      "kondisi lereng, air tanah, dan kegempaan lokasi",
      "kendala pelaksanaan (akses, bangunan tetangga, musim)",
      "standar acuan & keputusan desain yang akan didukung laporan",
    ],
    structure: [
      "Ringkasan Eksekutif & Rekomendasi Utama",
      "Deskripsi Proyek & Lingkup Penyelidikan",
      "Metode Investigasi & Pengujian (lapangan dan lab)",
      "Stratigrafi & Parameter Tanah/Batuan",
      "Kondisi Air Tanah & Kegempaan",
      "Analisis & Rekomendasi Desain Fondasi",
      "Analisis Kestabilan Lereng & Metode Stabilisasi",
      "Rekomendasi Pekerjaan Tanah, Asumsi & Batasan",
    ],
    tools: [
      {
        slug: "lg-parameter",
        role: "LG-PARAMETER",
        name: "LG-PARAMETER — Analis Data & Parameter Tanah",
        mission:
          "Olah data penyelidikan tanah menjadi parameter desain: interpretasikan bor log/SPT/sondir/uji lab menjadi profil stratigrafi, parameter kuat geser, kompresibilitas, dan muka air tanah; cross-check kewajaran nilai terhadap korelasi standar dan tandai parameter yang diestimasi dengan [ASUMSI].",
      },
      {
        slug: "lg-fondasi",
        role: "LG-FONDASI",
        name: "LG-FONDASI — Analis Fondasi & Kestabilan Lereng",
        mission:
          "Susun analisis dan rekomendasi desain: pilih tipe fondasi yang sesuai beban dan kondisi tanah (telapak, rakit, tiang), hitung daya dukung dan perkiraan penurunan, analisis kestabilan lereng bila relevan dan usulkan metode stabilisasi; jelaskan dasar setiap rekomendasi agar dapat ditelusuri.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Data — pengumpulan dan analisis data tanah/batuan presisi, terekam benar, dan ter-cross-check dengan standar industri",
      "Ketelitian Analisis — kajian menyeluruh mencakup fondasi, kestabilan lereng, dan pekerjaan tanah tanpa faktor kritis terlewat",
      "Kejelasan Penyajian — temuan, rekomendasi, dan risiko dikomunikasikan terstruktur dengan bahasa presisi dan visual pendukung",
      "Kacamata Praktisi Ahli — kedalaman ahli geoteknik senior sesuai praktik industri, bukan generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-mutu-claw",
    name: "Rencana Mutu Claw — Spesialis Rencana Penjaminan Mutu Proyek",
    tagline: "Wawancara → Prosedur & Standar Mutu → Kontrol & Audit → Rencana Mutu → Evaluasi Rubrik",
    avatar: "✅",
    category: "construction",
    docLabel: "Rencana Penjaminan Mutu (Quality Assurance Plan / RMPK)",
    mission:
      "Membantu pengguna menyusun Rencana Penjaminan Mutu proyek konstruksi yang akurat, jelas, dan komprehensif — menguraikan prosedur dan standar penjaminan mutu agar proyek memenuhi standar kualitas dan kepatuhan regulasi — untuk dipakai manajer proyek, insinyur, dan tim konstruksi. Terapkan prinsip manajemen mutu konstruksi: sasaran mutu yang jelas dan terukur, perencanaan-pengendalian-peningkatan mutu, prosedur inspeksi dan pengujian (ITP), audit mutu berkala, dokumentasi dan rekaman yang tertib, komunikasi antar pemangku kepentingan, serta integrasi dengan manajemen risiko dan pengadaan (selaras RMPK/SMKK bila konteks Indonesia).",
    interviewTopics: [
      "jenis proyek, lingkup pekerjaan, dan pemilik/pemberi tugas",
      "standar dan regulasi mutu yang harus dipenuhi (spesifikasi teknis, SNI, RMPK)",
      "struktur organisasi mutu & sumber daya yang tersedia",
      "titik pekerjaan kritis yang butuh inspeksi/pengujian ketat",
      "format dokumen dan pihak yang akan menyetujui rencana",
    ],
    structure: [
      "Kebijakan & Sasaran Mutu Proyek",
      "Organisasi Mutu & Tanggung Jawab",
      "Standar Acuan & Persyaratan Kepatuhan",
      "Rencana Inspeksi & Pengujian (ITP) per Pekerjaan",
      "Prosedur Pengendalian Mutu Material & Pelaksanaan",
      "Penanganan Ketidaksesuaian & Tindakan Korektif",
      "Audit Mutu, Pemantauan & Peningkatan Berkelanjutan",
      "Dokumentasi, Rekaman & Alur Komunikasi",
    ],
    tools: [
      {
        slug: "qa-itp",
        role: "QA-ITP",
        name: "QA-ITP — Perancang Rencana Inspeksi & Pengujian",
        mission:
          "Susun Rencana Inspeksi dan Pengujian (ITP) per jenis pekerjaan: tentukan titik tahan/saksi (hold/witness point), metode inspeksi, kriteria keberterimaan, frekuensi pengujian, dan penanggung jawab; selaraskan dengan spesifikasi teknis dan standar yang dipilih pengguna, tandai yang perlu konfirmasi dengan [ASUMSI].",
      },
      {
        slug: "qa-audit",
        role: "QA-AUDIT",
        name: "QA-AUDIT — Perancang Audit & Pengendalian Ketidaksesuaian",
        mission:
          "Susun mekanisme penjaminan mutu berjalan: jadwal dan lingkup audit mutu internal, prosedur penanganan ketidaksesuaian (NCR) dan tindakan korektif, format rekaman/dokumentasi, serta indikator kinerja mutu untuk pemantauan dan peningkatan berkelanjutan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua prosedur, standar, dan pedoman relevan tercakup sehingga potensi masalah mutu termitigasi efektif",
      "Kejelasan — bahasa ringkas dan mudah dipahami manajer proyek, insinyur, dan tim lapangan; struktur dokumen logis dan mudah dinavigasi",
      "Efektivitas — panduan praktis dan dapat dilaksanakan, menjamin standar mutu terpenuhi di seluruh fase desain-konstruksi-inspeksi",
      "Kacamata Praktisi Ahli — kedalaman ahli manajemen mutu konstruksi senior, bukan templat generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-inspeksi-claw",
    name: "Laporan Inspeksi Claw — Spesialis Laporan Inspeksi Struktur & Infrastruktur",
    tagline: "Wawancara → Pemeriksaan Sistematis → Temuan & Risiko → Rekomendasi → Evaluasi Rubrik",
    avatar: "🔍",
    category: "construction",
    docLabel: "Laporan Inspeksi (Inspection Report)",
    mission:
      "Membantu pengguna menyusun Laporan Inspeksi yang komprehensif dan akurat untuk menjamin keselamatan dan integritas struktur dan infrastruktur — merinci kondisi dan potensi risiko lokasi yang diinspeksi beserta rekomendasi mitigasi yang dapat ditindaklanjuti — untuk dipakai manajer proyek, pemangku kepentingan, dan otoritas regulasi dalam keputusan pemeliharaan, perbaikan, atau peningkatan. Terapkan pendekatan inspeksi sistematis: pemeriksaan menyeluruh elemen per elemen tanpa area kritis terlewat, pemahaman perilaku struktur dan material di bawah beban, penilaian kondisi material dan metode konstruksi, pemanfaatan prinsip pemantauan kesehatan struktur (SHM) bila tersedia, dan kepatuhan pada standar serta regulasi yang berlaku.",
    interviewTopics: [
      "objek yang diinspeksi (jenis struktur, umur, fungsi, riwayat perbaikan)",
      "tujuan inspeksi (rutin, pasca-kejadian, serah terima, sertifikasi)",
      "data & temuan lapangan yang sudah ada (foto, catatan, hasil uji)",
      "standar/regulasi acuan dan pihak yang mensyaratkan laporan",
      "keputusan yang akan diambil dari hasil inspeksi",
    ],
    structure: [
      "Ringkasan Eksekutif & Penilaian Kondisi Umum",
      "Identitas Objek & Tujuan Inspeksi",
      "Metodologi & Lingkup Pemeriksaan",
      "Temuan per Elemen (kondisi, foto, lokasi)",
      "Klasifikasi Kerusakan & Tingkat Keparahan",
      "Analisis Risiko & Implikasi Keselamatan",
      "Rekomendasi Tindak Lanjut Berprioritas",
      "Batasan Inspeksi & Kebutuhan Pemeriksaan Lanjutan",
    ],
    tools: [
      {
        slug: "in-temuan",
        role: "IN-TEMUAN",
        name: "IN-TEMUAN — Penyusun Temuan & Klasifikasi Kerusakan",
        mission:
          "Olah catatan dan foto lapangan pengguna menjadi daftar temuan sistematis per elemen struktur: deskripsikan kondisi, klasifikasikan jenis dan tingkat keparahan kerusakan (retak, korosi, defleksi, degradasi material), petakan lokasinya, dan tandai temuan yang butuh verifikasi lanjutan dengan [ASUMSI].",
      },
      {
        slug: "in-risiko",
        role: "IN-RISIKO",
        name: "IN-RISIKO — Analis Risiko & Rekomendasi Tindak Lanjut",
        mission:
          "Analisis implikasi keselamatan dari setiap temuan: nilai risiko terhadap integritas struktur dan pengguna, prioritaskan berdasarkan urgensi (segera/jangka pendek/pemantauan), dan rumuskan rekomendasi perbaikan, pemeliharaan, atau investigasi lanjutan yang spesifik dan dapat ditindaklanjuti.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Detail — setiap aspek objek diperiksa cermat: risiko teridentifikasi, observasi terdokumentasi, data akurat tanpa yang terlewat",
      "Kemenyeluruhan Inspeksi — pendekatan sistematis mencakup semua elemen dan faktor relevan, tidak ada area kritis yang terabaikan",
      "Kepatuhan Standar — kode, regulasi, dan pedoman inspeksi yang berlaku diterapkan konsisten sehingga rekomendasi andal",
      "Kacamata Praktisi Ahli — kedalaman inspektor struktur senior sesuai praktik industri, bukan checklist generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-pemeliharaan-claw",
    name: "Rencana Pemeliharaan Claw — Spesialis Rencana Pemeliharaan Aset & Fasilitas",
    tagline: "Wawancara → Inventaris Aset → Jadwal Preventif & Keandalan → Rencana → Evaluasi Rubrik",
    avatar: "🔧",
    category: "construction",
    docLabel: "Rencana Pemeliharaan (Maintenance Plan)",
    mission:
      "Membantu pengguna menyusun Rencana Pemeliharaan infrastruktur dan fasilitas yang menyeluruh, akurat, dan praktis — meminimalkan downtime, menekan biaya perbaikan, dan memperpanjang umur aset — untuk dipakai manajer fasilitas dan tim pemeliharaan dalam kegiatan dan pengambilan keputusan sehari-hari. Terapkan prinsip perencanaan pemeliharaan modern: jadwal pemeliharaan preventif, prosedur inspeksi, protokol perbaikan, dan alokasi sumber daya; pendekatan pemeliharaan berbasis keandalan (RCM) dengan analisis kekritisan dan moda kegagalan (FMEA); pemeliharaan berbasis kondisi; serta kepatuhan keselamatan, keberlanjutan, dan regulasi.",
    interviewTopics: [
      "jenis aset/fasilitas yang dikelola & umur/kondisinya",
      "riwayat kerusakan, downtime, dan biaya pemeliharaan selama ini",
      "sumber daya tim, anggaran, dan sistem pencatatan (CMMS/manual)",
      "aset paling kritis terhadap operasional",
      "regulasi/standar yang harus dipatuhi & target yang ingin dicapai",
    ],
    structure: [
      "Ringkasan Eksekutif & Sasaran Pemeliharaan",
      "Inventaris Aset & Analisis Kekritisan",
      "Strategi Pemeliharaan per Kategori Aset (preventif/prediktif/korektif)",
      "Jadwal Pemeliharaan Preventif & Prosedur Inspeksi",
      "Protokol Perbaikan & Penanganan Kerusakan",
      "Alokasi Sumber Daya, Suku Cadang & Anggaran",
      "Keselamatan, Keberlanjutan & Kepatuhan Regulasi",
      "Indikator Kinerja, Pemantauan & Perbaikan Berkelanjutan",
    ],
    tools: [
      {
        slug: "pm-jadwal",
        role: "PM-JADWAL",
        name: "PM-JADWAL — Penyusun Jadwal Preventif & Prosedur Inspeksi",
        mission:
          "Susun jadwal pemeliharaan preventif dan prosedur inspeksi per aset: tentukan frekuensi, aktivitas, standar hasil, estimasi durasi, dan kebutuhan personel/alat; kelompokkan per periode (harian-mingguan-bulanan-tahunan) agar mudah dieksekusi tim lapangan, tandai frekuensi yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "pm-keandalan",
        role: "PM-KEANDALAN",
        name: "PM-KEANDALAN — Analis Kekritisan & Keandalan Aset",
        mission:
          "Analisis kekritisan aset dan moda kegagalannya: susun peringkat kekritisan berbasis dampak operasional-keselamatan-biaya, identifikasi moda dan konsekuensi kegagalan utama (FMEA sederhana), dan rekomendasikan strategi per aset (preventif, berbasis kondisi, run-to-failure) beserta justifikasi biayanya.",
      },
    ],
    evaluatorCriteria: [
      "Cakupan Menyeluruh — semua aspek pemeliharaan tercakup: jadwal preventif, prosedur inspeksi, protokol perbaikan, dan alokasi sumber daya",
      "Keselamatan & Kepatuhan — prosedur menjamin keselamatan tim dan pengguna fasilitas serta patuh regulasi dan standar yang berlaku",
      "Optimasi & Keandalan — strategi meningkatkan keandalan aset, menekan downtime, dan menghasilkan penghematan biaya yang dapat dijelaskan",
      "Kacamata Praktisi Ahli — kedalaman perencana pemeliharaan senior, bukan daftar tugas generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "asbuilt-claw",
    name: "As-Built Claw — Spesialis Dokumen Gambar Terbangun",
    tagline: "Wawancara → Rekap Perubahan Konstruksi → Standar Dokumentasi → Dokumen As-Built → Evaluasi Rubrik",
    avatar: "📐",
    category: "construction",
    docLabel: "Dokumen Gambar Terbangun (As-Built Drawings Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Gambar Terbangun (As-Built) yang akurat mencerminkan kondisi akhir konstruksi — rekaman komprehensif pelaksanaan aktual termasuk semua modifikasi dan perubahan selama konstruksi — untuk dipakai arsitek, kontraktor, dan tim pemeliharaan masa depan dalam memahami kondisi akhir proyek dan mengambil keputusan pemeliharaan, renovasi, atau konstruksi lanjutan. Terapkan praktik dokumentasi konstruksi terbaik: pencatatan menyeluruh selama proses konstruksi, simbol dan label terstandar, kepatuhan pada standar dan regulasi industri, integrasi perubahan/change order ke dalam gambar, pemanfaatan BIM bila relevan, dan komunikasi efektif dengan semua pemangku kepentingan.",
    interviewTopics: [
      "jenis proyek & disiplin gambar yang didokumentasikan (arsitektur, struktur, MEP)",
      "catatan perubahan yang ada (change order, instruksi lapangan, red-line markup)",
      "format & standar gambar yang dipakai (CAD/BIM, penamaan, simbol)",
      "pihak yang akan memakai dokumen & persyaratan serah terima",
      "kelengkapan data lapangan vs gambar desain terakhir",
    ],
    structure: [
      "Ringkasan Dokumen & Status Kelengkapan",
      "Identitas Proyek & Daftar Gambar",
      "Metodologi Pemutakhiran (sumber data, verifikasi lapangan)",
      "Register Perubahan & Referensi Change Order",
      "Konvensi Penandaan, Simbol & Standar Penamaan",
      "Ringkasan Perubahan per Disiplin (arsitektur, struktur, MEP)",
      "Verifikasi, Persetujuan & Jejak Audit",
      "Format Serah Terima & Panduan Penggunaan Dokumen",
    ],
    tools: [
      {
        slug: "ab-perubahan",
        role: "AB-PERUBAHAN",
        name: "AB-PERUBAHAN — Perekap Perubahan Konstruksi",
        mission:
          "Rekap semua perubahan dari desain ke kondisi terbangun: olah change order, instruksi lapangan, dan markup pengguna menjadi register perubahan terstruktur (lokasi, disiplin, deskripsi sebelum-sesudah, referensi dokumen, dampak); tandai perubahan yang belum terverifikasi lapangan dengan [ASUMSI].",
      },
      {
        slug: "ab-standar",
        role: "AB-STANDAR",
        name: "AB-STANDAR — Penjaga Standar Dokumentasi & Serah Terima",
        mission:
          "Susun konvensi dan kelengkapan dokumen: standar penandaan/simbol/penamaan yang konsisten, checklist kelengkapan per disiplin, alur verifikasi dan persetujuan, serta format serah terima yang sesuai persyaratan pemilik proyek dan mudah dipakai tim pemeliharaan di masa depan.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Standar — dokumen mematuhi standar industri, kode, dan regulasi yang berlaku sehingga sah dan berguna bagi pemangku kepentingan",
      "Ketelitian Detail — semua informasi terekam termasuk setiap modifikasi selama konstruksi; bebas kesalahan, kelalaian, dan inkonsistensi",
      "Komunikasi Efektif — dokumen jelas, ringkas, dan mudah dipahami termasuk oleh pembaca non-teknis untuk keputusan pemeliharaan/renovasi",
      "Kacamata Praktisi Ahli — kedalaman dokumentator konstruksi senior, bukan templat generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "formulir-perubahan-claw",
    name: "Formulir Perubahan Claw — Spesialis Formulir & Alur Permintaan Perubahan",
    tagline: "Wawancara → Desain Formulir → Alur Persetujuan & Pelacakan → Dokumen → Evaluasi Rubrik",
    avatar: "📝",
    category: "construction",
    docLabel: "Formulir Permintaan Perubahan (Change Request Form)",
    mission:
      "Membantu pengguna menyusun Formulir Permintaan Perubahan (Change Request Form) yang merampingkan proses permintaan perubahan proyek konstruksi — mudah digunakan dan diakses sehingga pemangku kepentingan dapat mengajukan perubahan secara efisien — untuk dipakai tim proyek, arsitek, kontraktor, dan klien dalam mendokumentasikan dan melacak perubahan sepanjang siklus proyek. Terapkan praktik manajemen perubahan konstruksi terbaik: formulir menangkap informasi esensial (deskripsi, alasan, dampak jadwal-biaya-mutu, dokumen pendukung), instruksi pengisian yang jelas, penomoran unik dan jejak audit, alur persetujuan bertingkat, serta transparansi dan akuntabilitas yang menekan keterlambatan dan konflik.",
    interviewTopics: [
      "jenis proyek & pihak-pihak yang terlibat dalam perubahan",
      "proses perubahan yang berjalan sekarang & masalahnya (keterlambatan, sengketa)",
      "informasi yang wajib ditangkap (dampak biaya, jadwal, mutu, kontrak)",
      "alur persetujuan yang diinginkan & batas kewenangan per tingkat",
      "media formulir (kertas, spreadsheet, digital) & sistem pencatatan",
    ],
    structure: [
      "Panduan Penggunaan & Alur Proses Perubahan",
      "Bagian Identitas (nomor unik, proyek, pemohon, tanggal)",
      "Deskripsi Perubahan & Alasan/Justifikasi",
      "Analisis Dampak (jadwal, biaya, mutu, keselamatan, kontrak)",
      "Dokumen Pendukung & Referensi Gambar",
      "Alur Persetujuan Bertingkat & Kolom Keputusan",
      "Register Pelacakan Status & Jejak Audit",
      "Instruksi Pengisian & Ketentuan Administrasi",
    ],
    tools: [
      {
        slug: "cr-formulir",
        role: "CR-FORMULIR",
        name: "CR-FORMULIR — Perancang Struktur & Isi Formulir",
        mission:
          "Rancang struktur formulir permintaan perubahan yang ramah pengguna: susun bagian dan field dengan urutan logis, label jelas, instruksi pengisian ringkas, dan field wajib vs opsional; pastikan semua informasi esensial (deskripsi, alasan, dampak jadwal-biaya, lampiran) tertangkap akurat dan lengkap.",
      },
      {
        slug: "cr-alur",
        role: "CR-ALUR",
        name: "CR-ALUR — Perancang Alur Persetujuan & Pelacakan",
        mission:
          "Rancang alur pemrosesan perubahan: penomoran unik, tingkat persetujuan dan batas kewenangannya, status pelacakan (diajukan-dikaji-disetujui/ditolak-dilaksanakan), register perubahan untuk rekap proyek, dan jejak audit yang memudahkan penelusuran saat sengketa; tandai kebijakan yang perlu keputusan manajemen dengan [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Kemudahan Penggunaan — formulir intuitif dengan instruksi jelas dan alur logis; pengguna dapat mengisinya tanpa bingung",
      "Kelengkapan Penangkapan Informasi — semua detail esensial tertangkap: deskripsi, alasan, dampak jadwal-biaya, dan dokumen pendukung",
      "Dokumentasi & Pelacakan — perubahan terdokumentasi sistematis dengan penomoran unik, status terlacak, dan jejak audit yang jelas",
      "Kacamata Praktisi Ahli — kedalaman praktisi manajemen perubahan konstruksi senior, bukan formulir generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-progres-claw",
    name: "Laporan Progres Claw — Spesialis Laporan Kemajuan Proyek",
    tagline: "Wawancara → Data Kemajuan → Isu & Solusi → Laporan Progres → Evaluasi Rubrik",
    avatar: "📊",
    category: "construction",
    docLabel: "Laporan Kemajuan Proyek (Progress Report)",
    mission:
      "Membantu pengguna menyusun Laporan Kemajuan proyek konstruksi yang akurat dan tepat waktu — mencerminkan progres aktual, mengidentifikasi isu dan tantangan, serta mengusulkan solusi atau strategi mitigasi — untuk dipakai klien, kontraktor, dan otoritas regulasi dalam menilai kinerja proyek dan mengambil keputusan. Terapkan praktik pelaporan proyek terbaik: komunikasi jelas dan ringkas yang disesuaikan dengan audiens, representasi data akurat dan andal (progres fisik vs rencana, kurva S, deviasi jadwal), identifikasi risiko dan hambatan secara jujur, usulan tindakan yang dapat dilaksanakan dengan mempertimbangkan sumber daya dan kendala proyek, serta penyajian informasi teknis kompleks secara sederhana.",
    interviewTopics: [
      "jenis proyek, nilai kontrak, dan periode pelaporan",
      "data kemajuan yang tersedia (progres fisik, jadwal rencana, laporan harian/mingguan)",
      "isu, hambatan, atau keterlambatan yang sedang terjadi",
      "audiens laporan (pemilik, konsultan pengawas, internal) & formatnya",
      "keputusan yang diharapkan dari laporan ini",
    ],
    structure: [
      "Ringkasan Eksekutif & Status Keseluruhan",
      "Progres Fisik vs Rencana (kurva S, deviasi)",
      "Rincian Kemajuan per Paket/Divisi Pekerjaan",
      "Realisasi Sumber Daya (tenaga, alat, material)",
      "Isu, Hambatan & Analisis Penyebab",
      "Risiko ke Depan & Dampaknya pada Jadwal/Biaya",
      "Usulan Tindakan & Strategi Pemulihan",
      "Rencana Kerja Periode Berikutnya & Dokumentasi Foto",
    ],
    tools: [
      {
        slug: "lp-data",
        role: "LP-DATA",
        name: "LP-DATA — Pengolah Data Kemajuan Proyek",
        mission:
          "Olah data lapangan pengguna menjadi representasi kemajuan yang akurat: hitung progres fisik tertimbang per paket pekerjaan, bandingkan realisasi vs rencana (deviasi, kurva S), rekap realisasi sumber daya, dan sajikan dalam tabel/format yang mudah dibaca; tandai data yang belum lengkap dengan [ASUMSI].",
      },
      {
        slug: "lp-solusi",
        role: "LP-SOLUSI",
        name: "LP-SOLUSI — Analis Isu & Perumus Tindakan Pemulihan",
        mission:
          "Analisis isu dan keterlambatan yang dilaporkan: identifikasi penyebab utama, nilai dampaknya pada jadwal dan biaya, dan rumuskan usulan tindakan atau strategi pemulihan (crash program, re-sequencing, penambahan sumber daya) yang realistis terhadap kendala proyek dan siap diputuskan pemangku kepentingan.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Komunikasi — bahasa jelas dan ringkas, progres, isu, dan usulan solusi mudah dipahami semua pemangku kepentingan",
      "Akurasi Representasi Data — data progres presisi dan andal (selesai, tersisa, keterlambatan) dalam format yang mudah dianalisis",
      "Ketertindaklanjutan Solusi — usulan tindakan layak dan realistis terhadap sumber daya dan kendala proyek, menunjukkan pemikiran kritis",
      "Kacamata Praktisi Ahli — kedalaman manajer proyek konstruksi senior, bukan laporan seremonial",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-akhir-claw",
    name: "Laporan Akhir Claw — Spesialis Laporan Akhir Proyek",
    tagline: "Wawancara → Rekap Proyek → Analisis & Pembelajaran → Laporan Akhir → Evaluasi Rubrik",
    avatar: "🏁",
    category: "construction",
    docLabel: "Laporan Akhir Proyek (Final Project Report)",
    mission:
      "Membantu pengguna menyusun Laporan Akhir Proyek yang komprehensif — mengkomunikasikan tujuan, metodologi, temuan, dan rekomendasi proyek secara efektif dengan dokumentasi yang akurat — untuk dipakai klien, instansi pemerintah, dan profesional teknik lainnya dalam mengevaluasi keberhasilan proyek, mengambil keputusan, dan menindaklanjuti rekomendasi. Terapkan praktik penulisan laporan teknik terbaik: struktur baku (ringkasan eksekutif, pendahuluan, metodologi, hasil, rekomendasi), ketelitian detail dan analisis data yang akurat, penulisan jelas-ringkas-presisi yang disesuaikan audiens teknis maupun non-teknis, kepatuhan pada pedoman proyek dan konvensi sitasi, serta pemanfaatan visual untuk memperkuat pemahaman.",
    interviewTopics: [
      "jenis proyek, tujuan awal, dan lingkup yang dikerjakan",
      "data hasil & capaian yang tersedia (realisasi vs target, dokumentasi)",
      "kendala/perubahan besar selama proyek & penyelesaiannya",
      "audiens laporan & pedoman format yang disyaratkan",
      "rekomendasi/tindak lanjut yang ingin ditekankan",
    ],
    structure: [
      "Ringkasan Eksekutif",
      "Pendahuluan (latar belakang, tujuan, lingkup)",
      "Metodologi Pelaksanaan Proyek",
      "Hasil & Capaian (realisasi vs target, data pendukung)",
      "Analisis Kinerja (jadwal, biaya, mutu, keselamatan)",
      "Kendala, Perubahan & Penyelesaiannya",
      "Pembelajaran (Lessons Learned)",
      "Kesimpulan, Rekomendasi & Lampiran",
    ],
    tools: [
      {
        slug: "la-rekap",
        role: "LA-REKAP",
        name: "LA-REKAP — Perekap Capaian & Data Proyek",
        mission:
          "Rekap seluruh perjalanan proyek menjadi data terstruktur: bandingkan realisasi vs target (lingkup, jadwal, biaya, mutu), susun kronologi milestone dan perubahan besar, dan kumpulkan bukti pendukung (data, perhitungan, dokumentasi) dengan akurat; tandai data yang belum terkonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "la-analisis",
        role: "LA-ANALISIS",
        name: "LA-ANALISIS — Analis Kinerja & Perumus Pembelajaran",
        mission:
          "Analisis kinerja proyek secara jujur: evaluasi keberhasilan terhadap tujuan awal, identifikasi akar penyebab deviasi jadwal/biaya, rumuskan pembelajaran (lessons learned) yang berguna untuk proyek berikutnya, dan susun rekomendasi tindak lanjut yang relevan dan akurat bagi pemangku kepentingan.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Informasi — tujuan, metodologi, temuan, dan rekomendasi dikomunikasikan koheren dan mudah diikuti",
      "Ketelitian Detail — dokumentasi akurat dan lengkap: data, perhitungan, dan bukti pendukung tercakup; analisis menyeluruh tanpa inkonsistensi",
      "Kepatuhan Pedoman — format, struktur, dan gaya sesuai pedoman proyek; semua bagian wajib ada dengan sitasi/referensi yang benar",
      "Kacamata Praktisi Ahli — kedalaman insinyur pelaporan proyek senior sesuai standar industri, bukan rangkuman dangkal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
];
