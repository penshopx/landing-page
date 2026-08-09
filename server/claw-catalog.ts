// ─────────────────────────────────────────────────────────────────────────────
// KATALOG CLAW — daftar produk premium yang di-seed oleh Claw Factory.
//
// Produk baru = tambahkan SATU entri di array ini (bukan file seed baru).
// Alur produksi:
//   1. User menempelkan JSON prompt mentah (tidak perlu dipotong/diterjemahkan)
//   2. Agent mengonversinya jadi entri ClawDef: terjemahkan → buang semua
//      link/branding  → pecah jadi misi orkestrator + 2–3 alat bantu
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
  // ── Batch 1 ( civil-engineer, konstruksi) ─────────────────────────
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
  // ── Batch 2 ( civil-engineer, konstruksi) ─────────────────────────
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
  // ── Batch 3 ( electrical-engineer, engineering) ───────────────────
  {
    kind: "openclaw",
    slug: "spesifikasi-elektrikal-claw",
    name: "Spesifikasi Elektrikal Claw — Spesialis Dokumen Spesifikasi Desain Elektrikal",
    tagline: "Wawancara → Kebutuhan & Beban → Standar & Persyaratan → Spesifikasi → Evaluasi Rubrik",
    avatar: "⚡",
    category: "engineering",
    docLabel: "Dokumen Spesifikasi Desain Elektrikal (Electrical Design Specifications)",
    mission:
      "Membantu pengguna menyusun Dokumen Spesifikasi Desain Elektrikal yang menjamin perencanaan dan eksekusi proyek desain elektrikal berjalan efektif — memuat spesifikasi, persyaratan, dan pedoman terperinci untuk proses desain — untuk dipakai tim desain elektrikal dan manajer proyek agar pelaksanaan akurat dan efisien. Terapkan praktik rekayasa elektrikal terbaik: analisis kebutuhan dan beban listrik, pemilihan sistem distribusi dan proteksi, kepatuhan pada standar yang berlaku (PUIL/SNI atau IEC/NEC sesuai konteks), spesifikasi material dan peralatan yang jelas dan dapat diverifikasi, serta bahasa spesifikasi yang tidak ambigu sehingga memudahkan eksekusi dan pengawasan.",
    interviewTopics: [
      "jenis proyek & fungsi bangunan/fasilitas (gedung, industri, infrastruktur)",
      "kebutuhan beban listrik & sistem utama (distribusi, penerangan, proteksi, cadangan)",
      "standar acuan yang dipakai (PUIL, SNI, IEC, NEC) & persyaratan pemilik",
      "batasan proyek (anggaran, jadwal, kondisi lokasi, keandalan yang dituntut)",
      "pengguna dokumen & tahap proyek yang didukung (tender, DED, pelaksanaan)",
    ],
    structure: [
      "Ringkasan & Lingkup Desain Elektrikal",
      "Kriteria Desain & Standar Acuan",
      "Analisis Kebutuhan Beban & Perhitungan Dasar",
      "Spesifikasi Sistem Distribusi Daya & Panel",
      "Spesifikasi Penerangan, Kotak Kontak & Sistem Khusus",
      "Sistem Proteksi, Pembumian & Keselamatan",
      "Spesifikasi Material & Peralatan (persyaratan teknis, pengujian)",
      "Pedoman Pelaksanaan, Inspeksi & Kriteria Keberterimaan",
    ],
    tools: [
      {
        slug: "se-beban",
        role: "SE-BEBAN",
        name: "SE-BEBAN — Analis Kebutuhan & Beban Listrik",
        mission:
          "Susun analisis kebutuhan listrik proyek: rekap beban per area/fungsi, faktor kebutuhan dan keserempakan, estimasi daya tersambung dan kapasitas trafo/genset, serta kebutuhan sistem khusus (UPS, cadangan); tandai angka yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "se-persyaratan",
        role: "SE-PERSYARATAN",
        name: "SE-PERSYARATAN — Penyusun Persyaratan Teknis & Standar",
        mission:
          "Susun persyaratan teknis per sistem dan material: rujuk pasal standar yang relevan (PUIL/SNI/IEC), tulis spesifikasi yang terukur dan dapat diverifikasi (rating, kelas proteksi, pengujian yang disyaratkan), dan pastikan tidak ada persyaratan ambigu yang bisa memicu sengketa pelaksanaan.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Spesifikasi — bahasa spesifikasi tidak ambigu, terukur, dan mudah diikuti tim desain dan pelaksana",
      "Kelengkapan Persyaratan — semua sistem, material, dan kondisi batas tercakup tanpa celah yang menghambat eksekusi",
      "Keterterapan pada Eksekusi — dokumen praktis dipakai untuk memandu pelaksanaan, inspeksi, dan keberterimaan pekerjaan",
      "Kacamata Praktisi Ahli — kedalaman insinyur elektrikal senior sesuai standar industri, bukan templat generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "diagram-sirkuit-claw",
    name: "Diagram Sirkuit Claw — Spesialis Dokumen Diagram Sirkuit",
    tagline: "Wawancara → Identifikasi Komponen & Koneksi → Standar Simbol → Dokumen Diagram → Evaluasi Rubrik",
    avatar: "🔌",
    category: "engineering",
    docLabel: "Dokumen Diagram Sirkuit (Circuit Diagrams Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Diagram Sirkuit yang merepresentasikan rangkaian listrik proyek secara akurat — diagram yang jelas, komprehensif, dan mudah dipahami serta diimplementasikan insinyur dan teknisi lain — untuk dipakai tim proyek dan pemangku kepentingan memahami koneksi dan komponen listrik yang dibutuhkan. Terapkan praktik dokumentasi rangkaian terbaik: simbol dan notasi standar (IEC/ANSI), penomoran dan penandaan komponen yang konsisten, kelengkapan informasi (rating, nilai komponen, referensi silang antar lembar), tata letak diagram yang logis dan mudah ditelusuri, serta kepatuhan pada standar dan praktik industri.",
    interviewTopics: [
      "jenis rangkaian & aplikasinya (daya, kontrol, elektronik, instrumentasi)",
      "daftar komponen & data teknis yang tersedia (rating, tipe, produsen)",
      "standar simbol yang dipakai (IEC, ANSI) & konvensi penandaan proyek",
      "siapa yang akan membaca/mengimplementasikan diagram",
      "format keluaran & perangkat lunak gambar yang digunakan",
    ],
    structure: [
      "Ringkasan Dokumen & Daftar Diagram",
      "Konvensi Simbol, Notasi & Penandaan Komponen",
      "Diagram Satu Garis / Blok Sistem",
      "Diagram Skematik per Rangkaian (daya, kontrol)",
      "Daftar Komponen & Rating per Diagram",
      "Referensi Silang Antar Lembar & Terminal",
      "Catatan Desain, Peringatan & Kondisi Khusus",
      "Riwayat Revisi & Status Persetujuan",
    ],
    tools: [
      {
        slug: "ds-skematik",
        role: "DS-SKEMATIK",
        name: "DS-SKEMATIK — Penyusun Struktur Skematik & Koneksi",
        mission:
          "Susun struktur diagram dari data pengguna: uraikan sistem menjadi blok dan rangkaian, definisikan setiap koneksi dan jalur sinyal/daya secara tekstual siap gambar (dari-ke, terminal, penampang), lengkapi penomoran komponen yang konsisten; tandai koneksi yang belum terkonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "ds-kelengkapan",
        role: "DS-KELENGKAPAN",
        name: "DS-KELENGKAPAN — Pemeriksa Kelengkapan & Kepatuhan Standar",
        mission:
          "Periksa kelengkapan dan kepatuhan dokumen diagram: verifikasi semua komponen punya identitas, rating, dan nilai; simbol sesuai standar yang dipilih; referensi silang antar lembar utuh; dan daftar ketidaksesuaian yang harus dikoreksi sebelum diagram dirilis ke tim pelaksana.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Diagram — representasi rangkaian mudah dibaca dan ditelusuri oleh insinyur maupun teknisi pelaksana",
      "Kelengkapan Informasi — semua komponen, koneksi, rating, dan referensi silang tercantum tanpa yang terlewat",
      "Kepatuhan Standar — simbol, notasi, dan penyajian mengikuti standar industri dan praktik terbaik yang dipilih",
      "Kacamata Praktisi Ahli — kedalaman perancang rangkaian senior, bukan diagram generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "diagram-pengawatan-claw",
    name: "Diagram Pengawatan Claw — Spesialis Dokumen Diagram Pengawatan",
    tagline: "Wawancara → Jalur & Terminasi → Label & Instruksi → Dokumen Pengawatan → Evaluasi Rubrik",
    avatar: "🧵",
    category: "engineering",
    docLabel: "Dokumen Diagram Pengawatan (Wiring Diagrams Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Diagram Pengawatan yang memberi instruksi jelas dan akurat untuk sistem pengawatan listrik — diagram terperinci, label, dan deskripsi koneksi listrik — untuk dipakai instalatir dan teknisi memasang serta memelihara sistem listrik secara efisien dan aman. Terapkan praktik pengawatan terbaik: identifikasi jalur kabel dan terminasi yang presisi, kode warna dan penandaan kabel yang konsisten, penampang dan tipe kabel sesuai beban dan lingkungan, urutan pemasangan yang aman (termasuk isolasi dan verifikasi bebas tegangan), serta dokumentasi yang lengkap untuk perawatan di masa depan (acuan PUIL/SNI atau standar yang berlaku).",
    interviewTopics: [
      "sistem yang diawat (panel, motor, penerangan, kontrol, instalasi gedung)",
      "data peralatan & terminal yang tersedia (denah, layout panel, datasheet)",
      "konvensi kode warna, penandaan kabel & standar acuan",
      "kondisi lingkungan pemasangan (dalam/luar ruang, area khusus)",
      "siapa pemasangnya & format instruksi yang paling membantu mereka",
    ],
    structure: [
      "Ringkasan Dokumen & Lingkup Pengawatan",
      "Konvensi Kode Warna, Penandaan & Simbol",
      "Skedul Kabel (tipe, penampang, panjang, rute)",
      "Diagram Pengawatan per Panel/Peralatan (terminal-ke-terminal)",
      "Instruksi Pemasangan & Urutan Kerja Aman",
      "Daftar Terminasi & Torsi Pengencangan",
      "Pengujian Pasca-Pemasangan (kontinuitas, isolasi, urutan fasa)",
      "Catatan Pemeliharaan & Riwayat Revisi",
    ],
    tools: [
      {
        slug: "dw-jalur",
        role: "DW-JALUR",
        name: "DW-JALUR — Penyusun Skedul Kabel & Jalur",
        mission:
          "Susun skedul kabel lengkap dari data pengguna: tentukan tipe dan penampang kabel per sirkuit sesuai beban dan panjang jalur, rute penarikan, identitas kabel, dan daftar terminasi dari-ke per terminal; tandai parameter yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "dw-instruksi",
        role: "DW-INSTRUKSI",
        name: "DW-INSTRUKSI — Penyusun Instruksi Pemasangan & Pengujian",
        mission:
          "Susun instruksi pemasangan yang aman dan mudah diikuti teknisi: urutan kerja, prosedur isolasi dan verifikasi bebas tegangan, detail terminasi dan torsi, serta checklist pengujian pasca-pemasangan (kontinuitas, tahanan isolasi, urutan fasa) dengan kriteria lulus/gagal yang jelas.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Diagram & Instruksi — teknisi dapat mengikuti diagram dan langkah pemasangan tanpa kebingungan",
      "Akurasi Koneksi Listrik — setiap terminasi, kode warna, dan penampang kabel benar dan konsisten dengan beban",
      "Kelengkapan Dokumentasi — skedul kabel, instruksi, pengujian, dan catatan pemeliharaan tercakup utuh",
      "Kacamata Praktisi Ahli — kedalaman praktisi instalasi listrik senior sesuai standar, bukan generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proposal-proyek-claw",
    name: "Proposal Proyek Claw — Spesialis Dokumen Proposal Proyek",
    tagline: "Wawancara → Struktur & Substansi → Narasi Persuasif → Proposal → Evaluasi Rubrik",
    avatar: "📄",
    category: "engineering",
    docLabel: "Dokumen Proposal Proyek (Project Proposal Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Proposal Proyek yang menguraikan detail dan tujuan proyek secara komprehensif, terstruktur baik, dan persuasif — mengkomunikasikan manfaat inti proyek secara efektif kepada pemangku kepentingan — untuk dipakai manajer proyek, eksekutif, dan calon investor dalam mengambil keputusan dan mengalokasikan sumber daya, dengan ukuran keberhasilan proposal disetujui dan didanai. Terapkan praktik penyusunan proposal terbaik: kejelasan masalah dan solusi, tujuan terukur, lingkup dan metodologi yang realistis, analisis manfaat-biaya dan kelayakan, identifikasi risiko beserta mitigasinya, struktur logis yang mudah diikuti pengambil keputusan, dan bahasa persuasif yang tetap akurat dan ringkas.",
    interviewTopics: [
      "proyek yang diusulkan & masalah/peluang yang dijawab",
      "audiens proposal (manajemen, investor, pemberi dana) & kriteria keputusannya",
      "perkiraan lingkup, jadwal, dan kebutuhan anggaran",
      "manfaat/keuntungan yang bisa dikuantifikasi & data pendukungnya",
      "pesaing/alternatif solusi & alasan usulan ini unggul",
    ],
    structure: [
      "Ringkasan Eksekutif",
      "Latar Belakang & Rumusan Masalah/Peluang",
      "Tujuan & Sasaran Terukur",
      "Lingkup & Metodologi Pelaksanaan",
      "Jadwal, Milestone & Organisasi Tim",
      "Anggaran & Analisis Manfaat-Biaya",
      "Risiko & Mitigasi",
      "Ajakan Keputusan & Langkah Berikutnya",
    ],
    tools: [
      {
        slug: "pp-substansi",
        role: "PP-SUBSTANSI",
        name: "PP-SUBSTANSI — Penyusun Substansi & Kelayakan",
        mission:
          "Susun substansi proposal yang kokoh: rumuskan masalah dan solusi, tujuan terukur, lingkup-jadwal-anggaran yang realistis, analisis manfaat-biaya dengan angka yang dapat dipertanggungjawabkan, dan risiko beserta mitigasinya; tandai angka yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "pp-persuasi",
        role: "PP-PERSUASI",
        name: "PP-PERSUASI — Perancang Narasi Persuasif",
        mission:
          "Bangun narasi proposal yang meyakinkan tanpa berlebihan: susun alur argumen dari kebutuhan → solusi → manfaat → bukti, sesuaikan bahasa dan penekanan dengan kriteria keputusan audiens, pertajam ringkasan eksekutif, dan pastikan setiap klaim didukung data dari substansi proposal.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan Isi — semua detail dan tujuan proyek tercakup akurat: lingkup, jadwal, anggaran, manfaat, dan risiko",
      "Struktur Logis — dokumen terorganisir baik dan mudah diikuti pengambil keputusan dari ringkasan sampai lampiran",
      "Komunikasi Persuasif — manfaat inti proyek tersampaikan meyakinkan dengan klaim yang didukung bukti",
      "Kacamata Praktisi Ahli — kedalaman penyusun proposal teknik senior, bukan proposal seremonial",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-uji-claw",
    name: "Laporan Uji Claw — Spesialis Dokumen Laporan Pengujian Peralatan",
    tagline: "Wawancara → Prosedur Uji → Hasil & Analisis → Laporan Uji → Evaluasi Rubrik",
    avatar: "🧪",
    category: "engineering",
    docLabel: "Dokumen Laporan Pengujian (Test Reports Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Laporan Pengujian yang menyajikan informasi komprehensif dan akurat tentang prosedur serta hasil pengujian peralatan listrik — terorganisir baik, terperinci, dan mudah dipahami — untuk dipakai tim kendali mutu dan pemangku kepentingan mengevaluasi kinerja dan keandalan peralatan serta mengambil keputusan berbasis informasi. Terapkan praktik pelaporan pengujian terbaik: dokumentasi prosedur yang dapat direproduksi, pencatatan kondisi uji dan alat ukur (termasuk kalibrasi), penyajian data hasil yang rapi dengan perbandingan terhadap kriteria keberterimaan, analisis kegagalan/anomali, kepatuhan pada standar industri (SNI/IEC/SPLN sesuai konteks), dan kesimpulan yang jelas untuk keputusan mutu.",
    interviewTopics: [
      "peralatan yang diuji & tujuan pengujian (komisioning, rutin, tipe, pasca-perbaikan)",
      "jenis uji yang dilakukan & standar acuan (SNI, IEC, SPLN)",
      "data hasil uji & alat ukur yang dipakai (termasuk status kalibrasi)",
      "kriteria keberterimaan yang berlaku",
      "pembaca laporan & keputusan yang akan diambil",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesimpulan Kelulusan",
      "Identitas Peralatan & Tujuan Pengujian",
      "Standar Acuan & Kriteria Keberterimaan",
      "Prosedur Uji & Kondisi Pengujian",
      "Alat Ukur & Status Kalibrasi",
      "Hasil Uji per Item (data, tabel, perbandingan kriteria)",
      "Analisis Anomali & Ketidaksesuaian",
      "Kesimpulan, Rekomendasi & Lampiran Data Mentah",
    ],
    tools: [
      {
        slug: "lu-prosedur",
        role: "LU-PROSEDUR",
        name: "LU-PROSEDUR — Penyusun Prosedur & Kondisi Uji",
        mission:
          "Dokumentasikan prosedur pengujian secara dapat-direproduksi: urutan langkah uji per item, kondisi lingkungan dan setelan, alat ukur beserta status kalibrasinya, dan kriteria keberterimaan dari standar yang dipilih; tandai detail yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "lu-hasil",
        role: "LU-HASIL",
        name: "LU-HASIL — Analis Hasil & Ketidaksesuaian",
        mission:
          "Olah data hasil uji menjadi penyajian yang rapi dan bermakna: tabulasi hasil vs kriteria keberterimaan, tandai lulus/gagal per item, analisis anomali dan kemungkinan penyebabnya, dan rumuskan kesimpulan serta rekomendasi tindak lanjut yang jelas bagi tim kendali mutu.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan & Organisasi — laporan terstruktur logis, informasi mudah ditemukan dan dipahami pembaca teknis maupun manajerial",
      "Akurasi & Kelengkapan — prosedur, kondisi uji, dan hasil terdokumentasi lengkap dan presisi hingga dapat direproduksi",
      "Kepatuhan Standar Industri — pengujian dan pelaporan mengikuti standar yang berlaku sehingga hasil kredibel",
      "Kacamata Praktisi Ahli — kedalaman insinyur pengujian senior, bukan rekap data mentah",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "daftar-material-claw",
    name: "Daftar Material Claw — Spesialis Bill of Materials Proyek",
    tagline: "Wawancara → Rincian Komponen → Spesifikasi & Kuantitas → BoM → Evaluasi Rubrik",
    avatar: "📦",
    category: "engineering",
    docLabel: "Daftar Material / Bill of Materials (BoM)",
    mission:
      "Membantu pengguna menyusun Bill of Materials (BoM) yang akurat mencantumkan semua komponen dan material yang dibutuhkan proyek — daftar komprehensif dan terperinci mencakup item, kuantitas, dan spesifikasi — untuk dipakai tim pengadaan dan manajer proyek menjamin eksekusi proyek yang sukses dengan proses pengadaan bebas kesalahan dan efisien. Terapkan praktik penyusunan BoM terbaik: struktur hierarkis per sistem/rakitan, identitas item yang tak ambigu (kode, deskripsi, produsen/tipe referensi), satuan dan kuantitas presisi termasuk cadangan pemasangan (waste factor), spesifikasi teknis yang cukup untuk pembelian tanpa klarifikasi bolak-balik, penanda item long-lead dan kritis, serta konsistensi dengan gambar dan spesifikasi desain.",
    interviewTopics: [
      "proyek & sistem yang butuh BoM (elektrikal, mekanikal, produk rakitan)",
      "sumber data desain (gambar, skematik, spesifikasi) yang tersedia",
      "konvensi penomoran/kode item & preferensi produsen",
      "kebijakan cadangan/waste factor & item long-lead yang diketahui",
      "format keluaran untuk tim pengadaan (kolom, satuan, pengelompokan)",
    ],
    structure: [
      "Ringkasan BoM & Basis Penyusunan",
      "Struktur Hierarki (sistem → rakitan → komponen)",
      "Daftar Item (kode, deskripsi, tipe/produsen referensi)",
      "Kuantitas, Satuan & Cadangan Pemasangan",
      "Spesifikasi Teknis Ringkas per Item",
      "Penanda Item Kritis & Long-Lead",
      "Konsistensi dengan Gambar/Spesifikasi & Catatan Deviasi",
      "Riwayat Revisi & Kontrol Perubahan BoM",
    ],
    tools: [
      {
        slug: "bm-rincian",
        role: "BM-RINCIAN",
        name: "BM-RINCIAN — Perinci Komponen & Kuantitas",
        mission:
          "Urai data desain pengguna menjadi daftar komponen terstruktur: identifikasi setiap item per sistem/rakitan, hitung kuantitas dengan satuan yang benar termasuk cadangan pemasangan yang wajar, dan kelompokkan secara hierarkis; tandai item yang datanya belum cukup dengan [ASUMSI].",
      },
      {
        slug: "bm-spesifikasi",
        role: "BM-SPESIFIKASI",
        name: "BM-SPESIFIKASI — Penyusun Spesifikasi & Kesiapan Pengadaan",
        mission:
          "Lengkapi setiap item dengan spesifikasi siap-beli: parameter teknis kunci, standar yang harus dipenuhi, tipe/produsen referensi beserta padanan setara, penanda item kritis/long-lead, dan periksa konsistensi BoM terhadap gambar dan spesifikasi desain agar pengadaan bebas kesalahan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua komponen dan material yang dibutuhkan proyek tercantum tanpa item terlewat",
      "Kerincian — setiap item punya kode, deskripsi, kuantitas, satuan, dan pengelompokan yang jelas dan konsisten",
      "Akurasi Spesifikasi — spesifikasi teknis per item benar, cukup untuk pembelian, dan selaras dokumen desain",
      "Kacamata Praktisi Ahli — kedalaman perencana material senior, bukan daftar belanja generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "manual-peralatan-claw",
    name: "Manual Peralatan Claw — Spesialis Dokumen Manual Peralatan",
    tagline: "Wawancara → Operasi & Perawatan → Format Ramah Pengguna → Manual → Evaluasi Rubrik",
    avatar: "📘",
    category: "engineering",
    docLabel: "Dokumen Manual Peralatan (Equipment Manuals Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Manual Peralatan yang memuat instruksi dan informasi komprehensif bagi pengguna — jelas, ringkas, dan mudah dipahami agar peralatan dioperasikan dan dirawat dengan efektif — untuk dipakai teknisi, operator, dan personel pemeliharaan dalam troubleshooting, perbaikan, dan perawatan rutin, dengan tujuan operasi efisien dan downtime minimal. Terapkan praktik penulisan manual teknis terbaik: struktur berbasis tugas (operasi, perawatan, troubleshooting), instruksi langkah-demi-langkah dengan peringatan keselamatan di titik yang tepat, format ramah pengguna (daftar isi, indeks, tabel, ilustrasi deskriptif), jadwal perawatan preventif, tabel diagnosis gangguan gejala-penyebab-solusi, dan kepatuhan pada standar dokumentasi industri.",
    interviewTopics: [
      "peralatan yang didokumentasikan (jenis, merek/model, fungsi) & datasheet yang ada",
      "pengguna manual (operator, teknisi, pemeliharaan) & tingkat keahliannya",
      "mode operasi & prosedur yang harus tercakup",
      "gangguan yang sering terjadi & pengalaman perbaikannya",
      "persyaratan keselamatan & standar dokumentasi yang diminta",
    ],
    structure: [
      "Pendahuluan & Ikhtisar Peralatan",
      "Informasi Keselamatan & Peringatan Umum",
      "Spesifikasi Teknis & Identifikasi Komponen",
      "Instruksi Pemasangan & Persiapan Awal",
      "Prosedur Operasi (langkah demi langkah per mode)",
      "Jadwal & Prosedur Perawatan Preventif",
      "Panduan Troubleshooting (gejala → penyebab → solusi)",
      "Suku Cadang, Kontak Dukungan & Riwayat Revisi",
    ],
    tools: [
      {
        slug: "me-prosedur",
        role: "ME-PROSEDUR",
        name: "ME-PROSEDUR — Penyusun Prosedur Operasi & Perawatan",
        mission:
          "Susun prosedur operasi dan perawatan langkah-demi-langkah dari data peralatan pengguna: urutan tindakan yang aman per mode operasi, jadwal perawatan preventif dengan frekuensi dan standar hasil, sisipkan peringatan keselamatan di titik yang tepat; tandai langkah yang belum terkonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "me-diagnosis",
        role: "ME-DIAGNOSIS",
        name: "ME-DIAGNOSIS — Penyusun Panduan Troubleshooting",
        mission:
          "Susun panduan diagnosis gangguan yang praktis: tabel gejala → kemungkinan penyebab → langkah pemeriksaan → solusi, urutkan dari penyebab paling umum, tetapkan batas kapan harus eskalasi ke teknisi ahli/produsen, dan pastikan bahasanya bisa diikuti operator non-spesialis.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan & Kelengkapan — instruksi akurat dan detail mencakup operasi, perawatan, dan troubleshooting tanpa celah",
      "Format Ramah Pengguna — struktur, navigasi, dan penyajian memudahkan pengguna menemukan dan mengikuti informasi",
      "Kepatuhan Standar Industri — isi dan format manual selaras standar dokumentasi dan keselamatan yang berlaku",
      "Kacamata Praktisi Ahli — kedalaman penulis dokumentasi teknis senior, bukan salinan datasheet",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "presentasi-teknis-claw",
    name: "Presentasi Teknis Claw — Spesialis Presentasi Teknik",
    tagline: "Wawancara → Alur Cerita Teknis → Visual & Keterlibatan Audiens → Presentasi → Evaluasi Rubrik",
    avatar: "📽️",
    category: "engineering",
    docLabel: "Presentasi Teknis (Technical Presentation)",
    mission:
      "Membantu pengguna menyusun Presentasi Teknis yang mengkomunikasikan konsep rekayasa kompleks secara efektif kepada audiens yang beragam — menarik secara visual, informatif, dan mudah dipahami — untuk dipakai dalam rapat proyek, konferensi, dan presentasi kepada kolega, klien, dan pemangku kepentingan, dengan ukuran keberhasilan informasi teknis tersampaikan dan mendapat tanggapan positif. Terapkan prinsip komunikasi teknis terbaik: kenali audiens dan sesuaikan kedalaman materi, bangun alur cerita yang logis (masalah → pendekatan → hasil → implikasi), sederhanakan konsep kompleks dengan analogi dan visual (diagram, grafik) tanpa mengorbankan akurasi, satu pesan kunci per slide, dan antisipasi pertanyaan audiens.",
    interviewTopics: [
      "topik teknis yang dipresentasikan & pesan kunci yang ingin melekat",
      "audiens (teknis/campuran/awam) & tingkat pemahamannya",
      "konteks acara (rapat proyek, konferensi, pitching) & durasi",
      "data/hasil yang tersedia untuk ditampilkan",
      "keputusan/tindakan yang diharapkan dari audiens setelah presentasi",
    ],
    structure: [
      "Pembuka & Pesan Kunci (mengapa ini penting bagi audiens)",
      "Konteks & Rumusan Masalah",
      "Pendekatan/Metodologi (disederhanakan sesuai audiens)",
      "Hasil Utama & Visualisasi Data",
      "Implikasi & Rekomendasi",
      "Ringkasan & Ajakan Tindakan",
      "Antisipasi Tanya-Jawab",
      "Lampiran Slide Cadangan (detail teknis)",
    ],
    tools: [
      {
        slug: "pt-alur",
        role: "PT-ALUR",
        name: "PT-ALUR — Perancang Alur Cerita & Isi Slide",
        mission:
          "Susun alur cerita presentasi dari materi pengguna: tetapkan pesan kunci, bangun urutan slide masalah → pendekatan → hasil → implikasi dengan satu pesan per slide, tulis judul slide yang bermakna (assertion-evidence) dan poin isi yang ringkas; sesuaikan kedalaman teknis dengan audiens.",
      },
      {
        slug: "pt-visual",
        role: "PT-VISUAL",
        name: "PT-VISUAL — Perancang Visual & Keterlibatan Audiens",
        mission:
          "Rancang deskripsi visual per slide: pilih bentuk penyajian yang tepat (diagram, grafik, skema, analogi visual) untuk setiap konsep kompleks, beri panduan penyederhanaan tanpa mengorbankan akurasi, dan usulkan momen interaksi/pertanyaan retoris untuk menjaga keterlibatan audiens sepanjang sesi.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Penjelasan — konsep teknik kompleks tersampaikan mudah dipahami tanpa kehilangan akurasi",
      "Daya Tarik Visual — visual mendukung pesan: diagram/grafik tepat guna, slide bersih, satu pesan per slide",
      "Keterlibatan Audiens — alur dan penyajian mempertahankan perhatian audiens yang beragam hingga selesai",
      "Kacamata Praktisi Ahli — kedalaman komunikator teknik senior, bukan tumpukan slide data",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "prosedur-keselamatan-claw",
    name: "Prosedur Keselamatan Claw — Spesialis Dokumen Prosedur Keselamatan Listrik",
    tagline: "Wawancara → Identifikasi Bahaya Listrik → Prosedur & LOTO → Dokumen → Evaluasi Rubrik",
    avatar: "🛡️",
    category: "engineering",
    docLabel: "Dokumen Prosedur Keselamatan (Safety Procedures Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Prosedur Keselamatan yang menjamin keselamatan seluruh personel dan peralatan — komprehensif, jelas, dan mudah dipahami — untuk dipakai semua karyawan perusahaan, dirujuk dalam operasi harian, dan diperbarui berkala, dengan ukuran keberhasilan efektif mencegah kecelakaan dan membangun lingkungan kerja yang aman. Terapkan prinsip keselamatan kelistrikan dan kerja: identifikasi bahaya (sengatan listrik, busur api/arc flash, energi tersimpan), prosedur isolasi energi (lockout-tagout/LOTO), APD per jenis pekerjaan, jarak aman dan izin kerja, prosedur tanggap darurat, pelatihan dan sosialisasi, serta kepatuhan pada regulasi dan standar yang berlaku (PUIL, Permenaker, atau standar setara).",
    interviewTopics: [
      "jenis operasi & pekerjaan berisiko yang ada (kelistrikan, mesin, ketinggian, bahan berbahaya)",
      "regulasi/standar yang harus dipatuhi (Permenaker, PUIL, kebijakan internal)",
      "insiden atau near-miss yang pernah terjadi",
      "struktur tanggung jawab keselamatan & program pelatihan yang berjalan",
      "cakupan dokumen (satu fasilitas/seluruh perusahaan) & pihak yang menyetujui",
    ],
    structure: [
      "Kebijakan Keselamatan & Ruang Lingkup",
      "Tanggung Jawab & Organisasi Keselamatan",
      "Identifikasi Bahaya & Penilaian Risiko per Area/Aktivitas",
      "Prosedur Kerja Aman & Izin Kerja (termasuk LOTO)",
      "Alat Pelindung Diri per Jenis Pekerjaan",
      "Prosedur Tanggap Darurat & Pertolongan Pertama",
      "Pelatihan, Sosialisasi & Inspeksi Berkala",
      "Pelaporan Insiden, Investigasi & Pembaruan Dokumen",
    ],
    tools: [
      {
        slug: "pk-bahaya",
        role: "PK-BAHAYA",
        name: "PK-BAHAYA — Pengidentifikasi Bahaya & Penilai Risiko",
        mission:
          "Susun identifikasi bahaya dan penilaian risiko per area/aktivitas: uraikan bahaya (listrik, mekanis, kimia, ergonomi), nilai tingkat risikonya, dan tetapkan pengendalian sesuai hierarki (eliminasi → APD) beserta APD wajib per pekerjaan; tandai aktivitas yang detailnya belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "pk-prosedur",
        role: "PK-PROSEDUR",
        name: "PK-PROSEDUR — Penyusun Prosedur Aman & Tanggap Darurat",
        mission:
          "Susun prosedur kerja aman yang bisa diikuti semua karyawan: langkah isolasi energi (LOTO), izin kerja khusus, jarak aman kelistrikan, prosedur tanggap darurat per skenario (sengatan, kebakaran, kecelakaan) dengan alur pelaporan dan kontak darurat, serta jadwal pelatihan dan drill berkala.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua aspek keselamatan personel dan peralatan tercakup: bahaya, prosedur, APD, tanggap darurat, pelatihan",
      "Kejelasan — bahasa ringkas dan mudah dipahami seluruh karyawan; prosedur bisa diikuti tanpa penafsiran ganda",
      "Kepatuhan Standar Industri — selaras regulasi dan standar keselamatan yang berlaku, memenuhi atau melampaui persyaratan minimum",
      "Kacamata Praktisi Ahli — kedalaman ahli keselamatan kelistrikan senior, bukan templat generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  // ── Batch 4 ( electrical-engineer lanjutan, engineering) ──────────
  {
    kind: "openclaw",
    slug: "analisis-efisiensi-energi-claw",
    name: "Analisis Efisiensi Energi Claw — Spesialis Dokumen Analisis Efisiensi Energi",
    tagline: "Wawancara → Audit Konsumsi → Peluang Penghematan → Rekomendasi → Evaluasi Rubrik",
    avatar: "💡",
    category: "engineering",
    docLabel: "Dokumen Analisis Efisiensi Energi (Energy Efficiency Analysis)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Efisiensi Energi berkualitas tinggi yang menganalisis dan mengidentifikasi peluang efisiensi energi beserta rekomendasi perbaikannya — untuk dipakai tim manajemen dan pemangku kepentingan mengambil keputusan inisiatif serta investasi efisiensi energi, dengan ukuran keberhasilan wawasan yang dapat ditindaklanjuti dan penghematan energi signifikan. Terapkan praktik audit energi terbaik: pemetaan profil konsumsi dan beban dasar (baseline), identifikasi pemborosan per sistem (penerangan, HVAC, motor, kompresor, trafo), kuantifikasi potensi penghematan dengan perhitungan yang dapat diverifikasi, analisis kelayakan investasi (payback, ROI), prioritisasi rekomendasi dari tanpa-biaya hingga investasi besar, serta acuan standar yang relevan (ISO 50001, SNI, regulasi konservasi energi Indonesia).",
    interviewTopics: [
      "fasilitas yang dianalisis (gedung, pabrik, area) & sistem energi utamanya",
      "data konsumsi yang tersedia (tagihan listrik, hasil pengukuran, jam operasi)",
      "peralatan pengguna energi terbesar & usianya",
      "target penghematan/anggaran investasi & kebijakan manajemen",
      "audit atau upaya efisiensi yang pernah dilakukan",
    ],
    structure: [
      "Ringkasan Eksekutif & Potensi Penghematan Total",
      "Profil Konsumsi Energi & Baseline",
      "Metodologi Analisis & Sumber Data",
      "Analisis per Sistem Pengguna Energi Utama",
      "Identifikasi Peluang Efisiensi & Kuantifikasi Penghematan",
      "Analisis Kelayakan Investasi (payback, ROI) per Rekomendasi",
      "Prioritisasi Rekomendasi & Peta Jalan Implementasi",
      "Rencana Pemantauan, Verifikasi & Keberlanjutan",
    ],
    tools: [
      {
        slug: "ee-audit",
        role: "EE-AUDIT",
        name: "EE-AUDIT — Analis Profil Konsumsi & Baseline",
        mission:
          "Olah data konsumsi energi pengguna menjadi profil yang bermakna: susun baseline konsumsi, rincian penggunaan per sistem dan per waktu, indikator intensitas energi, dan identifikasi anomali/pemborosan; tandai angka yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "ee-rekomendasi",
        role: "EE-REKOMENDASI",
        name: "EE-REKOMENDASI — Penyusun Rekomendasi & Kelayakan Investasi",
        mission:
          "Susun rekomendasi efisiensi yang dapat ditindaklanjuti: kuantifikasi penghematan per peluang dengan perhitungan transparan, estimasi biaya implementasi, payback dan ROI, prioritisasi dari quick-win hingga investasi besar, dan sajikan argumen yang meyakinkan bagi manajemen.",
      },
    ],
    evaluatorCriteria: [
      "Kedalaman Analisis — analisis konsumsi dan peluang efisiensi menyeluruh, akurat, dan berbasis data yang dapat diverifikasi",
      "Kepraktisan Rekomendasi — rekomendasi konkret, terkuantifikasi, dan realistis untuk diimplementasikan sesuai kondisi fasilitas",
      "Komunikasi & Daya Persuasi — penyajian jelas dan meyakinkan bagi manajemen untuk memutuskan investasi",
      "Kacamata Praktisi Ahli — kedalaman auditor energi senior, bukan daftar tips hemat listrik generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "permintaan-perubahan-claw",
    name: "Permintaan Perubahan Claw — Spesialis Dokumen Manajemen Permintaan Perubahan",
    tagline: "Wawancara → Alur & Format → Analisis Dampak → Dokumen → Evaluasi Rubrik",
    avatar: "🔁",
    category: "engineering",
    docLabel: "Dokumen Permintaan Perubahan (Change Requests Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Permintaan Perubahan yang menjamin pengelolaan permintaan perubahan proyek rekayasa berjalan efisien dan efektif — komprehensif, terorganisir baik, dan mudah dipahami — untuk dipakai tim proyek dan pemangku kepentingan melacak serta mengimplementasikan perubahan, dengan ukuran keberhasilan proses manajemen perubahan yang mulus dan keterlambatan proyek yang minimal. Terapkan praktik manajemen perubahan terbaik: formulir permintaan yang lengkap (deskripsi, justifikasi, urgensi), analisis dampak terhadap lingkup-biaya-jadwal-mutu-keselamatan, alur persetujuan berjenjang dengan wewenang yang jelas, register perubahan dengan status terkini, keterlacakan dari permintaan sampai implementasi dan verifikasi, serta pengendalian dokumen revisi terkait.",
    interviewTopics: [
      "proyek & jenis perubahan yang sering terjadi (desain, material, jadwal, lingkup)",
      "alur persetujuan yang berlaku & pemegang wewenang keputusan",
      "dampak yang wajib dianalisis (biaya, jadwal, mutu, keselamatan, kontrak)",
      "sistem pencatatan yang dipakai sekarang & masalahnya",
      "pemangku kepentingan yang harus diberi tahu setiap perubahan",
    ],
    structure: [
      "Tujuan, Lingkup & Definisi Perubahan",
      "Peran, Tanggung Jawab & Wewenang Persetujuan",
      "Formulir Permintaan Perubahan (format standar)",
      "Prosedur Pengajuan & Klasifikasi Urgensi",
      "Analisis Dampak (lingkup, biaya, jadwal, mutu, keselamatan)",
      "Alur Persetujuan & Kriteria Keputusan",
      "Register Perubahan & Pelacakan Status",
      "Implementasi, Verifikasi & Pemutakhiran Dokumen Terkait",
    ],
    tools: [
      {
        slug: "mc-alur",
        role: "MC-ALUR",
        name: "MC-ALUR — Perancang Alur & Format Perubahan",
        mission:
          "Rancang alur manajemen perubahan yang sesuai organisasi pengguna: format formulir permintaan yang lengkap, klasifikasi urgensi/kategori perubahan, jenjang persetujuan dengan wewenang per tingkat, dan struktur register pelacakan status; tandai kebijakan yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "mc-dampak",
        role: "MC-DAMPAK",
        name: "MC-DAMPAK — Analis Dampak Perubahan",
        mission:
          "Susun kerangka analisis dampak untuk setiap permintaan perubahan: pengaruh terhadap lingkup, biaya, jadwal, mutu, keselamatan, dan kontrak; identifikasi dokumen/gambar yang harus direvisi; dan rumuskan rekomendasi terima/tolak/tunda dengan justifikasi yang jelas bagi pemberi keputusan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — seluruh siklus perubahan tercakup: pengajuan, analisis dampak, persetujuan, implementasi, verifikasi",
      "Organisasi — dokumen terstruktur logis dengan alur, formulir, dan register yang saling terhubung rapi",
      "Kejelasan & Keterpahaman — tim proyek dan pemangku kepentingan dapat mengikuti proses tanpa penafsiran ganda",
      "Kacamata Praktisi Ahli — kedalaman pengendali proyek senior, bukan templat formulir kosong",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-uji-claw",
    name: "Rencana Uji Claw — Spesialis Dokumen Rencana Pengujian Sistem",
    tagline: "Wawancara → Cakupan Uji → Prosedur & Kriteria → Rencana Uji → Evaluasi Rubrik",
    avatar: "📋",
    category: "engineering",
    docLabel: "Dokumen Rencana Pengujian (Test Plans Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Rencana Pengujian yang menjamin pengujian dan validasi sistem kelistrikan dilakukan dengan benar — komprehensif, terorganisir, dan mudah dipahami — untuk dipakai tim rekayasa melakukan pengujian yang efisien dan akurat. Terapkan praktik perencanaan pengujian terbaik: cakupan uji yang lengkap per sistem dan tahap (uji pabrik/FAT, uji lokasi/SAT, komisioning), prosedur per item uji dengan langkah dan setelan yang jelas, kriteria keberterimaan terukur dari standar yang berlaku (SNI/IEC/SPLN/PUIL), kebutuhan alat ukur terkalibrasi dan personel kompeten, urutan serta prasyarat antar-uji, aspek keselamatan pengujian, dan format pencatatan hasil yang siap dipakai.",
    interviewTopics: [
      "sistem/peralatan yang akan diuji & tahap proyeknya (FAT, SAT, komisioning, rutin)",
      "standar acuan & kriteria keberterimaan yang berlaku",
      "alat ukur & personel penguji yang tersedia",
      "batasan jadwal & jendela pemadaman yang diizinkan",
      "pihak yang menyaksikan/menyetujui hasil uji",
    ],
    structure: [
      "Tujuan, Lingkup & Tahap Pengujian",
      "Standar Acuan & Kriteria Keberterimaan",
      "Organisasi Pengujian, Peran & Kompetensi Personel",
      "Daftar Item Uji per Sistem (matriks cakupan)",
      "Prosedur Uji per Item (langkah, setelan, prasyarat)",
      "Alat Ukur, Kalibrasi & Kebutuhan Sumber Daya",
      "Jadwal, Urutan Uji & Keselamatan Pengujian",
      "Format Pencatatan Hasil & Penanganan Kegagalan Uji",
    ],
    tools: [
      {
        slug: "ru-cakupan",
        role: "RU-CAKUPAN",
        name: "RU-CAKUPAN — Penyusun Matriks Cakupan Uji",
        mission:
          "Susun matriks cakupan pengujian yang lengkap dari data sistem pengguna: daftar item uji per peralatan/sistem dan per tahap (FAT/SAT/komisioning), pemetaan ke pasal standar acuan, prasyarat dan urutan antar-uji; tandai item yang datanya belum lengkap dengan [ASUMSI].",
      },
      {
        slug: "ru-prosedur",
        role: "RU-PROSEDUR",
        name: "RU-PROSEDUR — Penyusun Prosedur & Kriteria Uji",
        mission:
          "Rinci setiap item uji menjadi prosedur yang siap dieksekusi: langkah pengujian berurutan, setelan dan kondisi uji, alat ukur yang dipakai, kriteria lulus/gagal terukur dari standar, aspek keselamatan per uji, dan format pencatatan hasil beserta alur penanganan bila uji gagal.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — cakupan uji lengkap tanpa item terlewat dan prosedur cukup rinci untuk dieksekusi langsung",
      "Organisasi — rencana terstruktur logis: cakupan, prosedur, jadwal, dan pencatatan saling terhubung rapi",
      "Kepatuhan Standar Industri — item uji dan kriteria keberterimaan merujuk standar yang berlaku secara benar",
      "Kacamata Praktisi Ahli — kedalaman insinyur komisioning senior, bukan checklist generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "penilaian-risiko-claw",
    name: "Penilaian Risiko Claw — Spesialis Dokumen Penilaian Risiko Sistem Kelistrikan",
    tagline: "Wawancara → Identifikasi Risiko → Mitigasi & Kepatuhan → Dokumen → Evaluasi Rubrik",
    avatar: "⚠️",
    category: "engineering",
    docLabel: "Dokumen Penilaian Risiko (Risk Assessments Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Penilaian Risiko yang menjamin keselamatan dan kepatuhan sistem kelistrikan — komprehensif, akurat, dan mutakhir — untuk dipakai tim rekayasa dan pemangku kepentingan dalam desain, pemasangan, dan pemeliharaan sistem kelistrikan, dengan ukuran keberhasilan memandu pengambilan keputusan dan meminimalkan bahaya listrik. Terapkan praktik penilaian risiko terbaik: identifikasi bahaya sistematis per tahap siklus hidup sistem (sengatan, busur api/arc flash, kebakaran listrik, kegagalan peralatan, energi tersimpan), analisis kemungkinan dan keparahan dengan matriks risiko, pengendalian sesuai hierarki (eliminasi → substitusi → rekayasa → administratif → APD), risiko residu dan pemantauannya, serta kepatuhan pada standar dan regulasi yang relevan (PUIL, Permenaker, IEC/IEEE untuk arc flash).",
    interviewTopics: [
      "sistem kelistrikan yang dinilai & tahapnya (desain, pemasangan, operasi, pemeliharaan)",
      "insiden/near-miss listrik yang pernah terjadi",
      "standar & regulasi yang harus dipatuhi (PUIL, Permenaker, IEC/IEEE)",
      "matriks risiko/kebijakan penilaian yang dipakai organisasi",
      "pengendalian yang sudah ada & keterbatasannya",
    ],
    structure: [
      "Tujuan, Lingkup & Metodologi Penilaian",
      "Deskripsi Sistem & Batasan Penilaian",
      "Identifikasi Bahaya per Tahap Siklus Hidup",
      "Analisis Kemungkinan & Keparahan (matriks risiko)",
      "Evaluasi Risiko & Prioritisasi",
      "Pengendalian per Hierarki & Rencana Mitigasi",
      "Risiko Residu, Pemantauan & Jadwal Kaji Ulang",
      "Kepatuhan Standar/Regulasi & Rekomendasi Keputusan",
    ],
    tools: [
      {
        slug: "pr-identifikasi",
        role: "PR-IDENTIFIKASI",
        name: "PR-IDENTIFIKASI — Pengidentifikasi Bahaya & Analis Risiko",
        mission:
          "Susun identifikasi bahaya kelistrikan yang sistematis dari data pengguna: bahaya per komponen/aktivitas dan per tahap siklus hidup, skenario kejadian, lalu nilai kemungkinan dan keparahannya dalam matriks risiko organisasi; tandai penilaian yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "pr-mitigasi",
        role: "PR-MITIGASI",
        name: "PR-MITIGASI — Penyusun Mitigasi & Kepatuhan",
        mission:
          "Rumuskan pengendalian per risiko sesuai hierarki (eliminasi → APD) dengan penanggung jawab dan tenggat, hitung risiko residu pasca-pengendalian, petakan kepatuhan setiap pengendalian ke pasal standar/regulasi yang relevan, dan susun rekomendasi keputusan yang jelas bagi pemangku kepentingan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — analisis potensi risiko menyeluruh mencakup semua bahaya, tahap siklus hidup, dan skenario yang relevan",
      "Kejelasan — identifikasi risiko dan langkah mitigasi tersaji jelas hingga dapat langsung memandu keputusan",
      "Kepatuhan — penilaian dan pengendalian selaras standar serta regulasi kelistrikan yang berlaku",
      "Kacamata Praktisi Ahli — kedalaman penilai risiko kelistrikan senior, bukan tabel risiko generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kepatuhan-regulasi-claw",
    name: "Kepatuhan Regulasi Claw — Spesialis Dokumentasi Kepatuhan Regulasi",
    tagline: "Wawancara → Pemetaan Regulasi → Bukti Kepatuhan → Dokumentasi → Evaluasi Rubrik",
    avatar: "📜",
    category: "engineering",
    docLabel: "Dokumentasi Kepatuhan Regulasi (Regulatory Compliance Documentation)",
    mission:
      "Membantu pengguna menyusun Dokumentasi Kepatuhan Regulasi yang menjamin ketaatan pada semua regulasi dan standar yang relevan — komprehensif dan akurat, memuat seluruh informasi yang diperlukan — untuk dipakai badan regulator dan pemangku kepentingan internal memastikan kepatuhan, dengan ukuran keberhasilan lolos audit dan inspeksi regulator. Terapkan praktik dokumentasi kepatuhan terbaik: inventarisasi regulasi dan standar yang berlaku (untuk kelistrikan Indonesia antara lain PUIL/SNI, SLO, Permen ESDM, Permenaker K3 listrik, sertifikasi produk), pemetaan persyaratan ke kondisi aktual (matriks kepatuhan), bukti objektif per persyaratan (sertifikat, hasil uji, izin, rekaman), analisis kesenjangan beserta rencana tindak lanjut, penanggung jawab dan tenggat pemenuhan, serta mekanisme pemutakhiran saat regulasi berubah.",
    interviewTopics: [
      "kegiatan/instalasi yang harus patuh & lokasi operasinya",
      "regulasi & standar yang diketahui berlaku (SLO, PUIL, ESDM, Permenaker, lainnya)",
      "izin/sertifikat yang sudah dimiliki & masa berlakunya",
      "riwayat audit/inspeksi & temuan yang belum ditutup",
      "pihak internal penanggung jawab kepatuhan",
    ],
    structure: [
      "Ringkasan & Lingkup Kepatuhan",
      "Inventarisasi Regulasi & Standar yang Berlaku",
      "Matriks Kepatuhan (persyaratan → kondisi aktual → status)",
      "Bukti Objektif per Persyaratan (sertifikat, uji, izin, rekaman)",
      "Analisis Kesenjangan & Tingkat Risiko Ketidakpatuhan",
      "Rencana Tindak Lanjut (penanggung jawab, tenggat)",
      "Kesiapan Audit & Prosedur Menghadapi Inspeksi",
      "Mekanisme Pemantauan Perubahan Regulasi & Pemutakhiran",
    ],
    tools: [
      {
        slug: "kp-pemetaan",
        role: "KP-PEMETAAN",
        name: "KP-PEMETAAN — Pemeta Regulasi & Persyaratan",
        mission:
          "Susun inventarisasi regulasi dan matriks kepatuhan dari data pengguna: daftar regulasi/standar yang berlaku beserta pasal kuncinya, uraikan menjadi persyaratan konkret yang bisa diperiksa, dan petakan ke kondisi aktual organisasi dengan status patuh/belum; tandai regulasi yang perlu verifikasi hukum dengan [ASUMSI].",
      },
      {
        slug: "kp-bukti",
        role: "KP-BUKTI",
        name: "KP-BUKTI — Penyusun Bukti & Kesiapan Audit",
        mission:
          "Susun daftar bukti objektif per persyaratan (sertifikat, hasil uji, izin, rekaman) beserta lokasi penyimpanannya, identifikasi kesenjangan bukti dan rencana penutupannya dengan penanggung jawab dan tenggat, dan siapkan ringkasan kesiapan audit yang memudahkan inspeksi regulator.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — riset regulasi menyeluruh; semua regulasi dan standar relevan teridentifikasi dan terpetakan",
      "Perhatian pada Detail — setiap persyaratan punya status, bukti, dan tindak lanjut yang akurat tanpa celah",
      "Kejelasan Komunikasi — dokumentasi mudah diikuti auditor/regulator dan pemangku kepentingan internal",
      "Kacamata Praktisi Ahli — kedalaman spesialis kepatuhan senior, bukan salinan daftar peraturan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-insiden-claw",
    name: "Laporan Insiden Claw — Spesialis Dokumen Pelaporan Insiden",
    tagline: "Wawancara → Format Pelaporan → Analisis & Tindakan Korektif → Dokumen → Evaluasi Rubrik",
    avatar: "🚨",
    category: "engineering",
    docLabel: "Dokumen Laporan Insiden (Incident Reports Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Laporan Insiden yang meningkatkan keselamatan dan manajemen risiko organisasi — komprehensif, akurat, dan mudah dipahami — untuk dipakai seluruh karyawan dan manajemen melaporkan serta mendokumentasikan insiden atau kecelakaan kerja, dengan ukuran keberhasilan memudahkan analisis insiden, pelacakan tren, dan mendukung tindakan korektif. Terapkan praktik pelaporan insiden terbaik: format pelaporan yang mudah diisi semua level karyawan, klasifikasi insiden (kecelakaan, near-miss, kondisi tidak aman), pelaporan tepat waktu dengan alur eskalasi jelas, kronologi dan bukti yang objektif, analisis akar masalah (root cause analysis, mis. 5-Why/fishbone), tindakan korektif-preventif (CAPA) dengan penanggung jawab dan verifikasi efektivitas, register insiden untuk analisis tren, serta kepatuhan pelaporan wajib ke regulator (Permenaker) bila insiden memenuhi kriteria.",
    interviewTopics: [
      "jenis operasi & insiden yang mungkin terjadi (kelistrikan, mekanis, umum)",
      "alur pelaporan yang berjalan sekarang & kendalanya",
      "regulasi pelaporan yang berlaku (Permenaker, kebijakan internal)",
      "metode analisis akar masalah yang dipakai organisasi",
      "kebutuhan pelacakan tren & pelaporan ke manajemen",
    ],
    structure: [
      "Tujuan, Lingkup & Definisi/Klasifikasi Insiden",
      "Alur Pelaporan & Batas Waktu (termasuk eskalasi)",
      "Formulir Laporan Insiden (format standar)",
      "Investigasi & Pengumpulan Bukti",
      "Analisis Akar Masalah (metode & panduan)",
      "Tindakan Korektif-Preventif & Verifikasi Efektivitas",
      "Register Insiden & Analisis Tren",
      "Pelaporan Wajib ke Regulator & Kaji Ulang Berkala",
    ],
    tools: [
      {
        slug: "li-format",
        role: "LI-FORMAT",
        name: "LI-FORMAT — Perancang Format & Alur Pelaporan",
        mission:
          "Rancang format dan alur pelaporan insiden yang mudah dipakai semua karyawan: formulir dengan kolom yang lengkap namun ringkas, klasifikasi insiden dan tingkat keparahan, batas waktu pelaporan per klasifikasi, dan alur eskalasi hingga manajemen; tandai kebijakan yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "li-analisis",
        role: "LI-ANALISIS",
        name: "LI-ANALISIS — Penyusun Analisis Akar Masalah & CAPA",
        mission:
          "Susun panduan investigasi dan analisis akar masalah (5-Why/fishbone) yang bisa diikuti tim non-spesialis, kerangka tindakan korektif-preventif dengan penanggung jawab, tenggat, dan verifikasi efektivitas, serta struktur register insiden yang mendukung pelacakan tren dan laporan berkala ke manajemen.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — seluruh siklus tercakup: pelaporan, investigasi, analisis akar masalah, CAPA, register tren",
      "Kejelasan — bahasa dan format mudah dipahami seluruh karyawan sehingga pelaporan tepat waktu terjadi",
      "Kegunaan — dokumen efektif memfasilitasi analisis insiden, pelacakan tren, dan tindakan korektif nyata",
      "Kacamata Praktisi Ahli — kedalaman investigator K3 senior, bukan formulir kosong tanpa panduan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "evaluasi-vendor-claw",
    name: "Evaluasi Vendor Claw — Spesialis Dokumen Evaluasi Vendor",
    tagline: "Wawancara → Kriteria & Bobot → Analisis Objektif → Dokumen Evaluasi → Evaluasi Rubrik",
    avatar: "🤝",
    category: "engineering",
    docLabel: "Dokumen Evaluasi Vendor (Vendor Evaluations Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Evaluasi Vendor yang menyajikan evaluasi komprehensif calon vendor — memandu proses pengambilan keputusan secara efektif dan memfasilitasi pemilihan vendor yang tepat — untuk dipakai tim pengadaan membuat keputusan kemitraan vendor berbasis informasi, dengan ukuran keberhasilan gambaran yang jelas atas kapabilitas dan kesesuaian vendor terhadap kebutuhan organisasi. Terapkan praktik evaluasi vendor terbaik: kriteria evaluasi yang relevan dan terbobot (teknis, kualitas, harga, pengalaman, kapasitas, layanan purna jual, kepatuhan legal/sertifikasi), metode penilaian objektif dengan skala terdefinisi, verifikasi informasi (referensi, kunjungan, dokumen legal), perbandingan antar-vendor yang setara (apple-to-apple), analisis risiko per vendor, dan rekomendasi yang tertelusur ke bukti penilaian.",
    interviewTopics: [
      "barang/jasa yang diadakan & kebutuhan teknis utamanya",
      "calon vendor yang dievaluasi & informasi yang sudah terkumpul",
      "kriteria yang paling penting bagi organisasi (harga, kualitas, layanan, kepatuhan)",
      "kebijakan pengadaan internal & persyaratan legal vendor (NIB, sertifikasi)",
      "pengalaman buruk dengan vendor sebelumnya yang ingin dihindari",
    ],
    structure: [
      "Tujuan Evaluasi & Kebutuhan Pengadaan",
      "Metodologi & Kriteria Evaluasi Terbobot",
      "Profil Calon Vendor (legalitas, pengalaman, kapasitas)",
      "Penilaian per Kriteria dengan Skala Terdefinisi",
      "Verifikasi (referensi, dokumen, kunjungan/uji sampel)",
      "Matriks Perbandingan Antar-Vendor",
      "Analisis Risiko per Vendor & Mitigasinya",
      "Rekomendasi Pemilihan & Justifikasi Berbasis Bukti",
    ],
    tools: [
      {
        slug: "ev-kriteria",
        role: "EV-KRITERIA",
        name: "EV-KRITERIA — Perancang Kriteria & Metode Penilaian",
        mission:
          "Susun kerangka evaluasi yang objektif dari kebutuhan pengguna: kriteria evaluasi yang relevan dengan bobot yang dapat dipertanggungjawabkan, skala penilaian terdefinisi per kriteria, dan daftar informasi/dokumen yang wajib diverifikasi per vendor; tandai bobot yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "ev-analisis",
        role: "EV-ANALISIS",
        name: "EV-ANALISIS — Analis Perbandingan & Rekomendasi",
        mission:
          "Olah data penilaian menjadi perbandingan antar-vendor yang setara: matriks skor terbobot, analisis kekuatan-kelemahan dan risiko per vendor beserta mitigasinya, dan rumuskan rekomendasi pemilihan yang objektif dengan justifikasi tertelusur ke bukti penilaian — bukan preferensi subjektif.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Evaluasi — semua aspek kapabilitas vendor dinilai menyeluruh dengan kriteria yang relevan",
      "Akurasi Informasi — data vendor terverifikasi dan penilaian didukung bukti, bukan klaim sepihak",
      "Objektivitas Analisis — perbandingan setara dan bebas bias; rekomendasi tertelusur ke skor dan bukti",
      "Kacamata Praktisi Ahli — kedalaman spesialis pengadaan teknik senior, bukan tabel skor kosmetik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  // ── Batch 5 ( mechanical-engineer, engineering) ───────────────────
  {
    kind: "openclaw",
    slug: "gambar-teknik-claw",
    name: "Gambar Teknik Claw — Spesialis Dokumen Gambar Teknik",
    tagline: "Wawancara → Standar & Detail → Anotasi & Toleransi → Paket Gambar → Evaluasi Rubrik",
    avatar: "📐",
    category: "engineering",
    docLabel: "Gambar Teknik (Engineering Drawings)",
    mission:
      "Membantu pengguna menyusun paket Gambar Teknik yang menggambarkan desain dan spesifikasi komponen serta sistem mekanikal secara akurat — terperinci dan presisi untuk keperluan manufaktur, perakitan, dan kendali mutu — untuk dipakai tim produksi, teknisi perakitan, dan inspektur QC menjamin produksi dan perakitan bebas kesalahan. Terapkan praktik gambar teknik terbaik: proyeksi dan tata letak sesuai standar (ISO/SNI atau ASME Y14.5 sesuai konteks), dimensi dan toleransi lengkap termasuk GD&T bila relevan, penandaan material, kekasaran permukaan, dan perlakuan khusus, daftar bagian (BoM gambar) dan penomoran yang konsisten, catatan manufaktur yang jelas, serta kontrol revisi yang tertib.",
    interviewTopics: [
      "komponen/sistem yang digambar & fungsi utamanya",
      "standar gambar yang dipakai (ISO/SNI, ASME) & konvensi perusahaan",
      "proses manufaktur yang dituju (machining, casting, sheet metal, welding)",
      "toleransi kritis & fit yang harus dijaga",
      "pengguna gambar & keperluan (produksi, perakitan, inspeksi)",
    ],
    structure: [
      "Daftar Gambar & Struktur Penomoran",
      "Konvensi Standar (proyeksi, satuan, simbol)",
      "Gambar Susunan (assembly) & Daftar Bagian",
      "Gambar Detail per Komponen (dimensi lengkap)",
      "Toleransi & GD&T (datum, fit kritis)",
      "Spesifikasi Material, Permukaan & Perlakuan",
      "Catatan Manufaktur & Inspeksi",
      "Blok Judul, Persetujuan & Kontrol Revisi",
    ],
    tools: [
      {
        slug: "gt-detail",
        role: "GT-DETAIL",
        name: "GT-DETAIL — Perinci Dimensi & Anotasi",
        mission:
          "Uraikan desain pengguna menjadi konten gambar siap gambar: daftar pandangan yang dibutuhkan per komponen, dimensi lengkap dengan basis fungsional, toleransi dan GD&T pada fitur kritis, penandaan material dan permukaan; tandai dimensi yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "gt-standar",
        role: "GT-STANDAR",
        name: "GT-STANDAR — Pemeriksa Kepatuhan Standar Gambar",
        mission:
          "Periksa paket gambar terhadap standar yang dipilih: proyeksi, simbol, dan format sesuai ISO/SNI/ASME; penomoran, daftar bagian, dan referensi silang konsisten; catatan manufaktur tidak ambigu; dan susun daftar ketidaksesuaian yang harus dikoreksi sebelum gambar dirilis ke produksi.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Standar & Regulasi — proyeksi, simbol, toleransi, dan format mengikuti standar industri yang dipilih",
      "Perhatian pada Detail — dimensi, toleransi, material, dan catatan lengkap tanpa ambiguitas yang memicu kesalahan produksi",
      "Komunikasi Lintas Fungsi — gambar mudah dipahami tim produksi, perakitan, dan QC tanpa klarifikasi bolak-balik",
      "Kacamata Praktisi Ahli — kedalaman drafter/insinyur mekanikal senior, bukan sketsa dangkal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pemilihan-komponen-claw",
    name: "Pemilihan Komponen Claw — Spesialis Laporan Pemilihan Komponen",
    tagline: "Wawancara → Kriteria & Kandidat → Analisis & Data Dukung → Laporan → Evaluasi Rubrik",
    avatar: "⚙️",
    category: "engineering",
    docLabel: "Laporan Pemilihan Komponen (Component Selection Report)",
    mission:
      "Membantu pengguna menyusun Laporan Pemilihan Komponen dengan rekomendasi tingkat ahli — menjamin pemilihan komponen akurat dan efisien, mengurangi risiko kegagalan, dan mengoptimalkan kinerja sistem — laporan berkualitas tinggi dengan analisis komprehensif, rekomendasi terperinci, dan data pendukung, untuk dipakai tim proyek dan pemangku kepentingan mengambil keputusan. Terapkan praktik pemilihan komponen terbaik: definisi persyaratan fungsi dan lingkungan operasi, kriteria pemilihan terbobot (kinerja, keandalan, umur, ketersediaan, biaya siklus hidup, dukungan purna jual), perbandingan kandidat berbasis datasheet dan standar, analisis margin keamanan dan derating, kompatibilitas antarmuka, dan rekomendasi yang tertelusur ke data.",
    interviewTopics: [
      "sistem & fungsi komponen yang dipilih (bantalan, motor, pompa, katup, fastener, dll.)",
      "kondisi operasi (beban, kecepatan, suhu, lingkungan, siklus kerja)",
      "kriteria terpenting (kinerja, umur, harga, ketersediaan lokal)",
      "kandidat/merek yang sudah dipertimbangkan & datasheet yang ada",
      "batasan integrasi (dimensi, antarmuka, standar perusahaan)",
    ],
    structure: [
      "Ringkasan & Rekomendasi Utama",
      "Persyaratan Fungsi & Kondisi Operasi",
      "Kriteria Pemilihan Terbobot",
      "Identifikasi Kandidat Komponen",
      "Analisis Perbandingan (kinerja, keandalan, biaya)",
      "Perhitungan Margin Keamanan & Derating",
      "Kompatibilitas Antarmuka & Ketersediaan Pasokan",
      "Rekomendasi Akhir & Data Pendukung",
    ],
    tools: [
      {
        slug: "ko-kriteria",
        role: "KO-KRITERIA",
        name: "KO-KRITERIA — Perumus Persyaratan & Kriteria",
        mission:
          "Terjemahkan kebutuhan sistem pengguna menjadi persyaratan komponen yang terukur: fungsi, beban dan kondisi operasi, umur rencana, batasan dimensi/antarmuka, lalu susun kriteria pemilihan terbobot yang dapat dipertanggungjawabkan; tandai parameter operasi yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "ko-analisis",
        role: "KO-ANALISIS",
        name: "KO-ANALISIS — Analis Perbandingan & Margin",
        mission:
          "Bandingkan kandidat komponen secara setara: skor per kriteria berbasis data teknis, perhitungan margin keamanan dan derating terhadap kondisi operasi, analisis risiko kegagalan dan ketersediaan pasokan, dan rumuskan rekomendasi yang tertelusur ke data — bukan preferensi merek.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Riset — kandidat dan data teknis digali menyeluruh dari sumber yang kredibel",
      "Kualitas Analisis & Rekomendasi — perbandingan objektif, margin dihitung, rekomendasi mengurangi risiko kegagalan dan mengoptimalkan kinerja",
      "Komunikasi Efektif — laporan tersaji jelas hingga tim proyek dan pemangku kepentingan dapat langsung memutuskan",
      "Kacamata Praktisi Ahli — kedalaman insinyur mekanikal senior, bukan katalog vendor",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "validasi-desain-claw",
    name: "Validasi Desain Claw — Spesialis Laporan Validasi Desain",
    tagline: "Wawancara → Rencana Validasi → Analisis Temuan → Laporan → Evaluasi Rubrik",
    avatar: "✅",
    category: "engineering",
    docLabel: "Laporan Validasi Desain (Design Validation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Validasi Desain yang menjamin keandalan dan fungsionalitas desain — komprehensif, akurat, dan terdokumentasi baik — untuk dipakai tim rekayasa dan pemangku kepentingan memvalidasi desain serta mengambil keputusan pengembangan lanjutan, dengan ukuran keberhasilan wawasan yang dapat ditindaklanjuti dan perbaikan desain. Terapkan praktik validasi desain terbaik: keterlacakan persyaratan ke metode validasi (matriks verifikasi-validasi), kombinasi metode yang tepat (uji fisik, analisis, inspeksi, demonstrasi), kondisi uji yang merepresentasikan penggunaan nyata termasuk kasus terburuk, kriteria terima/tolak terukur, dokumentasi penyimpangan dan tindak lanjut, serta kesimpulan kelulusan per persyaratan sesuai standar industri.",
    interviewTopics: [
      "produk/desain yang divalidasi & persyaratan utamanya",
      "tahap pengembangan & keputusan yang menunggu hasil validasi",
      "metode validasi yang tersedia (uji fisik, analisis, prototipe)",
      "standar & regulasi yang menjadi acuan kelulusan",
      "hasil uji/analisis yang sudah ada",
    ],
    structure: [
      "Ringkasan Eksekutif & Status Kelulusan",
      "Deskripsi Desain & Persyaratan yang Divalidasi",
      "Matriks Keterlacakan Persyaratan → Metode Validasi",
      "Rencana & Kondisi Validasi (termasuk kasus terburuk)",
      "Hasil per Item Validasi vs Kriteria Terima",
      "Analisis Penyimpangan & Kegagalan",
      "Tindak Lanjut Perbaikan Desain",
      "Kesimpulan, Rekomendasi & Lampiran Data",
    ],
    tools: [
      {
        slug: "vd-rencana",
        role: "VD-RENCANA",
        name: "VD-RENCANA — Penyusun Matriks & Rencana Validasi",
        mission:
          "Susun matriks keterlacakan persyaratan → metode validasi dari data pengguna: pilih metode yang tepat per persyaratan (uji/analisis/inspeksi/demonstrasi), definisikan kondisi validasi termasuk kasus terburuk, dan tetapkan kriteria terima/tolak terukur; tandai persyaratan yang belum jelas dengan [ASUMSI].",
      },
      {
        slug: "vd-temuan",
        role: "VD-TEMUAN",
        name: "VD-TEMUAN — Analis Temuan & Kesimpulan",
        mission:
          "Olah hasil validasi menjadi kesimpulan yang dapat ditindaklanjuti: bandingkan hasil vs kriteria per item, analisis penyimpangan dan akar penyebab kegagalan, rumuskan tindak lanjut perbaikan desain dengan prioritas, dan susun pernyataan kelulusan per persyaratan yang jelas bagi pengambil keputusan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Analisis — semua persyaratan tervalidasi dengan metode dan kondisi yang tepat, termasuk kasus terburuk",
      "Kepatuhan Standar Industri — metode dan kriteria kelulusan merujuk standar yang berlaku secara benar",
      "Kejelasan Komunikasi — temuan dan status kelulusan tersaji jelas hingga langsung memandu keputusan pengembangan",
      "Kacamata Praktisi Ahli — kedalaman insinyur validasi senior, bukan rekap uji seadanya",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kinerja-produk-claw",
    name: "Kinerja Produk Claw — Spesialis Laporan Kinerja Produk",
    tagline: "Wawancara → Data & Metrik → Kekuatan-Kelemahan → Rekomendasi Optimasi → Evaluasi Rubrik",
    avatar: "📈",
    category: "engineering",
    docLabel: "Laporan Kinerja Produk (Product Performance Report)",
    mission:
      "Membantu pengguna menyusun Laporan Kinerja Produk yang menyajikan analisis dan evaluasi kinerja produk secara terperinci — menunjukkan kekuatan dan kelemahan produk, mengidentifikasi area perbaikan, dan memberi rekomendasi optimasi — untuk dipakai tim pengembangan produk dan manajemen mengambil keputusan peningkatan produk dan iterasi berikutnya. Terapkan praktik evaluasi kinerja terbaik: definisi metrik kinerja yang relevan dengan fungsi produk, analisis data yang akurat dengan metode statistik yang tepat, perbandingan terhadap spesifikasi, target, dan kompetitor bila ada, identifikasi tren dan pola kegagalan dari data lapangan, penyajian visual yang jelas, dan rekomendasi yang diprioritaskan berdasarkan dampak-usaha.",
    interviewTopics: [
      "produk yang dievaluasi & fungsi utamanya",
      "metrik kinerja yang penting (efisiensi, keandalan, umur, kepuasan pengguna)",
      "data yang tersedia (uji lab, data lapangan, keluhan, garansi)",
      "target/spesifikasi pembanding & produk kompetitor",
      "keputusan yang akan diambil dari laporan ini",
    ],
    structure: [
      "Ringkasan Eksekutif & Skor Kinerja Keseluruhan",
      "Deskripsi Produk & Metrik Evaluasi",
      "Metodologi & Sumber Data",
      "Analisis Kinerja per Metrik vs Target",
      "Kekuatan Produk (didukung data)",
      "Kelemahan & Pola Masalah (termasuk data lapangan)",
      "Rekomendasi Optimasi Terprioritas (dampak vs usaha)",
      "Peta Jalan Perbaikan untuk Iterasi Berikutnya",
    ],
    tools: [
      {
        slug: "kj-data",
        role: "KJ-DATA",
        name: "KJ-DATA — Analis Data Kinerja",
        mission:
          "Olah data kinerja pengguna secara akurat: bersihkan dan strukturkan data, hitung metrik dengan metode statistik yang tepat, bandingkan terhadap spesifikasi/target, identifikasi tren dan pola kegagalan, dan siapkan deskripsi visualisasi yang jelas; tandai data yang tidak lengkap dengan [ASUMSI].",
      },
      {
        slug: "kj-rekomendasi",
        role: "KJ-REKOMENDASI",
        name: "KJ-REKOMENDASI — Penyusun Rekomendasi Optimasi",
        mission:
          "Terjemahkan temuan analisis menjadi rekomendasi yang dapat dieksekusi: identifikasi akar penyebab kelemahan kinerja, usulkan perbaikan konkret per temuan dengan estimasi dampak dan usaha, prioritaskan dalam matriks dampak-usaha, dan rangkai peta jalan perbaikan untuk iterasi produk berikutnya.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Analisis Data — pengolahan data benar secara metodologis dan kesimpulan didukung angka",
      "Kejelasan Penyajian — struktur, narasi, dan visual memudahkan manajemen memahami kondisi kinerja dengan cepat",
      "Rekomendasi yang Dapat Ditindaklanjuti — usulan konkret, terprioritas, dan terhubung langsung ke temuan",
      "Kacamata Praktisi Ahli — kedalaman insinyur produk senior, bukan rekap angka tanpa makna",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-kegagalan-claw",
    name: "Analisis Kegagalan Claw — Spesialis Laporan Analisis Kegagalan",
    tagline: "Wawancara → Investigasi & Bukti → Akar Penyebab → Rekomendasi → Evaluasi Rubrik",
    avatar: "🔍",
    category: "engineering",
    docLabel: "Laporan Analisis Kegagalan (Failure Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Kegagalan yang mengidentifikasi penyebab kegagalan sistem mekanikal dan memberi rekomendasi perbaikan — komprehensif, akurat, dan terdokumentasi baik — untuk dipakai manajer proyek, insinyur desain, dan personel kendali mutu memahami serta mengatasi kegagalan. Terapkan metodologi analisis kegagalan terbaik: pengumpulan bukti dan kronologi yang objektif, karakterisasi mode kegagalan (fatik, korosi, aus, patah getas/ulet, creep), analisis akar penyebab sistematis (fault tree, 5-Why, fishbone), pembedaan penyebab langsung vs akar penyebab (desain, material, manufaktur, operasi, perawatan), verifikasi hipotesis terhadap bukti, dan rekomendasi korektif-preventif yang mencegah keberulangan.",
    interviewTopics: [
      "komponen/sistem yang gagal & kronologi kejadiannya",
      "bukti yang tersedia (foto patahan, data operasi, riwayat perawatan, hasil lab)",
      "kondisi operasi saat kegagalan vs kondisi desain",
      "riwayat kegagalan serupa sebelumnya",
      "dampak kegagalan & urgensi tindakan korektif",
    ],
    structure: [
      "Ringkasan Eksekutif & Akar Penyebab Utama",
      "Deskripsi Kegagalan & Kronologi Kejadian",
      "Bukti & Data yang Dikumpulkan",
      "Karakterisasi Mode Kegagalan",
      "Analisis Akar Penyebab (metode & alur logika)",
      "Verifikasi Hipotesis terhadap Bukti",
      "Rekomendasi Korektif & Preventif Terprioritas",
      "Pelajaran untuk Desain/Operasi & Lampiran",
    ],
    tools: [
      {
        slug: "ak-investigasi",
        role: "AK-INVESTIGASI",
        name: "AK-INVESTIGASI — Investigator Bukti & Mode Kegagalan",
        mission:
          "Strukturkan investigasi dari data pengguna: susun kronologi objektif, inventarisasi bukti, karakterisasi mode kegagalan dari ciri-ciri yang dilaporkan (pola patahan, deformasi, korosi), dan identifikasi data tambahan yang perlu dikumpulkan; tandai interpretasi yang butuh uji lab dengan [ASUMSI].",
      },
      {
        slug: "ak-akar",
        role: "AK-AKAR",
        name: "AK-AKAR — Analis Akar Penyebab & Rekomendasi",
        mission:
          "Bangun analisis akar penyebab yang sistematis: susun pohon penyebab/5-Why dari mode kegagalan sampai akar (desain, material, manufaktur, operasi, perawatan), verifikasi tiap hipotesis terhadap bukti, dan rumuskan rekomendasi korektif-preventif terprioritas yang mencegah keberulangan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Analisis — investigasi menyeluruh dari bukti sampai akar penyebab dengan logika yang dapat diikuti",
      "Kejelasan Rekomendasi — tindakan korektif dan preventif konkret, terprioritas, dan terhubung ke akar penyebab",
      "Kualitas Dokumentasi — bukti, analisis, dan kesimpulan terdokumentasi rapi hingga kredibel bagi semua pihak",
      "Kacamata Praktisi Ahli — kedalaman analis kegagalan senior, bukan tebakan penyebab tanpa verifikasi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proses-manufaktur-claw",
    name: "Proses Manufaktur Claw — Spesialis Dokumen Rencana Proses Manufaktur",
    tagline: "Wawancara → Urutan Proses → Instruksi & Parameter → Dokumen → Evaluasi Rubrik",
    avatar: "🏭",
    category: "engineering",
    docLabel: "Dokumen Rencana Proses Manufaktur (Manufacturing Process Plans)",
    mission:
      "Membantu pengguna menyusun Dokumen Rencana Proses Manufaktur yang merampingkan proses produksi serta menjamin efisiensi dan akurasi — komprehensif dengan instruksi terperinci, diagram, dan spesifikasi per langkah proses — untuk dipakai tim produksi memandu operasi dan menjaga konsistensi manufaktur, dengan ukuran keberhasilan efisiensi produksi meningkat, kesalahan berkurang, dan kualitas produk naik. Terapkan praktik perencanaan proses terbaik: urutan operasi yang logis (routing) dengan waktu siklus, pemilihan mesin/perkakas/fixture per operasi, parameter proses yang terukur, instruksi kerja langkah-demi-langkah yang bisa diikuti operator, titik kendali mutu dalam proses (in-process inspection), penanganan material dan keselamatan kerja, serta kepatuhan pada standar industri.",
    interviewTopics: [
      "produk/komponen yang diproduksi & volume produksinya",
      "proses yang terlibat (machining, welding, forming, assembly, finishing)",
      "mesin, perkakas & kapasitas yang tersedia",
      "titik kritis kualitas & toleransi yang harus dijaga",
      "masalah produksi yang selama ini terjadi",
    ],
    structure: [
      "Ringkasan Rencana & Lingkup Produksi",
      "Urutan Operasi / Routing (dengan waktu siklus)",
      "Mesin, Perkakas & Fixture per Operasi",
      "Parameter Proses per Operasi (terukur)",
      "Instruksi Kerja Langkah-demi-Langkah",
      "Titik Kendali Mutu Dalam-Proses & Kriteria",
      "Penanganan Material & Keselamatan Kerja",
      "Diagram Alir Proses & Kontrol Revisi",
    ],
    tools: [
      {
        slug: "mf-urutan",
        role: "MF-URUTAN",
        name: "MF-URUTAN — Perencana Urutan & Sumber Daya",
        mission:
          "Susun routing produksi yang efisien dari data produk pengguna: urutan operasi yang logis dengan estimasi waktu siklus, pemilihan mesin/perkakas/fixture per operasi sesuai kapasitas yang ada, dan identifikasi bottleneck; tandai estimasi waktu yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "mf-instruksi",
        role: "MF-INSTRUKSI",
        name: "MF-INSTRUKSI — Penyusun Instruksi Kerja & Kendali Mutu",
        mission:
          "Rinci setiap operasi menjadi instruksi kerja yang bisa diikuti operator: langkah berurutan dengan parameter proses terukur, deskripsi diagram/sketsa pendukung, titik inspeksi dalam-proses dengan kriteria terima, aspek keselamatan per langkah, dan penanganan ketidaksesuaian di lini produksi.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Instruksi — operator dapat mengikuti instruksi kerja tanpa penafsiran ganda atau klarifikasi tambahan",
      "Kerincian Diagram & Spesifikasi — routing, parameter, dan diagram cukup detail untuk menjaga konsistensi produksi",
      "Kepatuhan Standar Industri — proses dan kendali mutu selaras standar manufaktur yang berlaku",
      "Kacamata Praktisi Ahli — kedalaman insinyur proses senior, bukan daftar langkah dangkal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "prosedur-uji-claw",
    name: "Prosedur Uji Claw — Spesialis Dokumen Prosedur Pengujian Mekanikal",
    tagline: "Wawancara → Langkah Uji → Kriteria & Pencatatan → Dokumen → Evaluasi Rubrik",
    avatar: "🔬",
    category: "engineering",
    docLabel: "Dokumen Prosedur Pengujian (Test Procedures Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Prosedur Pengujian yang menjamin pengujian sistem mekanikal akurat dan andal — komprehensif, jelas, dan mudah diikuti — untuk dipakai tim penguji melaksanakan prosedur pengujian dengan benar dan efisien. Terapkan praktik prosedur pengujian terbaik: tujuan dan lingkup tiap uji yang jelas, prasyarat dan persiapan (kalibrasi alat, kondisi lingkungan, keselamatan), langkah pengujian berurutan yang dapat direproduksi siapa pun, parameter yang diukur dengan akurasi yang disyaratkan, kriteria terima/tolak terukur dari standar yang berlaku (SNI/ISO/ASTM), format pencatatan hasil yang konsisten, dan penanganan anomali selama pengujian.",
    interviewTopics: [
      "sistem/komponen mekanikal yang diuji & tujuan pengujiannya",
      "jenis uji yang dibutuhkan (dimensi, kekuatan, kebocoran, getaran, endurance)",
      "standar acuan (SNI, ISO, ASTM) & kriteria keberterimaan",
      "alat uji & fasilitas yang tersedia (termasuk status kalibrasi)",
      "kompetensi tim penguji & format pencatatan yang dipakai",
    ],
    structure: [
      "Tujuan, Lingkup & Daftar Prosedur Uji",
      "Standar Acuan & Kriteria Keberterimaan",
      "Prasyarat: Alat, Kalibrasi, Kondisi & Keselamatan",
      "Prosedur per Uji (langkah berurutan, setelan)",
      "Parameter Terukur & Akurasi yang Disyaratkan",
      "Format Pencatatan Hasil & Lembar Data",
      "Penanganan Anomali & Kegagalan Uji",
      "Persetujuan, Distribusi & Kontrol Revisi",
    ],
    tools: [
      {
        slug: "pu-langkah",
        role: "PU-LANGKAH",
        name: "PU-LANGKAH — Perinci Langkah & Prasyarat Uji",
        mission:
          "Rinci setiap pengujian menjadi langkah yang dapat direproduksi: prasyarat dan persiapan (alat terkalibrasi, kondisi lingkungan, keselamatan), urutan langkah dengan setelan spesifik, dan titik pengamatan per langkah; tandai setelan yang belum dikonfirmasi dengan [ASUMSI].",
      },
      {
        slug: "pu-kriteria",
        role: "PU-KRITERIA",
        name: "PU-KRITERIA — Penyusun Kriteria & Pencatatan",
        mission:
          "Tetapkan kriteria terima/tolak terukur per parameter uji dengan rujukan pasal standar, rancang lembar data pencatatan hasil yang konsisten dan mudah diisi, dan susun alur penanganan anomali/kegagalan uji termasuk kapan pengujian harus dihentikan demi keselamatan.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan & Organisasi — prosedur terstruktur logis dan mudah diikuti tim penguji tanpa kebingungan",
      "Akurasi & Kelengkapan — langkah, parameter, dan prasyarat lengkap hingga hasil uji dapat direproduksi",
      "Kepatuhan Standar Industri — metode dan kriteria merujuk standar yang berlaku secara benar",
      "Kacamata Praktisi Ahli — kedalaman insinyur pengujian mekanikal senior, bukan checklist dangkal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pemilihan-material-claw",
    name: "Pemilihan Material Claw — Spesialis Laporan Pemilihan Material",
    tagline: "Wawancara → Kandidat Material → Analisis Sifat & Biaya → Laporan → Evaluasi Rubrik",
    avatar: "🧱",
    category: "engineering",
    docLabel: "Laporan Pemilihan Material (Material Selection Report)",
    mission:
      "Membantu pengguna menyusun Laporan Pemilihan Material yang komprehensif dengan analisis akurat dan rekomendasi pemilihan material — untuk dipakai tim proyek dan pemangku kepentingan mengambil keputusan material yang paling sesuai untuk proyek. Terapkan metodologi pemilihan material terbaik: penerjemahan fungsi menjadi persyaratan sifat material (mekanik, termal, kimia, manufakturabilitas), penyaringan kandidat sistematis (indeks material ala Ashby bila relevan), perbandingan sifat dari sumber data kredibel dan standar material (SNI/ASTM/JIS/DIN), analisis lingkungan operasi (korosi, suhu, keausan), pertimbangan biaya siklus hidup dan ketersediaan lokal, serta rekomendasi dengan justifikasi tertelusur ke data sifat.",
    interviewTopics: [
      "komponen & fungsi yang butuh material (beban, umur rencana)",
      "lingkungan operasi (suhu, korosif, aus, luar ruang)",
      "proses manufaktur yang direncanakan (machining, casting, welding, 3D print)",
      "batasan biaya & preferensi ketersediaan lokal",
      "material yang dipakai sekarang & masalahnya (bila penggantian)",
    ],
    structure: [
      "Ringkasan & Rekomendasi Material Utama",
      "Persyaratan Fungsi & Terjemahan ke Sifat Material",
      "Metodologi Penyaringan & Sumber Data",
      "Kandidat Material & Standar Acuannya",
      "Perbandingan Sifat (mekanik, termal, kimia)",
      "Analisis Lingkungan Operasi & Degradasi",
      "Manufakturabilitas & Biaya Siklus Hidup",
      "Rekomendasi Akhir, Alternatif & Data Pendukung",
    ],
    tools: [
      {
        slug: "ml-kandidat",
        role: "ML-KANDIDAT",
        name: "ML-KANDIDAT — Penyaring Kandidat Material",
        mission:
          "Terjemahkan fungsi komponen menjadi persyaratan sifat material yang terukur, lalu saring kandidat secara sistematis: keluarga material yang layak, grade spesifik dengan standar acuannya (SNI/ASTM/JIS/DIN), dan alasan lolos/gugur per kandidat; tandai persyaratan yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "ml-analisis",
        role: "ML-ANALISIS",
        name: "ML-ANALISIS — Analis Perbandingan Sifat & Biaya",
        mission:
          "Bandingkan kandidat material secara setara: tabel sifat kunci dari data kredibel, kesesuaian terhadap lingkungan operasi (korosi, suhu, aus), manufakturabilitas dengan proses yang direncanakan, biaya siklus hidup dan ketersediaan lokal, dan rumuskan rekomendasi dengan justifikasi tertelusur ke data.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Riset — kandidat dan data sifat digali menyeluruh dari standar dan sumber kredibel",
      "Ketajaman Analisis — perbandingan sistematis mempertimbangkan sifat, lingkungan, manufakturabilitas, dan biaya",
      "Kejelasan Rekomendasi — pilihan material dan alternatifnya tersaji jelas dengan justifikasi berbasis data",
      "Kacamata Praktisi Ahli — kedalaman insinyur material senior, bukan tabel sifat tanpa konteks",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-elemen-hingga-claw",
    name: "Analisis Elemen Hingga Claw — Spesialis Laporan Finite Element Analysis",
    tagline: "Wawancara → Model & Kondisi Batas → Interpretasi Hasil → Laporan FEA → Evaluasi Rubrik",
    avatar: "🕸️",
    category: "engineering",
    docLabel: "Laporan Analisis Elemen Hingga (Finite Element Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Elemen Hingga (FEA) yang menyajikan analisis dan evaluasi struktur serta komponen mekanikal secara terperinci — simulasi akurat, temuan detail, dan rekomendasi perbaikan desain — untuk dipakai manajer proyek, tim desain, dan pemangku kepentingan menilai integritas struktur dan kinerja sistem. Terapkan praktik FEA terbaik: idealisasi model yang tepat (geometri, material, kontak), kondisi batas dan pembebanan yang merepresentasikan kondisi nyata, studi konvergensi mesh, verifikasi terhadap perhitungan tangan/kasus acuan, interpretasi hasil terhadap kriteria kegagalan yang tepat (von Mises, fatik, buckling), margin keamanan terhadap standar, dokumentasi batasan analisis, dan rekomendasi desain yang tertelusur ke hasil simulasi.",
    interviewTopics: [
      "struktur/komponen yang dianalisis & pertanyaan desain yang harus dijawab",
      "jenis analisis (statik, fatik, buckling, dinamik, termal-struktural)",
      "pembebanan & kondisi batas aktual (gaya, tekanan, tumpuan)",
      "material & datanya; perangkat FEA yang dipakai",
      "hasil simulasi yang sudah ada & kriteria keberterimaan/standar acuan",
    ],
    structure: [
      "Ringkasan Eksekutif & Kesimpulan Kelayakan",
      "Deskripsi Masalah & Tujuan Analisis",
      "Model: Geometri, Material & Idealisasi",
      "Kondisi Batas, Pembebanan & Kasus Analisis",
      "Mesh & Studi Konvergensi",
      "Verifikasi Model (perhitungan tangan/kasus acuan)",
      "Hasil & Interpretasi vs Kriteria Kegagalan (margin keamanan)",
      "Batasan Analisis, Rekomendasi Desain & Lampiran",
    ],
    tools: [
      {
        slug: "fe-model",
        role: "FE-MODEL",
        name: "FE-MODEL — Perancang Model & Kondisi Batas",
        mission:
          "Susun strategi pemodelan FEA dari masalah pengguna: idealisasi geometri yang tepat, data material, kondisi batas dan pembebanan yang merepresentasikan kondisi nyata, rencana mesh dan studi konvergensi, dan verifikasi awal dengan perhitungan tangan; tandai beban/tumpuan yang belum pasti dengan [ASUMSI].",
      },
      {
        slug: "fe-hasil",
        role: "FE-HASIL",
        name: "FE-HASIL — Interpretator Hasil & Rekomendasi",
        mission:
          "Interpretasikan hasil simulasi terhadap kriteria kegagalan yang tepat: tegangan vs kekuatan material dengan margin keamanan, area kritis dan sensitivitasnya, kewajaran hasil vs verifikasi, batasan analisis yang jujur, dan rekomendasi perbaikan desain yang tertelusur ke hasil — bukan sekadar gambar kontur.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Analisis — pemodelan, kondisi batas, dan kasus analisis mencakup semua skenario kritis",
      "Akurasi Simulasi — model terverifikasi (konvergensi mesh, perhitungan pembanding) hingga hasil dapat dipercaya",
      "Kejelasan Rekomendasi — temuan dan rekomendasi desain tersaji jelas dengan margin keamanan terukur",
      "Kacamata Praktisi Ahli — kedalaman analis FEA senior, bukan tampilan kontur tanpa interpretasi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "presentasi-desain-claw",
    name: "Presentasi Desain Claw — Spesialis Presentasi Tinjauan Desain",
    tagline: "Wawancara → Konsep & Fungsi → Alur Diskusi & Keputusan → Presentasi → Evaluasi Rubrik",
    avatar: "🖥️",
    category: "engineering",
    docLabel: "Presentasi Tinjauan Desain (Design Review Presentation)",
    mission:
      "Membantu pengguna menyusun Presentasi Tinjauan Desain yang menyoroti aspek dan pertimbangan kunci desain — memberi pemahaman jelas atas konsep desain, fungsionalitasnya, serta potensi perbaikan dan tantangannya — untuk dipakai tim proyek, pemangku kepentingan, dan klien menilai kelayakan dan efektivitas desain, dengan ukuran keberhasilan detail desain tersampaikan dan diskusi serta pengambilan keputusan berjalan bermakna. Terapkan praktik tinjauan desain terbaik: kerangka tinjauan yang sistematis (persyaratan → konsep → analisis → status), penyajian keputusan desain beserta alternatif yang dipertimbangkan dan alasannya, status pemenuhan persyaratan yang jujur (termasuk isu terbuka dan risiko), visual teknis yang tepat, daftar item yang butuh keputusan forum, dan antisipasi pertanyaan penelaah.",
    interviewTopics: [
      "desain yang ditinjau & tahap tinjauannya (konsep, awal/PDR, kritis/CDR)",
      "persyaratan kunci & status pemenuhannya saat ini",
      "keputusan desain penting & alternatif yang sempat dipertimbangkan",
      "isu terbuka, risiko & item yang butuh keputusan forum",
      "audiens tinjauan (internal, klien, penelaah eksternal) & durasi",
    ],
    structure: [
      "Pembuka: Tujuan Tinjauan & Keputusan yang Dibutuhkan",
      "Persyaratan & Kriteria Desain",
      "Konsep Desain & Fungsionalitas Utama",
      "Keputusan Desain Kunci & Alternatif yang Dipertimbangkan",
      "Status Analisis & Verifikasi (dengan data)",
      "Isu Terbuka, Risiko & Rencana Mitigasi",
      "Item Keputusan Forum & Rekomendasi Tim",
      "Ringkasan, Langkah Berikutnya & Slide Cadangan Teknis",
    ],
    tools: [
      {
        slug: "pd-konsep",
        role: "PD-KONSEP",
        name: "PD-KONSEP — Penyusun Narasi Konsep & Fungsi",
        mission:
          "Susun narasi desain yang mudah dipahami audiens tinjauan: konsep dan cara kerja desain, keputusan kunci beserta alternatif dan alasan pemilihannya, status pemenuhan persyaratan dengan data pendukung, dan deskripsi visual teknis per slide; tandai status yang belum terverifikasi dengan [ASUMSI].",
      },
      {
        slug: "pd-forum",
        role: "PD-FORUM",
        name: "PD-FORUM — Perancang Diskusi & Keputusan Forum",
        mission:
          "Rancang bagian presentasi yang menggerakkan keputusan: sajikan isu terbuka dan risiko secara jujur dengan opsi penyelesaiannya, rumuskan item keputusan forum dengan rekomendasi tim, antisipasi pertanyaan penelaah beserta jawaban dan slide cadangannya, dan susun urutan diskusi yang efisien.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Konsep Desain — audiens memahami konsep, cara kerja, dan batasan desain dengan cepat",
      "Kedalaman Penjelasan Fungsi — fungsionalitas dan keputusan desain dijelaskan dengan data, bukan klaim",
      "Fasilitasi Diskusi & Keputusan — isu terbuka dan item keputusan tersaji hingga forum menghasilkan keputusan nyata",
      "Kacamata Praktisi Ahli — kedalaman insinyur desain senior, bukan pajangan gambar 3D",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-perpindahan-panas-claw",
    name: "Analisis Perpindahan Panas Claw — Spesialis Laporan Analisis Perpindahan Panas",
    tagline: "Wawancara → Perhitungan Termal → Optimasi Sistem → Laporan → Evaluasi Rubrik",
    avatar: "🌡️",
    category: "engineering",
    docLabel: "Laporan Analisis Perpindahan Panas (Heat Transfer Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Perpindahan Panas yang menyajikan analisis terperinci dan rekomendasi optimasi perpindahan panas dalam sistem — komprehensif, akurat, dan terstruktur baik hingga pengguna memahami proses termal yang terlibat dan dapat memutuskan perbaikan efisiensi sistem — untuk dipakai manajer proyek, insinyur desain, dan pemangku kepentingan memandu desain dan implementasi sistem termal. Terapkan praktik analisis termal terbaik: identifikasi moda perpindahan panas dominan (konduksi, konveksi, radiasi), perhitungan dengan korelasi yang tepat dan properti material yang benar, neraca energi yang konsisten, analisis jaringan tahanan termal, evaluasi opsi perbaikan (isolasi, sirip, pendinginan, material), kuantifikasi dampak per opsi, dan penyajian yang menjembatani konsep kompleks ke keputusan praktis.",
    interviewTopics: [
      "sistem termal yang dianalisis (penukar panas, elektronik, tungku, HVAC, mesin)",
      "masalah yang dirasakan (overheat, boros energi, distribusi tidak merata)",
      "data operasi (suhu, laju alir, daya, geometri, material)",
      "batasan perbaikan (ruang, biaya, downtime)",
      "target kinerja termal yang diinginkan",
    ],
    structure: [
      "Ringkasan Eksekutif & Temuan Kunci",
      "Deskripsi Sistem & Kondisi Operasi",
      "Metodologi & Properti Material yang Dipakai",
      "Identifikasi Moda Perpindahan Panas Dominan",
      "Perhitungan & Neraca Energi (jaringan tahanan termal)",
      "Analisis Masalah Termal Saat Ini",
      "Opsi Optimasi & Kuantifikasi Dampaknya",
      "Rekomendasi Terprioritas & Implementasi",
    ],
    tools: [
      {
        slug: "hp-hitung",
        role: "HP-HITUNG",
        name: "HP-HITUNG — Analis Perhitungan Termal",
        mission:
          "Bangun perhitungan perpindahan panas yang dapat diverifikasi dari data pengguna: identifikasi moda dominan, pilih korelasi yang tepat dengan justifikasi, susun jaringan tahanan termal dan neraca energi yang konsisten, dan sajikan langkah perhitungan transparan; tandai properti/kondisi yang diperkirakan dengan [ASUMSI].",
      },
      {
        slug: "hp-optimasi",
        role: "HP-OPTIMASI",
        name: "HP-OPTIMASI — Penyusun Opsi Optimasi Termal",
        mission:
          "Evaluasi opsi perbaikan kinerja termal secara kuantitatif: bandingkan opsi (isolasi, sirip, pendinginan paksa, penggantian material) dengan dampak suhu/energi terhitung per opsi, estimasi biaya-manfaat dan kompleksitas implementasi, dan prioritaskan rekomendasi sesuai batasan pengguna.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan & Organisasi — laporan terstruktur logis dan konsep termal kompleks tersaji mudah dipahami",
      "Akurasi Teknis — korelasi, properti, dan neraca energi benar hingga hasil perhitungan dapat dipercaya",
      "Relevansi Praktis — rekomendasi terkuantifikasi, realistis, dan langsung menaikkan efisiensi sistem",
      "Kacamata Praktisi Ahli — kedalaman insinyur termal senior, bukan teori buku tanpa angka sistem nyata",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-toleransi-claw",
    name: "Analisis Toleransi Claw — Spesialis Laporan Analisis Toleransi",
    tagline: "Wawancara → Stack-Up & Variasi → Rekomendasi Perbaikan → Laporan → Evaluasi Rubrik",
    avatar: "🎯",
    category: "engineering",
    docLabel: "Laporan Analisis Toleransi (Tolerance Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Toleransi yang menjamin pengukuran akurat dan presisi dalam proses manufaktur — komprehensif dan terperinci, mengidentifikasi sumber variasi potensial dan memberi rekomendasi peningkatan kualitas produk — untuk dipakai tim manufaktur dan personel kendali mutu mengoptimalkan proses produksi dan mengurangi cacat, dengan ukuran keberhasilan memandu perbaikan proses dan meminimalkan variabilitas dimensi. Terapkan praktik analisis toleransi terbaik: identifikasi rantai dimensi (stack-up) pada fit dan fungsi kritis, metode worst-case dan statistik (RSS) dengan pemilihan yang tepat, kontribusi variasi per komponen dan per proses, kaitan toleransi dengan kapabilitas proses (Cp/Cpk), evaluasi GD&T yang dipakai, keseimbangan antara ketat-toleransi dan biaya manufaktur, serta rekomendasi realokasi toleransi atau perbaikan proses yang terukur.",
    interviewTopics: [
      "rakitan/fit kritis yang dianalisis & masalah yang terjadi (macet, longgar, bocor, cacat)",
      "gambar & toleransi yang berlaku sekarang (termasuk GD&T)",
      "data pengukuran/kapabilitas proses yang tersedia (Cp/Cpk)",
      "proses manufaktur per komponen & kemampuannya",
      "target kualitas & batasan biaya perubahan",
    ],
    structure: [
      "Ringkasan Eksekutif & Temuan Kritis",
      "Definisi Fit/Fungsi Kritis & Persyaratannya",
      "Rantai Dimensi (stack-up) per Fit Kritis",
      "Analisis Worst-Case & Statistik (RSS)",
      "Kontribusi Variasi per Komponen & Proses",
      "Evaluasi Kapabilitas Proses vs Toleransi (Cp/Cpk)",
      "Rekomendasi Realokasi Toleransi & Perbaikan Proses",
      "Dampak Biaya-Kualitas & Rencana Implementasi",
    ],
    tools: [
      {
        slug: "tl-stackup",
        role: "TL-STACKUP",
        name: "TL-STACKUP — Analis Rantai Dimensi",
        mission:
          "Bangun analisis stack-up dari data gambar pengguna: definisikan rantai dimensi per fit kritis dengan arah dan kontributornya, hitung hasil worst-case dan RSS dengan langkah transparan, dan identifikasi kontributor variasi terbesar; tandai dimensi/toleransi yang belum jelas dengan [ASUMSI].",
      },
      {
        slug: "tl-perbaikan",
        role: "TL-PERBAIKAN",
        name: "TL-PERBAIKAN — Penyusun Rekomendasi Toleransi & Proses",
        mission:
          "Rumuskan perbaikan yang seimbang antara kualitas dan biaya: realokasi toleransi pada kontributor dominan, penyesuaian GD&T bila lebih tepat, perbaikan proses untuk menaikkan kapabilitas (Cp/Cpk), dan kuantifikasi dampak tiap rekomendasi terhadap tingkat cacat dan biaya manufaktur.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Analisis — rantai dimensi lengkap, metode tepat, dan sumber variasi teridentifikasi menyeluruh",
      "Kejelasan Rekomendasi — usulan realokasi toleransi dan perbaikan proses konkret dengan dampak terukur",
      "Kepraktisan Solusi — rekomendasi dapat dieksekusi tim manufaktur dan QC sesuai kapabilitas proses nyata",
      "Kacamata Praktisi Ahli — kedalaman insinyur presisi senior, bukan hitungan stack-up tanpa konteks proses",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "risiko-desain-claw",
    name: "Risiko Desain Claw — Spesialis Dokumen Penilaian Risiko Desain",
    tagline: "Wawancara → Identifikasi Risiko Desain → Mitigasi Praktis → Dokumen → Evaluasi Rubrik",
    avatar: "🧯",
    category: "engineering",
    docLabel: "Dokumen Penilaian Risiko Desain (Design Risk Assessments)",
    mission:
      "Membantu pengguna menyusun Dokumen Penilaian Risiko Desain yang menjamin keselamatan dan keandalan desain — teliti, akurat, dan komprehensif — untuk dipakai manajer proyek, tim desain, dan pemangku kepentingan mengidentifikasi risiko potensial, mengevaluasi dampaknya, dan menerapkan mitigasi yang tepat, dengan ukuran keberhasilan keputusan yang terinformasi, cacat desain minimal, dan keselamatan proyek meningkat. Terapkan praktik penilaian risiko desain terbaik: identifikasi mode kegagalan sistematis per fungsi/komponen (pendekatan DFMEA), penilaian keparahan-kejadian-deteksi dengan skala terdefinisi, prioritisasi berdasarkan tingkat risiko, mitigasi lewat perubahan desain lebih dulu sebelum kontrol proses, penilaian ulang risiko residu pasca-mitigasi, dan keterlacakan setiap risiko sampai status tertutup.",
    interviewTopics: [
      "desain/produk yang dinilai & fungsi kritisnya",
      "tahap desain saat ini & kebebasan mengubah desain",
      "riwayat kegagalan produk serupa/generasi sebelumnya",
      "standar keselamatan yang berlaku & konsekuensi kegagalan terburuk",
      "skala penilaian risiko yang dipakai organisasi (bila ada)",
    ],
    structure: [
      "Tujuan, Lingkup & Metodologi Penilaian",
      "Deskripsi Desain & Fungsi Kritis",
      "Identifikasi Mode Kegagalan per Fungsi/Komponen",
      "Analisis Efek & Penyebab Kegagalan",
      "Penilaian Keparahan-Kejadian-Deteksi (skala terdefinisi)",
      "Prioritisasi Risiko & Ambang Tindakan",
      "Rencana Mitigasi (desain dulu, lalu kontrol) & Penanggung Jawab",
      "Risiko Residu, Verifikasi Efektivitas & Status Penutupan",
    ],
    tools: [
      {
        slug: "rd-mode",
        role: "RD-MODE",
        name: "RD-MODE — Pengidentifikasi Mode Kegagalan",
        mission:
          "Susun identifikasi mode kegagalan sistematis dari desain pengguna: uraikan fungsi per komponen/antarmuka, mode kegagalan potensial beserta efek dan penyebabnya (pendekatan DFMEA), dan nilai keparahan-kejadian-deteksi dengan skala terdefinisi; tandai penilaian yang berbasis perkiraan dengan [ASUMSI].",
      },
      {
        slug: "rd-mitigasi",
        role: "RD-MITIGASI",
        name: "RD-MITIGASI — Penyusun Mitigasi & Risiko Residu",
        mission:
          "Rumuskan mitigasi yang praktis per risiko prioritas: utamakan perubahan desain sebelum kontrol proses/inspeksi, tetapkan penanggung jawab dan tenggat, nilai ulang risiko residu pasca-mitigasi, dan susun daftar tindak lanjut sampai status tertutup yang mudah dilacak tim proyek.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Dokumen — struktur dan bahasa mudah diikuti tim desain dan pemangku kepentingan non-spesialis",
      "Efektivitas Identifikasi Risiko — mode kegagalan tergali menyeluruh per fungsi termasuk skenario terburuk",
      "Kepraktisan Strategi Mitigasi — mitigasi realistis, mengutamakan perbaikan desain, dengan dampak terukur",
      "Kacamata Praktisi Ahli — kedalaman fasilitator DFMEA senior, bukan tabel risiko formalitas",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perintah-perubahan-claw",
    name: "Perintah Perubahan Claw — Spesialis Dokumen Engineering Change Orders",
    tagline: "Wawancara → Format ECO → Implementasi & Pelacakan → Dokumen → Evaluasi Rubrik",
    avatar: "📝",
    category: "engineering",
    docLabel: "Dokumen Perintah Perubahan Teknik (Engineering Change Orders)",
    mission:
      "Membantu pengguna menyusun Dokumen Perintah Perubahan Teknik (ECO) yang merampingkan proses perubahan desain dan spesifikasi rekayasa — komprehensif dan akurat menangkap semua informasi yang diperlukan untuk implementasi perubahan — untuk dipakai tim rekayasa dan manajer proyek mengkomunikasikan serta mengimplementasikan perubahan desain secara efektif dan tepat waktu. Terapkan praktik ECO terbaik: identitas perubahan yang jelas (nomor, kelas urgensi, produk terdampak), deskripsi kondisi lama vs baru dengan justifikasi, daftar lengkap dokumen/gambar/BoM yang terdampak beserta revisinya, disposisi stok dan barang dalam proses (use-as-is, rework, scrap), efektivitas pemberlakuan (tanggal/serial), persetujuan berjenjang, dan verifikasi implementasi sampai tertutup.",
    interviewTopics: [
      "produk & perubahan yang diproses (desain, material, proses, dokumen)",
      "alasan perubahan (perbaikan masalah, permintaan pelanggan, penghematan, keusangan)",
      "dokumen/gambar/BoM yang terdampak & sistem pengelolaannya (PLM/manual)",
      "kebijakan disposisi stok & barang dalam proses",
      "alur persetujuan & pihak yang harus diberi tahu",
    ],
    structure: [
      "Identitas ECO (nomor, kelas, produk terdampak)",
      "Deskripsi Perubahan: Kondisi Lama vs Baru",
      "Justifikasi & Analisis Dampak (biaya, jadwal, kualitas)",
      "Daftar Dokumen/Gambar/BoM Terdampak & Revisi Baru",
      "Disposisi Stok & Barang Dalam Proses",
      "Efektivitas Pemberlakuan (tanggal/serial/lot)",
      "Alur Persetujuan & Notifikasi Pihak Terkait",
      "Verifikasi Implementasi & Penutupan ECO",
    ],
    tools: [
      {
        slug: "ec-format",
        role: "EC-FORMAT",
        name: "EC-FORMAT — Penyusun Format & Substansi ECO",
        mission:
          "Susun ECO yang lengkap dari data pengguna: identitas dan klasifikasi perubahan, deskripsi lama-vs-baru yang presisi, justifikasi dengan analisis dampak, dan daftar lengkap dokumen/gambar/BoM terdampak beserta revisi barunya; tandai dampak yang belum dianalisis dengan [ASUMSI].",
      },
      {
        slug: "ec-implementasi",
        role: "EC-IMPLEMENTASI",
        name: "EC-IMPLEMENTASI — Perancang Implementasi & Pelacakan",
        mission:
          "Rancang bagian implementasi ECO yang eksekutabel: disposisi stok dan barang dalam proses dengan kriteria jelas, efektivitas pemberlakuan (tanggal/serial/lot), alur persetujuan dan notifikasi ke semua pihak terdampak, dan checklist verifikasi implementasi sampai ECO tertutup.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua informasi implementasi tercakup: perubahan, dampak, dokumen terdampak, disposisi, efektivitas",
      "Kejelasan — kondisi lama vs baru dan instruksi implementasi tidak menimbulkan penafsiran ganda",
      "Keramahan Pengguna — format mudah diisi pengaju dan mudah diproses penyetuju serta pelaksana",
      "Kacamata Praktisi Ahli — kedalaman pengendali konfigurasi senior, bukan memo perubahan informal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-cfd-claw",
    name: "Analisis CFD Claw — Spesialis Laporan Computational Fluid Dynamics",
    tagline: "Wawancara → Setup Simulasi → Interpretasi Aliran → Laporan CFD → Evaluasi Rubrik",
    avatar: "🌀",
    category: "engineering",
    docLabel: "Laporan Analisis CFD (Computational Fluid Dynamics Report)",
    mission:
      "Membantu pengguna menyusun Laporan Computational Fluid Dynamics (CFD) dengan analisis dan wawasan tingkat ahli atas perilaku aliran fluida — membantu optimasi desain dan peningkatan kinerja dalam berbagai aplikasi rekayasa — untuk dipakai manajer proyek, tim desain, dan pemangku kepentingan mengambil keputusan, memuat informasi menyeluruh tentang perilaku fluida (kecepatan, tekanan, suhu, turbulensi, dan parameter relevan lainnya). Terapkan praktik CFD terbaik: definisi domain dan kondisi batas yang merepresentasikan fisika nyata, pemilihan model turbulensi dengan justifikasi, studi independensi mesh, kriteria konvergensi yang dilaporkan jujur, validasi terhadap data eksperimen/korelasi bila tersedia, interpretasi medan aliran yang menjawab pertanyaan desain, kuantifikasi parameter kinerja (pressure drop, koefisien, distribusi), batasan simulasi yang transparan, dan rekomendasi desain tertelusur ke hasil.",
    interviewTopics: [
      "sistem aliran yang dianalisis (saluran, penukar panas, aerodinamika, mixing, pompa/fan)",
      "pertanyaan desain yang harus dijawab (pressure drop, distribusi, hot-spot, gaya)",
      "fluida & kondisi operasi (laju alir, tekanan, suhu)",
      "perangkat CFD yang dipakai & hasil simulasi yang sudah ada",
      "data eksperimen/lapangan untuk validasi (bila ada)",
    ],
    structure: [
      "Ringkasan Eksekutif & Jawaban atas Pertanyaan Desain",
      "Deskripsi Masalah & Tujuan Simulasi",
      "Domain, Geometri & Kondisi Batas",
      "Model Fisika (turbulensi, dll.) & Justifikasinya",
      "Mesh & Studi Independensi",
      "Konvergensi & Validasi",
      "Hasil: Medan Aliran & Parameter Kinerja Terkuantifikasi",
      "Batasan Simulasi, Rekomendasi Desain & Lampiran",
    ],
    tools: [
      {
        slug: "cf-setup",
        role: "CF-SETUP",
        name: "CF-SETUP — Perancang Setup Simulasi",
        mission:
          "Susun strategi simulasi CFD dari masalah pengguna: domain dan kondisi batas yang merepresentasikan fisika nyata, pemilihan model turbulensi dan fisika lain dengan justifikasi, rencana mesh dan studi independensi, serta kriteria konvergensi; tandai kondisi operasi yang diperkirakan dengan [ASUMSI].",
      },
      {
        slug: "cf-hasil",
        role: "CF-HASIL",
        name: "CF-HASIL — Interpretator Medan Aliran & Rekomendasi",
        mission:
          "Interpretasikan hasil CFD menjadi jawaban desain: analisis medan kecepatan/tekanan/suhu/turbulensi pada area kritis, kuantifikasi parameter kinerja (pressure drop, koefisien, keseragaman distribusi), kewajaran hasil vs validasi, batasan simulasi yang jujur, dan rekomendasi perbaikan desain tertelusur ke hasil.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Teknis — setup simulasi benar (kondisi batas, model turbulensi, mesh, konvergensi) hingga hasil kredibel",
      "Kedalaman Analisis — perilaku aliran dianalisis menyeluruh pada semua parameter relevan dan area kritis",
      "Rekomendasi yang Dapat Ditindaklanjuti — wawasan simulasi diterjemahkan menjadi perbaikan desain konkret",
      "Kacamata Praktisi Ahli — kedalaman analis CFD senior, bukan galeri gambar kontur warna-warni",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 6: real-estate-developer (property) ──
  {
    kind: "openclaw",
    slug: "proposal-akuisisi-lahan-claw",
    name: "Akuisisi Lahan Claw — Spesialis Proposal Akuisisi Lahan",
    tagline: "Wawancara → Analisis Lokasi → Kelayakan Finansial → Proposal → Evaluasi Rubrik",
    avatar: "🗺️",
    category: "property",
    docLabel: "Proposal Akuisisi Lahan (Land Acquisition Proposal)",
    mission:
      "Membantu pengguna menyusun Proposal Akuisisi Lahan yang mengidentifikasi dan merekomendasikan properti potensial untuk diakuisisi sesuai sasaran strategis perusahaan — memuat analisis menyeluruh kesesuaian tiap properti, potensi pasar, dan kelayakan finansial — untuk dipakai manajemen senior mengambil keputusan akuisisi. Terapkan praktik terbaik: riset lokasi berbasis data (aksesibilitas, tata ruang/RTRW & RDTR, infrastruktur, demografi), verifikasi legalitas tanah (SHM/HGB, girik, sengketa, PBB), analisis pasar komparatif (harga tanah per m², tren kawasan), kelayakan finansial dengan asumsi eksplisit (harga perolehan, biaya BPHTB/notaris, proyeksi nilai), analisis risiko akuisisi, perbandingan antar-kandidat dalam matriks skoring, dan rekomendasi berperingkat yang tertelusur ke data.",
    interviewTopics: [
      "sasaran strategis perusahaan & jenis pengembangan yang direncanakan (perumahan, komersial, mixed-use)",
      "kandidat lahan yang sedang dipertimbangkan (lokasi, luas, status legal, harga penawaran)",
      "anggaran akuisisi & sumber pendanaan",
      "data pasar kawasan yang sudah dimiliki (harga pembanding, rencana infrastruktur)",
      "kriteria keputusan manajemen (IRR minimum, payback, toleransi risiko)",
    ],
    structure: [
      "Ringkasan Eksekutif & Rekomendasi Berperingkat",
      "Sasaran Strategis & Kriteria Akuisisi",
      "Profil Kandidat Lahan (lokasi, luas, legalitas, harga)",
      "Analisis Kesesuaian Tata Ruang & Perizinan (RTRW/RDTR, KDB/KLB)",
      "Analisis Pasar & Potensi Kawasan",
      "Kelayakan Finansial per Kandidat (biaya perolehan, proyeksi nilai, IRR)",
      "Matriks Perbandingan & Analisis Risiko",
      "Rekomendasi, Langkah Lanjut & Lampiran",
    ],
    tools: [
      {
        slug: "pa-riset",
        role: "PA-RISET",
        name: "PA-RISET — Analis Lokasi & Legalitas",
        mission:
          "Susun analisis kesesuaian tiap kandidat lahan: kesesuaian tata ruang (RTRW/RDTR, KDB/KLB), status legal tanah dan risiko sengketa, aksesibilitas dan infrastruktur, serta potensi pasar kawasan berbasis data pembanding; tandai data pasar yang diperkirakan dengan [ASUMSI].",
      },
      {
        slug: "pa-finansial",
        role: "PA-FINANSIAL",
        name: "PA-FINANSIAL — Analis Kelayakan Finansial",
        mission:
          "Hitung kelayakan finansial tiap kandidat: total biaya perolehan (harga tanah, BPHTB, notaris/PPAT, pematangan), proyeksi nilai pengembangan, indikator kelayakan (IRR, payback), sensitivitas terhadap asumsi kunci, dan matriks skoring antar-kandidat; setiap angka asumsi ditandai [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Riset Akurat & Menyeluruh — analisis lokasi, legalitas, dan pasar berbasis data dengan sumber jelas",
      "Analisis Finansial Kuat — kelayakan dihitung lengkap dengan asumsi eksplisit dan sensitivitas",
      "Komunikasi Temuan Efektif — rekomendasi berperingkat jelas dan mudah dipakai manajemen memutuskan",
      "Kacamata Praktisi Ahli — kedalaman pengembang properti senior, bukan brosur pemasaran lahan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-tapak-claw",
    name: "Rencana Tapak Claw — Spesialis Site Plan",
    tagline: "Wawancara → Analisis Tapak → Tata Letak → Dokumen Site Plan → Evaluasi Rubrik",
    avatar: "📍",
    category: "property",
    docLabel: "Rencana Tapak (Site Plan)",
    mission:
      "Membantu pengguna menyusun dokumen Rencana Tapak (Site Plan) yang memaksimalkan potensi properti dan memastikan pemanfaatan lahan yang efisien — komprehensif dan jelas, memuat lokasi bangunan, area parkir, lanskap, dan infrastruktur — untuk dipakai arsitek, kontraktor, dan pemangku kepentingan memandu pembangunan. Terapkan praktik terbaik: kepatuhan pada aturan tata ruang setempat (KDB, KLB, GSB, KDH), analisis kondisi tapak (kontur, drainase, orientasi matahari, akses), zonasi fungsi yang logis, sirkulasi kendaraan dan pejalan kaki yang aman, perhitungan kebutuhan parkir sesuai standar, jaringan utilitas (air bersih, air kotor, listrik, hidran), ruang terbuka hijau sesuai ketentuan, dan tabel rekapitulasi pemanfaatan lahan yang akurat.",
    interviewTopics: [
      "properti yang direncanakan (lokasi, luas lahan, bentuk, kondisi eksisting)",
      "jenis pengembangan & program ruang (jumlah unit, fungsi bangunan, fasilitas)",
      "ketentuan tata ruang setempat (KDB, KLB, GSB, KDH) yang berlaku",
      "kondisi tapak (kontur, drainase, akses jalan, utilitas tersedia)",
      "preferensi tata letak & fasilitas yang diinginkan",
    ],
    structure: [
      "Ringkasan Rencana & Rekapitulasi Pemanfaatan Lahan",
      "Analisis Kondisi Tapak & Konteks Kawasan",
      "Ketentuan Tata Ruang & Kepatuhan (KDB/KLB/GSB/KDH)",
      "Konsep Zonasi & Tata Letak Bangunan",
      "Sirkulasi, Akses & Perhitungan Parkir",
      "Lanskap & Ruang Terbuka Hijau",
      "Jaringan Infrastruktur & Utilitas",
      "Tahapan Pengembangan & Lampiran",
    ],
    tools: [
      {
        slug: "rt-tapak",
        role: "RT-TAPAK",
        name: "RT-TAPAK — Analis Tapak & Regulasi",
        mission:
          "Susun analisis tapak dan kepatuhan regulasi: kondisi eksisting (kontur, drainase, akses, utilitas), ketentuan tata ruang yang mengikat (KDB, KLB, GSB, KDH), batasan dan peluang tapak, serta perhitungan luas maksimal yang boleh dibangun; tandai ketentuan yang belum diverifikasi ke dinas terkait dengan [ASUMSI].",
      },
      {
        slug: "rt-layout",
        role: "RT-LAYOUT",
        name: "RT-LAYOUT — Perancang Tata Letak & Infrastruktur",
        mission:
          "Susun konsep tata letak: zonasi fungsi, penempatan bangunan dengan orientasi optimal, sirkulasi kendaraan/pejalan kaki, kebutuhan parkir sesuai standar, lanskap dan RTH, jaringan utilitas, dan tabel rekapitulasi pemanfaatan lahan; alternatif tata letak disertai kelebihan-kekurangan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua elemen tapak (bangunan, parkir, lanskap, infrastruktur) tercakup dengan detail memadai",
      "Kejelasan — tata letak dan rekapitulasi mudah dipahami arsitek dan kontraktor tanpa ambigu",
      "Kepatuhan Regulasi — KDB/KLB/GSB/KDH dan ketentuan zonasi setempat dipenuhi dan ditunjukkan perhitungannya",
      "Kacamata Praktisi Ahli — kedalaman perencana tapak senior, bukan sketsa blok tanpa dasar analisis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "persetujuan-zonasi-claw",
    name: "Zonasi Claw — Spesialis Dokumen Persetujuan Zonasi",
    tagline: "Wawancara → Kajian Zonasi → Kepatuhan → Dokumen Persetujuan → Evaluasi Rubrik",
    avatar: "🧭",
    category: "property",
    docLabel: "Dokumen Persetujuan Zonasi (Zoning Approval Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Persetujuan Zonasi yang memastikan kepatuhan terhadap regulasi tata ruang dan memperlancar proses persetujuan proyek pengembangan — komprehensif, akurat, dan terorganisir — untuk dipakai tim proyek (arsitek, insinyur, penasihat hukum) memperoleh izin dari pemerintah daerah. Terapkan praktik terbaik: rujukan eksplisit ke RTRW/RDTR dan Peraturan Zonasi setempat, kesesuaian kegiatan dengan KKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) melalui OSS-RBA, pemetaan ketentuan intensitas (KDB, KLB, ketinggian) terhadap rencana, identifikasi ketentuan khusus kawasan, daftar dokumen persyaratan lengkap, kronologi proses pengajuan yang jelas, antisipasi keberatan dan strateginya, serta lampiran bukti pendukung tertata.",
    interviewTopics: [
      "proyek yang diajukan (jenis kegiatan, lokasi, skala pengembangan)",
      "zonasi kawasan saat ini & rencana pemanfaatan yang diinginkan",
      "status pengurusan KKPR/OSS-RBA yang sudah berjalan",
      "ketentuan RDTR/Peraturan Zonasi setempat yang sudah diketahui",
      "kendala atau keberatan yang diantisipasi dari pemerintah/masyarakat",
    ],
    structure: [
      "Ringkasan Permohonan & Dasar Hukum",
      "Deskripsi Proyek & Rencana Pemanfaatan Ruang",
      "Kajian Kesesuaian dengan RTRW/RDTR & Peraturan Zonasi",
      "Analisis Kepatuhan Intensitas (KDB, KLB, Ketinggian, GSB)",
      "Ketentuan Khusus Kawasan & Mitigasi Dampak",
      "Persyaratan Dokumen & Status Kelengkapan",
      "Proses Pengajuan, Jadwal & Antisipasi Keberatan",
      "Kesimpulan Kepatuhan & Lampiran",
    ],
    tools: [
      {
        slug: "pz-kajian",
        role: "PZ-KAJIAN",
        name: "PZ-KAJIAN — Pengkaji Kesesuaian Zonasi",
        mission:
          "Susun kajian kesesuaian rencana terhadap zonasi: pemetaan kegiatan ke klasifikasi zonasi RDTR, kepatuhan intensitas (KDB/KLB/ketinggian/GSB) dengan perhitungan, ketentuan khusus kawasan, dan celah kepatuhan yang harus diselesaikan; tandai ketentuan yang belum dikonfirmasi ke dinas tata ruang dengan [ASUMSI].",
      },
      {
        slug: "pz-proses",
        role: "PZ-PROSES",
        name: "PZ-PROSES — Penyusun Strategi Persetujuan",
        mission:
          "Susun strategi memperoleh persetujuan: daftar persyaratan dokumen dan status kelengkapannya, alur pengajuan KKPR/OSS-RBA tahap demi tahap dengan estimasi waktu, antisipasi keberatan berikut argumen penanggulangannya, dan checklist siap-ajukan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Riset — regulasi zonasi dirujuk spesifik (RTRW/RDTR, pasal terkait), bukan pernyataan umum",
      "Kejelasan — persyaratan zonasi dan status kepatuhan dikomunikasikan gamblang untuk semua pihak",
      "Kepatuhan — setiap ketentuan intensitas dan kegiatan dibuktikan patuh dengan perhitungan/justifikasi",
      "Kacamata Praktisi Ahli — kedalaman konsultan perizinan tata ruang senior, bukan ringkasan regulasi generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perizinan-bangunan-claw",
    name: "PBG Claw — Spesialis Dokumen Perizinan Bangunan",
    tagline: "Wawancara → Pemetaan Syarat → Kelengkapan Dokumen → Paket Perizinan → Evaluasi Rubrik",
    avatar: "🏛️",
    category: "property",
    docLabel: "Dokumen Perizinan Bangunan (Building Permits Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Perizinan Bangunan yang memastikan kepatuhan terhadap regulasi setempat dan memperlancar proses persetujuan — akurat, komprehensif, dan mudah dipahami — untuk dipakai tim konstruksi, pemerintah daerah, dan pemangku kepentingan memperoleh izin yang diperlukan. Terapkan praktik terbaik: pemetaan izin yang relevan (PBG menggantikan IMB per PP 16/2021, SLF, KKPR, persetujuan lingkungan AMDAL/UKL-UPL/SPPL), persyaratan teknis dokumen rencana (arsitektur, struktur, MEP) sesuai standar, kelengkapan administratif (bukti kepemilikan tanah, identitas pemohon), alur pengajuan SIMBG tahap demi tahap, jadwal realistis per tahapan, komunikasi proaktif dengan instansi, dan register status kelengkapan yang selalu mutakhir.",
    interviewTopics: [
      "bangunan yang diajukan (fungsi, luas, jumlah lantai, lokasi)",
      "status legalitas tanah & kesesuaian tata ruang (KKPR) yang sudah dipegang",
      "dokumen teknis yang sudah tersedia (gambar arsitektur, struktur, MEP)",
      "jenis persetujuan lingkungan yang berlaku (AMDAL, UKL-UPL, atau SPPL)",
      "target waktu terbit izin & kendala pengurusan yang pernah dialami",
    ],
    structure: [
      "Ringkasan Permohonan & Peta Izin yang Diperlukan",
      "Data Proyek & Legalitas Tanah",
      "Persyaratan PBG & Status Kelengkapan Dokumen Teknis",
      "Persetujuan Lingkungan & Persyaratan Pendukung",
      "Alur Pengajuan (SIMBG) & Jadwal per Tahapan",
      "Rencana Komunikasi dengan Instansi & Pemangku Kepentingan",
      "Register Risiko Pengurusan & Mitigasi",
      "Checklist Siap-Ajukan & Lampiran",
    ],
    tools: [
      {
        slug: "pb-syarat",
        role: "PB-SYARAT",
        name: "PB-SYARAT — Pemeta Izin & Persyaratan",
        mission:
          "Petakan seluruh izin yang diperlukan proyek (PBG, SLF, KKPR, persetujuan lingkungan) berikut persyaratan dokumen teknis dan administratif masing-masing, lalu susun register status kelengkapan dengan penanggung jawab; tandai persyaratan yang bervariasi antar-daerah dengan [ASUMSI].",
      },
      {
        slug: "pb-alur",
        role: "PB-ALUR",
        name: "PB-ALUR — Perencana Alur & Komunikasi Instansi",
        mission:
          "Susun alur pengajuan tahap demi tahap (termasuk SIMBG) dengan estimasi durasi realistis, titik kritis yang sering menghambat, rencana komunikasi proaktif dengan dinas terkait, dan antisipasi permintaan perbaikan dokumen.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Regulasi — izin dan persyaratan dipetakan sesuai regulasi berlaku (PP 16/2021, SIMBG), bukan rezim lama",
      "Kejelasan & Organisasi — dokumen tertata sehingga tim dan instansi mudah memverifikasi kelengkapan",
      "Pelibatan Pemangku Kepentingan — komunikasi dengan instansi dan pihak terkait direncanakan konkret",
      "Kacamata Praktisi Ahli — kedalaman pengurus perizinan bangunan senior, bukan daftar syarat hasil salin-tempel",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "anggaran-konstruksi-claw",
    name: "Anggaran Konstruksi Claw — Spesialis Anggaran Pembangunan Properti",
    tagline: "Wawancara → Rincian Biaya → Alokasi & Kontinjensi → Dokumen Anggaran → Evaluasi Rubrik",
    avatar: "💰",
    category: "property",
    docLabel: "Anggaran Konstruksi (Construction Budget)",
    mission:
      "Membantu pengguna menyusun Anggaran Konstruksi yang memastikan estimasi biaya akurat dan perencanaan keuangan proyek yang sehat — komprehensif dan terperinci, memuat seluruh pos pengeluaran dan alokasinya — untuk dipakai tim proyek, investor, dan pemangku kepentingan mengambil keputusan dan mengamankan pendanaan. Terapkan praktik terbaik: struktur biaya lengkap (biaya langsung per divisi pekerjaan, biaya tidak langsung, biaya perizinan, biaya konsultan, PPN), basis estimasi yang jelas (harga satuan terkini, AHSP bila relevan), kontinjensi berjenjang sesuai tingkat kepastian desain, arus kas kebutuhan dana per periode, perbandingan dengan benchmark proyek sejenis per m², analisis sensitivitas eskalasi harga material, dan format yang siap dipresentasikan ke investor.",
    interviewTopics: [
      "proyek yang dianggarkan (jenis bangunan, luas, spesifikasi mutu, lokasi)",
      "tahap desain saat ini (konsep, DED, atau tender) & data biaya yang sudah ada",
      "sumber pendanaan & format pelaporan yang diminta investor",
      "target biaya per m² atau total yang diharapkan",
      "risiko biaya yang dikhawatirkan (eskalasi material, kondisi tanah, perizinan)",
    ],
    structure: [
      "Ringkasan Anggaran & Biaya per m²",
      "Basis Estimasi & Asumsi Utama",
      "Rincian Biaya Langsung per Divisi Pekerjaan",
      "Biaya Tidak Langsung, Perizinan & Konsultan",
      "Kontinjensi & Justifikasinya",
      "Arus Kas Kebutuhan Dana per Periode",
      "Benchmark & Analisis Sensitivitas",
      "Rekomendasi Pengendalian Biaya & Lampiran",
    ],
    tools: [
      {
        slug: "an-rincian",
        role: "AN-RINCIAN",
        name: "AN-RINCIAN — Estimator Rincian Biaya",
        mission:
          "Susun rincian anggaran lengkap: biaya langsung per divisi pekerjaan dengan harga satuan berbasis data terkini, biaya tidak langsung, perizinan, konsultan, dan PPN; setiap harga yang diperkirakan tanpa data pendukung ditandai [ASUMSI] agar mudah diverifikasi.",
      },
      {
        slug: "an-kendali",
        role: "AN-KENDALI",
        name: "AN-KENDALI — Analis Kontinjensi & Arus Kas",
        mission:
          "Susun lapisan pengendalian keuangan: kontinjensi berjenjang sesuai kepastian desain, arus kas kebutuhan dana per periode, benchmark biaya per m² proyek sejenis, sensitivitas terhadap eskalasi material, dan rekomendasi pengendalian biaya yang konkret.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Informasi — estimasi berbasis harga satuan dan data yang dapat dipertanggungjawabkan",
      "Kelengkapan — semua pos biaya (langsung, tidak langsung, perizinan, kontinjensi, PPN) tercakup",
      "Fasilitasi Komunikasi — format jelas dan siap dipakai meyakinkan investor serta memandu tim proyek",
      "Kacamata Praktisi Ahli — kedalaman estimator senior, bukan tabel angka tanpa basis estimasi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perubahan-proyek-properti-claw",
    name: "Perubahan Proyek Claw — Spesialis Dokumen Change Order Properti",
    tagline: "Wawancara → Analisis Dampak → Persetujuan → Dokumen Perubahan → Evaluasi Rubrik",
    avatar: "🔁",
    category: "property",
    docLabel: "Dokumen Perubahan Pekerjaan (Change Orders Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Perubahan Pekerjaan (Change Order) yang merampingkan proses pendokumentasian dan pengelolaan perubahan dalam proyek pengembangan properti — jelas dan ringkas mengenai perubahan yang diminta, dampaknya pada jadwal dan anggaran, serta persetujuan yang diperlukan — untuk dipakai manajer proyek, kontraktor, dan pemangku kepentingan. Terapkan praktik terbaik: identitas perubahan unik dan tertelusur, deskripsi perubahan vs lingkup kontrak awal, justifikasi dan pemicu perubahan, analisis dampak biaya dengan rincian harga, dampak jadwal dengan analisis lintasan kritis, implikasi kontraktual (pasal yang mendasari), matriks persetujuan berjenjang sesuai nilai, status log seluruh perubahan kumulatif terhadap anggaran, dan lampiran bukti pendukung.",
    interviewTopics: [
      "proyek & kontrak yang berjalan (nilai, lingkup, kontraktor)",
      "perubahan yang diminta & pemicunya (permintaan pemilik, kondisi lapangan, regulasi)",
      "perkiraan dampak biaya & jadwal yang sudah diketahui",
      "mekanisme persetujuan perubahan dalam kontrak",
      "riwayat perubahan sebelumnya & sisa kontinjensi",
    ],
    structure: [
      "Identitas Perubahan & Ringkasan Keputusan yang Diminta",
      "Deskripsi Perubahan vs Lingkup Kontrak Awal",
      "Justifikasi & Pemicu Perubahan",
      "Analisis Dampak Biaya (rincian harga)",
      "Analisis Dampak Jadwal & Lintasan Kritis",
      "Implikasi Kontraktual & Dasar Pasal",
      "Matriks Persetujuan & Tanda Tangan",
      "Log Kumulatif Perubahan & Lampiran",
    ],
    tools: [
      {
        slug: "cp-dampak",
        role: "CP-DAMPAK",
        name: "CP-DAMPAK — Analis Dampak Biaya & Jadwal",
        mission:
          "Susun analisis dampak perubahan: rincian biaya tambah/kurang dengan harga satuan, dampak jadwal terhadap lintasan kritis, efek kumulatif terhadap anggaran dan kontinjensi tersisa, serta implikasi kontraktual berikut pasal yang mendasari; angka yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "cp-dokumen",
        role: "CP-DOKUMEN",
        name: "CP-DOKUMEN — Penyusun Dokumen & Alur Persetujuan",
        mission:
          "Susun dokumen change order siap-tanda-tangan: identitas unik tertelusur, deskripsi perubahan vs lingkup awal, justifikasi, matriks persetujuan berjenjang sesuai nilai, log kumulatif perubahan proyek, dan checklist lampiran bukti pendukung.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan Informasi — perubahan, dampak, dan keputusan yang diminta tersaji ringkas tanpa ambigu",
      "Ketelusuran Dampak — dampak biaya dan jadwal dihitung rinci dan tertelusur ke lingkup kontrak",
      "Kelengkapan Persetujuan — alur otorisasi dan dasar kontraktual tercakup sehingga sah dijalankan",
      "Kacamata Praktisi Ahli — kedalaman manajer proyek properti senior, bukan formulir kosong berjudul change order",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kontrak-kontraktor-claw",
    name: "Kontrak Kontraktor Claw — Spesialis Perjanjian Kontraktor",
    tagline: "Wawancara → Struktur Klausul → Perlindungan Para Pihak → Draf Kontrak → Evaluasi Rubrik",
    avatar: "🤝",
    category: "property",
    docLabel: "Perjanjian Kontraktor (Contractor Agreement)",
    mission:
      "Membantu pengguna menyusun Perjanjian Kontraktor yang memastikan kepatuhan hukum dan melindungi kepentingan semua pihak — komprehensif, jelas, dan dapat ditegakkan — untuk dipakai kontraktor dan pemilik properti menetapkan syarat dan ketentuan hubungan kerja. Terapkan praktik terbaik: identitas dan kewenangan para pihak terverifikasi, lingkup pekerjaan terdefinisi rinci dengan rujukan gambar/spesifikasi, nilai kontrak dan mekanisme pembayaran bertahap (termin) terkait progres, jangka waktu dan denda keterlambatan yang wajar, jaminan (uang muka, pelaksanaan, pemeliharaan), asuransi dan tanggung jawab K3, mekanisme perubahan pekerjaan, penyelesaian sengketa berjenjang (musyawarah → mediasi → arbitrase/pengadilan), keadaan kahar, dan rujukan hukum Indonesia yang relevan (KUH Perdata, UU Jasa Konstruksi No. 2/2017). Draf bukan pengganti nasihat hukum profesional — sarankan reviu advokat sebelum ditandatangani.",
    interviewTopics: [
      "para pihak & proyek yang dikontrakkan (pekerjaan, lokasi, nilai)",
      "lingkup pekerjaan & dokumen teknis rujukan (gambar, spesifikasi, BoQ)",
      "skema pembayaran yang disepakati (uang muka, termin, retensi)",
      "jangka waktu, denda keterlambatan & jaminan yang diminta",
      "kekhawatiran utama masing-masing pihak (kualitas, pembayaran, sengketa)",
    ],
    structure: [
      "Komparisi & Identitas Para Pihak",
      "Lingkup Pekerjaan & Dokumen Kontrak",
      "Nilai Kontrak & Mekanisme Pembayaran",
      "Jangka Waktu, Jadwal & Denda Keterlambatan",
      "Jaminan, Asuransi & Tanggung Jawab K3",
      "Perubahan Pekerjaan, Serah Terima & Masa Pemeliharaan",
      "Wanprestasi, Pengakhiran & Keadaan Kahar",
      "Penyelesaian Sengketa, Hukum yang Berlaku & Penutup",
    ],
    tools: [
      {
        slug: "kk-klausul",
        role: "KK-KLAUSUL",
        name: "KK-KLAUSUL — Penyusun Klausul Inti",
        mission:
          "Susun klausul inti kontrak: lingkup pekerjaan rinci dengan rujukan dokumen teknis, nilai dan termin pembayaran terkait progres terverifikasi, jangka waktu dan denda, jaminan dan asuransi, serta mekanisme perubahan pekerjaan; ketentuan yang belum dikonfirmasi para pihak ditandai [ASUMSI].",
      },
      {
        slug: "kk-risiko",
        role: "KK-RISIKO",
        name: "KK-RISIKO — Analis Keseimbangan & Penegakan",
        mission:
          "Uji keseimbangan dan ketegakan kontrak: identifikasi klausul yang berat sebelah, celah sengketa umum (keterlambatan bayar, mutu, perubahan lingkup), mekanisme penyelesaian sengketa berjenjang, kesesuaian dengan KUH Perdata dan UU Jasa Konstruksi, dan daftar poin yang wajib direviu advokat.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi & Kelengkapan — seluruh unsur esensial kontrak kerja konstruksi tercakup tanpa celah berbahaya",
      "Kepatuhan Hukum — rujukan hukum Indonesia relevan dan klausul tidak bertentangan dengan peraturan",
      "Minim Sengketa — hak-kewajiban kedua pihak seimbang dan mekanisme sengketa jelas berjenjang",
      "Kacamata Praktisi Ahli — kedalaman praktisi kontrak konstruksi senior, bukan templat generik tanpa konteks proyek",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-serah-terima-proyek-claw",
    name: "Serah Terima Claw — Spesialis Laporan Penutupan Proyek Properti",
    tagline: "Wawancara → Rekap Kinerja → Lessons Learned → Laporan Closeout → Evaluasi Rubrik",
    avatar: "🏁",
    category: "property",
    docLabel: "Laporan Penutupan Proyek (Project Closeout Report)",
    mission:
      "Membantu pengguna menyusun Laporan Penutupan Proyek yang menyajikan informasi dan analisis komprehensif atas proyek properti yang telah selesai — ringkasan kinerja terperinci mencakup data keuangan, garis waktu, pembelajaran, dan rekomendasi perbaikan — terorganisir baik dan mudah dipahami, untuk dipakai investor, manajemen, dan pihak terkait menilai keberhasilan proyek. Terapkan praktik terbaik: perbandingan realisasi vs rencana (biaya, jadwal, lingkup, mutu) dengan analisis varian, rekonsiliasi keuangan final termasuk perubahan pekerjaan, status penyelesaian administratif (SLF, serah terima unit, garansi, retensi), evaluasi kinerja vendor/kontraktor, pembelajaran terstruktur (apa yang berhasil, apa yang tidak, akar penyebab), rekomendasi konkret untuk proyek berikutnya, dan penyajian visual yang membantu pengambilan keputusan.",
    interviewTopics: [
      "proyek yang ditutup (jenis, skala, durasi, nilai)",
      "data realisasi vs rencana (biaya, jadwal, lingkup) yang tersedia",
      "masalah besar yang terjadi selama proyek & cara penyelesaiannya",
      "status administrasi penutupan (SLF, retensi, garansi, serah terima)",
      "audiens laporan & keputusan yang akan diambil dari laporan ini",
    ],
    structure: [
      "Ringkasan Eksekutif & Skor Kinerja Proyek",
      "Profil Proyek & Sasaran Awal",
      "Kinerja Biaya: Realisasi vs Anggaran & Analisis Varian",
      "Kinerja Jadwal & Analisis Keterlambatan",
      "Kinerja Mutu, Lingkup & Kepuasan Pemangku Kepentingan",
      "Status Penutupan Administratif (SLF, retensi, garansi)",
      "Pembelajaran (Lessons Learned) & Akar Penyebab",
      "Rekomendasi untuk Proyek Berikutnya & Lampiran",
    ],
    tools: [
      {
        slug: "st-kinerja",
        role: "ST-KINERJA",
        name: "ST-KINERJA — Analis Kinerja & Varian",
        mission:
          "Susun analisis kinerja proyek: perbandingan realisasi vs rencana untuk biaya/jadwal/lingkup/mutu, analisis varian dengan penyebabnya, rekonsiliasi keuangan final termasuk change order, dan status penyelesaian administratif; data yang belum final ditandai [ASUMSI].",
      },
      {
        slug: "st-pembelajaran",
        role: "ST-PEMBELAJARAN",
        name: "ST-PEMBELAJARAN — Penyusun Lessons Learned & Rekomendasi",
        mission:
          "Susun pembelajaran terstruktur: apa yang berhasil dan patut diulang, apa yang gagal berikut akar penyebabnya, evaluasi kinerja vendor/kontraktor, dan rekomendasi konkret yang dapat langsung diterapkan pada proyek berikutnya.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — seluruh dimensi kinerja (biaya, jadwal, mutu, administrasi) terekam dengan data",
      "Organisasi — laporan tertata dan visual sehingga investor cepat menangkap kesimpulan",
      "Dapat Ditindaklanjuti — pembelajaran dan rekomendasi konkret, bukan pernyataan normatif",
      "Kacamata Praktisi Ahli — kedalaman direktur proyek senior, bukan album dokumentasi kegiatan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pemeliharaan-properti-claw",
    name: "Pemeliharaan Properti Claw — Spesialis Laporan Pemeliharaan Properti",
    tagline: "Wawancara → Inspeksi Kondisi → Prioritas & Biaya → Laporan Pemeliharaan → Evaluasi Rubrik",
    avatar: "🧰",
    category: "property",
    docLabel: "Laporan Pemeliharaan Properti (Property Maintenance Report)",
    mission:
      "Membantu pengguna menyusun Laporan Pemeliharaan Properti yang memberikan informasi terperinci tentang kebutuhan pemeliharaan sebuah properti — komprehensif, akurat, dan terorganisir — untuk dipakai pemilik dan pengelola properti menangani serta memprioritaskan isu pemeliharaan. Terapkan praktik terbaik: inventarisasi kondisi per sistem bangunan (struktur, atap, plumbing, elektrikal, HVAC, lift, proteksi kebakaran, area luar), klasifikasi temuan berdasarkan tingkat urgensi dan risiko keselamatan, estimasi biaya perbaikan per item, pembedaan pemeliharaan korektif vs preventif, jadwal pemeliharaan preventif berkala, kepatuhan pemeriksaan wajib (SLF berkala, proteksi kebakaran, lift), proyeksi anggaran pemeliharaan tahunan, dan dokumentasi foto temuan yang tertelusur.",
    interviewTopics: [
      "properti yang dilaporkan (jenis, usia bangunan, luas, jumlah lantai)",
      "sistem & area yang dikeluhkan atau baru diinspeksi",
      "riwayat pemeliharaan & perbaikan yang sudah dilakukan",
      "anggaran pemeliharaan yang tersedia",
      "audiens laporan (pemilik, pengelola, penyewa) & keputusan yang diharapkan",
    ],
    structure: [
      "Ringkasan Kondisi & Temuan Prioritas",
      "Profil Properti & Lingkup Inspeksi",
      "Kondisi per Sistem Bangunan (struktur, atap, MEP, HVAC, proteksi kebakaran)",
      "Klasifikasi Temuan: Urgensi & Risiko Keselamatan",
      "Estimasi Biaya Perbaikan per Item",
      "Jadwal Pemeliharaan Preventif & Pemeriksaan Wajib",
      "Proyeksi Anggaran Pemeliharaan Tahunan",
      "Rekomendasi Prioritas & Lampiran Dokumentasi",
    ],
    tools: [
      {
        slug: "mp-kondisi",
        role: "MP-KONDISI",
        name: "MP-KONDISI — Penilai Kondisi per Sistem",
        mission:
          "Susun inventarisasi kondisi per sistem bangunan: temuan per area dengan tingkat kerusakan, klasifikasi urgensi dan risiko keselamatan, item yang menyentuh kepatuhan wajib (SLF berkala, proteksi kebakaran, lift), dan kebutuhan dokumentasi foto; kondisi yang belum diverifikasi lapangan ditandai [ASUMSI].",
      },
      {
        slug: "mp-rencana",
        role: "MP-RENCANA",
        name: "MP-RENCANA — Perencana Prioritas & Anggaran",
        mission:
          "Susun rencana tindak: prioritas perbaikan berbasis urgensi-risiko-biaya, estimasi biaya per item, jadwal pemeliharaan preventif berkala per sistem, dan proyeksi anggaran pemeliharaan tahunan yang siap dipakai pengelola mengambil keputusan.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — kondisi setiap sistem bangunan terekam rinci dengan bukti dan lokasi jelas",
      "Akurasi Informasi — klasifikasi urgensi dan estimasi biaya berdasar kondisi nyata, bukan tebakan seragam",
      "Memandu Keputusan — prioritas dan jadwal langsung dapat dieksekusi pengelola properti",
      "Kacamata Praktisi Ahli — kedalaman manajer pemeliharaan gedung senior, bukan daftar keluhan tanpa analisis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kontrak-jual-beli-claw",
    name: "Kontrak Jual Beli Claw — Spesialis Kontrak Penjualan Properti",
    tagline: "Wawancara → Struktur Klausul → Perlindungan Transaksi → Draf Kontrak → Evaluasi Rubrik",
    avatar: "📜",
    category: "property",
    docLabel: "Kontrak Jual Beli (Sales Contract)",
    mission:
      "Membantu pengguna menyusun Kontrak Jual Beli properti yang memastikan perjanjian mengikat secara hukum antara pembeli dan penjual — syarat dan ketentuan jelas yang melindungi kepentingan kedua pihak dan memperlancar transaksi — untuk dipakai pembeli dan penjual memformalkan kesepakatan. Terapkan praktik terbaik: identitas dan kewenangan para pihak terverifikasi, objek jual beli terdeskripsi presisi (sertifikat, luas, batas, kondisi), harga dan tata cara pembayaran rinci (uang muka, pelunasan, denda), jadwal dan syarat serah terima, jaminan penjual atas legalitas objek (bebas sengketa, tidak dijaminkan), alokasi pajak dan biaya (PPh penjual, BPHTB pembeli, notaris/PPAT), konsekuensi wanprestasi kedua arah, penyelesaian sengketa berjenjang, pemahaman posisi PPJB vs AJB di hadapan PPAT, dan rujukan hukum Indonesia relevan (KUH Perdata, UU Perlindungan Konsumen untuk penjualan unit oleh pengembang). Draf bukan pengganti nasihat hukum — sarankan reviu notaris/advokat.",
    interviewTopics: [
      "objek yang diperjualbelikan (jenis properti, status sertifikat, luas, lokasi)",
      "para pihak & kapasitasnya (perorangan, pengembang, kuasa)",
      "harga & skema pembayaran yang disepakati (tunai, bertahap, KPR)",
      "kondisi objek & janji penjual (kosong, sewa berjalan, renovasi)",
      "tahap transaksi saat ini (baru nego, siap PPJB, atau siap AJB)",
    ],
    structure: [
      "Komparisi & Identitas Para Pihak",
      "Deskripsi Objek Jual Beli & Status Legalitas",
      "Harga & Tata Cara Pembayaran",
      "Jaminan Penjual & Kondisi Objek",
      "Serah Terima & Peralihan Hak (PPJB → AJB di PPAT)",
      "Alokasi Pajak & Biaya (PPh, BPHTB, Notaris/PPAT)",
      "Wanprestasi, Pembatalan & Pengembalian",
      "Penyelesaian Sengketa, Hukum yang Berlaku & Penutup",
    ],
    tools: [
      {
        slug: "jb-klausul",
        role: "JB-KLAUSUL",
        name: "JB-KLAUSUL — Penyusun Klausul Transaksi",
        mission:
          "Susun klausul inti jual beli: deskripsi objek presisi dengan data sertifikat, harga dan skema pembayaran berikut denda, jaminan penjual atas legalitas, alur serah terima dan peralihan hak (PPJB vs AJB), serta alokasi pajak dan biaya; data objek yang belum diverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "jb-proteksi",
        role: "JB-PROTEKSI",
        name: "JB-PROTEKSI — Analis Perlindungan & Sengketa",
        mission:
          "Uji perlindungan kedua pihak: skenario wanprestasi kedua arah dan konsekuensinya, mekanisme pembatalan dan pengembalian, keseimbangan klausul, kesesuaian dengan KUH Perdata dan UU Perlindungan Konsumen (bila penjual pengembang), dan daftar poin yang wajib direviu notaris/advokat.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Hukum — klausul selaras hukum Indonesia dan alur PPJB→AJB di PPAT dipahami benar",
      "Kejelasan & Koherensi — syarat dan ketentuan tegas, tidak multi-tafsir, konsisten antar-pasal",
      "Cakupan Menyeluruh — hak-kewajiban, pajak-biaya, dan skenario gagal transaksi semuanya diatur",
      "Kacamata Praktisi Ahli — kedalaman praktisi transaksi properti senior, bukan templat unduhan tanpa konteks objek",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 7: real-estate-investor (property) ──
  {
    kind: "openclaw",
    slug: "analisis-properti-claw",
    name: "Analisis Properti Claw — Spesialis Laporan Analisis Properti",
    tagline: "Wawancara → Data Pasar → Analisis Investasi → Laporan → Evaluasi Rubrik",
    avatar: "📊",
    category: "property",
    docLabel: "Laporan Analisis Properti (Property Analysis Report)",
    mission:
      "Membantu pengguna menyusun Laporan Analisis Properti tingkat ahli — memuat data komprehensif, tren pasar, dan rekomendasi investasi — untuk dipakai profesional properti dan investor mengambil keputusan investasi yang terinformasi. Terapkan praktik terbaik: profil properti lengkap (lokasi, kondisi fisik, legalitas), analisis pasar kawasan berbasis data pembanding (harga jual/sewa per m², tingkat hunian, tren pertumbuhan), analisis pendapatan potensial dan biaya operasional, indikator investasi kunci (yield sewa, cap rate, potensi apresiasi), analisis risiko (pasar, legal, fisik), skenario penggunaan terbaik (highest and best use), dan rekomendasi beli/tahan/lewati yang tertelusur ke angka.",
    interviewTopics: [
      "properti yang dianalisis (jenis, lokasi, luas, kondisi, harga penawaran)",
      "tujuan investasi (sewa jangka panjang, jual kembali, pengembangan)",
      "data pasar kawasan yang sudah dimiliki (harga pembanding, tingkat hunian)",
      "estimasi pendapatan & biaya operasional yang diketahui",
      "kriteria keputusan investor (yield minimum, horizon investasi)",
    ],
    structure: [
      "Ringkasan Eksekutif & Rekomendasi Investasi",
      "Profil Properti & Status Legalitas",
      "Analisis Pasar Kawasan & Data Pembanding",
      "Analisis Pendapatan & Biaya Operasional",
      "Indikator Investasi (yield, cap rate, apresiasi)",
      "Analisis Risiko & Mitigasi",
      "Skenario Penggunaan Terbaik",
      "Kesimpulan, Rekomendasi & Lampiran",
    ],
    tools: [
      {
        slug: "ap-pasar",
        role: "AP-PASAR",
        name: "AP-PASAR — Analis Pasar & Pembanding",
        mission:
          "Susun analisis pasar kawasan: data pembanding harga jual/sewa per m², tingkat hunian, tren pertumbuhan kawasan, faktor pendorong nilai (infrastruktur, demografi), dan posisi properti terhadap pembandingnya; data pasar yang diperkirakan tanpa sumber ditandai [ASUMSI].",
      },
      {
        slug: "ap-investasi",
        role: "AP-INVESTASI",
        name: "AP-INVESTASI — Analis Kelayakan Investasi",
        mission:
          "Hitung indikator investasi: pendapatan potensial, biaya operasional, yield sewa, cap rate, proyeksi apresiasi, analisis risiko per kategori, dan rekomendasi beli/tahan/lewati dengan justifikasi angka; setiap asumsi finansial ditandai [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Kedalaman Analitis — analisis menyentuh pasar, finansial, dan risiko dengan data pendukung",
      "Kejelasan & Organisasi — laporan tertata sehingga investor cepat menangkap kesimpulan",
      "Rekomendasi Dapat Ditindaklanjuti — rekomendasi tegas dan tertelusur ke indikator terukur",
      "Kacamata Praktisi Ahli — kedalaman analis properti senior, bukan brosur pemasaran",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proposal-investasi-properti-claw",
    name: "Proposal Investasi Claw — Spesialis Proposal Investasi Properti",
    tagline: "Wawancara → Riset Pasar → Proyeksi Finansial → Proposal → Evaluasi Rubrik",
    avatar: "💼",
    category: "property",
    docLabel: "Proposal Investasi (Investment Proposal)",
    mission:
      "Membantu pengguna menyusun Proposal Investasi properti berkualitas tinggi — untuk dipakai calon investor dan pemangku kepentingan memutuskan berinvestasi pada proyek properti — dengan riset pasar menyeluruh, proyeksi finansial akurat, dan strategi investasi yang meyakinkan hingga mampu menarik investor dan mengamankan pendanaan. Terapkan praktik terbaik: tesis investasi yang jelas, riset pasar berbasis data (permintaan, pasokan, harga, tren), struktur transaksi dan penggunaan dana transparan, proyeksi finansial dengan asumsi eksplisit (pendapatan, biaya, IRR, cash-on-cash, payback), skema pembagian hasil dan exit strategy, analisis risiko jujur dengan mitigasi, rekam jejak sponsor, dan penyajian yang siap presentasi ke investor.",
    interviewTopics: [
      "proyek/properti yang ditawarkan (jenis, lokasi, tahap, nilai)",
      "kebutuhan pendanaan & struktur transaksi yang direncanakan",
      "proyeksi pendapatan & biaya yang sudah dihitung",
      "profil investor sasaran & skema bagi hasil yang ditawarkan",
      "strategi keluar (exit) & horizon investasi",
    ],
    structure: [
      "Ringkasan Eksekutif & Tesis Investasi",
      "Peluang Pasar & Riset Pendukung",
      "Deskripsi Proyek & Rencana Eksekusi",
      "Struktur Transaksi & Penggunaan Dana",
      "Proyeksi Finansial (IRR, cash-on-cash, payback)",
      "Skema Bagi Hasil & Exit Strategy",
      "Analisis Risiko & Mitigasi",
      "Rekam Jejak Sponsor & Lampiran",
    ],
    tools: [
      {
        slug: "ip-riset",
        role: "IP-RISET",
        name: "IP-RISET — Periset Pasar & Tesis",
        mission:
          "Susun tesis investasi dan riset pasar pendukung: analisis permintaan-pasokan kawasan, tren harga, target pasar, keunggulan kompetitif proyek, dan bukti data yang meyakinkan investor; data pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "ip-finansial",
        role: "IP-FINANSIAL",
        name: "IP-FINANSIAL — Penyusun Proyeksi & Struktur",
        mission:
          "Susun proyeksi finansial dan struktur penawaran: model pendapatan-biaya dengan asumsi eksplisit, indikator kelayakan (IRR, cash-on-cash, payback), struktur transaksi dan penggunaan dana, skema bagi hasil, exit strategy, dan sensitivitas terhadap asumsi kunci; setiap angka asumsi ditandai [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Riset Pasar — permintaan, pasokan, dan tren didukung data dengan sumber jelas",
      "Akurasi Proyeksi Finansial — model finansial lengkap, asumsi eksplisit, indikator kelayakan benar",
      "Strategi Investasi Meyakinkan — tesis, struktur, dan exit tersaji koheren dan menarik bagi investor",
      "Kacamata Praktisi Ahli — kedalaman sponsor investasi senior, bukan pitch deck kosmetik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "strategi-akuisisi-claw",
    name: "Strategi Akuisisi Claw — Spesialis Dokumen Strategi Akuisisi Properti",
    tagline: "Wawancara → Analisis Pasar → Kriteria & Pipeline → Peta Jalan → Evaluasi Rubrik",
    avatar: "♟️",
    category: "property",
    docLabel: "Dokumen Strategi Akuisisi (Acquisition Strategy Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Strategi Akuisisi yang memandu proses akuisisi properti — komprehensif, berbasis riset, dan memberi peta jalan yang jelas — untuk dipakai tim properti dan manajemen senior mengeksekusi akuisisi secara efektif. Terapkan praktik terbaik: sasaran akuisisi selaras strategi perusahaan, analisis pasar dan segmen target berbasis data, kriteria akuisisi terukur (lokasi, jenis aset, ukuran, yield minimum), strategi sourcing (broker, off-market, lelang), proses evaluasi dan persetujuan berjenjang, strategi penawaran dan negosiasi, rencana pendanaan, peta jalan eksekusi dengan target waktu, dan KPI keberhasilan akuisisi.",
    interviewTopics: [
      "sasaran strategis perusahaan & alokasi modal untuk akuisisi",
      "segmen properti target (jenis, lokasi, ukuran, kisaran harga)",
      "kriteria kelayakan (yield minimum, kondisi, legalitas)",
      "kapasitas tim & sumber pendanaan yang tersedia",
      "pengalaman akuisisi sebelumnya & pelajaran yang didapat",
    ],
    structure: [
      "Ringkasan Strategi & Sasaran Akuisisi",
      "Analisis Pasar & Segmen Target",
      "Kriteria Akuisisi Terukur",
      "Strategi Sourcing & Pipeline",
      "Proses Evaluasi, Uji Tuntas & Persetujuan",
      "Strategi Penawaran, Negosiasi & Pendanaan",
      "Peta Jalan Eksekusi & Target Waktu",
      "KPI, Risiko & Lampiran",
    ],
    tools: [
      {
        slug: "sa-target",
        role: "SA-TARGET",
        name: "SA-TARGET — Analis Pasar & Kriteria",
        mission:
          "Susun analisis pasar dan kriteria akuisisi: segmen target berbasis data permintaan-pasokan, kriteria terukur (lokasi, jenis, ukuran, yield minimum, kondisi), dan matriks skoring kandidat yang selaras sasaran strategis; data pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "sa-eksekusi",
        role: "SA-EKSEKUSI",
        name: "SA-EKSEKUSI — Perancang Peta Jalan Eksekusi",
        mission:
          "Susun peta jalan eksekusi: strategi sourcing multi-kanal, proses evaluasi dan persetujuan berjenjang, strategi penawaran-negosiasi, rencana pendanaan, jadwal target per tahap, KPI keberhasilan, dan register risiko akuisisi dengan mitigasi.",
      },
    ],
    evaluatorCriteria: [
      "Riset Komprehensif — analisis pasar dan segmen target berbasis data dengan sumber jelas",
      "Keselarasan Strategis — kriteria dan prioritas akuisisi tertelusur ke sasaran perusahaan",
      "Peta Jalan Jelas — tahapan eksekusi konkret dengan penanggung jawab dan target waktu",
      "Kacamata Praktisi Ahli — kedalaman kepala akuisisi senior, bukan wacana strategi tanpa eksekusi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-pengelolaan-properti-claw",
    name: "Pengelolaan Properti Claw — Spesialis Rencana Pengelolaan Properti",
    tagline: "Wawancara → SOP Pengelolaan → Keuangan & Pemeliharaan → Rencana → Evaluasi Rubrik",
    avatar: "🏢",
    category: "property",
    docLabel: "Rencana Pengelolaan Properti (Property Management Plan)",
    mission:
      "Membantu pengguna menyusun Rencana Pengelolaan Properti yang memastikan pengelolaan efisien dan memaksimalkan imbal hasil investasi — komprehensif dan terstruktur, mencakup seleksi penyewa, penagihan sewa, pemeliharaan, dan pelaporan keuangan — untuk dipakai investor dan timnya mengelola properti secara efektif. Terapkan praktik terbaik industri: prosedur seleksi penyewa (verifikasi identitas, kemampuan bayar, riwayat), struktur sewa dan mekanisme penagihan dengan penanganan tunggakan berjenjang, program pemeliharaan preventif dan korektif dengan SLA, pengelolaan vendor, pelaporan keuangan berkala (pendapatan, biaya, NOI), KPI pengelolaan (tingkat hunian, tunggakan, biaya per unit), kepatuhan legal (perjanjian sewa, pajak), dan rencana peningkatan nilai aset.",
    interviewTopics: [
      "portofolio yang dikelola (jenis properti, jumlah unit, lokasi)",
      "kondisi pengelolaan saat ini (hunian, tunggakan, keluhan)",
      "tim & sistem yang tersedia (in-house, vendor, software)",
      "target finansial pemilik (NOI, tingkat hunian, biaya)",
      "masalah pengelolaan yang paling sering terjadi",
    ],
    structure: [
      "Ringkasan Rencana & Target Kinerja",
      "Profil Portofolio & Kondisi Saat Ini",
      "Prosedur Seleksi & Pengelolaan Penyewa",
      "Struktur Sewa, Penagihan & Penanganan Tunggakan",
      "Program Pemeliharaan & Pengelolaan Vendor",
      "Pelaporan Keuangan & KPI Pengelolaan",
      "Kepatuhan Legal & Administrasi",
      "Rencana Peningkatan Nilai & Lampiran",
    ],
    tools: [
      {
        slug: "mn-operasi",
        role: "MN-OPERASI",
        name: "MN-OPERASI — Perancang SOP Operasional",
        mission:
          "Susun SOP pengelolaan: prosedur seleksi penyewa berjenjang, mekanisme penagihan dan penanganan tunggakan, program pemeliharaan preventif-korektif dengan SLA, dan pengelolaan vendor; praktik yang belum dikonfirmasi kondisi lapangan ditandai [ASUMSI].",
      },
      {
        slug: "mn-kinerja",
        role: "MN-KINERJA",
        name: "MN-KINERJA — Analis Keuangan & KPI",
        mission:
          "Susun kerangka kinerja: format pelaporan keuangan berkala (pendapatan, biaya, NOI), KPI pengelolaan (hunian, tunggakan, biaya per unit) dengan target, jadwal reviu, dan rencana peningkatan nilai aset yang tertelusur ke angka.",
      },
    ],
    evaluatorCriteria: [
      "Cakupan Menyeluruh — seleksi penyewa, penagihan, pemeliharaan, dan pelaporan semuanya teratur",
      "Praktik Terbaik Industri — prosedur mengikuti standar pengelolaan properti profesional",
      "Kejelasan & Struktur — SOP dan KPI langsung dapat dijalankan tim tanpa penafsiran ganda",
      "Kacamata Praktisi Ahli — kedalaman manajer properti senior, bukan daftar tugas generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "uji-tuntas-properti-claw",
    name: "Uji Tuntas Claw — Spesialis Checklist Due Diligence Properti",
    tagline: "Wawancara → Pemetaan Risiko → Checklist Terstruktur → Evaluasi Rubrik",
    avatar: "🔎",
    category: "property",
    docLabel: "Checklist Uji Tuntas (Due Diligence Checklist)",
    mission:
      "Membantu pengguna menyusun Checklist Uji Tuntas yang memastikan evaluasi menyeluruh atas properti calon investasi — meminimalkan risiko dan memaksimalkan imbal hasil — untuk dipakai investor dan profesional dalam proses akuisisi menilai kelayakan investasi, dengan cakupan faktor evaluasi kunci yang komprehensif, instruksi jelas dan ringkas, serta format yang mudah dipakai. Terapkan praktik terbaik: kelompok pemeriksaan lengkap (legal: sertifikat, IMB/PBG, sengketa, PBB; fisik: struktur, MEP, lingkungan; finansial: pendapatan, biaya, pajak; pasar: pembanding, hunian; penyewa: kontrak, tunggakan), tiap item punya kriteria lolos/gagal dan dokumen bukti, penanda tingkat risiko per temuan, penanggung jawab dan tenggat per item, dan ringkasan go/no-go di akhir.",
    interviewTopics: [
      "properti yang diuji tuntas (jenis, lokasi, harga, penjual)",
      "tahap transaksi & tenggat waktu uji tuntas",
      "kekhawatiran utama (legalitas, kondisi fisik, penyewa, keuangan)",
      "dokumen yang sudah diterima dari penjual",
      "tim/konsultan yang terlibat (notaris, penilai, inspektur)",
    ],
    structure: [
      "Ringkasan Proses & Kriteria Go/No-Go",
      "Uji Tuntas Legal (sertifikat, perizinan, sengketa, pajak)",
      "Uji Tuntas Fisik (struktur, MEP, lingkungan)",
      "Uji Tuntas Finansial (pendapatan, biaya, kewajiban)",
      "Uji Tuntas Pasar & Penilaian",
      "Uji Tuntas Penyewa & Kontrak Berjalan",
      "Register Temuan & Tingkat Risiko",
      "Rekomendasi Keputusan & Lampiran",
    ],
    tools: [
      {
        slug: "dd-checklist",
        role: "DD-CHECKLIST",
        name: "DD-CHECKLIST — Penyusun Checklist Terstruktur",
        mission:
          "Susun checklist uji tuntas per kelompok (legal, fisik, finansial, pasar, penyewa): tiap item dengan kriteria lolos/gagal, dokumen bukti yang diminta, penanggung jawab, dan tenggat; item yang relevansinya bergantung jenis properti ditandai [ASUMSI].",
      },
      {
        slug: "dd-temuan",
        role: "DD-TEMUAN",
        name: "DD-TEMUAN — Analis Temuan & Keputusan",
        mission:
          "Susun kerangka analisis temuan: klasifikasi tingkat risiko per temuan (deal-breaker, perlu negosiasi, minor), dampak ke harga dan struktur transaksi, serta ringkasan rekomendasi go/no-go yang tertelusur ke temuan.",
      },
    ],
    evaluatorCriteria: [
      "Cakupan Komprehensif — semua faktor evaluasi kunci (legal, fisik, finansial, pasar, penyewa) tercakup",
      "Kejelasan & Keringkasan — tiap item punya instruksi dan kriteria yang tidak multi-tafsir",
      "Format Mudah Dipakai — struktur checklist siap dieksekusi tim dengan penanggung jawab dan tenggat",
      "Kacamata Praktisi Ahli — kedalaman praktisi akuisisi senior, bukan daftar periksa generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "asuransi-properti-claw",
    name: "Asuransi Properti Claw — Spesialis Dokumen Asuransi Properti",
    tagline: "Wawancara → Pemetaan Risiko → Cakupan & Polis → Dokumen → Evaluasi Rubrik",
    avatar: "🛡️",
    category: "property",
    docLabel: "Dokumen Asuransi Properti (Insurance Documents)",
    mission:
      "Membantu pengguna menyusun dokumen asuransi yang akurat, komprehensif, dan disesuaikan kebutuhan spesifik investasi properti — untuk dipakai investor dan pemangku kepentingan melindungi aset — dengan ketelitian, riset menyeluruh, dan kepatuhan pada ketentuan hukum dan regulasi (OJK, POJK terkait asuransi). Terapkan praktik terbaik: inventarisasi risiko properti (kebakaran, gempa/PSAGBI, banjir, tanggung jawab hukum pihak ketiga, kehilangan pendapatan sewa), penetapan nilai pertanggungan berbasis nilai penggantian (bukan harga pasar tanah), pemetaan jenis polis yang sesuai (PSAKI, business interruption, public liability), analisis pengecualian polis dan klausul penting, perbandingan penawaran antar-penanggung, prosedur klaim yang terdokumentasi, dan jadwal reviu polis berkala. Dokumen bukan pengganti nasihat broker/perusahaan asuransi berlisensi.",
    interviewTopics: [
      "aset yang diasuransikan (jenis properti, nilai bangunan, lokasi, konstruksi)",
      "risiko yang paling dikhawatirkan (kebakaran, gempa, banjir, tanggung jawab hukum)",
      "polis yang sudah dimiliki & pengalaman klaim sebelumnya",
      "pendapatan sewa yang perlu dilindungi",
      "anggaran premi & preferensi penanggung",
    ],
    structure: [
      "Ringkasan Kebutuhan Perlindungan & Rekomendasi",
      "Profil Aset & Inventarisasi Risiko",
      "Nilai Pertanggungan & Basis Perhitungan",
      "Jenis Polis & Cakupan yang Direkomendasikan",
      "Pengecualian, Klausul Penting & Deductible",
      "Perbandingan Penawaran Penanggung",
      "Prosedur Klaim & Dokumentasi",
      "Jadwal Reviu Polis & Lampiran",
    ],
    tools: [
      {
        slug: "ai-risiko",
        role: "AI-RISIKO",
        name: "AI-RISIKO — Pemeta Risiko & Nilai Pertanggungan",
        mission:
          "Susun inventarisasi risiko aset dan nilai pertanggungan: risiko per kategori dengan tingkat paparan, nilai penggantian bangunan dan isi (bukan harga pasar tanah), kebutuhan perlindungan pendapatan sewa, dan prioritas cakupan; nilai yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "ai-polis",
        role: "AI-POLIS",
        name: "AI-POLIS — Analis Polis & Klausul",
        mission:
          "Susun analisis polis: jenis polis yang sesuai kebutuhan (PSAKI, gempa, business interruption, liability), pengecualian dan klausul yang wajib dicermati, kerangka perbandingan penawaran antar-penanggung, prosedur klaim, dan daftar poin yang wajib dikonfirmasi ke broker berlisensi.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua risiko material aset teridentifikasi dan terpetakan ke cakupan polis",
      "Kepatuhan Legal & Regulasi — ketentuan asuransi Indonesia dirujuk benar, tanpa janji cakupan menyesatkan",
      "Ketelitian — nilai pertanggungan, pengecualian, dan klausul dianalisis detail dan akurat",
      "Kacamata Praktisi Ahli — kedalaman praktisi manajemen risiko properti, bukan brosur produk asuransi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pajak-properti-claw",
    name: "Pajak Properti Claw — Spesialis Dokumen Pajak Properti",
    tagline: "Wawancara → Pemetaan Kewajiban → Perhitungan & Jadwal → Dokumen → Evaluasi Rubrik",
    avatar: "🧾",
    category: "property",
    docLabel: "Dokumen Pajak Properti (Property Tax Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Pajak Properti yang akurat dan terperinci tentang kewajiban pajak properti — komprehensif dan terorganisir, memuat nilai ketetapan, tarif, pengecualian/keringanan, dan tenggat pembayaran — untuk dipakai pemilik dan investor memahami serta merencanakan kewajiban pajaknya. Terapkan praktik terbaik konteks Indonesia: pemetaan pajak per fase kepemilikan (perolehan: BPHTB; kepemilikan: PBB-P2 berbasis NJOP; penyewaan: PPh final sewa; penjualan: PPh final pengalihan; PPN untuk properti baru dari pengembang), perhitungan per pajak dengan dasar pengenaan dan tarif berlaku, keringanan/pengecualian yang tersedia (NJOPTKP, NPOPTKP), kalender tenggat pembayaran dan pelaporan, dokumentasi bukti bayar tertata, dan skenario perencanaan pajak yang legal. Dokumen bukan pengganti nasihat konsultan pajak — sarankan konsultasi untuk kasus kompleks.",
    interviewTopics: [
      "properti yang didokumentasikan (jenis, lokasi, NJOP, status kepemilikan)",
      "fase yang relevan (baru beli, sedang disewakan, akan dijual)",
      "SPPT PBB & bukti pajak yang sudah dimiliki",
      "pendapatan sewa & rencana transaksi ke depan",
      "masalah pajak yang pernah dialami (denda, sengketa NJOP)",
    ],
    structure: [
      "Ringkasan Kewajiban Pajak & Total Estimasi",
      "Profil Properti & Dasar Pengenaan (NJOP)",
      "Pajak Perolehan (BPHTB) & Perhitungannya",
      "Pajak Kepemilikan (PBB-P2) & Keringanan",
      "Pajak Penyewaan & Penjualan (PPh Final, PPN)",
      "Kalender Tenggat Pembayaran & Pelaporan",
      "Dokumentasi Bukti Bayar & Kepatuhan",
      "Perencanaan Pajak Legal & Lampiran",
    ],
    tools: [
      {
        slug: "px-hitung",
        role: "PX-HITUNG",
        name: "PX-HITUNG — Pemeta & Penghitung Kewajiban",
        mission:
          "Petakan dan hitung kewajiban pajak per fase kepemilikan: BPHTB, PBB-P2 berbasis NJOP, PPh final sewa/pengalihan, dan PPN bila relevan — dengan dasar pengenaan, tarif berlaku, dan keringanan yang tersedia; tarif daerah yang bervariasi ditandai [ASUMSI].",
      },
      {
        slug: "px-patuh",
        role: "PX-PATUH",
        name: "PX-PATUH — Perencana Kepatuhan & Kalender",
        mission:
          "Susun kerangka kepatuhan: kalender tenggat pembayaran dan pelaporan per pajak, checklist dokumen bukti bayar, skenario perencanaan pajak legal, dan daftar kasus yang wajib dikonsultasikan ke konsultan pajak.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Komprehensif — semua pajak relevan per fase kepemilikan tercakup tanpa terlewat",
      "Akurasi & Presisi — dasar pengenaan, tarif, dan perhitungan benar sesuai ketentuan berlaku",
      "Kejelasan & Organisasi — pemilik non-ahli pajak dapat memahami kewajiban dan tenggatnya",
      "Kacamata Praktisi Ahli — kedalaman praktisi pajak properti, bukan ringkasan peraturan mentah",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "dokumen-kpr-claw",
    name: "Pembiayaan KPR Claw — Spesialis Dokumen Pembiayaan Properti",
    tagline: "Wawancara → Struktur Pembiayaan → Kelengkapan Dokumen → Paket KPR → Evaluasi Rubrik",
    avatar: "🏦",
    category: "property",
    docLabel: "Dokumen Pembiayaan Properti (Mortgage Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Pembiayaan Properti yang memuat informasi esensial untuk pembiayaan — komprehensif, akurat, dan patuh hukum — untuk dipakai calon pemberi pinjaman, peminjam, dan profesional hukum dalam transaksi properti hingga memperlancar proses pembiayaan. Terapkan praktik terbaik konteks Indonesia: profil pembiayaan lengkap (nilai properti, LTV sesuai ketentuan BI, tenor, jenis bunga fixed/floating), profil kelayakan peminjam (penghasilan, DBR, riwayat SLIK), struktur jaminan (APHT/Hak Tanggungan atas objek), dokumen persyaratan per pihak (identitas, penghasilan, legalitas objek), simulasi angsuran dengan skenario bunga, biaya-biaya pembiayaan (provisi, appraisal, notaris, asuransi jiwa/kebakaran), klausul penting perjanjian kredit yang wajib dicermati, dan proses tahap demi tahap sampai akad. Dokumen bukan pengganti nasihat bank/notaris — sarankan verifikasi ke lembaga pembiayaan.",
    interviewTopics: [
      "properti yang dibiayai (jenis, harga, status sertifikat)",
      "kebutuhan pembiayaan (plafon, tenor, uang muka tersedia)",
      "profil peminjam (penghasilan, kewajiban berjalan, riwayat kredit)",
      "penawaran bank yang sedang dipertimbangkan",
      "kekhawatiran utama (bunga floating, penalti pelunasan, take-over)",
    ],
    structure: [
      "Ringkasan Struktur Pembiayaan yang Diusulkan",
      "Profil Properti & Legalitas Objek Jaminan",
      "Profil & Kelayakan Peminjam (DBR, SLIK)",
      "Struktur Kredit: Plafon, LTV, Tenor, Bunga",
      "Simulasi Angsuran & Skenario Bunga",
      "Biaya-Biaya Pembiayaan & Asuransi",
      "Klausul Penting Perjanjian Kredit & Hak Tanggungan",
      "Proses Pengajuan hingga Akad & Lampiran",
    ],
    tools: [
      {
        slug: "mg-struktur",
        role: "MG-STRUKTUR",
        name: "MG-STRUKTUR — Perancang Struktur Pembiayaan",
        mission:
          "Susun struktur pembiayaan: plafon dan LTV sesuai ketentuan, tenor dan jenis bunga dengan simulasi angsuran multi-skenario, kelayakan peminjam (DBR), dan total biaya pembiayaan; suku bunga dan ketentuan bank yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "mg-legal",
        role: "MG-LEGAL",
        name: "MG-LEGAL — Analis Dokumen & Klausul",
        mission:
          "Susun kelengkapan legal: daftar dokumen persyaratan per pihak, struktur jaminan Hak Tanggungan (APHT), klausul perjanjian kredit yang wajib dicermati (penalti, take-over, wanprestasi), dan checklist proses sampai akad berikut poin yang wajib diverifikasi ke bank/notaris.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian — struktur pembiayaan, simulasi, dan biaya dihitung lengkap dan akurat",
      "Kejelasan — peminjam non-ahli memahami kewajiban, risiko bunga, dan proses sampai akad",
      "Kepatuhan Hukum — ketentuan LTV, Hak Tanggungan, dan perjanjian kredit sesuai regulasi Indonesia",
      "Kacamata Praktisi Ahli — kedalaman praktisi pembiayaan properti, bukan brosur produk KPR",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rent-roll-claw",
    name: "Rent Roll Claw — Spesialis Dokumen Rent Roll",
    tagline: "Wawancara → Data Sewa → Struktur Dokumen → Rent Roll → Evaluasi Rubrik",
    avatar: "📋",
    category: "property",
    docLabel: "Dokumen Rent Roll (Rent Roll Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Rent Roll yang memuat informasi komprehensif tentang properti sewaan — terperinci dan akurat: nama penyewa, tarif sewa, jangka waktu sewa, dan riwayat pembayaran — untuk dipakai pengelola properti dan analis keuangan melacak pendapatan sewa dan menganalisis kinerja finansial. Terapkan praktik terbaik: struktur data per unit lengkap (nomor unit, luas, penyewa, tarif per m², mulai-akhir sewa, deposit, eskalasi, status pembayaran), ringkasan portofolio (tingkat hunian fisik dan ekonomis, WALE/rata-rata sisa masa sewa, total pendapatan efektif), penanda unit bermasalah (tunggakan, sewa di bawah pasar, kontrak segera berakhir), jadwal berakhirnya sewa (lease expiry profile), konsistensi format antar-periode agar tren terbaca, dan catatan sumber data per kolom.",
    interviewTopics: [
      "portofolio sewaan (jenis properti, jumlah unit, lokasi)",
      "data sewa yang tersedia (kontrak, pembayaran, deposit)",
      "format pelaporan yang dipakai saat ini & masalahnya",
      "audiens dokumen (pemilik, bank, calon pembeli)",
      "unit bermasalah yang diketahui (tunggakan, kosong, sengketa)",
    ],
    structure: [
      "Ringkasan Portofolio (hunian, pendapatan efektif, WALE)",
      "Tabel Rent Roll per Unit (penyewa, tarif, masa sewa, status)",
      "Riwayat & Status Pembayaran per Penyewa",
      "Jadwal Berakhirnya Sewa (Expiry Profile)",
      "Unit Bermasalah & Tindak Lanjut",
      "Analisis Tarif vs Pasar",
      "Catatan Sumber Data & Definisi Kolom",
      "Lampiran Kontrak & Bukti",
    ],
    tools: [
      {
        slug: "rr-data",
        role: "RR-DATA",
        name: "RR-DATA — Penyusun Struktur Data Sewa",
        mission:
          "Susun struktur rent roll per unit: kolom lengkap (unit, luas, penyewa, tarif, masa sewa, deposit, eskalasi, status bayar) dengan definisi konsisten antar-periode dan catatan sumber data; data yang belum diverifikasi ke kontrak ditandai [ASUMSI].",
      },
      {
        slug: "rr-analisis",
        role: "RR-ANALISIS",
        name: "RR-ANALISIS — Analis Kinerja Sewa",
        mission:
          "Susun analisis portofolio: tingkat hunian fisik vs ekonomis, WALE, pendapatan efektif, profil berakhirnya sewa, unit bermasalah (tunggakan, di bawah pasar, segera berakhir) berikut rekomendasi tindak lanjut per unit.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua unit dan kolom kunci (penyewa, tarif, masa, status bayar) terekam",
      "Organisasi — struktur tabel dan ringkasan mudah dibaca pengelola maupun analis",
      "Konsistensi — definisi kolom dan format seragam sehingga tren antar-periode terbaca",
      "Kacamata Praktisi Ahli — kedalaman pengelola aset senior, bukan daftar penyewa tanpa analisis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-biaya-operasional-claw",
    name: "Biaya Operasional Claw — Spesialis Laporan Biaya Operasional Properti",
    tagline: "Wawancara → Klasifikasi Biaya → Analisis & Benchmark → Laporan → Evaluasi Rubrik",
    avatar: "💸",
    category: "property",
    docLabel: "Laporan Biaya Operasional (Operating Expense Report)",
    mission:
      "Membantu pengguna menyusun Laporan Biaya Operasional yang menyajikan informasi terperinci biaya operasional properti — akurat mencerminkan kinerja finansial dan membantu keputusan investasi — untuk dipakai investor dan pemangku kepentingan pengelola properti. Terapkan praktik terbaik: klasifikasi biaya standar (utilitas, pemeliharaan, keamanan-kebersihan, asuransi, pajak, manajemen, cadangan penggantian), pemisahan biaya operasional vs belanja modal (CapEx), analisis biaya per m² dan rasio biaya terhadap pendapatan (OER), perbandingan periode-ke-periode dengan penjelasan varian, benchmark terhadap properti sejenis, identifikasi kebocoran biaya dan peluang efisiensi, rekonsiliasi service charge bila multi-penyewa, dan rekomendasi pengendalian biaya yang terukur.",
    interviewTopics: [
      "properti yang dilaporkan (jenis, luas, jumlah unit/penyewa)",
      "data biaya yang tersedia & periode pelaporan",
      "pendapatan operasional untuk rasio biaya",
      "biaya yang dirasa membengkak atau tidak wajar",
      "audiens laporan & keputusan yang diharapkan",
    ],
    structure: [
      "Ringkasan Biaya & Rasio Kunci (OER, biaya per m²)",
      "Klasifikasi Biaya per Kategori",
      "Pemisahan Biaya Operasional vs Belanja Modal",
      "Analisis Varian Periode-ke-Periode",
      "Benchmark terhadap Properti Sejenis",
      "Kebocoran Biaya & Peluang Efisiensi",
      "Rekonsiliasi Service Charge (bila relevan)",
      "Rekomendasi Pengendalian Biaya & Lampiran",
    ],
    tools: [
      {
        slug: "ox-klasifikasi",
        role: "OX-KLASIFIKASI",
        name: "OX-KLASIFIKASI — Pengklasifikasi & Perekam Biaya",
        mission:
          "Susun klasifikasi biaya standar per kategori dengan pemisahan tegas biaya operasional vs belanja modal, biaya per m², dan rasio biaya terhadap pendapatan; alokasi biaya yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "ox-efisiensi",
        role: "OX-EFISIENSI",
        name: "OX-EFISIENSI — Analis Varian & Efisiensi",
        mission:
          "Susun analisis pengendalian: varian periode-ke-periode dengan akar penyebab, benchmark terhadap properti sejenis, identifikasi kebocoran biaya, dan rekomendasi efisiensi terukur dengan estimasi penghematan.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan — struktur biaya dan rasio tersaji sehingga investor cepat memahami kinerja",
      "Relevansi — kategori dan analisis sesuai jenis properti dan kebutuhan keputusan",
      "Kedalaman Analisis — varian, benchmark, dan peluang efisiensi dianalisis dengan angka",
      "Kacamata Praktisi Ahli — kedalaman pengelola keuangan properti senior, bukan rekap kuitansi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kinerja-investasi-claw",
    name: "Kinerja Investasi Claw — Spesialis Laporan Kinerja Investasi Properti",
    tagline: "Wawancara → Data Kinerja → Analisis & Visual → Laporan → Evaluasi Rubrik",
    avatar: "📈",
    category: "property",
    docLabel: "Laporan Kinerja Investasi (Investment Performance Report)",
    mission:
      "Membantu pengguna menyusun Laporan Kinerja Investasi yang memberi wawasan dan analisis komprehensif atas kinerja investasi properti — data akurat, visualisasi jelas, dan rekomendasi dapat ditindaklanjuti — untuk dipakai investor, penasihat keuangan, dan manajer portofolio menilai kinerja dan mengarahkan keputusan investasi berikutnya. Terapkan praktik terbaik: metrik kinerja standar (NOI, cash-on-cash return, cap rate aktual, total return termasuk apresiasi, IRR sejak akuisisi), perbandingan realisasi vs proyeksi awal (underwriting) dengan analisis varian, kinerja per aset dan agregat portofolio, tren multi-periode, atribusi kinerja (pendapatan, biaya, nilai), posisi terhadap benchmark pasar, dan rekomendasi aksi per aset (tahan, perbaiki, jual) tertelusur ke angka.",
    interviewTopics: [
      "portofolio/aset yang dilaporkan (jumlah, jenis, nilai akuisisi)",
      "data kinerja yang tersedia (pendapatan, biaya, penilaian terkini)",
      "proyeksi awal (underwriting) untuk perbandingan realisasi",
      "periode pelaporan & frekuensi yang diinginkan",
      "keputusan yang akan diambil dari laporan (tahan, jual, refinancing)",
    ],
    structure: [
      "Ringkasan Eksekutif & Skor Kinerja Portofolio",
      "Metrik Kinerja per Aset (NOI, cash-on-cash, cap rate)",
      "Realisasi vs Proyeksi Awal & Analisis Varian",
      "Tren Kinerja Multi-Periode",
      "Atribusi Kinerja (pendapatan, biaya, nilai)",
      "Posisi terhadap Benchmark Pasar",
      "Rekomendasi Aksi per Aset (tahan/perbaiki/jual)",
      "Metodologi, Sumber Data & Lampiran",
    ],
    tools: [
      {
        slug: "ki-metrik",
        role: "KI-METRIK",
        name: "KI-METRIK — Penghitung Metrik Kinerja",
        mission:
          "Hitung metrik kinerja per aset dan portofolio: NOI, cash-on-cash, cap rate aktual, total return, IRR sejak akuisisi, dan perbandingan realisasi vs underwriting dengan varian; data yang belum terverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "ki-arah",
        role: "KI-ARAH",
        name: "KI-ARAH — Analis Atribusi & Rekomendasi",
        mission:
          "Susun analisis arah: atribusi kinerja (pendapatan, biaya, nilai), tren multi-periode, posisi vs benchmark pasar, dan rekomendasi aksi per aset (tahan/perbaiki/jual/refinancing) yang tertelusur ke metrik.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Data — metrik dihitung benar dari data terverifikasi dengan metodologi jelas",
      "Kedalaman Analitis — varian, atribusi, dan tren dianalisis sampai akar penyebab",
      "Rekomendasi Dapat Ditindaklanjuti — aksi per aset konkret dan tertelusur ke angka",
      "Kacamata Praktisi Ahli — kedalaman manajer portofolio senior, bukan dasbor angka tanpa makna",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 8: real-estate-analyst (property) ──
  {
    kind: "openclaw",
    slug: "penilaian-peluang-investasi-claw",
    name: "Peluang Investasi Claw — Spesialis Penilaian Peluang Investasi Properti",
    tagline: "Wawancara → Skrining Peluang → Analisis Kelayakan → Penilaian → Evaluasi Rubrik",
    avatar: "🎯",
    category: "property",
    docLabel: "Penilaian Peluang Investasi (Investment Opportunity Assessment)",
    mission:
      "Membantu pengguna menyusun Dokumen Penilaian Peluang Investasi yang mengevaluasi peluang investasi di pasar properti secara akurat — untuk dipakai investor dan pemangku kepentingan mengambil keputusan investasi — dengan analisis menyeluruh, interpretasi data akurat, dan penilaian komprehensif. Terapkan praktik terbaik analis: kerangka skrining awal terhadap kriteria investasi, analisis fundamental pasar (permintaan-pasokan, demografi, infrastruktur), analisis finansial cepat (yield, cap rate, potensi apresiasi) dengan asumsi eksplisit, perbandingan antar-peluang dalam matriks skoring berbobot, identifikasi red flag sejak dini, tingkat keyakinan per temuan, dan rekomendasi lanjut/tidak dengan syarat yang jelas.",
    interviewTopics: [
      "peluang yang dinilai (properti/proyek, lokasi, harga, sumber informasi)",
      "kriteria investasi organisasi (yield minimum, jenis aset, horizon)",
      "data yang sudah tersedia (harga pembanding, pendapatan, kondisi)",
      "batas waktu keputusan & proses persetujuan internal",
      "peluang alternatif yang sedang dibandingkan",
    ],
    structure: [
      "Ringkasan Penilaian & Rekomendasi Lanjut/Tidak",
      "Deskripsi Peluang & Sumber Informasi",
      "Skrining terhadap Kriteria Investasi",
      "Analisis Fundamental Pasar",
      "Analisis Finansial Cepat (yield, cap rate, apresiasi)",
      "Matriks Skoring & Perbandingan Antar-Peluang",
      "Red Flag & Tingkat Keyakinan per Temuan",
      "Syarat Lanjut ke Uji Tuntas & Lampiran",
    ],
    tools: [
      {
        slug: "io-skrining",
        role: "IO-SKRINING",
        name: "IO-SKRINING — Penyaring Peluang & Pasar",
        mission:
          "Susun skrining peluang: kesesuaian terhadap kriteria investasi, analisis fundamental pasar (permintaan-pasokan, demografi, infrastruktur), red flag awal, dan tingkat keyakinan per temuan; data yang belum terverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "io-skor",
        role: "IO-SKOR",
        name: "IO-SKOR — Penilai Finansial & Skoring",
        mission:
          "Susun penilaian finansial cepat: yield, cap rate, potensi apresiasi dengan asumsi eksplisit, matriks skoring berbobot antar-peluang, dan rekomendasi lanjut/tidak dengan syarat jelas menuju uji tuntas; angka asumsi ditandai [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Analisis Menyeluruh — pasar, finansial, dan risiko peluang dievaluasi dengan kerangka jelas",
      "Interpretasi Data Akurat — kesimpulan tertelusur ke data dengan tingkat keyakinan jujur",
      "Penilaian Komprehensif — matriks skoring dan rekomendasi mempertimbangkan semua faktor material",
      "Kacamata Praktisi Ahli — kedalaman analis investasi senior, bukan opini tanpa kerangka",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-valuasi-properti-claw",
    name: "Valuasi Properti Claw — Spesialis Laporan Valuasi Properti",
    tagline: "Wawancara → Pendekatan Nilai → Data Pasar → Laporan Valuasi → Evaluasi Rubrik",
    avatar: "⚖️",
    category: "property",
    docLabel: "Laporan Valuasi Properti (Property Valuation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Valuasi Properti yang akurat dan komprehensif — terperinci, berbasis riset, dengan data dan analisis pasar relevan — untuk dipakai investor, pemberi pinjaman, dan pemilik properti mengambil keputusan investasi, pembiayaan, dan penjualan. Terapkan praktik terbaik penilaian (selaras KEPI/SPI di Indonesia): tiga pendekatan nilai dengan justifikasi pemilihan (pendekatan pasar/data pembanding, pendekatan pendapatan/kapitalisasi & DCF, pendekatan biaya), penyesuaian pembanding yang transparan, dasar nilai dinyatakan jelas (nilai pasar vs nilai likuidasi), tanggal penilaian dan asumsi pembatas, rekonsiliasi indikasi nilai antar-pendekatan, dan sensitivitas terhadap parameter kunci. Laporan bukan pengganti penilaian resmi KJPP — sarankan KJPP berlisensi untuk keperluan legal/perbankan.",
    interviewTopics: [
      "properti yang dinilai (jenis, lokasi, luas tanah-bangunan, kondisi)",
      "tujuan valuasi (jual-beli, pembiayaan, pelaporan, internal)",
      "data pembanding yang tersedia (transaksi/penawaran sekitar)",
      "data pendapatan bila properti komersial (sewa, hunian, biaya)",
      "tanggal penilaian & dasar nilai yang dibutuhkan",
    ],
    structure: [
      "Ringkasan Nilai & Dasar Penilaian",
      "Identifikasi Properti & Tujuan Valuasi",
      "Analisis Pasar & Lingkungan",
      "Pendekatan Pasar: Data Pembanding & Penyesuaian",
      "Pendekatan Pendapatan: Kapitalisasi & DCF",
      "Pendekatan Biaya (bila relevan)",
      "Rekonsiliasi Nilai & Sensitivitas",
      "Asumsi Pembatas, Disclaimer & Lampiran",
    ],
    tools: [
      {
        slug: "vl-pembanding",
        role: "VL-PEMBANDING",
        name: "VL-PEMBANDING — Analis Data Pembanding",
        mission:
          "Susun pendekatan pasar: pemilihan pembanding yang relevan, tabel penyesuaian transparan (lokasi, luas, kondisi, waktu, legalitas), indikasi nilai per m², dan kewajaran rentang nilai; pembanding tanpa verifikasi transaksi ditandai [ASUMSI].",
      },
      {
        slug: "vl-pendapatan",
        role: "VL-PENDAPATAN",
        name: "VL-PENDAPATAN — Analis Pendekatan Pendapatan & Rekonsiliasi",
        mission:
          "Susun pendekatan pendapatan: NOI ternormalisasi, pemilihan cap rate/discount rate berjustifikasi, DCF bila relevan, rekonsiliasi indikasi nilai antar-pendekatan dengan bobot beralasan, dan sensitivitas parameter kunci; asumsi ditandai [ASUMSI].",
      },
    ],
    evaluatorCriteria: [
      "Akurasi — pendekatan nilai diterapkan benar dengan penyesuaian dan parameter berjustifikasi",
      "Ketelitian — data pembanding dan pendapatan diverifikasi dan didokumentasikan sumbernya",
      "Kelengkapan — dasar nilai, asumsi pembatas, dan rekonsiliasi dinyatakan eksplisit",
      "Kacamata Praktisi Ahli — kedalaman penilai properti senior, bukan tebakan harga pasaran",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proposal-disposisi-claw",
    name: "Disposisi Claw — Spesialis Proposal Disposisi Aset Properti",
    tagline: "Wawancara → Analisis Opsi → Strategi Pelepasan → Proposal → Evaluasi Rubrik",
    avatar: "🏷️",
    category: "property",
    docLabel: "Proposal Disposisi (Disposition Proposal)",
    mission:
      "Membantu pengguna menyusun Proposal Disposisi yang komprehensif dan berbasis riset — dengan analisis terperinci dan rekomendasi — untuk dipakai tim properti dan manajemen senior menentukan langkah terbaik melepas sebuah aset. Terapkan praktik terbaik: alasan disposisi tertelusur ke strategi portofolio, analisis kinerja aset saat ini vs potensi, perbandingan opsi pelepasan (jual langsung, lelang, sale-and-leaseback, tukar guling, tahan-perbaiki-jual) dengan analisis finansial per opsi, estimasi nilai realisasi bersih setelah pajak dan biaya transaksi, timing pasar dan strategi pemasaran aset, analisis dampak ke portofolio (alokasi, arus kas), risiko eksekusi per opsi, dan rekomendasi dengan syarat harga minimum (reserve price).",
    interviewTopics: [
      "aset yang akan dilepas (jenis, lokasi, nilai buku, kondisi)",
      "alasan pelepasan (kinerja, strategi, kebutuhan dana)",
      "kinerja aset saat ini (pendapatan, biaya, hunian)",
      "opsi yang sedang dipertimbangkan & preferensi manajemen",
      "target waktu & harga minimum yang diharapkan",
    ],
    structure: [
      "Ringkasan Eksekutif & Rekomendasi Opsi",
      "Profil Aset & Alasan Disposisi",
      "Kinerja Aset Saat Ini vs Potensi",
      "Perbandingan Opsi Pelepasan & Analisis Finansial",
      "Estimasi Nilai Realisasi Bersih (setelah pajak & biaya)",
      "Timing Pasar & Strategi Pemasaran Aset",
      "Dampak ke Portofolio & Risiko Eksekusi",
      "Syarat Harga Minimum, Jadwal & Lampiran",
    ],
    tools: [
      {
        slug: "dz-opsi",
        role: "DZ-OPSI",
        name: "DZ-OPSI — Analis Opsi Pelepasan",
        mission:
          "Susun perbandingan opsi disposisi: analisis finansial per opsi (jual langsung, lelang, sale-and-leaseback, tukar guling, tahan-perbaiki-jual), nilai realisasi bersih setelah PPh final dan biaya transaksi, dan risiko eksekusi per opsi; estimasi nilai ditandai [ASUMSI].",
      },
      {
        slug: "dz-eksekusi",
        role: "DZ-EKSEKUSI",
        name: "DZ-EKSEKUSI — Perancang Strategi Eksekusi",
        mission:
          "Susun strategi eksekusi opsi terpilih: timing pasar, strategi pemasaran aset dan target pembeli, syarat harga minimum (reserve price), jadwal proses sampai serah terima, dan dampak pelepasan ke alokasi portofolio dan arus kas.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Analisis — kinerja aset dan nilai realisasi dihitung benar dengan pajak dan biaya nyata",
      "Kelayakan Rekomendasi — opsi terpilih realistis dieksekusi di kondisi pasar saat ini",
      "Keselarasan Strategis — keputusan pelepasan tertelusur ke sasaran portofolio perusahaan",
      "Kacamata Praktisi Ahli — kedalaman manajer aset senior, bukan iklan jual properti",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "prakiraan-tren-pasar-claw",
    name: "Tren Pasar Claw — Spesialis Prakiraan Tren Pasar Properti",
    tagline: "Wawancara → Data Historis → Model Prakiraan → Dokumen Tren → Evaluasi Rubrik",
    avatar: "🔮",
    category: "property",
    docLabel: "Dokumen Prakiraan Tren Pasar (Market Trend Forecast Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Prakiraan Tren Pasar properti yang membantu mengantisipasi arah pasar dan mengambil posisi investasi lebih awal — untuk dipakai tim investasi dan manajemen senior. Terapkan praktik terbaik analis: baseline data historis multi-periode (harga, volume transaksi, pasokan baru, penyerapan, hunian), pemetaan pendorong pasar (suku bunga, kebijakan pemerintah, infrastruktur, demografi), metodologi prakiraan yang dinyatakan jujur (ekstrapolasi tren, analisis siklus, indikator awal), skenario dasar-optimis-pesimis dengan probabilitas kualitatif, implikasi per segmen (residensial, komersial, industri) dan per kawasan, sinyal pemicu yang harus dipantau, batas ketidakpastian prakiraan yang transparan, dan rekomendasi posisi investasi per skenario.",
    interviewTopics: [
      "pasar yang diprakirakan (segmen, kawasan, horizon waktu)",
      "data historis yang tersedia (harga, transaksi, pasokan)",
      "keputusan yang bergantung pada prakiraan ini",
      "faktor eksternal yang dikhawatirkan (suku bunga, regulasi, ekonomi)",
      "toleransi risiko & fleksibilitas posisi investasi",
    ],
    structure: [
      "Ringkasan Prakiraan & Arah Pasar",
      "Baseline Data Historis & Kondisi Saat Ini",
      "Pendorong Pasar & Analisis Dampaknya",
      "Metodologi Prakiraan & Batas Ketidakpastian",
      "Skenario Dasar–Optimis–Pesimis",
      "Implikasi per Segmen & Kawasan",
      "Sinyal Pemicu yang Harus Dipantau",
      "Rekomendasi Posisi per Skenario & Lampiran",
    ],
    tools: [
      {
        slug: "tf-data",
        role: "TF-DATA",
        name: "TF-DATA — Analis Data & Pendorong Pasar",
        mission:
          "Susun baseline dan pendorong: tren historis multi-periode (harga, volume, pasokan, penyerapan), pemetaan pendorong pasar dengan arah dampaknya, dan kondisi siklus saat ini; data tanpa sumber terverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "tf-skenario",
        role: "TF-SKENARIO",
        name: "TF-SKENARIO — Penyusun Skenario & Implikasi",
        mission:
          "Susun prakiraan berskenario: dasar-optimis-pesimis dengan asumsi eksplisit per skenario, implikasi per segmen dan kawasan, sinyal pemicu yang harus dipantau, dan rekomendasi posisi investasi per skenario dengan batas ketidakpastian jujur.",
      },
    ],
    evaluatorCriteria: [
      "Riset Menyeluruh — baseline historis dan pendorong pasar didukung data bersumber",
      "Metodologi Jujur — cara prakiraan dan batas ketidakpastiannya dinyatakan transparan",
      "Implikasi Dapat Ditindaklanjuti — skenario diterjemahkan ke posisi investasi konkret",
      "Kacamata Praktisi Ahli — kedalaman analis riset pasar senior, bukan ramalan tanpa dasar",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perbandingan-properti-claw",
    name: "Perbandingan Properti Claw — Spesialis Laporan Perbandingan Properti",
    tagline: "Wawancara → Kriteria Berbobot → Matriks Perbandingan → Laporan → Evaluasi Rubrik",
    avatar: "🆚",
    category: "property",
    docLabel: "Laporan Perbandingan Properti (Property Comparison Report)",
    mission:
      "Membantu pengguna menyusun Laporan Perbandingan Properti yang membandingkan beberapa kandidat secara adil dan terukur — untuk dipakai investor memilih properti terbaik sesuai tujuannya. Terapkan praktik terbaik: kriteria perbandingan yang relevan dengan tujuan investasi (lokasi, harga per m², kondisi, legalitas, yield, potensi apresiasi, risiko), bobot kriteria yang dinyatakan eksplisit dan disepakati, data per kandidat dari sumber yang dicatat, normalisasi agar perbandingan apple-to-apple (harga per m², yield bersih), matriks skoring dengan perhitungan transparan, analisis kelebihan-kekurangan naratif per kandidat, uji sensitivitas peringkat terhadap perubahan bobot, dan rekomendasi peringkat dengan justifikasi.",
    interviewTopics: [
      "kandidat yang dibandingkan (jumlah, jenis, lokasi, harga)",
      "tujuan investasi & kriteria yang paling penting",
      "data yang tersedia per kandidat (harga, kondisi, pendapatan)",
      "bobot preferensi antar-kriteria",
      "batas waktu & proses keputusan",
    ],
    structure: [
      "Ringkasan & Rekomendasi Peringkat",
      "Tujuan Investasi & Kriteria Berbobot",
      "Profil per Kandidat & Sumber Data",
      "Normalisasi Data (harga per m², yield bersih)",
      "Matriks Skoring & Perhitungan",
      "Kelebihan–Kekurangan per Kandidat",
      "Sensitivitas Peringkat terhadap Bobot",
      "Rekomendasi, Langkah Lanjut & Lampiran",
    ],
    tools: [
      {
        slug: "pc-matriks",
        role: "PC-MATRIKS",
        name: "PC-MATRIKS — Penyusun Kriteria & Matriks",
        mission:
          "Susun kerangka perbandingan: kriteria relevan dengan bobot eksplisit, normalisasi data antar-kandidat (harga per m², yield bersih), dan matriks skoring dengan perhitungan transparan; data kandidat yang belum diverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "pc-putusan",
        role: "PC-PUTUSAN",
        name: "PC-PUTUSAN — Analis Peringkat & Sensitivitas",
        mission:
          "Susun analisis keputusan: kelebihan-kekurangan naratif per kandidat, uji sensitivitas peringkat terhadap perubahan bobot, risiko spesifik per kandidat, dan rekomendasi peringkat berjustifikasi dengan langkah lanjut.",
      },
    ],
    evaluatorCriteria: [
      "Perbandingan Adil — data ternormalisasi dan bobot eksplisit, tanpa bias ke kandidat tertentu",
      "Ketelusuran — skor dan peringkat tertelusur ke data bersumber dan perhitungan transparan",
      "Kedalaman Analisis — kelebihan-kekurangan dan sensitivitas dianalisis, bukan sekadar tabel skor",
      "Kacamata Praktisi Ahli — kedalaman analis investasi senior, bukan daftar iklan properti",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-sewa-claw",
    name: "Analisis Sewa Claw — Spesialis Dokumen Analisis Sewa",
    tagline: "Wawancara → Bedah Kontrak → Analisis Finansial Sewa → Dokumen → Evaluasi Rubrik",
    avatar: "📃",
    category: "property",
    docLabel: "Dokumen Analisis Sewa (Lease Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Sewa yang membedah kontrak sewa secara menyeluruh — untuk dipakai investor, pengelola, dan calon penyewa memahami nilai dan risiko sebuah perjanjian sewa. Terapkan praktik terbaik: abstraksi ketentuan kunci kontrak (para pihak, objek, masa sewa, opsi perpanjangan, tarif dan eskalasi, deposit, service charge, kewajiban pemeliharaan, klausul pemutusan), analisis finansial sewa (tarif efektif setelah insentif, beban total okupansi, perbandingan terhadap pasar), identifikasi klausul berisiko dan tidak seimbang, analisis posisi negosiasi (leverage masing-masing pihak), skenario perpanjangan vs relokasi bila relevan, dan rekomendasi negosiasi dengan prioritas.",
    interviewTopics: [
      "kontrak yang dianalisis (jenis properti, posisi pengguna: pemilik/penyewa)",
      "ketentuan utama yang sudah diketahui (tarif, masa, eskalasi)",
      "tujuan analisis (negosiasi baru, perpanjangan, audit portofolio)",
      "data pasar sewa pembanding yang tersedia",
      "masalah sewa yang pernah terjadi (sengketa, tunggakan, service charge)",
    ],
    structure: [
      "Ringkasan Analisis & Rekomendasi",
      "Abstraksi Ketentuan Kunci Kontrak",
      "Analisis Tarif Efektif & Beban Total Okupansi",
      "Perbandingan terhadap Pasar",
      "Klausul Berisiko & Ketidakseimbangan",
      "Posisi Negosiasi & Leverage",
      "Skenario Perpanjangan vs Alternatif",
      "Rekomendasi Negosiasi Berprioritas & Lampiran",
    ],
    tools: [
      {
        slug: "ls-abstrak",
        role: "LS-ABSTRAK",
        name: "LS-ABSTRAK — Pengabstraksi Kontrak",
        mission:
          "Susun abstraksi kontrak sewa: ketentuan kunci terstruktur (tarif, eskalasi, masa, opsi, deposit, service charge, pemeliharaan, pemutusan), klausul berisiko atau tidak seimbang dengan tingkat keparahan; ketentuan yang belum terkonfirmasi dari dokumen ditandai [ASUMSI].",
      },
      {
        slug: "ls-nilai",
        role: "LS-NILAI",
        name: "LS-NILAI — Analis Nilai & Negosiasi",
        mission:
          "Susun analisis nilai: tarif efektif setelah insentif, beban total okupansi, posisi terhadap pasar pembanding, leverage negosiasi kedua pihak, skenario perpanjangan vs alternatif, dan rekomendasi negosiasi berprioritas.",
      },
    ],
    evaluatorCriteria: [
      "Ketelitian Abstraksi — semua ketentuan material kontrak terekam akurat dan terstruktur",
      "Kedalaman Finansial — tarif efektif dan beban total dihitung benar dan dibandingkan ke pasar",
      "Rekomendasi Tajam — poin negosiasi berprioritas dan tertelusur ke temuan analisis",
      "Kacamata Praktisi Ahli — kedalaman analis sewa komersial senior, bukan rangkuman kontrak",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-kredit-penyewa-claw",
    name: "Kredit Penyewa Claw — Spesialis Analisis Kredit Penyewa",
    tagline: "Wawancara → Data Keuangan → Skoring Risiko → Dokumen Analisis → Evaluasi Rubrik",
    avatar: "🧮",
    category: "property",
    docLabel: "Dokumen Analisis Kredit Penyewa (Tenant Credit Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Kredit Penyewa yang menilai kemampuan dan kemauan bayar calon/eksisting penyewa — untuk dipakai pemilik dan pengelola properti memutuskan penerimaan penyewa, syarat sewa, dan mitigasi risiko. Terapkan praktik terbaik: profil penyewa lengkap (individu: penghasilan, pekerjaan, riwayat sewa; badan usaha: laporan keuangan, lama beroperasi, industri), analisis kemampuan bayar (rasio sewa terhadap penghasilan/pendapatan), verifikasi dokumen dan referensi, skoring risiko dengan kriteria eksplisit, mitigasi per tingkat risiko (deposit lebih besar, penjamin, jaminan bank), pemantauan berkala penyewa eksisting, dan kepatuhan pada etika serta privasi data dalam pengumpulan informasi.",
    interviewTopics: [
      "penyewa yang dianalisis (individu/badan usaha, sektor, ukuran)",
      "nilai sewa & syarat yang direncanakan",
      "dokumen keuangan yang tersedia (slip gaji, laporan keuangan, referensi)",
      "pengalaman buruk penyewa sebelumnya yang ingin dihindari",
      "kebijakan risiko pemilik (toleransi, deposit standar)",
    ],
    structure: [
      "Ringkasan Skor Risiko & Rekomendasi",
      "Profil Penyewa & Verifikasi Dokumen",
      "Analisis Kemampuan Bayar (rasio sewa/penghasilan)",
      "Riwayat Sewa & Referensi",
      "Skoring Risiko & Kriteria Penilaian",
      "Mitigasi per Tingkat Risiko (deposit, penjamin)",
      "Rencana Pemantauan Berkala",
      "Catatan Etika & Privasi Data, Lampiran",
    ],
    tools: [
      {
        slug: "tc-profil",
        role: "TC-PROFIL",
        name: "TC-PROFIL — Penyusun Profil & Verifikasi",
        mission:
          "Susun profil kredit penyewa: data keuangan terstruktur (penghasilan/laporan keuangan), checklist verifikasi dokumen dan referensi, riwayat sewa, dan rasio kemampuan bayar; data yang belum terverifikasi ditandai [ASUMSI], dengan kepatuhan etika dan privasi data.",
      },
      {
        slug: "tc-skor",
        role: "TC-SKOR",
        name: "TC-SKOR — Penilai Risiko & Mitigasi",
        mission:
          "Susun skoring risiko dengan kriteria eksplisit dan bobot transparan, rekomendasi terima/tolak/terima-dengan-syarat, mitigasi per tingkat risiko (deposit lebih besar, penjamin, jaminan bank), dan rencana pemantauan penyewa eksisting.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Komprehensif — profil keuangan, riwayat, dan referensi penyewa tercakup",
      "Akurasi & Presisi — rasio kemampuan bayar dan skor dihitung benar dengan kriteria eksplisit",
      "Kejelasan & Organisasi — rekomendasi dan mitigasi mudah dieksekusi pengelola",
      "Kacamata Praktisi Ahli — kedalaman analis kredit senior, bukan formulir data penyewa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-capex-claw",
    name: "CapEx Claw — Spesialis Analisis Belanja Modal Properti",
    tagline: "Wawancara → Identifikasi Kebutuhan → Analisis Kelayakan → Dokumen CapEx → Evaluasi Rubrik",
    avatar: "🏗️",
    category: "property",
    docLabel: "Dokumen Analisis Belanja Modal (Capital Expenditure Analysis)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Belanja Modal (CapEx) yang memberi wawasan komprehensif atas kelayakan finansial proyek properti — analisis terperinci, proyeksi, dan rekomendasi — untuk dipakai eksekutif dan pemangku kepentingan memutuskan investasi modal. Terapkan praktik terbaik: inventarisasi kebutuhan CapEx (penggantian wajib vs peningkatan nilai vs kepatuhan regulasi), estimasi biaya per item dengan basis jelas, analisis kelayakan per investasi (dampak ke NOI/nilai aset, payback, ROI), prioritisasi berbasis urgensi-risiko-imbal hasil, jadwal pelaksanaan multi-tahun dengan kebutuhan dana per periode, sumber pendanaan (cadangan, pinjaman, arus kas), dampak pelaksanaan ke operasi dan penyewa, dan sensitivitas terhadap eskalasi biaya.",
    interviewTopics: [
      "aset & kebutuhan CapEx yang teridentifikasi (penggantian, upgrade, kepatuhan)",
      "kondisi aset saat ini & usia sistem utama",
      "anggaran/cadangan yang tersedia & sumber pendanaan",
      "target imbal hasil dari investasi modal (kenaikan sewa, nilai)",
      "batasan pelaksanaan (penyewa aktif, musim, izin)",
    ],
    structure: [
      "Ringkasan Kebutuhan CapEx & Rekomendasi Prioritas",
      "Inventarisasi Kebutuhan per Kategori",
      "Estimasi Biaya per Item & Basisnya",
      "Analisis Kelayakan per Investasi (ROI, payback, dampak NOI)",
      "Matriks Prioritisasi (urgensi–risiko–imbal hasil)",
      "Jadwal Multi-Tahun & Kebutuhan Dana per Periode",
      "Sumber Pendanaan & Dampak ke Operasi",
      "Sensitivitas Eskalasi Biaya & Lampiran",
    ],
    tools: [
      {
        slug: "cx-kebutuhan",
        role: "CX-KEBUTUHAN",
        name: "CX-KEBUTUHAN — Inventarisator Kebutuhan & Biaya",
        mission:
          "Susun inventarisasi CapEx: klasifikasi kebutuhan (penggantian wajib, peningkatan nilai, kepatuhan), estimasi biaya per item dengan basis jelas, dan urgensi berbasis kondisi-usia sistem; biaya yang diperkirakan tanpa penawaran ditandai [ASUMSI].",
      },
      {
        slug: "cx-kelayakan",
        role: "CX-KELAYAKAN",
        name: "CX-KELAYAKAN — Analis Kelayakan & Prioritas",
        mission:
          "Susun analisis kelayakan: dampak per investasi ke NOI dan nilai aset, ROI dan payback, matriks prioritisasi urgensi-risiko-imbal hasil, jadwal multi-tahun dengan kebutuhan dana, sumber pendanaan, dan sensitivitas eskalasi biaya.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Estimasi — biaya per item punya basis jelas dan realistis di pasar konstruksi",
      "Kedalaman Kelayakan — ROI, payback, dan dampak NOI dihitung per investasi, bukan agregat kabur",
      "Prioritisasi Beralasan — urutan pelaksanaan tertelusur ke urgensi, risiko, dan imbal hasil",
      "Kacamata Praktisi Ahli — kedalaman manajer aset senior, bukan daftar keinginan renovasi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-proforma-claw",
    name: "Proforma Claw — Spesialis Analisis Proforma Properti",
    tagline: "Wawancara → Asumsi Model → Proyeksi Multi-Tahun → Dokumen Proforma → Evaluasi Rubrik",
    avatar: "📑",
    category: "property",
    docLabel: "Dokumen Analisis Proforma (Proforma Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Proforma yang menganalisis kinerja dan potensi finansial sebuah investasi properti secara akurat — untuk dipakai investor dan pemangku kepentingan mengambil keputusan — dengan analisis finansial menyeluruh, proyeksi akurat, dan analisis pasar komprehensif. Terapkan praktik terbaik: struktur proforma standar (pendapatan potensial bruto → kekosongan & kehilangan → pendapatan efektif → biaya operasional → NOI → debt service → arus kas sebelum pajak), asumsi eksplisit per baris dengan sumber (pertumbuhan sewa, kekosongan, eskalasi biaya, exit cap rate), proyeksi multi-tahun sampai exit, indikator kelayakan (IRR leveraged/unleveraged, equity multiple, cash-on-cash per tahun), uji kewajaran asumsi terhadap data pasar, dan keterbukaan atas keterbatasan model.",
    interviewTopics: [
      "investasi yang dimodelkan (properti, harga akuisisi, rencana)",
      "struktur pembiayaan (ekuitas, pinjaman, bunga, tenor)",
      "asumsi pendapatan & biaya yang sudah ada",
      "horizon investasi & rencana exit",
      "data pasar untuk uji kewajaran asumsi",
    ],
    structure: [
      "Ringkasan Indikator Kelayakan (IRR, equity multiple, CoC)",
      "Deskripsi Investasi & Struktur Pembiayaan",
      "Tabel Asumsi per Baris & Sumbernya",
      "Proforma Operasional Multi-Tahun (GPI → NOI → arus kas)",
      "Analisis Exit & Nilai Terminal",
      "Uji Kewajaran Asumsi vs Pasar",
      "Keterbatasan Model & Risiko Utama",
      "Kesimpulan & Lampiran Perhitungan",
    ],
    tools: [
      {
        slug: "pf-model",
        role: "PF-MODEL",
        name: "PF-MODEL — Penyusun Model Proforma",
        mission:
          "Susun proforma multi-tahun terstruktur: pendapatan potensial → efektif → NOI → debt service → arus kas, dengan asumsi eksplisit per baris berikut sumbernya, dan analisis exit dengan nilai terminal; setiap asumsi tanpa data pendukung ditandai [ASUMSI].",
      },
      {
        slug: "pf-uji",
        role: "PF-UJI",
        name: "PF-UJI — Penguji Kewajaran & Indikator",
        mission:
          "Hitung indikator kelayakan (IRR leveraged/unleveraged, equity multiple, cash-on-cash per tahun), uji kewajaran asumsi terhadap data pasar pembanding, tandai asumsi agresif, dan nyatakan keterbatasan model secara jujur.",
      },
    ],
    evaluatorCriteria: [
      "Analisis Finansial Menyeluruh — struktur proforma lengkap dari GPI sampai arus kas ekuitas",
      "Akurasi Proyeksi — perhitungan benar dan indikator kelayakan konsisten dengan model",
      "Kewajaran Asumsi — asumsi diuji terhadap pasar dan yang agresif ditandai jujur",
      "Kacamata Praktisi Ahli — kedalaman analis underwriting senior, bukan spreadsheet optimis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-rent-roll-claw",
    name: "Analisis Rent Roll Claw — Spesialis Analisis Rent Roll",
    tagline: "Wawancara → Data Rent Roll → Analisis Kinerja & Risiko → Dokumen → Evaluasi Rubrik",
    avatar: "🗂️",
    category: "property",
    docLabel: "Dokumen Analisis Rent Roll (Rent Roll Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Rent Roll yang mengubah data rent roll mentah menjadi wawasan investasi — untuk dipakai analis, investor, dan calon pembeli menilai kualitas pendapatan sebuah properti. Terapkan praktik terbaik: validasi kualitas data rent roll (kelengkapan, konsistensi dengan kontrak), analisis kualitas pendapatan (konsentrasi penyewa, WALE, profil berakhirnya sewa, sewa di bawah/di atas pasar), tingkat hunian fisik vs ekonomis, analisis tunggakan dan tren pembayaran, potensi kenaikan pendapatan (mark-to-market, unit kosong), risiko pendapatan (penyewa dominan jatuh tempo bersamaan, klausul putus), dampak temuan ke valuasi dan underwriting, dan rekomendasi aksi per temuan.",
    interviewTopics: [
      "properti & rent roll yang dianalisis (jumlah unit, jenis penyewa)",
      "tujuan analisis (akuisisi, pembiayaan, audit internal)",
      "data pendukung yang tersedia (kontrak, riwayat pembayaran)",
      "data pasar sewa pembanding",
      "kekhawatiran spesifik (konsentrasi, tunggakan, expiry menumpuk)",
    ],
    structure: [
      "Ringkasan Temuan & Kualitas Pendapatan",
      "Validasi Kualitas Data Rent Roll",
      "Analisis Hunian Fisik vs Ekonomis",
      "Konsentrasi Penyewa, WALE & Profil Expiry",
      "Posisi Sewa vs Pasar (mark-to-market)",
      "Tunggakan & Tren Pembayaran",
      "Risiko Pendapatan & Dampak ke Valuasi",
      "Rekomendasi Aksi per Temuan & Lampiran",
    ],
    tools: [
      {
        slug: "ra-kualitas",
        role: "RA-KUALITAS",
        name: "RA-KUALITAS — Validator Data & Kualitas Pendapatan",
        mission:
          "Susun validasi dan analisis kualitas: kelengkapan-konsistensi data rent roll terhadap kontrak, hunian fisik vs ekonomis, konsentrasi penyewa, WALE, profil expiry, dan tunggakan; data yang tidak konsisten atau belum terverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "ra-potensi",
        role: "RA-POTENSI",
        name: "RA-POTENSI — Analis Potensi & Risiko Pendapatan",
        mission:
          "Susun analisis potensi dan risiko: mark-to-market sewa terhadap pasar, potensi kenaikan pendapatan (unit kosong, sewa di bawah pasar), risiko pendapatan (expiry menumpuk, penyewa dominan), dampak ke valuasi/underwriting, dan rekomendasi aksi per temuan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua dimensi kualitas pendapatan (hunian, konsentrasi, expiry, tunggakan) dianalisis",
      "Organisasi — temuan tersaji terstruktur dari data → analisis → dampak → aksi",
      "Konsistensi — angka analisis konsisten dengan data rent roll dan kontrak sumber",
      "Kacamata Praktisi Ahli — kedalaman analis akuisisi senior, bukan rekap tabel sewa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-sensitivitas-claw",
    name: "Sensitivitas Claw — Spesialis Analisis Sensitivitas Investasi Properti",
    tagline: "Wawancara → Variabel Kunci → Skenario & Batas → Dokumen Sensitivitas → Evaluasi Rubrik",
    avatar: "🎚️",
    category: "property",
    docLabel: "Dokumen Analisis Sensitivitas (Sensitivity Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Sensitivitas yang menganalisis dampak berbagai faktor terhadap investasi properti — komprehensif dan akurat, memberi wawasan risiko dan imbal hasil pada berbagai skenario — untuk dipakai tim properti dan manajemen senior mengambil keputusan investasi. Terapkan praktik terbaik: identifikasi variabel kunci yang paling berdampak (sewa, kekosongan, biaya, suku bunga, exit cap rate, biaya konstruksi), rentang variasi realistis per variabel berbasis data historis, analisis satu-variabel (tornado chart) untuk mengurutkan dampak, analisis skenario kombinasi (dasar-optimis-pesimis-stres), titik impas per variabel (break-even), probabilitas kualitatif per skenario, implikasi ke struktur transaksi (margin pengaman, kontinjensi), dan rekomendasi mitigasi per risiko dominan.",
    interviewTopics: [
      "investasi yang diuji (model dasar & indikator kelayakannya)",
      "variabel yang paling dikhawatirkan (sewa, bunga, biaya, exit)",
      "data historis untuk rentang variasi realistis",
      "batas kelayakan minimum investor (IRR floor, DSCR minimum)",
      "keputusan yang bergantung pada hasil analisis",
    ],
    structure: [
      "Ringkasan: Variabel Dominan & Ketahanan Investasi",
      "Model Dasar & Indikator Acuan",
      "Variabel Kunci & Rentang Variasi Berbasis Data",
      "Analisis Satu-Variabel (urutan dampak)",
      "Skenario Kombinasi (dasar–optimis–pesimis–stres)",
      "Titik Impas per Variabel",
      "Implikasi ke Struktur Transaksi & Margin Pengaman",
      "Rekomendasi Mitigasi & Lampiran",
    ],
    tools: [
      {
        slug: "sn-variabel",
        role: "SN-VARIABEL",
        name: "SN-VARIABEL — Pemeta Variabel & Rentang",
        mission:
          "Susun peta variabel kunci: variabel paling berdampak ke kelayakan, rentang variasi realistis berbasis data historis, analisis satu-variabel dengan urutan dampak (tornado), dan titik impas per variabel; rentang tanpa data historis ditandai [ASUMSI].",
      },
      {
        slug: "sn-skenario",
        role: "SN-SKENARIO",
        name: "SN-SKENARIO — Penyusun Skenario & Mitigasi",
        mission:
          "Susun analisis skenario kombinasi (dasar-optimis-pesimis-stres) dengan probabilitas kualitatif, dampak ke indikator kelayakan per skenario, implikasi ke struktur transaksi (margin pengaman, kontinjensi), dan rekomendasi mitigasi per risiko dominan.",
      },
    ],
    evaluatorCriteria: [
      "Riset & Rentang Realistis — variasi variabel berbasis data historis, bukan angka sembarang",
      "Akurasi Perhitungan — dampak per variabel dan skenario konsisten dengan model dasar",
      "Wawasan Keputusan — analisis diterjemahkan ke batas aman dan mitigasi konkret",
      "Kacamata Praktisi Ahli — kedalaman analis risiko investasi senior, bukan tabel what-if tanpa makna",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proyeksi-arus-kas-claw",
    name: "Arus Kas Claw — Spesialis Proyeksi Arus Kas Properti",
    tagline: "Wawancara → Pendapatan & Biaya → Proyeksi & Risiko → Dokumen Arus Kas → Evaluasi Rubrik",
    avatar: "💵",
    category: "property",
    docLabel: "Dokumen Proyeksi Arus Kas (Cash Flow Projection Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Proyeksi Arus Kas yang memberikan proyeksi finansial akurat untuk investasi properti — terperinci, memperhitungkan pendapatan, biaya, dan potensi risiko — untuk dipakai investor dan pemangku kepentingan menilai profitabilitas dan kelayakan investasi. Terapkan praktik terbaik: proyeksi berbasis bulanan/tahunan sesuai kebutuhan, komponen pendapatan lengkap (sewa, pendapatan lain, penyesuaian kekosongan), komponen biaya lengkap (operasional, pemeliharaan, pajak, asuransi, manajemen, cadangan CapEx), jadwal debt service bila berutang, arus kas bersih sebelum dan sesudah pajak, saldo kas kumulatif dan kebutuhan modal kerja, penanda periode defisit dan sumber penutupnya, uji stres pada asumsi kritis, dan rekonsiliasi dengan realisasi bila ada data.",
    interviewTopics: [
      "investasi yang diproyeksikan (properti, tahap, kepemilikan)",
      "sumber pendapatan & kontrak sewa berjalan",
      "struktur biaya & kewajiban utang",
      "periode proyeksi & granularitas (bulanan/tahunan)",
      "risiko arus kas yang dikhawatirkan (kekosongan, tunggakan, bunga)",
    ],
    structure: [
      "Ringkasan Arus Kas & Indikator Kunci",
      "Asumsi Pendapatan & Biaya per Baris",
      "Proyeksi Pendapatan (sewa, lain-lain, kekosongan)",
      "Proyeksi Biaya (operasional, pajak, cadangan CapEx)",
      "Debt Service & Arus Kas Bersih",
      "Saldo Kumulatif & Periode Defisit",
      "Uji Stres Asumsi Kritis",
      "Rekonsiliasi vs Realisasi & Lampiran",
    ],
    tools: [
      {
        slug: "ck-proyeksi",
        role: "CK-PROYEKSI",
        name: "CK-PROYEKSI — Penyusun Proyeksi Terstruktur",
        mission:
          "Susun proyeksi arus kas per periode: pendapatan lengkap dengan penyesuaian kekosongan, biaya lengkap termasuk cadangan CapEx, debt service, arus kas bersih, dan saldo kumulatif dengan penanda periode defisit; setiap asumsi per baris ditandai [ASUMSI] bila tanpa data pendukung.",
      },
      {
        slug: "ck-risiko",
        role: "CK-RISIKO",
        name: "CK-RISIKO — Penguji Stres & Kebutuhan Dana",
        mission:
          "Susun analisis ketahanan: uji stres asumsi kritis (kekosongan naik, sewa turun, bunga naik), kebutuhan modal kerja dan sumber penutup defisit, indikator kesehatan (DSCR per periode), dan rekomendasi penjadwalan kewajiban agar arus kas aman.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Proyeksi — perhitungan per periode benar dan konsisten dari pendapatan sampai saldo",
      "Kelengkapan Komponen — semua pos pendapatan, biaya, cadangan, dan utang tercakup",
      "Kesadaran Risiko — periode defisit dan hasil uji stres ditampilkan jujur dengan mitigasi",
      "Kacamata Praktisi Ahli — kedalaman analis keuangan properti senior, bukan tabel optimis tanpa cadangan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "proposal-akuisisi-properti-claw",
    name: "Proposal Akuisisi Claw — Spesialis Proposal Akuisisi Properti",
    tagline: "Wawancara → Analisis & Underwriting → Struktur Transaksi → Proposal → Evaluasi Rubrik",
    avatar: "🏠",
    category: "property",
    docLabel: "Proposal Akuisisi (Acquisition Proposal)",
    mission:
      "Membantu pengguna menyusun Proposal Akuisisi yang memberikan analisis dan rekomendasi komprehensif untuk akuisisi properti — proyeksi finansial terperinci, riset pasar, dan penilaian risiko — untuk dipakai tim eksekutif dan investor mengevaluasi investasi dan mengambil keputusan strategis. Terapkan praktik terbaik: tesis akuisisi yang jelas (mengapa aset ini, mengapa sekarang), riset pasar berbasis data (pembanding, permintaan-pasokan, tren), underwriting disiplin (pendapatan ternormalisasi, biaya realistis, cadangan), penentuan harga penawaran dengan rentang (walk-away price), struktur transaksi dan pendanaan, penilaian risiko dengan mitigasi per risiko, rencana nilai tambah pasca-akuisisi (value-add plan), jadwal proses sampai closing, dan rekomendasi tegas dengan syarat.",
    interviewTopics: [
      "aset target (jenis, lokasi, harga penawaran, penjual)",
      "tesis akuisisi & kesesuaian dengan strategi portofolio",
      "data underwriting yang tersedia (rent roll, biaya, kondisi)",
      "rencana pendanaan (ekuitas, pinjaman, partner)",
      "rencana nilai tambah pasca-akuisisi",
    ],
    structure: [
      "Ringkasan Eksekutif & Rekomendasi Harga",
      "Tesis Akuisisi & Keselarasan Strategis",
      "Profil Aset & Riset Pasar",
      "Underwriting: Pendapatan, Biaya & Indikator Kelayakan",
      "Harga Penawaran, Rentang & Walk-Away Price",
      "Struktur Transaksi & Pendanaan",
      "Penilaian Risiko & Mitigasi",
      "Rencana Nilai Tambah, Jadwal Closing & Lampiran",
    ],
    tools: [
      {
        slug: "aq-underwriting",
        role: "AQ-UNDERWRITING",
        name: "AQ-UNDERWRITING — Analis Underwriting & Harga",
        mission:
          "Susun underwriting disiplin: pendapatan ternormalisasi dari rent roll, biaya realistis dengan cadangan, indikator kelayakan (IRR, cap rate masuk, cash-on-cash), dan penentuan harga penawaran dengan rentang serta walk-away price; asumsi ditandai [ASUMSI].",
      },
      {
        slug: "aq-transaksi",
        role: "AQ-TRANSAKSI",
        name: "AQ-TRANSAKSI — Perancang Struktur & Rencana",
        mission:
          "Susun struktur transaksi dan rencana eksekusi: skema pendanaan, penilaian risiko dengan mitigasi per risiko, rencana nilai tambah pasca-akuisisi dengan target terukur, jadwal proses sampai closing, dan syarat-syarat rekomendasi.",
      },
    ],
    evaluatorCriteria: [
      "Proyeksi Finansial Terperinci — underwriting lengkap dengan asumsi eksplisit dan indikator benar",
      "Riset Pasar Kuat — tesis dan harga didukung data pembanding dan analisis kawasan",
      "Penilaian Risiko Jujur — risiko material diungkap dengan mitigasi, bukan disembunyikan",
      "Kacamata Praktisi Ahli — kedalaman kepala akuisisi senior, bukan proposal pemasaran",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-pembiayaan-claw",
    name: "Analisis Pembiayaan Claw — Spesialis Analisis Pembiayaan Proyek Properti",
    tagline: "Wawancara → Opsi Pembiayaan → Analisis & Risiko → Dokumen → Evaluasi Rubrik",
    avatar: "💳",
    category: "property",
    docLabel: "Dokumen Analisis Pembiayaan (Financing Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Pembiayaan yang mengevaluasi opsi pembiayaan proyek properti secara komprehensif — proyeksi finansial akurat, penilaian risiko, dan rekomendasi strategi pembiayaan — untuk dipakai pengembang, investor, dan lembaga keuangan mengambil keputusan. Terapkan praktik terbaik: pemetaan opsi pembiayaan relevan (kredit konstruksi, kredit investasi, obligasi/MTN, ekuitas partner, pembiayaan syariah, pre-sales), perbandingan biaya modal efektif per opsi (bunga, provisi, biaya lain), struktur leverage optimal (LTV/LTC, DSCR minimum), jadwal penarikan dan pembayaran sesuai arus kas proyek, analisis risiko pembiayaan (bunga naik, refinancing, covenant), dampak struktur ke imbal hasil ekuitas (leverage effect), persyaratan dan jaminan per opsi, dan rekomendasi struktur dengan skenario cadangan.",
    interviewTopics: [
      "proyek yang dibiayai (jenis, nilai, tahap, jadwal)",
      "kebutuhan dana & struktur modal saat ini",
      "opsi pembiayaan yang tersedia/ditawarkan (bank, partner, lainnya)",
      "arus kas proyek untuk jadwal penarikan-pembayaran",
      "batasan & preferensi (syariah, covenant, jaminan yang bisa diberikan)",
    ],
    structure: [
      "Ringkasan & Rekomendasi Struktur Pembiayaan",
      "Profil Proyek & Kebutuhan Dana",
      "Pemetaan Opsi Pembiayaan yang Relevan",
      "Perbandingan Biaya Modal Efektif per Opsi",
      "Struktur Leverage & Indikator Aman (LTV/LTC, DSCR)",
      "Jadwal Penarikan–Pembayaran vs Arus Kas Proyek",
      "Risiko Pembiayaan & Dampak ke Imbal Hasil Ekuitas",
      "Persyaratan, Jaminan, Skenario Cadangan & Lampiran",
    ],
    tools: [
      {
        slug: "fn-opsi",
        role: "FN-OPSI",
        name: "FN-OPSI — Pemeta Opsi & Biaya Modal",
        mission:
          "Susun pemetaan opsi pembiayaan: opsi relevan untuk tahap proyek, biaya modal efektif per opsi (bunga, provisi, biaya lain), persyaratan dan jaminan masing-masing, dan kesesuaian dengan profil proyek; suku bunga dan syarat yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "fn-struktur",
        role: "FN-STRUKTUR",
        name: "FN-STRUKTUR — Analis Struktur & Risiko",
        mission:
          "Susun analisis struktur: leverage optimal dengan indikator aman (LTV/LTC, DSCR minimum), jadwal penarikan-pembayaran selaras arus kas proyek, dampak leverage ke imbal hasil ekuitas, risiko pembiayaan (bunga, refinancing, covenant) dengan mitigasi, dan skenario cadangan.",
      },
    ],
    evaluatorCriteria: [
      "Proyeksi Akurat — biaya modal dan dampak leverage dihitung benar dan dapat diperbandingkan",
      "Penilaian Risiko — risiko bunga, refinancing, dan covenant dianalisis dengan mitigasi konkret",
      "Rekomendasi Strategis — struktur terpilih beralasan dengan skenario cadangan yang realistis",
      "Kacamata Praktisi Ahli — kedalaman analis pembiayaan proyek senior, bukan brosur produk kredit",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 9 (real-estate-appraiser, property) ───────────────────────────────
  {
    kind: "openclaw",
    slug: "pendekatan-biaya-claw",
    name: "Pendekatan Biaya Claw — Spesialis Analisis Pendekatan Biaya",
    tagline: "Wawancara → Biaya Pengganti → Penyusutan → Dokumen → Evaluasi Rubrik",
    avatar: "🧱",
    category: "property",
    docLabel: "Dokumen Analisis Pendekatan Biaya (Cost Approach Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Pendekatan Biaya yang menghasilkan indikasi nilai properti akurat — mencakup seluruh faktor biaya relevan — untuk dipakai investor, kreditur, dan pemilik properti mengambil keputusan investasi dan pembiayaan. Terapkan praktik terbaik sesuai KEPI & SPI (standar penilaian KJPP/MAPPI): estimasi nilai tanah sebagai lahan kosong (perbandingan data pasar), pilihan basis biaya (biaya reproduksi vs biaya pengganti baru), rincian biaya langsung (material, upah, sesuai indeks biaya konstruksi/AHSP), biaya tidak langsung (perizinan PBG, IMB lama, perencanaan, bunga masa konstruksi), keuntungan pengembang wajar, tiga jenis penyusutan (fisik, fungsional, eksternal/ekonomis) dengan metode umur efektif–umur ekonomis, dan rekonsiliasi ke indikasi nilai akhir dengan asumsi eksplisit.",
    interviewTopics: [
      "properti yang dinilai (jenis bangunan, luas, umur, lokasi)",
      "data tanah & pembanding lahan kosong yang tersedia",
      "spesifikasi konstruksi & kualitas bangunan",
      "kondisi fisik, fungsional, dan lingkungan sekitar",
      "tujuan penilaian & tanggal penilaian",
    ],
    structure: [
      "Ringkasan Nilai & Basis Penilaian",
      "Identifikasi Properti & Tujuan Penilaian",
      "Estimasi Nilai Tanah (Lahan Kosong)",
      "Estimasi Biaya Pengganti/Reproduksi Baru",
      "Biaya Tidak Langsung & Keuntungan Pengembang",
      "Analisis Penyusutan (Fisik, Fungsional, Eksternal)",
      "Indikasi Nilai Pendekatan Biaya",
      "Asumsi, Batasan & Lampiran Perhitungan",
    ],
    tools: [
      {
        slug: "cb-biaya",
        role: "CB-BIAYA",
        name: "CB-BIAYA — Estimator Biaya Pengganti",
        mission:
          "Susun estimasi biaya: nilai tanah dari data pembanding, biaya pengganti baru per komponen (struktur, arsitektur, MEP) mengacu indeks biaya konstruksi, biaya tidak langsung dan keuntungan pengembang wajar; setiap angka satuan yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "cb-susut",
        role: "CB-SUSUT",
        name: "CB-SUSUT — Analis Penyusutan",
        mission:
          "Susun analisis penyusutan: penyusutan fisik (umur efektif vs umur ekonomis), keusangan fungsional (desain/layout tak sesuai pasar), keusangan eksternal (faktor lingkungan/ekonomi), total penyusutan, dan indikasi nilai akhir pendekatan biaya dengan jejak perhitungan.",
      },
    ],
    evaluatorCriteria: [
      "Riset Menyeluruh — nilai tanah dan biaya didukung data pembanding dan indeks biaya yang jelas",
      "Estimasi Biaya Akurat — komponen biaya lengkap, konsisten, dan penyusutan dihitung dengan metode baku",
      "Penyajian Jernih — alur perhitungan mudah diikuti hingga indikasi nilai akhir",
      "Kacamata Praktisi Ahli — kedalaman penilai KJPP senior, bukan kalkulator biaya bangunan sederhana",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pendekatan-perbandingan-pasar-claw",
    name: "Perbandingan Pasar Claw — Spesialis Analisis Pendekatan Perbandingan Data Pasar",
    tagline: "Wawancara → Pembanding → Penyesuaian → Dokumen → Evaluasi Rubrik",
    avatar: "🏘️",
    category: "property",
    docLabel: "Dokumen Analisis Perbandingan Data Pasar (Sales Comparison Approach Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Pendekatan Perbandingan Data Pasar yang akurat — perbandingan detail properti sejenis, penyesuaian atas perbedaan, dan estimasi nilai akhir yang terdukung — untuk dipakai agen properti, calon pembeli, dan lembaga keuangan mengambil keputusan transaksi. Terapkan praktik terbaik sesuai KEPI & SPI: seleksi minimal 3–5 data pembanding yang benar-benar sebanding (lokasi, luas, peruntukan zonasi RDTR), verifikasi data transaksi vs penawaran (dengan diskon penawaran wajar), elemen perbandingan baku (hak atas tanah SHM/HGB, syarat pembiayaan, kondisi pasar/waktu, lokasi, fisik), penyesuaian kuantitatif dengan urutan yang benar, grid penyesuaian transparan, analisis bobot berdasarkan penyesuaian terkecil, dan indikasi nilai akhir dengan justifikasi.",
    interviewTopics: [
      "properti subjek (alamat, luas tanah/bangunan, legalitas, kondisi)",
      "data pembanding yang tersedia (transaksi/penawaran, sumber)",
      "karakter pasar lokal & tren harga terkini",
      "perbedaan utama subjek vs pembanding",
      "tujuan penilaian & tanggal penilaian",
    ],
    structure: [
      "Ringkasan Nilai & Metodologi",
      "Identifikasi Properti Subjek",
      "Kriteria Seleksi & Verifikasi Data Pembanding",
      "Deskripsi Data Pembanding (3–5 Properti)",
      "Grid Penyesuaian & Dasar Setiap Penyesuaian",
      "Analisis Bobot & Rentang Nilai",
      "Indikasi Nilai Pendekatan Perbandingan Pasar",
      "Asumsi, Batasan & Lampiran Data",
    ],
    tools: [
      {
        slug: "sc-banding",
        role: "SC-BANDING",
        name: "SC-BANDING — Kurator Data Pembanding",
        mission:
          "Susun kurasi pembanding: kriteria seleksi, profil 3–5 pembanding terverifikasi (transaksi vs penawaran, diskon penawaran), kesebandingan lokasi-fisik-legalitas, dan data yang belum terverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "sc-adjust",
        role: "SC-ADJUST",
        name: "SC-ADJUST — Analis Grid Penyesuaian",
        mission:
          "Susun grid penyesuaian: elemen perbandingan baku dengan urutan penyesuaian benar, besaran penyesuaian beralasan per elemen, nilai terindikasi per pembanding, bobot berdasarkan penyesuaian terkecil, dan indikasi nilai akhir dengan rentang.",
      },
    ],
    evaluatorCriteria: [
      "Teliti Detail — grid penyesuaian konsisten, urutan dan arah penyesuaian benar",
      "Riset Mendalam — pembanding terverifikasi dan benar-benar sebanding dengan subjek",
      "Komunikasi Jelas — dasar setiap penyesuaian dan pembobotan mudah dipahami pembaca awam",
      "Kacamata Praktisi Ahli — kedalaman penilai pasar senior, bukan daftar iklan properti sejenis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "keberatan-pajak-properti-claw",
    name: "Keberatan Pajak Claw — Spesialis Keberatan Penetapan Pajak Properti",
    tagline: "Wawancara → Analisis NJOP → Argumen → Dokumen → Evaluasi Rubrik",
    avatar: "📮",
    category: "property",
    docLabel: "Dokumen Keberatan Penetapan Pajak Properti (Property Tax Assessment Appeal)",
    mission:
      "Membantu pengguna menyusun Dokumen Keberatan Penetapan Pajak Properti yang komprehensif dan terdukung kuat — untuk diajukan pemilik properti ke otoritas pajak daerah (Bapenda) guna menurunkan penetapan yang terlalu tinggi. Terapkan praktik terbaik: analisis SPPT PBB-P2 dan dasar penetapan NJOP bumi/bangunan, perbandingan NJOP dengan nilai pasar wajar dan NJOP properti sebanding di sekitar, identifikasi kesalahan objek (luas, kelas bumi/bangunan, peruntukan), bukti pendukung (data transaksi, foto kondisi, dokumen legalitas), argumen persuasif yang terstruktur, kepatuhan pada tata cara dan tenggat pengajuan keberatan sesuai peraturan daerah, dan permohonan yang jelas. Sertakan pengingat: dokumen ini alat bantu — tenggat, format resmi, dan strategi akhir dikonfirmasi ke konsultan pajak atau Bapenda setempat.",
    interviewTopics: [
      "properti & SPPT yang dikeberatankan (NJOP, luas, kelas)",
      "alasan keberatan (NJOP vs nilai pasar, kesalahan data objek)",
      "data pembanding & bukti pendukung yang dimiliki",
      "riwayat pembayaran & keberatan sebelumnya",
      "tenggat & aturan keberatan di daerah setempat",
    ],
    structure: [
      "Ringkasan Permohonan Keberatan",
      "Identitas Wajib Pajak & Objek Pajak",
      "Penetapan yang Dikeberatankan (SPPT/NJOP)",
      "Analisis NJOP vs Nilai Pasar Wajar",
      "Kesalahan Data Objek & Bukti Pendukung",
      "Argumen Keberatan Terstruktur",
      "Permohonan & Nilai yang Diusulkan",
      "Lampiran Bukti & Kelengkapan Administrasi",
    ],
    tools: [
      {
        slug: "tp-njop",
        role: "TP-NJOP",
        name: "TP-NJOP — Analis NJOP & Nilai Pasar",
        mission:
          "Susun analisis penetapan: perbandingan NJOP subjek vs nilai pasar wajar dan NJOP properti sebanding, identifikasi kesalahan data objek (luas, kelas, peruntukan), dan selisih yang menjadi dasar keberatan; nilai pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "tp-argumen",
        role: "TP-ARGUMEN",
        name: "TP-ARGUMEN — Penyusun Argumen & Kelengkapan",
        mission:
          "Susun argumen keberatan: struktur argumen persuasif berbasis bukti, daftar bukti pendukung per argumen, kelengkapan administrasi dan tata cara pengajuan sesuai aturan daerah, dan draf permohonan dengan nilai yang diusulkan.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi — perhitungan selisih NJOP vs nilai pasar benar dan berbasis data",
      "Kelengkapan — semua kesalahan objek dan bukti pendukung teridentifikasi",
      "Argumentasi Persuasif — argumen tersusun logis, kuat, dan siap diajukan ke otoritas",
      "Kacamata Praktisi Ahli — kedalaman penilai berpengalaman menangani sengketa PBB, bukan surat komplain umum",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "penilaian-agunan-kpr-claw",
    name: "Penilaian Agunan Claw — Spesialis Penilaian Properti untuk Kredit",
    tagline: "Wawancara → Inspeksi & Data → Nilai Agunan → Dokumen → Evaluasi Rubrik",
    avatar: "🏦",
    category: "property",
    docLabel: "Dokumen Penilaian Agunan Kredit (Mortgage Lending Appraisal Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Penilaian Agunan Kredit yang akurat dan komprehensif sesuai standar industri — untuk dipakai bank dan lembaga pembiayaan menentukan jumlah dan syarat kredit. Terapkan praktik terbaik sesuai KEPI & SPI dan ketentuan agunan perbankan: identifikasi lengkap objek dan legalitas (SHM/HGB, PBG/SLF, kesesuaian RDTR), pemeriksaan fisik dan lingkungan, pendekatan penilaian yang sesuai (perbandingan pasar untuk hunian, tambah pendekatan pendapatan untuk komersial), nilai pasar dan nilai likuidasi dengan dasar diskon jelas, analisis marketability agunan, kesesuaian LTV dengan ketentuan Bank Indonesia/OJK, red flag agunan (sengketa, akses jalan, banjir, tusuk sate menurut preferensi pasar), dan ringkasan bankable. Sertakan pengingat: penilaian resmi untuk kredit wajib oleh penilai internal bank atau KJPP rekanan — dokumen ini alat bantu persiapan.",
    interviewTopics: [
      "properti agunan (jenis, alamat, luas, legalitas)",
      "tujuan kredit & lembaga pembiayaan yang dituju",
      "kondisi fisik & lingkungan properti",
      "data pembanding & pendapatan properti (jika komersial)",
      "faktor risiko yang diketahui (sengketa, banjir, akses)",
    ],
    structure: [
      "Ringkasan Nilai Pasar & Nilai Likuidasi",
      "Identifikasi Objek & Kelengkapan Legalitas",
      "Pemeriksaan Fisik & Lingkungan",
      "Analisis Pasar & Pendekatan Penilaian",
      "Perhitungan Nilai Pasar & Nilai Likuidasi",
      "Analisis Marketability & Kesesuaian LTV",
      "Red Flag Agunan & Mitigasi",
      "Asumsi, Batasan & Lampiran",
    ],
    tools: [
      {
        slug: "mk-objek",
        role: "MK-OBJEK",
        name: "MK-OBJEK — Pemeriksa Objek & Legalitas",
        mission:
          "Susun profil agunan: identifikasi objek lengkap, checklist legalitas (SHM/HGB, PBG/SLF, RDTR), temuan fisik-lingkungan, red flag agunan dengan tingkat keparahan; kondisi yang belum diverifikasi lapangan ditandai [ASUMSI].",
      },
      {
        slug: "mk-nilai",
        role: "MK-NILAI",
        name: "MK-NILAI — Analis Nilai & LTV",
        mission:
          "Susun analisis nilai: nilai pasar dengan pendekatan sesuai jenis properti, nilai likuidasi dengan dasar diskon jelas, marketability agunan, simulasi plafon kredit terhadap batas LTV BI/OJK, dan ringkasan bankable untuk analis kredit.",
      },
    ],
    evaluatorCriteria: [
      "Kepatuhan Standar — mengikuti KEPI/SPI dan ketentuan agunan perbankan yang berlaku",
      "Penilaian Komprehensif — legalitas, fisik, pasar, dan risiko agunan tercakup utuh",
      "Akurasi Nilai — nilai pasar dan likuidasi dihitung benar dengan dasar yang dapat diaudit",
      "Kacamata Praktisi Ahli — kedalaman penilai agunan bank senior, bukan taksiran harga rumah kasar",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pendekatan-pendapatan-claw",
    name: "Pendekatan Pendapatan Claw — Spesialis Analisis Pendekatan Pendapatan",
    tagline: "Wawancara → Pendapatan & Biaya → Kapitalisasi → Dokumen → Evaluasi Rubrik",
    avatar: "💰",
    category: "property",
    docLabel: "Dokumen Analisis Pendekatan Pendapatan (Income Approach Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Pendekatan Pendapatan yang komprehensif — menilai potensi pendapatan properti dengan memperhitungkan tarif sewa, tingkat kekosongan, biaya operasional, dan tren pasar — untuk dipakai pemilik, investor, dan lembaga keuangan menilai properti dan peluang investasi. Terapkan praktik terbaik sesuai KEPI & SPI: pendapatan kotor potensial dari sewa pasar (bukan hanya sewa kontrak), pendapatan lain (parkir, iklan, service charge), pengurang kekosongan dan kerugian tagihan berbasis data pasar, biaya operasional dinormalisasi (PBB, asuransi, pemeliharaan, manajemen), NOI yang bersih dari biaya modal dan cicilan, pemilihan metode (kapitalisasi langsung vs DCF untuk arus kas tidak stabil), cap rate dari ekstraksi pasar dengan justifikasi, dan analisis sensitivitas nilai terhadap cap rate dan kekosongan.",
    interviewTopics: [
      "properti & sumber pendapatannya (sewa, service charge, lainnya)",
      "data sewa kontrak berjalan vs sewa pasar",
      "tingkat kekosongan historis & pasar",
      "rincian biaya operasional tahunan",
      "data cap rate / transaksi properti pendapatan sejenis",
    ],
    structure: [
      "Ringkasan Nilai & Metode Terpilih",
      "Profil Properti & Sumber Pendapatan",
      "Pendapatan Kotor Potensial & Efektif",
      "Biaya Operasional Ternormalisasi",
      "Perhitungan NOI",
      "Pemilihan & Justifikasi Cap Rate / Tingkat Diskonto",
      "Indikasi Nilai & Analisis Sensitivitas",
      "Asumsi, Batasan & Lampiran Perhitungan",
    ],
    tools: [
      {
        slug: "ic-noi",
        role: "IC-NOI",
        name: "IC-NOI — Analis Pendapatan & NOI",
        mission:
          "Susun analisis pendapatan: pendapatan kotor potensial (sewa pasar + pendapatan lain), pengurang kekosongan dan kerugian tagihan, biaya operasional ternormalisasi per pos, dan NOI; angka pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "ic-kap",
        role: "IC-KAP",
        name: "IC-KAP — Analis Kapitalisasi & Sensitivitas",
        mission:
          "Susun analisis nilai: pemilihan metode (kapitalisasi langsung vs DCF) dengan alasan, cap rate/tingkat diskonto dari ekstraksi pasar, indikasi nilai, dan tabel sensitivitas nilai terhadap cap rate serta tingkat kekosongan.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — seluruh sumber pendapatan dan pos biaya tercakup dan ternormalisasi",
      "Kejelasan — alur dari pendapatan kotor hingga indikasi nilai mudah diikuti",
      "Akurasi Proyeksi — NOI dan kapitalisasi dihitung benar dengan cap rate terjustifikasi",
      "Kacamata Praktisi Ahli — kedalaman penilai properti komersial senior, bukan kalkulator sewa sederhana",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "valuasi-tanah-claw",
    name: "Valuasi Tanah Claw — Spesialis Laporan Valuasi Tanah",
    tagline: "Wawancara → Analisis Lahan → Nilai → Dokumen → Evaluasi Rubrik",
    avatar: "🏞️",
    category: "property",
    docLabel: "Laporan Valuasi Tanah (Land Valuation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Valuasi Tanah yang menganalisis tren pasar secara menyeluruh, menilai lahan pembanding dengan akurat, dan patuh standar industri — untuk dipakai pemilik, investor, dan pengembang mengambil keputusan atas lahan. Terapkan praktik terbaik sesuai KEPI & SPI: identifikasi legalitas dan batas (SHM/HGB/girik, peta bidang BPN), analisis peruntukan zonasi RDTR dan intensitas (KDB/KLB/KDH) yang menentukan potensi lahan, karakteristik fisik (bentuk, kontur, lebar muka, akses, utilitas, risiko banjir), metode sesuai kondisi (perbandingan data pasar sebagai utama; metode penyisaan tanah/land residual untuk lahan pengembangan), penyesuaian pembanding atas lokasi-luas-legalitas-waktu, analisis tren harga koridor, dan indikasi nilai per meter persegi serta total dengan asumsi eksplisit.",
    interviewTopics: [
      "lahan yang dinilai (lokasi, luas, bentuk, legalitas)",
      "zonasi & intensitas ruang (RDTR, KDB/KLB) yang berlaku",
      "kondisi fisik & akses (kontur, lebar jalan, utilitas, banjir)",
      "data pembanding lahan di koridor yang sama",
      "tujuan penilaian (jual-beli, pengembangan, agunan)",
    ],
    structure: [
      "Ringkasan Nilai & Basis Penilaian",
      "Identifikasi Lahan & Legalitas",
      "Analisis Zonasi & Potensi Pemanfaatan",
      "Karakteristik Fisik & Lingkungan",
      "Analisis Tren Pasar Koridor",
      "Data Pembanding & Grid Penyesuaian",
      "Indikasi Nilai (per m² & Total)",
      "Asumsi, Batasan & Lampiran",
    ],
    tools: [
      {
        slug: "lv-lahan",
        role: "LV-LAHAN",
        name: "LV-LAHAN — Analis Lahan & Zonasi",
        mission:
          "Susun profil lahan: legalitas dan batas, peruntukan RDTR dengan intensitas KDB/KLB dan dampaknya ke potensi nilai, karakteristik fisik-akses-utilitas, dan faktor risiko; data zonasi yang belum dikonfirmasi ke dinas tata ruang ditandai [ASUMSI].",
      },
      {
        slug: "lv-nilai",
        role: "LV-NILAI",
        name: "LV-NILAI — Analis Pasar & Nilai",
        mission:
          "Susun analisis nilai: tren harga koridor, grid penyesuaian pembanding (lokasi, luas, legalitas, waktu), metode penyisaan tanah bila lahan pengembangan, dan indikasi nilai per m² serta total dengan rentang keyakinan.",
      },
    ],
    evaluatorCriteria: [
      "Analisis Tren Mendalam — pergerakan harga koridor dianalisis dengan data, bukan anekdot",
      "Pembanding Akurat — lahan pembanding sebanding dan penyesuaiannya beralasan",
      "Patuh Standar — mengikuti KEPI/SPI dan mempertimbangkan aturan tata ruang yang berlaku",
      "Kacamata Praktisi Ahli — kedalaman penilai tanah senior, bukan cek harga NJOP semata",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "penilaian-kondisi-properti-claw",
    name: "Kondisi Properti Claw — Spesialis Penilaian Kondisi Properti",
    tagline: "Wawancara → Inspeksi Sistematis → Temuan & Risiko → Dokumen → Evaluasi Rubrik",
    avatar: "🧰",
    category: "property",
    docLabel: "Laporan Penilaian Kondisi Properti (Property Condition Assessment)",
    mission:
      "Membantu pengguna menyusun Laporan Penilaian Kondisi Properti yang mengevaluasi kondisi fisik secara komprehensif — integritas struktur, sistem mekanikal-elektrikal-plambing, dan fungsionalitas keseluruhan — serta mengidentifikasi isu dan risiko potensial, untuk dipakai calon pembeli, investor, dan kreditur mengambil keputusan. Terapkan praktik terbaik: checklist inspeksi sistematis per komponen (pondasi/struktur, atap, dinding, lantai, MEP, sanitasi, proteksi kebakaran mengacu SLF), klasifikasi kondisi per komponen (baik/perlu perbaikan/kritis), indikasi masalah tersembunyi (retak struktur vs non-struktur, rembesan, rayap, instalasi listrik tak standar PUIL), estimasi sisa umur ekonomis komponen utama, prioritas perbaikan dengan estimasi biaya kasar (immediate repairs vs replacement reserves), dan ringkasan risiko untuk negosiasi harga.",
    interviewTopics: [
      "properti yang diperiksa (jenis, umur bangunan, riwayat renovasi)",
      "keluhan atau gejala yang sudah terlihat (retak, bocor, listrik)",
      "kelengkapan dokumen teknis (as-built drawing, SLF, riwayat pemeliharaan)",
      "sistem MEP terpasang (listrik, air, AC, lift, proteksi kebakaran)",
      "tujuan penilaian (pembelian, pembiayaan, pemeliharaan)",
    ],
    structure: [
      "Ringkasan Kondisi & Temuan Kritis",
      "Identifikasi Properti & Lingkup Inspeksi",
      "Kondisi Struktur & Selubung Bangunan",
      "Kondisi Sistem MEP & Sanitasi",
      "Indikasi Masalah Tersembunyi & Risiko",
      "Sisa Umur Ekonomis Komponen Utama",
      "Prioritas Perbaikan & Estimasi Biaya",
      "Asumsi, Batasan & Lampiran Foto/Checklist",
    ],
    tools: [
      {
        slug: "kc-inspeksi",
        role: "KC-INSPEKSI",
        name: "KC-INSPEKSI — Inspektur Komponen Bangunan",
        mission:
          "Susun hasil inspeksi: checklist per komponen (struktur, atap, dinding, MEP, sanitasi, proteksi kebakaran) dengan klasifikasi baik/perlu perbaikan/kritis, indikasi masalah tersembunyi, dan komponen yang tak dapat diperiksa langsung ditandai [ASUMSI].",
      },
      {
        slug: "kc-risiko",
        role: "KC-RISIKO",
        name: "KC-RISIKO — Analis Risiko & Biaya Perbaikan",
        mission:
          "Susun analisis tindak lanjut: sisa umur ekonomis komponen utama, prioritas perbaikan (segera vs terjadwal), estimasi biaya kasar per item, dampak temuan ke nilai dan negosiasi, dan rekomendasi pemeriksaan lanjutan oleh ahli spesialis bila perlu.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua komponen utama bangunan terperiksa dan terklasifikasi",
      "Kejelasan — temuan disajikan dengan bahasa yang dipahami pembeli awam",
      "Keandalan — klasifikasi kondisi dan estimasi biaya konsisten serta dapat dipertanggungjawabkan",
      "Kacamata Praktisi Ahli — kedalaman inspektur bangunan senior, bukan jalan-jalan lihat rumah biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "valuasi-servitut-claw",
    name: "Valuasi Servitut Claw — Spesialis Valuasi Hak Servitut/Easement",
    tagline: "Wawancara → Analisis Hak → Nilai Dampak → Dokumen → Evaluasi Rubrik",
    avatar: "🛤️",
    category: "property",
    docLabel: "Laporan Valuasi Servitut (Easement Valuation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Valuasi Servitut yang menilai secara akurat nilai suatu hak servitut/easement (hak lintas, jalur utilitas, saluran, akses) di atas sebidang properti — dengan analisis dan justifikasi transparan — untuk dipakai investor, pemilik properti, dan profesional hukum mengambil keputusan transaksi servitut dan pengembangan. Terapkan praktik terbaik: identifikasi jenis dan dasar hukum hak (perjanjian tertulis, akta notaris, itikad jalur utilitas PLN/PGN/telekomunikasi), delineasi area terdampak vs sisa lahan, metode sebelum-sesudah (nilai properti tanpa servitut dikurangi nilai dengan servitut), persentase pengambilan hak berdasarkan intensitas pembebanan (jalur udara vs bawah tanah vs akses permukaan), dampak ke potensi pengembangan (KDB/KLB efektif), kompensasi berkala vs sekaligus, dan sensitivitas nilai. Sertakan pengingat: aspek legalitas hak dikonfirmasi ke notaris/PPAT atau konsultan hukum pertanahan.",
    interviewTopics: [
      "properti & servitut yang dinilai (jenis hak, jalur, luas terdampak)",
      "dasar hukum & dokumen hak yang ada",
      "pihak pemegang hak & jangka waktu pembebanan",
      "dampak ke penggunaan & rencana pengembangan lahan",
      "data nilai pasar lahan di lokasi",
    ],
    structure: [
      "Ringkasan Nilai Servitut",
      "Identifikasi Properti & Hak yang Dibebankan",
      "Dasar Hukum & Karakter Pembebanan",
      "Delineasi Area Terdampak vs Sisa Lahan",
      "Analisis Sebelum–Sesudah & Intensitas Pembebanan",
      "Dampak ke Potensi Pengembangan",
      "Indikasi Nilai & Struktur Kompensasi",
      "Asumsi, Batasan & Lampiran",
    ],
    tools: [
      {
        slug: "es-hak",
        role: "ES-HAK",
        name: "ES-HAK — Analis Hak & Area Terdampak",
        mission:
          "Susun profil pembebanan: jenis dan dasar hukum servitut, delineasi area terdampak vs sisa lahan, intensitas pembebanan (udara/bawah tanah/permukaan), jangka waktu, dan dampak ke pemanfaatan; status hukum yang belum diverifikasi notaris ditandai [ASUMSI].",
      },
      {
        slug: "es-nilai",
        role: "ES-NILAI",
        name: "ES-NILAI — Analis Nilai Sebelum–Sesudah",
        mission:
          "Susun analisis nilai: nilai properti tanpa vs dengan servitut, persentase pengambilan hak beralasan, dampak ke potensi pengembangan, opsi kompensasi berkala vs sekaligus, dan sensitivitas nilai terhadap asumsi kunci.",
      },
    ],
    evaluatorCriteria: [
      "Riset Menyeluruh — dasar hukum, area terdampak, dan intensitas pembebanan teridentifikasi lengkap",
      "Akurasi Valuasi — metode sebelum-sesudah diterapkan benar dengan persentase pengambilan beralasan",
      "Patuh Standar — mengikuti KEPI/SPI dan transparan dalam justifikasi nilai",
      "Kacamata Praktisi Ahli — kedalaman penilai hak atas tanah senior, bukan taksiran ganti rugi kasar",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "valuasi-hak-sewa-claw",
    name: "Valuasi Hak Sewa Claw — Spesialis Valuasi Leasehold",
    tagline: "Wawancara → Analisis Sewa → Nilai Hak → Dokumen → Evaluasi Rubrik",
    avatar: "📜",
    category: "property",
    docLabel: "Laporan Valuasi Hak Sewa (Leasehold Valuation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Valuasi Hak Sewa (leasehold) yang menilai nilai kepentingan penyewa atau pemilik atas properti yang terikat sewa jangka panjang — dengan riset menyeluruh dan komunikasi jernih — untuk dipakai penyewa, pemilik, dan investor dalam transaksi pengalihan sewa, perpanjangan, atau pembelian. Terapkan praktik terbaik sesuai KEPI & SPI: pemisahan kepentingan (leased fee milik lessor vs leasehold milik lessee), selisih sewa kontrak vs sewa pasar sebagai sumber nilai hak sewa, kapitalisasi/diskonto selisih sewa selama sisa masa sewa dengan tingkat diskonto sesuai risiko, syarat kontrak yang memengaruhi nilai (opsi perpanjangan, eskalasi, sublease, kewajiban pengembalian kondisi), konteks Indonesia (HGB di atas HPL, sewa tanah negara/adat, BOT/BGS), nilai sisa saat masa sewa berakhir, dan sensitivitas nilai terhadap tingkat diskonto dan sewa pasar.",
    interviewTopics: [
      "properti & struktur sewanya (pihak, sisa masa sewa, dasar hak)",
      "sewa kontrak berjalan & jadwal eskalasi",
      "sewa pasar properti sebanding saat ini",
      "syarat kontrak penting (perpanjangan, sublease, pengembalian)",
      "tujuan penilaian (pengalihan, perpanjangan, pelaporan)",
    ],
    structure: [
      "Ringkasan Nilai Hak Sewa",
      "Identifikasi Properti & Struktur Kepentingan",
      "Analisis Kontrak Sewa & Syarat Penting",
      "Sewa Kontrak vs Sewa Pasar",
      "Kapitalisasi Selisih Sewa & Tingkat Diskonto",
      "Konteks Hak di Indonesia (HGB/HPL, BOT/BGS)",
      "Indikasi Nilai & Sensitivitas",
      "Asumsi, Batasan & Lampiran",
    ],
    tools: [
      {
        slug: "lh-kontrak",
        role: "LH-KONTRAK",
        name: "LH-KONTRAK — Analis Kontrak & Selisih Sewa",
        mission:
          "Susun analisis sewa: struktur kepentingan leased fee vs leasehold, sewa kontrak dan jadwal eskalasi vs sewa pasar, syarat kontrak yang memengaruhi nilai, dan sisa masa sewa efektif; sewa pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "lh-nilai",
        role: "LH-NILAI",
        name: "LH-NILAI — Analis Kapitalisasi Hak Sewa",
        mission:
          "Susun analisis nilai: diskonto selisih sewa selama sisa masa sewa dengan tingkat diskonto beralasan, perlakuan nilai sisa akhir masa sewa, dampak opsi perpanjangan, dan tabel sensitivitas nilai terhadap diskonto dan sewa pasar.",
      },
    ],
    evaluatorCriteria: [
      "Riset Mendalam — kontrak, sewa pasar, dan struktur kepentingan dianalisis tuntas",
      "Akurasi Valuasi — kapitalisasi selisih sewa dihitung benar dengan diskonto terjustifikasi",
      "Komunikasi Jernih — konsep leasehold dijelaskan sehingga dipahami pihak non-penilai",
      "Kacamata Praktisi Ahli — kedalaman penilai kepentingan sewa senior, bukan hitung sisa kontrak sederhana",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-rekonsiliasi-nilai-claw",
    name: "Rekonsiliasi Nilai Claw — Spesialis Laporan Rekonsiliasi Penilaian",
    tagline: "Wawancara → Tinjau Indikasi → Pembobotan → Dokumen → Evaluasi Rubrik",
    avatar: "⚖️",
    category: "property",
    docLabel: "Laporan Rekonsiliasi Nilai (Reconciliation Report)",
    mission:
      "Membantu pengguna menyusun Laporan Rekonsiliasi Nilai yang menganalisis indikasi nilai dari beberapa pendekatan penilaian secara komprehensif dan memastikan akurasi proses — dengan data valuasi, tren pasar, dan penjualan pembanding — untuk dipakai agen, kreditur, dan pemangku kepentingan transaksi. Terapkan praktik terbaik sesuai KEPI & SPI: tinjauan kualitas tiap indikasi nilai (kecukupan data, relevansi metode terhadap jenis properti, konsistensi asumsi), analisis sebab selisih antar pendekatan, pembobotan berbasis keandalan bukan rata-rata mekanis, kesesuaian nilai akhir dengan tujuan penilaian dan definisi nilai, pengecekan silang dengan indikator pasar independen (harga per m² koridor, cap rate pasar), pernyataan keyakinan dan rentang nilai, serta dokumentasi alasan pembobotan yang dapat diaudit.",
    interviewTopics: [
      "properti & tujuan penilaian",
      "pendekatan yang dipakai & indikasi nilai masing-masing",
      "kualitas data pendukung tiap pendekatan",
      "selisih antar indikasi & dugaan penyebabnya",
      "definisi nilai & standar yang diacu",
    ],
    structure: [
      "Ringkasan Nilai Akhir & Rentang",
      "Identifikasi Properti & Definisi Nilai",
      "Rekap Indikasi Nilai per Pendekatan",
      "Tinjauan Kualitas Data & Metode",
      "Analisis Sebab Selisih Antar Pendekatan",
      "Pembobotan & Justifikasi",
      "Pengecekan Silang Indikator Pasar",
      "Kesimpulan Nilai, Asumsi & Batasan",
    ],
    tools: [
      {
        slug: "rn-tinjau",
        role: "RN-TINJAU",
        name: "RN-TINJAU — Peninjau Kualitas Indikasi",
        mission:
          "Susun tinjauan indikasi: kualitas data dan relevansi metode per pendekatan, konsistensi asumsi antar pendekatan, sebab selisih nilai, dan kelemahan tiap indikasi; penilaian kualitas tanpa akses kertas kerja ditandai [ASUMSI].",
      },
      {
        slug: "rn-bobot",
        role: "RN-BOBOT",
        name: "RN-BOBOT — Analis Pembobotan & Nilai Akhir",
        mission:
          "Susun rekonsiliasi: pembobotan berbasis keandalan dengan alasan eksplisit (bukan rata-rata mekanis), nilai akhir dan rentang, pengecekan silang dengan indikator pasar independen, dan pernyataan keyakinan penilaian.",
      },
    ],
    evaluatorCriteria: [
      "Teliti Detail — selisih antar pendekatan teranalisis sampai ke akar penyebab",
      "Riset Mendalam — pengecekan silang memakai indikator pasar independen yang relevan",
      "Patuh Standar — pembobotan dan nilai akhir sesuai KEPI/SPI serta definisi nilai yang diacu",
      "Kacamata Praktisi Ahli — kedalaman penilai penanggung jawab senior, bukan rata-rata tiga angka",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "analisis-hbu-claw",
    name: "Analisis HBU Claw — Spesialis Analisis Highest and Best Use",
    tagline: "Wawancara → Uji 4 Kriteria → Rekomendasi → Dokumen → Evaluasi Rubrik",
    avatar: "🧭",
    category: "property",
    docLabel: "Dokumen Analisis Penggunaan Tertinggi dan Terbaik (Highest and Best Use Analysis Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Analisis Highest and Best Use (HBU) yang akurat dan komprehensif atas potensi penggunaan sebuah properti — menghasilkan rekomendasi terdukung untuk keputusan investor, pengembang, dan kreditur. Terapkan praktik terbaik sesuai KEPI & SPI: uji empat kriteria berurutan — diizinkan secara hukum (zonasi RDTR, KDB/KLB/KDH, PBG), memungkinkan secara fisik (luas, bentuk, kontur, daya dukung, utilitas), layak secara finansial (analisis pasar permintaan-pasokan per alternatif penggunaan, proyeksi pendapatan-biaya), dan produktivitas maksimal (alternatif dengan nilai residu tanah tertinggi) — analisis HBU as vacant vs as improved, skenario alternatif penggunaan yang realistis dengan land residual per skenario, sensitivitas terhadap asumsi kunci, dan rekomendasi penggunaan dengan tahapan implementasi.",
    interviewTopics: [
      "properti yang dianalisis (lokasi, luas, kondisi eksisting)",
      "zonasi & intensitas ruang yang berlaku (RDTR, KDB/KLB)",
      "kondisi fisik lahan & infrastruktur sekitar",
      "dinamika pasar per alternatif penggunaan (hunian, komersial, campuran)",
      "tujuan analisis & horizon investasi",
    ],
    structure: [
      "Ringkasan Rekomendasi HBU",
      "Identifikasi Properti & Kondisi Eksisting",
      "Uji Kriteria 1: Diizinkan Secara Hukum",
      "Uji Kriteria 2: Memungkinkan Secara Fisik",
      "Uji Kriteria 3: Layak Secara Finansial per Alternatif",
      "Uji Kriteria 4: Produktivitas Maksimal (Nilai Residu)",
      "HBU As Vacant vs As Improved & Sensitivitas",
      "Rekomendasi, Tahapan Implementasi & Lampiran",
    ],
    tools: [
      {
        slug: "hb-uji",
        role: "HB-UJI",
        name: "HB-UJI — Penguji Hukum & Fisik",
        mission:
          "Susun uji kelayakan awal: daftar alternatif penggunaan, uji diizinkan secara hukum (zonasi, intensitas, perizinan) dan memungkinkan secara fisik per alternatif, alternatif yang gugur beserta alasannya; aturan zonasi yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "hb-residu",
        role: "HB-RESIDU",
        name: "HB-RESIDU — Analis Kelayakan & Nilai Residu",
        mission:
          "Susun analisis finansial: proyeksi pendapatan-biaya per alternatif lolos uji, nilai residu tanah per skenario, peringkat produktivitas maksimal, sensitivitas terhadap asumsi kunci, dan rekomendasi HBU dengan tahapan implementasi.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — empat kriteria HBU diuji berurutan atas semua alternatif yang realistis",
      "Rekomendasi Jelas — penggunaan terpilih tegas dengan tahapan implementasi konkret",
      "Bukti Pendukung — kesimpulan didukung data pasar dan perhitungan nilai residu",
      "Kacamata Praktisi Ahli — kedalaman penilai pengembangan senior, bukan opini penggunaan tanpa uji",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "reviu-penilaian-claw",
    name: "Reviu Penilaian Claw — Spesialis Laporan Reviu Penilaian",
    tagline: "Wawancara → Telaah Laporan → Temuan → Dokumen → Evaluasi Rubrik",
    avatar: "🔍",
    category: "property",
    docLabel: "Laporan Reviu Penilaian (Appraisal Review Report)",
    mission:
      "Membantu pengguna menyusun Laporan Reviu Penilaian yang akurat, menyeluruh, dan terorganisir — menelaah laporan penilaian pihak lain — untuk dipakai manajemen senior mengambil keputusan berbasis nilai properti yang andal. Terapkan praktik terbaik sesuai KEPI & SPI (termasuk standar reviu penilaian): pemeriksaan kelengkapan administratif (kompetensi penilai, penugasan, tanggal, definisi nilai), telaah kecukupan dan verifikasi data (pembanding, sumber, tanggal transaksi), kewajaran metode terhadap jenis properti, ketepatan perhitungan (uji ulang matematika grid, kapitalisasi, penyusutan), kewajaran asumsi terhadap kondisi pasar aktual, konsistensi internal laporan, klasifikasi temuan (material vs minor) dengan dampak ke nilai, dan opini reviu (setuju/tidak setuju/perlu revisi) yang dibedakan tegas dari penilaian ulang.",
    interviewTopics: [
      "laporan penilaian yang direviu (objek, penilai, tanggal, nilai)",
      "tujuan reviu (audit internal, kredit, sengketa)",
      "lingkup reviu (desk review vs field review)",
      "area yang dicurigai bermasalah (jika ada)",
      "data pasar independen yang tersedia untuk pembanding",
    ],
    structure: [
      "Ringkasan Opini Reviu",
      "Identifikasi Laporan yang Direviu & Lingkup",
      "Telaah Kelengkapan Administratif",
      "Telaah Data & Verifikasi Pembanding",
      "Telaah Metode & Ketepatan Perhitungan",
      "Telaah Kewajaran Asumsi & Konsistensi",
      "Temuan Material vs Minor & Dampak ke Nilai",
      "Opini Reviu, Rekomendasi & Batasan",
    ],
    tools: [
      {
        slug: "ar-telaah",
        role: "AR-TELAAH",
        name: "AR-TELAAH — Penelaah Data & Metode",
        mission:
          "Susun telaah teknis: kelengkapan administratif, kecukupan dan verifikasi data pembanding, kewajaran metode untuk jenis properti, uji ulang perhitungan kunci, dan konsistensi internal; bagian yang tak dapat diuji tanpa kertas kerja ditandai [ASUMSI].",
      },
      {
        slug: "ar-temuan",
        role: "AR-TEMUAN",
        name: "AR-TEMUAN — Penyusun Temuan & Opini",
        mission:
          "Susun hasil reviu: klasifikasi temuan material vs minor dengan estimasi dampak ke nilai, opini reviu yang tegas (setuju/tidak setuju/perlu revisi) beserta dasarnya, dan rekomendasi tindak lanjut untuk manajemen.",
      },
    ],
    evaluatorCriteria: [
      "Akurat & Menyeluruh — semua aspek laporan tertelaah dan perhitungan kunci teruji ulang",
      "Terorganisir — temuan tersusun sistematis dari administratif hingga substansi nilai",
      "Analitis & Paham Pasar — kewajaran asumsi diuji terhadap kondisi pasar aktual",
      "Kacamata Praktisi Ahli — kedalaman reviewer penilaian senior, bukan proofreading laporan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "amdal-properti-claw",
    name: "Dampak Lingkungan Claw — Spesialis Kajian Dampak Lingkungan Proyek Properti",
    tagline: "Wawancara → Identifikasi Dampak → Mitigasi → Dokumen → Evaluasi Rubrik",
    avatar: "🌿",
    category: "property",
    docLabel: "Kajian Dampak Lingkungan (Environmental Impact Assessment)",
    mission:
      "Membantu pengguna menyusun Kajian Dampak Lingkungan yang mengevaluasi secara komprehensif potensi dampak lingkungan dari rencana pengembangan properti — kualitas udara, sumber daya air, habitat satwa, dan kebisingan — untuk dipakai pengembang, instansi pemerintah, dan pemangku kepentingan dalam proses persetujuan proyek. Terapkan praktik terbaik selaras kerangka persetujuan lingkungan Indonesia (AMDAL/UKL-UPL/SPPL sesuai skala dampak, PP 22/2021): penapisan jenis dokumen lingkungan yang diwajibkan, rona lingkungan awal per komponen (udara, air permukaan/tanah, flora-fauna, kebisingan, sosial), identifikasi dampak per tahap (pra-konstruksi, konstruksi, operasi), prakiraan besaran dan sifat penting dampak, rencana mitigasi yang layak dan terukur per dampak, rencana pemantauan (parameter, lokasi, frekuensi), dan keterlibatan masyarakat terdampak. Sertakan pengingat: dokumen AMDAL/UKL-UPL resmi wajib disusun bersama konsultan lingkungan tersertifikasi (KTPA/ATPA) — kajian ini alat bantu persiapan.",
    interviewTopics: [
      "rencana proyek (jenis, skala, luas lahan, lokasi)",
      "kondisi lingkungan sekitar (badan air, permukiman, kawasan lindung)",
      "tahapan proyek & aktivitas yang menimbulkan dampak",
      "kekhawatiran masyarakat atau isu lingkungan yang sudah muncul",
      "status perizinan lingkungan yang sedang diurus",
    ],
    structure: [
      "Ringkasan Kajian & Dampak Utama",
      "Deskripsi Rencana Proyek",
      "Penapisan Dokumen Lingkungan yang Diwajibkan",
      "Rona Lingkungan Awal per Komponen",
      "Identifikasi & Prakiraan Dampak per Tahap",
      "Rencana Mitigasi per Dampak",
      "Rencana Pemantauan & Keterlibatan Masyarakat",
      "Kesimpulan, Asumsi & Lampiran",
    ],
    tools: [
      {
        slug: "ea-dampak",
        role: "EA-DAMPAK",
        name: "EA-DAMPAK — Pengidentifikasi Dampak",
        mission:
          "Susun identifikasi dampak: rona lingkungan awal per komponen (udara, air, flora-fauna, kebisingan, sosial), matriks dampak per tahap proyek, prakiraan besaran dan sifat penting dampak; kondisi rona yang belum diukur lapangan ditandai [ASUMSI].",
      },
      {
        slug: "ea-mitigasi",
        role: "EA-MITIGASI",
        name: "EA-MITIGASI — Perancang Mitigasi & Pemantauan",
        mission:
          "Susun rencana pengelolaan: mitigasi layak dan terukur per dampak prioritas, rencana pemantauan (parameter, baku mutu acuan, lokasi, frekuensi, penanggung jawab), dan rencana keterlibatan masyarakat terdampak.",
      },
    ],
    evaluatorCriteria: [
      "Analisis Komprehensif — semua komponen lingkungan dan tahap proyek tercakup",
      "Identifikasi Dampak Akurat — besaran dan sifat penting dampak diprakirakan dengan dasar jelas",
      "Mitigasi Layak — strategi mitigasi terukur, realistis, dan terhubung ke rencana pemantauan",
      "Kacamata Praktisi Ahli — kedalaman penyusun kajian lingkungan senior, bukan daftar dampak generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 10 (property-manager, property) ───────────────────────────────────
  {
    kind: "openclaw",
    slug: "aplikasi-penyewa-claw",
    name: "Aplikasi Penyewa Claw — Spesialis Formulir Aplikasi Penyewa",
    tagline: "Wawancara → Rancang Formulir → Alur Proses → Dokumen → Evaluasi Rubrik",
    avatar: "📝",
    category: "property",
    docLabel: "Formulir Aplikasi Penyewa (Tenant Application)",
    mission:
      "Membantu pengguna menyusun Formulir Aplikasi Penyewa yang ramah pengguna dan komprehensif — merampingkan proses lamaran sewa bagi calon penyewa sekaligus mempercepat evaluasi oleh tim pengelola properti. Terapkan praktik terbaik: struktur formulir logis (data diri, pekerjaan & penghasilan, riwayat sewa, referensi, penghuni & kendaraan, hewan peliharaan), dokumen pendukung proporsional (KTP/KK, slip gaji atau bukti penghasilan, NPWP bila perlu), pernyataan persetujuan verifikasi dan pemrosesan data pribadi selaras UU PDP, kriteria penyaringan yang objektif dan konsisten (rasio penghasilan terhadap sewa, riwayat pembayaran), alur proses dari terima aplikasi → verifikasi → keputusan dengan SLA jelas, bahasa formulir sederhana tanpa jargon, dan lembar penilaian internal agar keputusan antar-aplikasi konsisten dan terdokumentasi.",
    interviewTopics: [
      "jenis properti yang disewakan (rumah, apartemen, ruko, kos)",
      "profil target penyewa & syarat minimum",
      "dokumen pendukung yang diwajibkan",
      "alur evaluasi & siapa pengambil keputusan",
      "kebijakan khusus (hewan, jumlah penghuni, sub-sewa)",
    ],
    structure: [
      "Petunjuk Pengisian untuk Calon Penyewa",
      "Data Diri & Kontak Darurat",
      "Pekerjaan & Penghasilan",
      "Riwayat Sewa & Referensi",
      "Penghuni, Kendaraan & Hewan Peliharaan",
      "Dokumen Pendukung & Checklist Kelengkapan",
      "Pernyataan Persetujuan & Verifikasi Data",
      "Lembar Penilaian Internal & Alur Keputusan",
    ],
    tools: [
      {
        slug: "ta-form",
        role: "TA-FORM",
        name: "TA-FORM — Perancang Formulir",
        mission:
          "Susun formulir aplikasi: bagian-bagian lengkap dengan bahasa sederhana, dokumen pendukung proporsional per jenis properti, pernyataan persetujuan pemrosesan data selaras UU PDP; kebijakan pemilik yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "ta-proses",
        role: "TA-PROSES",
        name: "TA-PROSES — Perancang Alur Evaluasi",
        mission:
          "Susun alur proses: kriteria penyaringan objektif (rasio penghasilan-sewa, riwayat pembayaran, referensi), lembar penilaian internal berbobot, tahapan verifikasi dengan SLA, dan template komunikasi keputusan (diterima/ditolak/perlu dokumen tambahan).",
      },
    ],
    evaluatorCriteria: [
      "Ramah Pengguna — formulir mudah diisi calon penyewa awam tanpa kebingungan",
      "Informasi Komprehensif — semua data yang dibutuhkan evaluasi tercakup tanpa berlebihan",
      "Proses Ramping — alur dari aplikasi sampai keputusan jelas, cepat, dan konsisten",
      "Kacamata Praktisi Ahli — kedalaman pengelola properti senior, bukan formulir biodata biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-penagihan-sewa-claw",
    name: "Penagihan Sewa Claw — Spesialis Laporan Penagihan Sewa",
    tagline: "Wawancara → Rekap Pembayaran → Analisis Tunggakan → Dokumen → Evaluasi Rubrik",
    avatar: "🧾",
    category: "property",
    docLabel: "Laporan Penagihan Sewa (Rent Collection Report)",
    mission:
      "Membantu pengguna menyusun Laporan Penagihan Sewa yang melacak dan mendokumentasikan pembayaran sewa secara akurat — memberi gambaran jelas aktivitas penagihan dan mengidentifikasi tunggakan atau keterlambatan — untuk dipakai tim pengelola menjaga penagihan tepat waktu dan catatan keuangan rapi. Terapkan praktik terbaik: rekap per unit/penyewa (jatuh tempo, tanggal bayar, jumlah, metode, denda keterlambatan sesuai kontrak), status kategori jelas (lunas, terlambat, menunggak, cicilan), aging tunggakan (1–30, 31–60, >60 hari), tingkat kolektibilitas bulanan dan trennya, rekonsiliasi dengan rekening penerimaan, catatan tindak lanjut per tunggakan (pengingat, somasi bertahap sesuai kontrak), proyeksi penerimaan bulan berikutnya, dan ringkasan eksekutif untuk pemilik properti termasuk potongan PPh final sewa bila dikelola.",
    interviewTopics: [
      "portofolio unit & penyewa yang dilaporkan",
      "ketentuan sewa (jatuh tempo, denda, metode bayar)",
      "data pembayaran periode berjalan",
      "tunggakan yang ada & riwayat tindak lanjutnya",
      "format pelaporan ke pemilik & periode laporan",
    ],
    structure: [
      "Ringkasan Eksekutif & Tingkat Kolektibilitas",
      "Rekap Pembayaran per Unit/Penyewa",
      "Status Kategori & Aging Tunggakan",
      "Denda Keterlambatan & Rekonsiliasi Penerimaan",
      "Analisis Tren Kolektibilitas",
      "Tindak Lanjut Tunggakan & Eskalasi",
      "Proyeksi Penerimaan Periode Berikutnya",
      "Catatan, Asumsi & Lampiran Detail",
    ],
    tools: [
      {
        slug: "rc-rekap",
        role: "RC-REKAP",
        name: "RC-REKAP — Penyusun Rekap & Aging",
        mission:
          "Susun rekap penagihan: tabel per unit/penyewa (jatuh tempo, bayar, jumlah, metode, denda), status kategori, aging tunggakan 1–30/31–60/>60 hari, dan rekonsiliasi penerimaan; data pembayaran yang belum terkonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "rc-analisis",
        role: "RC-ANALISIS",
        name: "RC-ANALISIS — Analis Kolektibilitas & Tindak Lanjut",
        mission:
          "Susun analisis: tingkat kolektibilitas dan tren, akar masalah tunggakan berulang, rencana tindak lanjut bertahap per tunggakan (pengingat → surat peringatan → somasi sesuai kontrak), dan proyeksi penerimaan periode berikutnya.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Jernih — status setiap unit terbaca sekilas dengan kategori dan aging yang tegas",
      "Data Menyeluruh — semua pembayaran, denda, dan tunggakan terekam dan terekonsiliasi",
      "Wawasan Analitis — tren kolektibilitas dan akar masalah tunggakan teranalisis dengan tindak lanjut",
      "Kacamata Praktisi Ahli — kedalaman pengelola keuangan properti senior, bukan tabel setoran biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "checklist-inspeksi-properti-claw",
    name: "Inspeksi Properti Claw — Spesialis Checklist Inspeksi Properti",
    tagline: "Wawancara → Susun Checklist → Prosedur & Temuan → Dokumen → Evaluasi Rubrik",
    avatar: "✅",
    category: "property",
    docLabel: "Checklist Inspeksi Properti (Property Inspection Checklist)",
    mission:
      "Membantu pengguna menyusun Checklist Inspeksi Properti yang memastikan pemeriksaan menyeluruh dan efisien — merampingkan proses inspeksi, mengidentifikasi kebutuhan perbaikan/pemeliharaan, dan menjaga kepatuhan pada regulasi dan standar (SLF, proteksi kebakaran, instalasi listrik PUIL). Terapkan praktik terbaik: checklist terorganisir per area (eksterior, atap & talang, struktur, interior per ruangan, MEP, sanitasi, keamanan & proteksi kebakaran, area bersama untuk apartemen/IPL), item spesifik yang dapat diverifikasi (bukan 'cek kondisi' generik), skala kondisi konsisten (baik/perlu perhatian/rusak) dengan kolom foto bukti, frekuensi inspeksi per jenis (rutin bulanan, musiman pra-hujan, pra-sewa, insidental), estimasi prioritas tindak lanjut per temuan, format ringkas yang bisa dipakai di lapangan, dan rekap temuan yang otomatis menjadi daftar kerja pemeliharaan.",
    interviewTopics: [
      "jenis properti & area yang diinspeksi",
      "tujuan inspeksi (rutin, pra-sewa, serah terima, kepatuhan)",
      "sistem terpasang (listrik, air, AC, lift, proteksi kebakaran)",
      "masalah berulang yang selama ini ditemukan",
      "frekuensi inspeksi & siapa pelaksananya",
    ],
    structure: [
      "Petunjuk Penggunaan & Skala Kondisi",
      "Checklist Eksterior, Atap & Struktur",
      "Checklist Interior per Ruangan",
      "Checklist MEP & Sanitasi",
      "Checklist Keamanan & Proteksi Kebakaran",
      "Checklist Area Bersama (bila ada)",
      "Rekap Temuan & Prioritas Tindak Lanjut",
      "Jadwal Frekuensi Inspeksi & Penanggung Jawab",
    ],
    tools: [
      {
        slug: "pi-checklist",
        role: "PI-CHECKLIST",
        name: "PI-CHECKLIST — Penyusun Checklist per Area",
        mission:
          "Susun checklist: item spesifik dan terverifikasi per area (eksterior, interior, MEP, keamanan, area bersama), skala kondisi konsisten dengan kolom foto, disesuaikan jenis properti; item yang butuh ahli spesialis ditandai [ASUMSI].",
      },
      {
        slug: "pi-tindak",
        role: "PI-TINDAK",
        name: "PI-TINDAK — Perancang Prosedur & Tindak Lanjut",
        mission:
          "Susun prosedur: jadwal frekuensi inspeksi per jenis (rutin, musiman, pra-sewa), alur dari temuan → prioritas → daftar kerja pemeliharaan, format rekap temuan untuk pemilik, dan keterkaitan dengan kepatuhan (SLF, proteksi kebakaran).",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua area dan sistem penting tercakup tanpa celah pemeriksaan",
      "Terorganisir — urutan checklist logis mengikuti alur jalan inspeksi di lapangan",
      "Kejelasan — setiap item spesifik, terverifikasi, dan bisa diisi petugas non-teknis",
      "Kacamata Praktisi Ahli — kedalaman pengelola gedung senior, bukan daftar 'cek kondisi' generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-pengembalian-deposit-claw",
    name: "Pengembalian Deposit Claw — Spesialis Surat Pengembalian Deposit",
    tagline: "Wawancara → Rincian Potongan → Draf Surat → Dokumen → Evaluasi Rubrik",
    avatar: "💌",
    category: "property",
    docLabel: "Surat Pengembalian Deposit (Security Deposit Refund Letter)",
    mission:
      "Membantu pengguna menyusun Surat Pengembalian Deposit yang memastikan proses transparan dan mulus bagi penyewa maupun pemilik — menjelaskan alasan setiap potongan dan rincian jumlah yang dikembalikan. Terapkan praktik terbaik: dasar potongan mengacu klausul kontrak sewa dan berita acara serah terima (move-out checklist), pembedaan tegas kerusakan akibat penyewa vs keausan wajar (wear and tear) yang tidak boleh dipotong, rincian potongan per item dengan bukti (foto, kuitansi perbaikan, tagihan utilitas tertunggak), perhitungan jelas (deposit awal − total potongan = jumlah dikembalikan), metode dan batas waktu pengembalian sesuai kontrak, nada profesional yang menjaga hubungan baik, langkah bila penyewa keberatan (musyawarah dulu sesuai kontrak), dan lampiran bukti lengkap agar meminimalkan sengketa.",
    interviewTopics: [
      "kontrak sewa & klausul deposit yang berlaku",
      "hasil pemeriksaan saat serah terima keluar",
      "potongan yang akan dikenakan & buktinya",
      "tunggakan sewa/utilitas yang belum lunas",
      "metode & batas waktu pengembalian",
    ],
    structure: [
      "Identitas Para Pihak & Referensi Kontrak",
      "Ringkasan Deposit & Jumlah Dikembalikan",
      "Hasil Pemeriksaan Serah Terima Keluar",
      "Rincian Potongan per Item dengan Dasar Kontrak",
      "Pembedaan Kerusakan vs Keausan Wajar",
      "Perhitungan Akhir & Metode Pengembalian",
      "Prosedur Bila Ada Keberatan",
      "Lampiran Bukti (Foto, Kuitansi, Berita Acara)",
    ],
    tools: [
      {
        slug: "sd-potongan",
        role: "SD-POTONGAN",
        name: "SD-POTONGAN — Analis Potongan & Bukti",
        mission:
          "Susun rincian potongan: item per item dengan dasar klausul kontrak dan bukti (foto, kuitansi), pembedaan kerusakan penyewa vs keausan wajar, tunggakan yang ikut diperhitungkan, dan perhitungan akhir; biaya perbaikan yang masih estimasi ditandai [ASUMSI].",
      },
      {
        slug: "sd-surat",
        role: "SD-SURAT",
        name: "SD-SURAT — Penyusun Draf Surat",
        mission:
          "Susun draf surat: nada profesional dan menjaga hubungan baik, struktur jelas dari ringkasan sampai rincian, metode dan batas waktu pengembalian, prosedur keberatan, dan daftar lampiran bukti yang menyertai surat.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi — perhitungan deposit, potongan, dan jumlah kembali benar dan konsisten dengan bukti",
      "Kejelasan — alasan setiap potongan dipahami penyewa tanpa penjelasan tambahan",
      "Transparansi — semua potongan berdasar kontrak dengan bukti terlampir, keausan wajar tidak dipotong",
      "Kacamata Praktisi Ahli — kedalaman pengelola properti senior yang meminimalkan sengketa, bukan surat tagihan sepihak",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kontrak-pengelolaan-properti-claw",
    name: "Kontrak Pengelolaan Claw — Spesialis Kontrak Pengelolaan Properti",
    tagline: "Wawancara → Lingkup & Fee → Klausul → Dokumen → Evaluasi Rubrik",
    avatar: "🤝",
    category: "property",
    docLabel: "Kontrak Pengelolaan Properti (Property Management Contract)",
    mission:
      "Membantu pengguna menyusun Kontrak Pengelolaan Properti yang komprehensif — menetapkan hubungan profesional yang jelas antara pemilik dan pengelola dengan hak-kewajiban, lingkup jasa, dan imbalan yang tegas. Terapkan praktik terbaik kontrak Indonesia (syarat sah Pasal 1320 KUHPerdata): identitas para pihak dan objek kelolaan, lingkup jasa terperinci (pemasaran unit, seleksi penyewa, penagihan, pemeliharaan, pelaporan keuangan berkala), struktur imbalan jelas (persentase dari sewa terkumpul vs fee tetap, biaya yang dapat ditagihkan kembali), batas wewenang pengelola (plafon pengeluaran tanpa persetujuan, tanda tangan kontrak sewa), kewajiban rekening terpisah untuk dana pemilik, standar pelaporan dan frekuensinya, tanggung jawab pajak (PPh final sewa milik pemilik), asuransi dan pembagian risiko, jangka waktu, pengakhiran dan serah terima kelolaan, serta penyelesaian sengketa bertingkat. Sertakan pengingat: finalisasi kontrak sebaiknya direviu konsultan hukum atau notaris.",
    interviewTopics: [
      "properti yang dikelola & para pihak",
      "lingkup jasa yang disepakati",
      "struktur imbalan & biaya yang bisa ditagihkan kembali",
      "batas wewenang pengelola & pelaporan",
      "jangka waktu, pengakhiran & penyelesaian sengketa",
    ],
    structure: [
      "Identitas Para Pihak & Objek Kelolaan",
      "Lingkup Jasa Pengelolaan Terperinci",
      "Imbalan, Biaya & Mekanisme Pembayaran",
      "Wewenang, Batasan & Rekening Terpisah",
      "Pelaporan, Pajak & Asuransi",
      "Jangka Waktu, Perpanjangan & Pengakhiran",
      "Wanprestasi & Penyelesaian Sengketa",
      "Ketentuan Penutup & Lampiran",
    ],
    tools: [
      {
        slug: "pg-lingkup",
        role: "PG-LINGKUP",
        name: "PG-LINGKUP — Perancang Lingkup & Imbalan",
        mission:
          "Susun lingkup dan imbalan: rincian jasa per fungsi (pemasaran, seleksi, penagihan, pemeliharaan, pelaporan), struktur fee dengan basis perhitungan jelas, biaya yang dapat ditagihkan kembali, dan batas wewenang dengan plafon; angka yang belum disepakati ditandai [ASUMSI].",
      },
      {
        slug: "pg-klausul",
        role: "PG-KLAUSUL",
        name: "PG-KLAUSUL — Penyusun Klausul Perlindungan",
        mission:
          "Susun klausul kunci: rekening terpisah dana pemilik, standar pelaporan, tanggung jawab pajak dan asuransi, wanprestasi dan pengakhiran dengan serah terima kelolaan yang tertib, dan penyelesaian sengketa bertingkat (musyawarah → mediasi → pengadilan/arbitrase).",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua aspek hubungan pemilik-pengelola tercakup tanpa celah abu-abu",
      "Kejelasan Kewajiban — hak, kewajiban, dan batas wewenang tiap pihak tegas dan terukur",
      "Perlindungan Seimbang — klausul melindungi dana pemilik sekaligus adil bagi pengelola",
      "Kacamata Praktisi Ahli — kedalaman praktisi kontrak pengelolaan senior, bukan template perjanjian umum",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "prakiraan-anggaran-properti-claw",
    name: "Anggaran Properti Claw — Spesialis Prakiraan Anggaran Properti",
    tagline: "Wawancara → Proyeksi Pendapatan-Biaya → Skenario → Dokumen → Evaluasi Rubrik",
    avatar: "📊",
    category: "property",
    docLabel: "Dokumen Prakiraan Anggaran (Budget Forecast Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Prakiraan Anggaran properti yang komprehensif dan analitis — memproyeksikan pendapatan dan biaya operasional untuk perencanaan keuangan pengelolaan. Terapkan praktik terbaik: proyeksi pendapatan berbasis data (sewa kontrak berjalan, asumsi perpanjangan dan kenaikan, kekosongan realistis, pendapatan lain seperti parkir/service charge), biaya operasional per pos dengan basis historis (pemeliharaan rutin, utilitas area bersama, kebersihan-keamanan, PBB, asuransi, honor pengelola), pemisahan biaya operasional vs belanja modal (capex) dengan rencana penggantian komponen besar, cadangan pemeliharaan (replacement reserve) yang memadai, penyusunan bulanan dengan pola musiman, skenario dasar-optimis-pesimis, indikator kinerja (rasio biaya operasional terhadap pendapatan, NOI), dan mekanisme monitoring realisasi vs anggaran dengan ambang varians.",
    interviewTopics: [
      "properti & portofolio yang dianggarkan",
      "data historis pendapatan & biaya",
      "kontrak sewa berjalan & rencana penyesuaian tarif",
      "rencana perbaikan besar / penggantian komponen",
      "periode anggaran & format pelaporan pemilik",
    ],
    structure: [
      "Ringkasan Anggaran & Indikator Kunci",
      "Asumsi Dasar & Sumber Data",
      "Proyeksi Pendapatan per Sumber",
      "Proyeksi Biaya Operasional per Pos",
      "Belanja Modal & Cadangan Pemeliharaan",
      "Anggaran Bulanan & Pola Musiman",
      "Skenario Dasar–Optimis–Pesimis",
      "Monitoring Realisasi & Ambang Varians",
    ],
    tools: [
      {
        slug: "bf-proyeksi",
        role: "BF-PROYEKSI",
        name: "BF-PROYEKSI — Penyusun Proyeksi Pendapatan-Biaya",
        mission:
          "Susun proyeksi: pendapatan per sumber dengan asumsi kekosongan dan kenaikan realistis, biaya operasional per pos berbasis historis, pemisahan opex vs capex, dan cadangan pemeliharaan; asumsi tanpa data historis ditandai [ASUMSI].",
      },
      {
        slug: "bf-skenario",
        role: "BF-SKENARIO",
        name: "BF-SKENARIO — Analis Skenario & Monitoring",
        mission:
          "Susun analisis: anggaran bulanan dengan pola musiman, skenario dasar-optimis-pesimis dengan pemicu masing-masing, indikator kinerja (NOI, rasio biaya), dan mekanisme monitoring realisasi vs anggaran dengan ambang varians dan tindakan korektif.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua sumber pendapatan dan pos biaya termasuk capex dan cadangan tercakup",
      "Ketelitian Analitis — proyeksi berbasis data historis dengan asumsi yang dapat dipertanggungjawabkan",
      "Komunikasi Jernih — anggaran mudah dipahami pemilik dan siap dipakai monitoring bulanan",
      "Kacamata Praktisi Ahli — kedalaman pengelola keuangan properti senior, bukan tabel perkiraan kasar",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "checklist-serah-terima-unit-claw",
    name: "Serah Terima Unit Claw — Spesialis Checklist Serah Terima Masuk-Keluar",
    tagline: "Wawancara → Checklist per Ruangan → Prosedur & Bukti → Dokumen → Evaluasi Rubrik",
    avatar: "🔑",
    category: "property",
    docLabel: "Checklist Serah Terima Masuk-Keluar (Move-In/Move-Out Checklist)",
    mission:
      "Membantu pengguna menyusun Checklist Serah Terima Masuk-Keluar yang memastikan transisi penyewa berjalan mulus dan kondisi properti terlindungi — komprehensif, terorganisir, dan mudah diikuti staf pengelola maupun penyewa. Terapkan praktik terbaik: checklist kondisi per ruangan dengan item spesifik (dinding, lantai, plafon, pintu-jendela, fixture, perabot bila furnished), pencatatan meteran (listrik, air, gas) saat masuk dan keluar, dokumentasi foto/video bertanggal sebagai bukti kondisi, kolom kondisi masuk vs keluar berdampingan untuk perbandingan langsung, daftar kunci dan akses yang diserahkan, pembedaan kerusakan vs keausan wajar sebagai dasar potongan deposit yang adil, tanda tangan kedua pihak sebagai berita acara, dan keterkaitan langsung dengan proses pengembalian deposit agar sengketa minimal.",
    interviewTopics: [
      "jenis unit & kelengkapannya (kosong/semi/full furnished)",
      "proses serah terima yang berjalan sekarang",
      "masalah sengketa deposit yang pernah terjadi",
      "utilitas & akses yang dicatat saat serah terima",
      "siapa yang mendampingi proses & format dokumentasi",
    ],
    structure: [
      "Petunjuk Penggunaan & Skala Kondisi",
      "Data Unit, Penyewa & Tanggal Serah Terima",
      "Checklist Kondisi per Ruangan (Masuk vs Keluar)",
      "Perabot & Kelengkapan (bila Furnished)",
      "Pencatatan Meteran & Utilitas",
      "Daftar Kunci & Akses",
      "Dokumentasi Foto & Catatan Khusus",
      "Berita Acara & Tanda Tangan Kedua Pihak",
    ],
    tools: [
      {
        slug: "mo-ruangan",
        role: "MO-RUANGAN",
        name: "MO-RUANGAN — Penyusun Checklist Kondisi",
        mission:
          "Susun checklist kondisi: item spesifik per ruangan dengan kolom masuk vs keluar berdampingan, kelengkapan perabot bila furnished, pencatatan meteran dan kunci; kelengkapan unit yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "mo-prosedur",
        role: "MO-PROSEDUR",
        name: "MO-PROSEDUR — Perancang Prosedur & Bukti",
        mission:
          "Susun prosedur serah terima: urutan langkah masuk dan keluar, standar dokumentasi foto bertanggal, pembedaan kerusakan vs keausan wajar, format berita acara dengan tanda tangan, dan keterkaitan hasil checklist ke perhitungan pengembalian deposit.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua ruangan, kelengkapan, meteran, dan akses tercatat tanpa celah",
      "Terorganisir — format masuk vs keluar berdampingan memudahkan perbandingan langsung",
      "Kejelasan — checklist bisa diikuti staf dan penyewa tanpa pelatihan khusus",
      "Kacamata Praktisi Ahli — kedalaman pengelola properti senior yang mencegah sengketa deposit, bukan daftar barang biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rencana-pemasaran-properti-claw",
    name: "Pemasaran Properti Claw — Spesialis Rencana Pemasaran Properti",
    tagline: "Wawancara → Riset Pasar → Strategi Kanal → Dokumen → Evaluasi Rubrik",
    avatar: "📣",
    category: "property",
    docLabel: "Rencana Pemasaran Properti (Property Marketing Plan)",
    mission:
      "Membantu pengguna menyusun Rencana Pemasaran Properti yang efektif mempromosikan properti dan menarik calon pembeli atau penyewa — komprehensif dan terancang baik dengan strategi iklan, penonjolan keunggulan properti, dan penjangkauan audiens target. Terapkan praktik terbaik: riset pasar lokal (harga pasaran koridor, pesaing aktif, profil pencari di area), segmentasi audiens target dengan persona jelas, positioning dan unique selling points properti (lokasi, akses, legalitas lengkap, fasilitas), strategi kanal sesuai pasar Indonesia (portal properti seperti listing online, media sosial dan video singkat, WhatsApp Business untuk follow-up, papan/spanduk lokal, jaringan agen dengan skema komisi), materi pemasaran berkualitas (foto profesional, denah, video tur virtual), penetapan harga dan strategi negosiasi, kalender kampanye dengan anggaran per kanal, target metrik (jumlah inquiry, viewing, konversi), dan evaluasi mingguan untuk realokasi anggaran ke kanal terbaik.",
    interviewTopics: [
      "properti yang dipasarkan (jenis, lokasi, kondisi, legalitas)",
      "target pasar (jual/sewa, segmen pembeli/penyewa)",
      "harga yang diinginkan & pembanding pasar",
      "anggaran pemasaran & kanal yang pernah dipakai",
      "tenggat waktu & target closing",
    ],
    structure: [
      "Ringkasan Strategi & Target",
      "Riset Pasar & Analisis Pesaing",
      "Segmentasi Audiens & Persona Target",
      "Positioning & Keunggulan Properti",
      "Strategi Kanal & Materi Pemasaran",
      "Harga, Skema Negosiasi & Insentif",
      "Kalender Kampanye & Anggaran per Kanal",
      "Target Metrik & Evaluasi Mingguan",
    ],
    tools: [
      {
        slug: "mm-riset",
        role: "MM-RISET",
        name: "MM-RISET — Periset Pasar & Audiens",
        mission:
          "Susun riset: harga pasaran koridor dan pesaing aktif, profil pencari properti di area, segmentasi audiens dengan persona, dan positioning serta USP properti; data pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "mm-kanal",
        role: "MM-KANAL",
        name: "MM-KANAL — Perancang Kanal & Kampanye",
        mission:
          "Susun strategi eksekusi: pemilihan kanal sesuai segmen (portal listing, media sosial, WhatsApp, agen, spanduk lokal), spesifikasi materi pemasaran, kalender kampanye dengan anggaran per kanal, target metrik, dan mekanisme evaluasi-realokasi mingguan.",
      },
    ],
    evaluatorCriteria: [
      "Riset Pasar — harga, pesaing, dan profil audiens dianalisis dengan data lokal",
      "Strategi Inovatif — kombinasi kanal kreatif dan tepat sasaran untuk segmen target",
      "Komunikasi Keunggulan — USP properti tersampaikan jelas dan menarik di setiap materi",
      "Kacamata Praktisi Ahli — kedalaman pemasar properti senior, bukan sekadar pasang iklan di satu portal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-perpanjangan-sewa-claw",
    name: "Perpanjangan Sewa Claw — Spesialis Surat Penawaran Perpanjangan Sewa",
    tagline: "Wawancara → Analisis Syarat → Draf Persuasif → Dokumen → Evaluasi Rubrik",
    avatar: "✉️",
    category: "property",
    docLabel: "Surat Penawaran Perpanjangan Sewa (Tenant Renewal Letter)",
    mission:
      "Membantu pengguna menyusun Surat Penawaran Perpanjangan Sewa yang mengkomunikasikan syarat dan manfaat perpanjangan secara jelas, ringkas, dan persuasif — dikirim tim pengelola kepada penyewa yang layak diperpanjang. Terapkan praktik terbaik: pengiriman cukup awal sebelum kontrak berakhir (60–90 hari) agar ada waktu negosiasi, apresiasi atas riwayat sewa yang baik, syarat perpanjangan jelas (durasi baru, harga sewa dan dasar penyesuaian yang wajar terhadap pasar, deposit, perubahan ketentuan bila ada), manfaat memperpanjang bagi penyewa (tanpa biaya pindah, prioritas perbaikan, harga lebih baik dari penawaran ke pasar), opsi yang ditawarkan (durasi alternatif bila ada), batas waktu tanggapan dan cara konfirmasi yang mudah, nada hangat namun profesional, dan langkah berikutnya bila penyewa menolak (jadwal pengembalian unit) tanpa nada mengancam.",
    interviewTopics: [
      "penyewa & kontrak yang akan berakhir (tanggal, harga sekarang)",
      "riwayat penyewa (pembayaran, perawatan unit)",
      "syarat perpanjangan yang ditawarkan (harga baru, durasi)",
      "dasar penyesuaian harga vs pasar",
      "batas waktu tanggapan & alur konfirmasi",
    ],
    structure: [
      "Pembuka & Apresiasi Penyewa",
      "Informasi Kontrak Berjalan & Tanggal Berakhir",
      "Penawaran Perpanjangan & Syarat Baru",
      "Dasar Penyesuaian Harga",
      "Manfaat Memperpanjang bagi Penyewa",
      "Opsi Durasi & Batas Waktu Tanggapan",
      "Cara Konfirmasi & Langkah Berikutnya",
      "Penutup & Kontak Pengelola",
    ],
    tools: [
      {
        slug: "tn-syarat",
        role: "TN-SYARAT",
        name: "TN-SYARAT — Analis Syarat & Penyesuaian",
        mission:
          "Susun analisis penawaran: perbandingan harga sekarang vs pasar sebagai dasar penyesuaian wajar, opsi durasi dengan insentif masing-masing, dan perubahan ketentuan yang perlu disorot; harga pasar yang diperkirakan ditandai [ASUMSI].",
      },
      {
        slug: "tn-draf",
        role: "TN-DRAF",
        name: "TN-DRAF — Penyusun Draf Surat",
        mission:
          "Susun draf surat: nada hangat-profesional dengan apresiasi tulus, syarat jelas tanpa ambigu, manfaat memperpanjang yang persuasif, batas waktu dan cara konfirmasi mudah, dan penutup yang menjaga hubungan baik apa pun keputusan penyewa.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Informasi — tanggal, harga, dan syarat perpanjangan benar dan konsisten dengan kontrak",
      "Jelas & Ringkas — penyewa memahami penawaran lengkap dalam sekali baca",
      "Persuasif — manfaat memperpanjang terasa nyata tanpa nada menekan",
      "Kacamata Praktisi Ahli — kedalaman pengelola yang menjaga retensi penyewa, bukan surat pemberitahuan kenaikan harga",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "log-pemeliharaan-properti-claw",
    name: "Log Pemeliharaan Claw — Spesialis Log Pemeliharaan Properti",
    tagline: "Wawancara → Struktur Log → Alur & Jadwal → Dokumen → Evaluasi Rubrik",
    avatar: "🛠️",
    category: "property",
    docLabel: "Log Pemeliharaan Properti (Property Maintenance Log)",
    mission:
      "Membantu pengguna menyusun Log Pemeliharaan Properti yang komprehensif dan mudah dipakai — merekam semua pekerjaan pemeliharaan beserta statusnya secara akurat — untuk dipakai pemilik, staf pemeliharaan, dan penyewa memastikan pemeliharaan tepat waktu dan efisien. Terapkan praktik terbaik: format entri baku (tanggal lapor, pelapor, lokasi/unit, deskripsi masalah, kategori, prioritas, penanggung jawab/vendor, biaya, tanggal selesai, status), alur dari laporan penyewa → triase prioritas (darurat/mendesak/rutin) → penugasan → verifikasi selesai → konfirmasi pelapor, jadwal pemeliharaan preventif per komponen (servis AC berkala, kuras toren, pengecekan listrik, pest control) terpisah dari perbaikan reaktif, riwayat per unit/aset untuk melihat masalah berulang, rekap biaya bulanan per kategori untuk anggaran, SLA respons per tingkat prioritas, dan format yang bisa dipakai di lapangan maupun direkap untuk pelaporan pemilik.",
    interviewTopics: [
      "properti & jumlah unit yang dikelola",
      "cara penyewa melaporkan masalah sekarang",
      "tim/vendor pemeliharaan yang menangani",
      "komponen yang butuh pemeliharaan preventif berkala",
      "format pelaporan biaya ke pemilik",
    ],
    structure: [
      "Petunjuk Penggunaan & Kategori Prioritas",
      "Format Entri Log Baku",
      "Alur Laporan → Triase → Penugasan → Verifikasi",
      "Jadwal Pemeliharaan Preventif per Komponen",
      "Riwayat per Unit & Deteksi Masalah Berulang",
      "Rekap Biaya Bulanan per Kategori",
      "SLA Respons per Tingkat Prioritas",
      "Format Rekap untuk Laporan Pemilik",
    ],
    tools: [
      {
        slug: "lm-log",
        role: "LM-LOG",
        name: "LM-LOG — Perancang Struktur Log",
        mission:
          "Susun struktur log: format entri baku lengkap (pelapor, lokasi, kategori, prioritas, vendor, biaya, status), kategori dan tingkat prioritas dengan definisi jelas, dan riwayat per unit; kebutuhan khusus properti yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "lm-alur",
        role: "LM-ALUR",
        name: "LM-ALUR — Perancang Alur & Jadwal Preventif",
        mission:
          "Susun alur kerja: proses laporan sampai verifikasi selesai dengan SLA per prioritas, jadwal preventif per komponen (AC, toren, listrik, pest control), deteksi masalah berulang, dan rekap biaya bulanan untuk pelaporan pemilik.",
      },
    ],
    evaluatorCriteria: [
      "Pencatatan Komprehensif — semua pekerjaan terekam dengan status dan biaya yang akurat",
      "Mudah Dipakai — format sederhana untuk staf lapangan tanpa pelatihan khusus",
      "Peningkatan Efisiensi — triase, SLA, dan jadwal preventif mengurangi perbaikan darurat",
      "Kacamata Praktisi Ahli — kedalaman kepala pemeliharaan senior, bukan buku catatan tukang",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "kontrak-vendor-claw",
    name: "Kontrak Vendor Claw — Spesialis Kontrak Vendor Properti",
    tagline: "Wawancara → Lingkup & SLA → Klausul → Dokumen → Evaluasi Rubrik",
    avatar: "📎",
    category: "property",
    docLabel: "Kontrak Vendor (Vendor Contract)",
    mission:
      "Membantu pengguna menyusun Kontrak Vendor yang komprehensif dan mengikat secara hukum — menetapkan syarat dan ketentuan kerja sama vendor secara jelas — untuk dipakai tim pengelola properti dan bagian legal membakukan proses manajemen vendor yang profesional. Terapkan praktik terbaik kontrak Indonesia (syarat sah Pasal 1320 KUHPerdata): identitas dan legalitas vendor (NIB, NPWP, sertifikasi teknis bila relevan seperti instalasi listrik), lingkup pekerjaan terperinci dengan spesifikasi dan standar mutu, SLA terukur (waktu respons, jadwal, hasil) dengan konsekuensi keterlambatan, harga dan cara pembayaran (termin, retensi bila perlu, kewajiban faktur pajak), K3 dan tanggung jawab atas kerusakan/kecelakaan di lokasi, asuransi vendor, kerahasiaan dan larangan pengalihan tanpa izin, jangka waktu dan evaluasi kinerja berkala sebagai dasar perpanjangan, pengakhiran (termasuk pemutusan karena kinerja buruk), dan penyelesaian sengketa bertingkat. Sertakan pengingat: finalisasi kontrak sebaiknya direviu bagian legal atau konsultan hukum.",
    interviewTopics: [
      "jenis jasa vendor (kebersihan, keamanan, AC, lift, lanskap)",
      "lingkup & standar hasil yang diharapkan",
      "harga, termin pembayaran & masa kontrak",
      "SLA & sanksi keterlambatan yang diinginkan",
      "persyaratan legalitas & asuransi vendor",
    ],
    structure: [
      "Identitas Para Pihak & Legalitas Vendor",
      "Lingkup Pekerjaan & Spesifikasi Mutu",
      "SLA, Jadwal & Konsekuensi Keterlambatan",
      "Harga, Pembayaran & Perpajakan",
      "K3, Tanggung Jawab & Asuransi",
      "Kerahasiaan & Larangan Pengalihan",
      "Jangka Waktu, Evaluasi Kinerja & Pengakhiran",
      "Penyelesaian Sengketa & Ketentuan Penutup",
    ],
    tools: [
      {
        slug: "vc-lingkup",
        role: "VC-LINGKUP",
        name: "VC-LINGKUP — Perancang Lingkup & SLA",
        mission:
          "Susun lingkup dan SLA: rincian pekerjaan dengan spesifikasi dan standar mutu terukur, SLA respons dan jadwal dengan konsekuensi jelas, harga dan termin pembayaran, dan checklist legalitas vendor; standar yang belum disepakati ditandai [ASUMSI].",
      },
      {
        slug: "vc-klausul",
        role: "VC-KLAUSUL",
        name: "VC-KLAUSUL — Penyusun Klausul Perlindungan",
        mission:
          "Susun klausul kunci: K3 dan tanggung jawab kerusakan/kecelakaan, asuransi vendor, kerahasiaan, larangan pengalihan tanpa izin, evaluasi kinerja berkala sebagai dasar perpanjangan, pengakhiran karena kinerja buruk, dan penyelesaian sengketa bertingkat.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi — syarat, harga, dan SLA terdefinisi benar tanpa klausul saling bertentangan",
      "Kelengkapan — semua risiko kerja vendor di properti tercakup dengan mitigasi kontraktual",
      "Standar Profesional — kontrak layak dipakai sebagai template baku manajemen vendor",
      "Kacamata Praktisi Ahli — kedalaman praktisi pengadaan jasa properti senior, bukan surat perintah kerja sederhana",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 11 (mortgage-loan-officer, property) ──────────────────────────────
  {
    kind: "openclaw",
    slug: "formulir-pengajuan-kpr-claw",
    name: "Pengajuan KPR Claw — Spesialis Formulir Pengajuan Kredit Properti",
    tagline: "Wawancara → Rancang Formulir → Alur & Kelengkapan → Dokumen → Evaluasi Rubrik",
    avatar: "🗂️",
    category: "property",
    docLabel: "Formulir Pengajuan Kredit Properti (Loan Application)",
    mission:
      "Membantu pengguna menyusun Formulir Pengajuan Kredit Properti yang merampingkan proses aplikasi KPR bagi calon debitur — ramah pengguna, efisien, dan mengumpulkan semua informasi yang dibutuhkan untuk persetujuan kredit. Terapkan praktik terbaik: struktur formulir logis (data diri dan pasangan, pekerjaan dan penghasilan tetap/tidak tetap, kewajiban berjalan untuk perhitungan DBR/DSR, data properti yang dibeli dan pengembang, uang muka sesuai ketentuan LTV Bank Indonesia), daftar dokumen pendukung per profil pemohon (karyawan: slip gaji dan rekening koran; wiraswasta: laporan keuangan dan rekening usaha; profesional: izin praktik), persetujuan pengecekan SLIK OJK dan pemrosesan data pribadi selaras UU PDP, penjelasan tahapan proses dengan estimasi waktu (verifikasi → appraisal → analisis → SP3K → akad), bahasa sederhana tanpa jargon perbankan, validasi kelengkapan sebelum submit untuk mengurangi bolak-balik, dan checklist internal untuk petugas agar berkas langsung siap dianalisis.",
    interviewTopics: [
      "jenis kredit yang dilayani (KPR baru, take over, refinancing, multiguna)",
      "segmen pemohon (karyawan, wiraswasta, profesional)",
      "informasi & dokumen yang diwajibkan analisis kredit",
      "alur proses & sistem pengajuan (online/cabang)",
      "kendala kelengkapan berkas yang sering terjadi",
    ],
    structure: [
      "Petunjuk Pengisian untuk Pemohon",
      "Data Pemohon & Pasangan",
      "Pekerjaan & Penghasilan",
      "Kewajiban Berjalan & Data Keuangan",
      "Data Properti & Rencana Pembiayaan",
      "Dokumen Pendukung per Profil Pemohon",
      "Persetujuan SLIK & Pemrosesan Data",
      "Tahapan Proses & Checklist Internal Petugas",
    ],
    tools: [
      {
        slug: "ln-form",
        role: "LN-FORM",
        name: "LN-FORM — Perancang Formulir Aplikasi",
        mission:
          "Susun formulir: bagian-bagian lengkap dengan bahasa sederhana, dokumen pendukung per profil pemohon, persetujuan SLIK dan data pribadi, dan validasi kelengkapan; kebijakan kredit bank yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "ln-alur",
        role: "LN-ALUR",
        name: "LN-ALUR — Perancang Alur & Kelengkapan",
        mission:
          "Susun alur proses: tahapan dari pengajuan sampai akad dengan estimasi waktu per tahap, checklist internal kelengkapan berkas untuk petugas, titik komunikasi status ke pemohon, dan penanganan berkas tidak lengkap tanpa bolak-balik berlebihan.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Informasi — semua data yang dibutuhkan analisis kredit terkumpul benar dan terstruktur",
      "Ramah Pengguna — formulir mudah diisi pemohon awam tanpa kebingungan istilah perbankan",
      "Proses Lebih Cepat — validasi kelengkapan dan checklist internal memangkas waktu proses",
      "Kacamata Praktisi Ahli — kedalaman petugas kredit senior, bukan formulir data diri biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "laporan-keuangan-debitur-claw",
    name: "Keuangan Debitur Claw — Spesialis Laporan Keuangan Calon Debitur",
    tagline: "Wawancara → Susun Posisi Keuangan → Analisis Kemampuan → Dokumen → Evaluasi Rubrik",
    avatar: "💼",
    category: "property",
    docLabel: "Laporan Keuangan Calon Debitur (Borrower's Financial Statement)",
    mission:
      "Membantu pengguna menyusun Laporan Keuangan Calon Debitur yang memberi gambaran menyeluruh kondisi finansial pemohon — akurat, terperinci, dan terorganisir — untuk dipakai analis dan pemroses kredit menilai kelayakan dan menentukan kemampuan mengangsur. Terapkan praktik terbaik: neraca pribadi (aset likuid, properti, kendaraan, investasi vs seluruh kewajiban berjalan), arus kas bulanan (penghasilan tetap dan tidak tetap terdokumentasi, pengeluaran rutin), perhitungan rasio kunci (DBR/DSR terhadap batas kebijakan bank, kecukupan uang muka dan biaya akad), verifikasi silang antar dokumen (slip gaji vs mutasi rekening vs SPT), riwayat kredit dari SLIK OJK dengan penjelasan atas catatan negatif, sumber uang muka yang jelas (bukan pinjaman baru), stress test kemampuan bayar saat bunga floating naik, dan penyajian jujur — data yang tidak konsisten ditandai, bukan dipoles.",
    interviewTopics: [
      "profil pemohon & jenis penghasilannya",
      "aset & kewajiban yang dimiliki",
      "dokumen keuangan yang tersedia (slip gaji, rekening, SPT)",
      "kredit yang diajukan (plafon, tenor, angsuran perkiraan)",
      "riwayat kredit & catatan SLIK yang diketahui",
    ],
    structure: [
      "Ringkasan Posisi Keuangan & Rasio Kunci",
      "Data Pemohon & Sumber Penghasilan",
      "Neraca Pribadi (Aset vs Kewajiban)",
      "Arus Kas Bulanan Terdokumentasi",
      "Perhitungan DBR/DSR & Kecukupan Uang Muka",
      "Verifikasi Silang Dokumen & Catatan SLIK",
      "Stress Test Kemampuan Bayar",
      "Catatan, Asumsi & Lampiran Dokumen",
    ],
    tools: [
      {
        slug: "bd-posisi",
        role: "BD-POSISI",
        name: "BD-POSISI — Penyusun Neraca & Arus Kas",
        mission:
          "Susun posisi keuangan: neraca pribadi lengkap, arus kas bulanan dari dokumen (slip gaji, mutasi rekening, SPT), verifikasi silang antar dokumen dengan ketidaksesuaian ditandai; penghasilan yang belum terdokumentasi ditandai [ASUMSI].",
      },
      {
        slug: "bd-rasio",
        role: "BD-RASIO",
        name: "BD-RASIO — Analis Rasio & Kemampuan Bayar",
        mission:
          "Susun analisis kemampuan: DBR/DSR terhadap batas kebijakan, kecukupan uang muka dan biaya akad dengan sumber dana jelas, dampak catatan SLIK, dan stress test angsuran saat bunga floating naik dengan kesimpulan kelayakan.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Keuangan — angka bersumber dari dokumen dan terverifikasi silang, bukan pengakuan lisan",
      "Representasi Menyeluruh — seluruh aset, kewajiban, dan arus kas tergambar utuh",
      "Patuh Ketentuan — rasio dan uang muka diuji terhadap ketentuan LTV BI dan kebijakan bank",
      "Kacamata Praktisi Ahli — kedalaman analis kredit senior, bukan rekap slip gaji semata",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "verifikasi-kerja-claw",
    name: "Verifikasi Kerja Claw — Spesialis Dokumen Verifikasi Pekerjaan & Penghasilan",
    tagline: "Wawancara → Verifikasi Data → Draf Dokumen → Evaluasi Rubrik",
    avatar: "🪪",
    category: "property",
    docLabel: "Dokumen Verifikasi Pekerjaan & Penghasilan (Employment Verification Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Verifikasi Pekerjaan & Penghasilan yang akurat, terkini, dan patuh ketentuan — memberi informasi lengkap riwayat kerja dan penghasilan individu — untuk dipakai bank, pemberi sewa, dan pihak lain menilai stabilitas finansial dan kemampuan bayar. Terapkan praktik terbaik: identitas terverifikasi (sesuai KTP), detail kepegawaian (jabatan, status karyawan tetap/kontrak, masa kerja, tanggal mulai), rincian penghasilan (gaji pokok, tunjangan tetap, rata-rata lembur/bonus dengan periode acuan), konfirmasi resmi dari HRD/pejabat berwenang dengan kop surat dan kontak yang dapat dihubungi ulang, konsistensi dengan dokumen pendukung (slip gaji, mutasi payroll, BPJS Ketenagakerjaan), persetujuan karyawan atas pembagian datanya selaras UU PDP, masa berlaku dokumen, format untuk karyawan vs wiraswasta (surat keterangan usaha, laporan omzet), dan tanda tangan basah/e-sign yang sah.",
    interviewTopics: [
      "tujuan verifikasi (pengajuan kredit, sewa, lainnya)",
      "status pekerjaan subjek (tetap, kontrak, wiraswasta)",
      "rincian penghasilan yang perlu dikonfirmasi",
      "dokumen pendukung yang tersedia",
      "pihak yang menerbitkan & yang menerima dokumen",
    ],
    structure: [
      "Identitas Penerbit & Subjek Verifikasi",
      "Detail Kepegawaian & Masa Kerja",
      "Rincian Penghasilan & Periode Acuan",
      "Konsistensi dengan Dokumen Pendukung",
      "Pernyataan Konfirmasi & Kontak Verifikasi Ulang",
      "Persetujuan Pembagian Data (UU PDP)",
      "Masa Berlaku & Keterbatasan Dokumen",
      "Tanda Tangan, Kop & Kelengkapan Formal",
    ],
    tools: [
      {
        slug: "ve-data",
        role: "VE-DATA",
        name: "VE-DATA — Verifikator Data Kerja & Penghasilan",
        mission:
          "Susun data terverifikasi: detail kepegawaian dan penghasilan dengan periode acuan, pemeriksaan konsistensi terhadap slip gaji/mutasi/BPJS, dan daftar ketidaksesuaian; data yang belum dikonfirmasi HRD ditandai [ASUMSI].",
      },
      {
        slug: "ve-draf",
        role: "VE-DRAF",
        name: "VE-DRAF — Penyusun Draf Dokumen",
        mission:
          "Susun draf dokumen: format resmi dengan kop dan kontak verifikasi ulang, pernyataan konfirmasi yang tegas, persetujuan pembagian data, masa berlaku, dan varian format untuk karyawan vs wiraswasta.",
      },
    ],
    evaluatorCriteria: [
      "Teliti Detail — identitas, jabatan, dan angka penghasilan tepat tanpa ambiguitas",
      "Kelengkapan — semua informasi yang dibutuhkan penilai kredit/sewa tersedia",
      "Patuh Regulasi — persetujuan data pribadi dan keabsahan formal dokumen terjaga",
      "Kacamata Praktisi Ahli — kedalaman verifikator kredit senior, bukan surat keterangan kerja generik",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "estimasi-kredit-claw",
    name: "Estimasi Kredit Claw — Spesialis Dokumen Estimasi Kredit Properti",
    tagline: "Wawancara → Rincian Biaya & Angsuran → Simulasi → Dokumen → Evaluasi Rubrik",
    avatar: "🧮",
    category: "property",
    docLabel: "Dokumen Estimasi Kredit (Loan Estimate Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Estimasi Kredit yang memberi informasi akurat dan menyeluruh tentang syarat kredit dan perkiraan biaya kepada calon debitur — jelas, ringkas, dan patuh ketentuan transparansi produk keuangan (POJK perlindungan konsumen). Terapkan praktik terbaik: ringkasan syarat kredit (plafon, tenor, jenis bunga fixed berapa tahun lalu floating, suku bunga acuan), rincian angsuran per skema dengan simulasi setelah masa fixed berakhir, seluruh biaya di muka (provisi, administrasi, appraisal KJPP, asuransi jiwa dan kebakaran, notaris/PPAT untuk akad dan APHT, BPHTB dan e-materai), total biaya yang harus disiapkan selain uang muka, ilustrasi total pembayaran selama tenor, hal yang bisa berubah vs terkunci beserta kondisinya, biaya pelunasan dipercepat dan penalti, perbandingan ringkas antar skema bila ada pilihan, dan bahasa sederhana dengan tabel yang mudah dibaca calon debitur awam.",
    interviewTopics: [
      "kredit yang diestimasi (plafon, tenor, properti)",
      "skema bunga yang ditawarkan (fixed/floating, promo)",
      "komponen biaya di muka yang berlaku di bank",
      "profil debitur untuk premi asuransi",
      "pilihan skema yang perlu dibandingkan",
    ],
    structure: [
      "Ringkasan Syarat Kredit",
      "Rincian Angsuran & Simulasi Setelah Masa Fixed",
      "Biaya di Muka (Provisi, Appraisal, Asuransi, Notaris)",
      "Pajak & Bea (BPHTB, e-Materai)",
      "Total Dana yang Harus Disiapkan",
      "Ilustrasi Total Pembayaran Selama Tenor",
      "Ketentuan Berubah vs Terkunci & Pelunasan Dipercepat",
      "Perbandingan Skema & Catatan untuk Debitur",
    ],
    tools: [
      {
        slug: "et-biaya",
        role: "ET-BIAYA",
        name: "ET-BIAYA — Perinci Biaya & Angsuran",
        mission:
          "Susun rincian: angsuran per skema dengan simulasi pasca-fixed, seluruh biaya di muka per pos (provisi, appraisal, asuransi, notaris/APHT, BPHTB, e-materai), dan total dana disiapkan; tarif yang belum dikonfirmasi bank ditandai [ASUMSI].",
      },
      {
        slug: "et-simulasi",
        role: "ET-SIMULASI",
        name: "ET-SIMULASI — Penyusun Simulasi & Perbandingan",
        mission:
          "Susun simulasi: ilustrasi total pembayaran selama tenor per skema, sensitivitas angsuran terhadap kenaikan bunga floating, biaya pelunasan dipercepat, perbandingan antar skema dalam tabel sederhana, dan catatan hal yang bisa berubah.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan — calon debitur awam memahami angsuran dan biaya dalam sekali baca",
      "Kelengkapan — tidak ada biaya tersembunyi; semua pos sampai e-materai tercantum",
      "Patuh Ketentuan — transparansi produk sesuai ketentuan perlindungan konsumen OJK",
      "Kacamata Praktisi Ahli — kedalaman petugas kredit senior, bukan brosur simulasi angsuran",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-pengakuan-utang-claw",
    name: "Pengakuan Utang Claw — Spesialis Surat Pengakuan Utang Kredit Properti",
    tagline: "Wawancara → Syarat Pokok → Klausul → Dokumen → Evaluasi Rubrik",
    avatar: "📜",
    category: "property",
    docLabel: "Surat Pengakuan Utang (Mortgage Note)",
    mission:
      "Membantu pengguna menyusun Surat Pengakuan Utang untuk kredit properti yang komprehensif dan akurat — menjamin transparansi dan kepatuhan hukum sekaligus menyederhanakan syarat kredit agar dipahami debitur. Terapkan praktik terbaik dokumen utang Indonesia: identitas para pihak dan dasar perjanjian kredit, pokok utang dengan angka dan terbilang, bunga (jenis, besaran, dasar perubahan floating), jadwal dan cara pembayaran angsuran, jaminan properti yang diikat Hak Tanggungan (APHT oleh PPAT — atau SKMHT sementara), urutan penggunaan pembayaran (biaya → bunga → pokok), kondisi cidera janji dan akibatnya secara bertahap, denda keterlambatan yang wajar, pelunasan dipercepat dan ketentuan biayanya, keabsahan formal (e-materai, tanda tangan, saksi; kekuatan lebih kuat bila dibuat notariil/grosse akta), dan bagian ringkasan berbahasa sederhana agar debitur paham kewajibannya. Sertakan pengingat: pengikatan jaminan dan finalisasi akta wajib melalui notaris/PPAT.",
    interviewTopics: [
      "para pihak & dasar perjanjian kreditnya",
      "pokok utang, bunga & tenor",
      "jaminan properti & rencana pengikatannya",
      "ketentuan denda, cidera janji & pelunasan dipercepat",
      "bentuk dokumen (bawah tangan vs notariil)",
    ],
    structure: [
      "Identitas Para Pihak & Dasar Perjanjian",
      "Pokok Utang & Pengakuan Berutang",
      "Bunga & Dasar Perubahannya",
      "Jadwal & Cara Pembayaran",
      "Jaminan & Pengikatan Hak Tanggungan",
      "Cidera Janji, Denda & Urutan Pembayaran",
      "Pelunasan Dipercepat & Ketentuan Biaya",
      "Ringkasan untuk Debitur & Keabsahan Formal",
    ],
    tools: [
      {
        slug: "nt-pokok",
        role: "NT-POKOK",
        name: "NT-POKOK — Penyusun Syarat Pokok",
        mission:
          "Susun syarat pokok: pokok utang (angka dan terbilang), bunga dengan dasar perubahan, jadwal pembayaran, dan jaminan dengan rencana pengikatan Hak Tanggungan; ketentuan yang belum disepakati para pihak ditandai [ASUMSI].",
      },
      {
        slug: "nt-klausul",
        role: "NT-KLAUSUL",
        name: "NT-KLAUSUL — Penyusun Klausul & Ringkasan Debitur",
        mission:
          "Susun klausul lengkap: cidera janji bertahap, denda wajar, urutan penggunaan pembayaran, pelunasan dipercepat, keabsahan formal (e-materai, saksi, opsi notariil), dan ringkasan berbahasa sederhana agar debitur memahami kewajibannya.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua unsur pengakuan utang dan jaminan tercakup tanpa celah",
      "Kejelasan — ringkasan debitur membuat kewajiban dipahami tanpa penerjemah hukum",
      "Patuh Hukum — selaras KUHPerdata, UU Hak Tanggungan, dan praktik perbankan",
      "Kacamata Praktisi Ahli — kedalaman praktisi kredit senior, bukan template surat utang umum",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "rincian-biaya-akad-claw",
    name: "Rincian Biaya Akad Claw — Spesialis Rincian Penyelesaian Transaksi Properti",
    tagline: "Wawancara → Rekap Dana Masuk-Keluar → Alokasi Para Pihak → Dokumen → Evaluasi Rubrik",
    avatar: "🧾",
    category: "property",
    docLabel: "Rincian Penyelesaian Transaksi (Settlement Statement / HUD-1)",
    mission:
      "Membantu pengguna menyusun Rincian Penyelesaian Transaksi properti yang mencerminkan detail keuangan transaksi secara akurat — semua informasi dan perhitungan yang dibutuhkan proses akad — untuk dipakai agen properti, bank, serta pembeli dan penjual. Terapkan praktik terbaik (adaptasi HUD-1 ke praktik akad Indonesia): rekap dana sisi pembeli (harga jual, uang muka yang sudah dibayar, plafon kredit cair, biaya KPR: provisi-administrasi-asuransi, biaya notaris/PPAT: AJB-APHT-balik nama, BPHTB, e-materai) vs sisi penjual (harga jual dikurangi PPh final penjualan, pelunasan sisa KPR berjalan/roya, komisi agen, tunggakan PBB/IPL yang diprorata), prorata biaya berjalan pada tanggal akad, rekonsiliasi total dana masuk vs keluar yang harus seimbang, jumlah bersih diterima penjual dan total disiapkan pembeli, alur pencairan (dana bank ke penjual setelah AJB dan pengikatan), dan checklist dokumen yang diserahkan saat akad. Sertakan pengingat: angka final dikonfirmasi dengan notaris/PPAT dan bank sebelum akad.",
    interviewTopics: [
      "transaksi yang diselesaikan (harga, properti, para pihak)",
      "skema pembayaran (KPR/tunai, uang muka yang sudah dibayar)",
      "biaya-biaya yang sudah diketahui dari bank & notaris",
      "kewajiban berjalan (sisa KPR penjual, PBB, IPL)",
      "tanggal akad & alur pencairan yang direncanakan",
    ],
    structure: [
      "Ringkasan Transaksi & Para Pihak",
      "Rekap Dana Sisi Pembeli",
      "Rekap Dana Sisi Penjual",
      "Pajak & Bea (BPHTB, PPh Final, e-Materai)",
      "Prorata Biaya Berjalan (PBB, IPL)",
      "Rekonsiliasi Dana Masuk vs Keluar",
      "Alur Pencairan & Jadwal Akad",
      "Checklist Dokumen Akad & Catatan",
    ],
    tools: [
      {
        slug: "hu-rekap",
        role: "HU-REKAP",
        name: "HU-REKAP — Penyusun Rekap Dua Sisi",
        mission:
          "Susun rekap dana: sisi pembeli (harga, DP, kredit cair, biaya KPR, notaris, BPHTB) dan sisi penjual (harga, PPh final, pelunasan-roya, komisi, prorata PBB/IPL) lengkap per pos; tarif yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "hu-rekon",
        role: "HU-REKON",
        name: "HU-REKON — Rekonsiliator & Alur Pencairan",
        mission:
          "Susun rekonsiliasi: total dana masuk vs keluar harus seimbang, jumlah bersih penjual dan total disiapkan pembeli, alur pencairan bertahap (AJB → pengikatan → pencairan), dan checklist dokumen yang diserahkan saat akad.",
      },
    ],
    evaluatorCriteria: [
      "Patuh Ketentuan — pajak, bea, dan alur pencairan sesuai praktik akad dan regulasi berlaku",
      "Teliti Detail — setiap pos dua sisi terekonsiliasi tanpa selisih tak terjelaskan",
      "Jernih & Menyeluruh — pembeli dan penjual paham persis dana mereka ke mana",
      "Kacamata Praktisi Ahli — kedalaman petugas akad senior, bukan catatan kasir transaksi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "checklist-analisis-kredit-claw",
    name: "Analisis Kredit Claw — Spesialis Checklist Analisis Kredit Properti",
    tagline: "Wawancara → Susun Checklist → Alur Keputusan → Dokumen → Evaluasi Rubrik",
    avatar: "🔬",
    category: "property",
    docLabel: "Checklist Analisis Kredit (Loan Underwriting Checklist)",
    mission:
      "Membantu pengguna menyusun Checklist Analisis Kredit yang memastikan pemrosesan kredit efisien dan akurat — merampingkan proses analisis dan meminimalkan risiko kesalahan atau kelalaian — untuk dipakai analis dan pemroses menilai aplikasi dan mengambil keputusan. Terapkan praktik terbaik prinsip 5C: checklist kelengkapan berkas per profil pemohon, verifikasi identitas dan keaslian dokumen, Character (SLIK OJK, riwayat pembayaran, penjelasan catatan negatif), Capacity (perhitungan penghasilan yang diakui, DBR/DSR terhadap batas kebijakan, stress test bunga), Capital (uang muka dan sumber dananya), Collateral (hasil appraisal KJPP vs harga transaksi, LTV terhadap ketentuan BI, legalitas agunan: sertifikat-IMB/PBG-cek bersih), Condition (stabilitas industri tempat kerja/usaha), red flag yang wajib eskalasi (dokumen tidak konsisten, sumber DP tidak jelas), jalur keputusan (setuju/setuju bersyarat/tolak) dengan kewenangan per plafon, dan jejak dokumentasi tiap butir agar keputusan dapat diaudit.",
    interviewTopics: [
      "produk kredit & segmen pemohon yang dianalisis",
      "kebijakan kredit internal (batas DBR, LTV, plafon kewenangan)",
      "proses analisis yang berjalan & titik kesalahan yang sering terjadi",
      "sistem & sumber data verifikasi (SLIK, appraisal)",
      "alur persetujuan & eskalasi keputusan",
    ],
    structure: [
      "Petunjuk Penggunaan & Prinsip 5C",
      "Checklist Kelengkapan & Keaslian Berkas",
      "Character: SLIK & Riwayat Pembayaran",
      "Capacity: Penghasilan Diakui, DBR/DSR & Stress Test",
      "Capital: Uang Muka & Sumber Dana",
      "Collateral: Appraisal, LTV & Legalitas Agunan",
      "Condition & Red Flag Wajib Eskalasi",
      "Jalur Keputusan, Kewenangan & Jejak Audit",
    ],
    tools: [
      {
        slug: "uw-checklist",
        role: "UW-CHECKLIST",
        name: "UW-CHECKLIST — Penyusun Checklist 5C",
        mission:
          "Susun checklist analisis: butir spesifik dan terverifikasi per aspek 5C, kelengkapan dan keaslian berkas per profil pemohon, dan red flag wajib eskalasi; batas kebijakan internal yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "uw-keputusan",
        role: "UW-KEPUTUSAN",
        name: "UW-KEPUTUSAN — Perancang Alur Keputusan",
        mission:
          "Susun alur keputusan: jalur setuju/setuju bersyarat/tolak dengan kriteria jelas, kewenangan per plafon, format catatan analisis yang dapat diaudit, dan SLA per tahap agar proses efisien tanpa mengorbankan kehati-hatian.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — seluruh aspek 5C dan legalitas agunan tercakup tanpa celah analisis",
      "Kejelasan — setiap butir spesifik dan bisa dieksekusi analis tanpa tafsir ganda",
      "Patuh Regulasi — selaras ketentuan LTV BI, SLIK OJK, dan prinsip kehati-hatian",
      "Kacamata Praktisi Ahli — kedalaman analis kredit senior, bukan daftar syarat dokumen biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-persetujuan-kredit-claw",
    name: "Persetujuan Kredit Claw — Spesialis Surat Persetujuan Kredit (SP3K)",
    tagline: "Wawancara → Syarat Persetujuan → Draf Surat → Evaluasi Rubrik",
    avatar: "🎉",
    category: "property",
    docLabel: "Surat Persetujuan Kredit (Loan Approval Letter / SP3K)",
    mission:
      "Membantu pengguna menyusun Surat Persetujuan Kredit (SP3K — Surat Penegasan Persetujuan Penyediaan Kredit) yang memberi kepastian dan konfirmasi persetujuan kepada debitur — akurat, komprehensif, dan profesional — untuk dipakai debitur melanjutkan proses dan menunjukkan bukti persetujuan kepada penjual atau pengembang. Terapkan praktik terbaik: identitas debitur dan objek yang dibiayai, syarat kredit disetujui (plafon, tenor, skema bunga, angsuran perkiraan), syarat yang harus dipenuhi sebelum akad (kelengkapan dokumen, pelunasan kewajiban tertentu, asuransi), biaya-biaya yang wajib disiapkan dengan rinciannya, masa berlaku SP3K dan konsekuensi kedaluwarsa, kondisi yang dapat membatalkan persetujuan (perubahan kondisi keuangan, hasil pemeriksaan akhir), jadwal indikatif menuju akad, bahasa profesional yang jelas bagi debitur maupun pihak ketiga, dan disclaimer bahwa persetujuan bersyarat bukan pencairan. Sertakan pengingat: format resmi mengikuti template dan kebijakan bank penerbit.",
    interviewTopics: [
      "debitur & kredit yang disetujui (plafon, tenor, bunga)",
      "properti/objek yang dibiayai",
      "syarat sebelum akad yang harus dipenuhi",
      "biaya yang wajib disiapkan debitur",
      "masa berlaku & jadwal menuju akad",
    ],
    structure: [
      "Kop, Nomor Surat & Identitas Debitur",
      "Pernyataan Persetujuan & Objek Pembiayaan",
      "Syarat Kredit Disetujui (Plafon, Tenor, Bunga, Angsuran)",
      "Syarat yang Harus Dipenuhi Sebelum Akad",
      "Rincian Biaya yang Wajib Disiapkan",
      "Masa Berlaku & Kondisi Pembatalan",
      "Jadwal Indikatif Menuju Akad",
      "Penutup, Kontak & Tanda Tangan Pejabat",
    ],
    tools: [
      {
        slug: "sp-syarat",
        role: "SP-SYARAT",
        name: "SP-SYARAT — Penyusun Syarat Persetujuan",
        mission:
          "Susun substansi persetujuan: syarat kredit disetujui lengkap, syarat sebelum akad yang terukur, rincian biaya wajib disiapkan, masa berlaku dan kondisi pembatalan; kebijakan bank yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "sp-draf",
        role: "SP-DRAF",
        name: "SP-DRAF — Penyusun Draf Surat",
        mission:
          "Susun draf surat: format resmi profesional dengan nomor surat dan kop, bahasa jelas untuk debitur dan pihak ketiga (penjual/pengembang), disclaimer persetujuan bersyarat bukan pencairan, jadwal indikatif, dan blok tanda tangan pejabat berwenang.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Jernih — syarat kredit dan kewajiban debitur terbaca tegas tanpa ambigu",
      "Patuh Ketentuan — substansi selaras praktik SP3K dan ketentuan perlindungan konsumen",
      "Penyajian Profesional — layak diserahkan ke penjual/pengembang sebagai bukti persetujuan",
      "Kacamata Praktisi Ahli — kedalaman pejabat kredit senior, bukan surat pemberitahuan biasa",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perjanjian-layanan-kredit-claw",
    name: "Layanan Kredit Claw — Spesialis Perjanjian Layanan Administrasi Kredit",
    tagline: "Wawancara → Lingkup Layanan → Klausul → Dokumen → Evaluasi Rubrik",
    avatar: "🏛️",
    category: "property",
    docLabel: "Perjanjian Layanan Administrasi Kredit (Mortgage Servicing Agreement)",
    mission:
      "Membantu pengguna menyusun Perjanjian Layanan Administrasi Kredit yang memastikan operasi pengelolaan kredit efisien dan patuh — menguraikan tanggung jawab dan kewajiban para pihak serta syarat dan ketentuan layanan kredit berjalan. Terapkan praktik terbaik: lingkup layanan administrasi (penagihan dan pencatatan angsuran, pengelolaan rekening escrow untuk PBB dan premi asuransi bila ada, penerusan pembayaran, laporan berkala ke debitur dan kreditur), standar layanan terukur (SLA respons keluhan, tenggat penerusan dana), penanganan keterlambatan dan tunggakan (pengingat bertahap, restrukturisasi sesuai ketentuan OJK, eskalasi), biaya layanan dan siapa menanggung, kewajiban penyampaian informasi perubahan bunga/angsuran ke debitur, perlindungan data debitur selaras UU PDP, pengalihan hak tagih atau layanan (cessie) dengan kewajiban pemberitahuan, pembukuan terpisah dana debitur, audit dan akses pemeriksaan, jangka waktu, pengakhiran dengan serah terima portofolio tertib, dan penyelesaian sengketa. Sertakan pengingat: finalisasi perjanjian direviu bagian legal atau konsultan hukum.",
    interviewTopics: [
      "para pihak & portofolio kredit yang dilayani",
      "lingkup layanan (penagihan, escrow, pelaporan)",
      "standar layanan & SLA yang diharapkan",
      "penanganan tunggakan & restrukturisasi",
      "biaya layanan, jangka waktu & pengakhiran",
    ],
    structure: [
      "Identitas Para Pihak & Portofolio Layanan",
      "Lingkup Layanan Administrasi Kredit",
      "Standar Layanan & SLA Terukur",
      "Penanganan Keterlambatan & Restrukturisasi",
      "Biaya Layanan & Pembukuan Dana Terpisah",
      "Perlindungan Data & Kewajiban Informasi",
      "Pengalihan, Audit, Jangka Waktu & Pengakhiran",
      "Penyelesaian Sengketa & Ketentuan Penutup",
    ],
    tools: [
      {
        slug: "sv-lingkup",
        role: "SV-LINGKUP",
        name: "SV-LINGKUP — Perancang Lingkup & SLA",
        mission:
          "Susun lingkup layanan: rincian fungsi administrasi (penagihan, escrow, penerusan dana, pelaporan) dengan SLA terukur, biaya layanan dan penanggungnya, dan alur penanganan tunggakan bertahap; ketentuan yang belum disepakati ditandai [ASUMSI].",
      },
      {
        slug: "sv-klausul",
        role: "SV-KLAUSUL",
        name: "SV-KLAUSUL — Penyusun Klausul Perlindungan",
        mission:
          "Susun klausul kunci: pembukuan terpisah dana debitur, perlindungan data selaras UU PDP, kewajiban informasi perubahan bunga/angsuran, pengalihan hak dengan pemberitahuan, audit, pengakhiran dengan serah terima portofolio tertib, dan sengketa bertingkat.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan — tanggung jawab tiap pihak dan alur dana terdefinisi tanpa wilayah abu-abu",
      "Kelengkapan — seluruh siklus layanan dari penagihan sampai pengakhiran tercakup",
      "Patuh Ketentuan — selaras ketentuan OJK, UU PDP, dan praktik pengelolaan kredit",
      "Kacamata Praktisi Ahli — kedalaman praktisi operasi kredit senior, bukan perjanjian jasa umum",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },

  // ── Batch 12 (mortgage-broker, property) ────────────────────────────────────
  {
    kind: "openclaw",
    slug: "formulir-kredit-multibank-claw",
    name: "Kredit Multibank Claw — Spesialis Formulir Aplikasi Kredit Multi-Bank",
    tagline: "Wawancara → Formulir Tunggal → Pemetaan Bank → Dokumen → Evaluasi Rubrik",
    avatar: "🗃️",
    category: "property",
    docLabel: "Formulir Aplikasi Kredit Multi-Bank (Loan Application Form)",
    mission:
      "Membantu pengguna (broker/perantara kredit) menyusun Formulir Aplikasi Kredit yang merampingkan proses pengajuan bagi klien — ramah pengguna, komprehensif, dan efisien — sehingga satu kali pengisian bisa dipakai mengajukan ke beberapa bank sekaligus. Terapkan praktik terbaik broker: struktur data superset yang memenuhi kebutuhan semua bank rekanan (data diri, pekerjaan-penghasilan, kewajiban untuk DBR, properti, uang muka), pemetaan field ke persyaratan spesifik tiap bank agar tidak ada pengisian ulang, daftar dokumen gabungan dengan penanda bank mana yang mewajibkan apa, kuasa dan persetujuan klien untuk broker mengajukan ke banyak bank serta pengecekan SLIK, persetujuan pemrosesan data pribadi selaras UU PDP, penjelasan alur broker (analisis profil → rekomendasi bank → pengajuan paralel → pendampingan sampai akad), pengungkapan komisi broker yang transparan, dan checklist kesiapan berkas sebelum diteruskan ke bank agar tingkat persetujuan tinggi.",
    interviewTopics: [
      "profil klien yang dilayani (karyawan, wiraswasta, profesional)",
      "bank rekanan & perbedaan persyaratannya",
      "dokumen yang diminta masing-masing bank",
      "alur kerja broker dari intake sampai akad",
      "cara pengungkapan komisi & kuasa klien",
    ],
    structure: [
      "Petunjuk Pengisian untuk Klien",
      "Data Diri, Pekerjaan & Penghasilan",
      "Kewajiban Berjalan & Data Properti",
      "Daftar Dokumen Gabungan per Bank",
      "Kuasa Klien & Persetujuan SLIK/Data Pribadi",
      "Pengungkapan Peran & Komisi Broker",
      "Alur Proses Multi-Bank & Estimasi Waktu",
      "Checklist Kesiapan Berkas Internal Broker",
    ],
    tools: [
      {
        slug: "fb-form",
        role: "FB-FORM",
        name: "FB-FORM — Perancang Formulir Superset",
        mission:
          "Susun formulir: field superset yang memenuhi semua bank rekanan, pemetaan field ke persyaratan tiap bank, daftar dokumen gabungan dengan penanda, dan bahasa sederhana; persyaratan bank yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "fb-alur",
        role: "FB-ALUR",
        name: "FB-ALUR — Perancang Alur & Kepatuhan Broker",
        mission:
          "Susun alur broker: kuasa dan persetujuan klien (multi-bank, SLIK, data pribadi), pengungkapan komisi transparan, tahapan pengajuan paralel dengan estimasi waktu, dan checklist kesiapan berkas agar tingkat persetujuan tinggi.",
      },
    ],
    evaluatorCriteria: [
      "Ramah Pengguna — klien cukup mengisi satu kali untuk semua bank tanpa kebingungan",
      "Kelengkapan — data dan dokumen memenuhi persyaratan seluruh bank rekanan",
      "Efisiensi — pemetaan per bank dan checklist memangkas bolak-balik berkas",
      "Kacamata Praktisi Ahli — kedalaman broker kredit senior, bukan salinan formulir satu bank",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "estimasi-penawaran-kredit-claw",
    name: "Penawaran Kredit Claw — Spesialis Estimasi Penawaran Kredit untuk Klien",
    tagline: "Wawancara → Rincian Penawaran → Penyajian Klien → Dokumen → Evaluasi Rubrik",
    avatar: "📄",
    category: "property",
    docLabel: "Estimasi Penawaran Kredit (Loan Estimate)",
    mission:
      "Membantu pengguna (broker) menyusun Estimasi Penawaran Kredit yang akurat dan komprehensif bagi calon debitur — jelas, ringkas, dan mudah dipahami — untuk dipakai klien membandingkan penawaran kredit dan mengambil keputusan yang tepat. Terapkan praktik terbaik: penyajian per penawaran bank (plafon, tenor, bunga fixed-floating dengan periodenya, angsuran per fase), seluruh biaya di muka per bank (provisi, administrasi, appraisal, asuransi, notaris) dalam format seragam agar apple-to-apple, total dana disiapkan dan total pembayaran selama tenor per penawaran, asumsi yang dipakai dan tanggal berlaku penawaran (bunga promo bisa berubah), catatan syarat khusus per bank (payroll pindah, produk bundling), penjelasan istilah dalam bahasa awam, transparansi posisi broker (komisi dari bank, tidak menambah biaya klien bila demikian), dan rekomendasi awal berbasis profil klien tanpa menyembunyikan kelemahan tiap penawaran.",
    interviewTopics: [
      "profil klien & kredit yang dibutuhkan",
      "penawaran bank yang sudah masuk (bunga, biaya, syarat)",
      "tanggal berlaku & syarat khusus tiap penawaran",
      "prioritas klien (angsuran ringan, total murah, fleksibilitas)",
      "posisi komisi broker per bank",
    ],
    structure: [
      "Ringkasan Penawaran & Rekomendasi Awal",
      "Profil Kebutuhan Klien",
      "Rincian per Penawaran (Bunga, Angsuran per Fase)",
      "Biaya di Muka per Bank (Format Seragam)",
      "Total Dana Disiapkan & Total Pembayaran per Tenor",
      "Syarat Khusus & Tanggal Berlaku per Bank",
      "Penjelasan Istilah untuk Klien Awam",
      "Transparansi Broker & Langkah Berikutnya",
    ],
    tools: [
      {
        slug: "ep-rincian",
        role: "EP-RINCIAN",
        name: "EP-RINCIAN — Perinci Penawaran per Bank",
        mission:
          "Susun rincian: setiap penawaran bank dalam format seragam (bunga per fase, angsuran, seluruh biaya di muka, total pembayaran), syarat khusus dan tanggal berlaku; komponen yang belum dikonfirmasi bank ditandai [ASUMSI].",
      },
      {
        slug: "ep-sajikan",
        role: "EP-SAJIKAN",
        name: "EP-SAJIKAN — Penyaji untuk Klien Awam",
        mission:
          "Susun penyajian: penjelasan istilah sederhana, kelebihan-kelemahan tiap penawaran jujur, rekomendasi awal berbasis prioritas klien, transparansi posisi komisi broker, dan langkah berikutnya menuju pengajuan.",
      },
    ],
    evaluatorCriteria: [
      "Jelas & Ringkas — klien awam paham penawaran dalam sekali baca tanpa jargon",
      "Patuh Ketentuan — transparansi biaya dan posisi broker sesuai perlindungan konsumen",
      "Akurat & Andal — angka per bank benar, seragam, dan dapat diperbandingkan langsung",
      "Kacamata Praktisi Ahli — kedalaman broker senior yang berpihak ke klien, bukan brosur bank",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-pra-persetujuan-kpr-claw",
    name: "Pra-Persetujuan Claw — Spesialis Surat Pra-Persetujuan KPR",
    tagline: "Wawancara → Verifikasi Kapasitas → Draf Surat → Evaluasi Rubrik",
    avatar: "🏅",
    category: "property",
    docLabel: "Surat Pra-Persetujuan KPR (Mortgage Pre-Approval Letter)",
    mission:
      "Membantu pengguna menyusun Surat Pra-Persetujuan KPR yang mencerminkan secara akurat plafon dan syarat kredit yang telah diverifikasi awal — untuk dipakai agen properti, penjual, dan calon pembeli sebagai bukti keseriusan dan kapasitas finansial dalam negosiasi. Terapkan praktik terbaik: dasar pra-persetujuan yang jelas (penghasilan terverifikasi dokumen, SLIK dicek, perhitungan DBR terhadap batas kebijakan), plafon maksimal dan kisaran harga properti yang terjangkau, syarat kredit indikatif (skema bunga, tenor, angsuran perkiraan), pembedaan tegas pra-persetujuan vs persetujuan final (masih tergantung appraisal properti dan pemeriksaan akhir), masa berlaku surat, kondisi yang membatalkan (perubahan penghasilan, kredit baru), format profesional yang meyakinkan penjual tanpa membuka data sensitif klien (tidak mencantumkan gaji), dan kontak verifikasi bagi pihak yang ingin mengonfirmasi keaslian.",
    interviewTopics: [
      "klien & verifikasi yang sudah dilakukan (dokumen, SLIK)",
      "plafon & syarat indikatif hasil analisis awal",
      "properti yang diincar atau kisaran harga",
      "masa berlaku & kondisi pembatalan",
      "pihak yang akan menerima surat (agen, penjual, pengembang)",
    ],
    structure: [
      "Kop, Nomor & Identitas Penerbit",
      "Pernyataan Pra-Persetujuan & Nama Klien",
      "Plafon Maksimal & Kisaran Harga Terjangkau",
      "Syarat Kredit Indikatif",
      "Dasar Verifikasi (Tanpa Data Sensitif)",
      "Pembedaan Pra-Persetujuan vs Persetujuan Final",
      "Masa Berlaku & Kondisi Pembatalan",
      "Kontak Verifikasi & Tanda Tangan",
    ],
    tools: [
      {
        slug: "pv-kapasitas",
        role: "PV-KAPASITAS",
        name: "PV-KAPASITAS — Verifikator Kapasitas",
        mission:
          "Susun dasar pra-persetujuan: ringkasan verifikasi (penghasilan terdokumentasi, SLIK, DBR), plafon maksimal dengan perhitungan, kisaran harga properti terjangkau termasuk uang muka dan biaya; verifikasi yang belum tuntas ditandai [ASUMSI].",
      },
      {
        slug: "pv-surat",
        role: "PV-SURAT",
        name: "PV-SURAT — Penyusun Draf Surat",
        mission:
          "Susun draf surat: format profesional meyakinkan penjual tanpa membuka data sensitif klien, pembedaan tegas dari persetujuan final, masa berlaku dan kondisi pembatalan, dan kontak verifikasi keaslian.",
      },
    ],
    evaluatorCriteria: [
      "Jelas & Ringkas — penjual/agen langsung paham kapasitas klien dan batas surat ini",
      "Profesional & Teliti — format dan angka rapi tanpa membocorkan data sensitif",
      "Patuh Standar — pembedaan pra-persetujuan vs final dan dasar verifikasi jujur",
      "Kacamata Praktisi Ahli — kedalaman broker senior yang memperkuat negosiasi, bukan surat pernyataan kosong",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perbandingan-kredit-claw",
    name: "Perbandingan Kredit Claw — Spesialis Lembar Perbandingan Kredit",
    tagline: "Wawancara → Matriks Perbandingan → Analisis per Profil → Dokumen → Evaluasi Rubrik",
    avatar: "⚗️",
    category: "property",
    docLabel: "Lembar Perbandingan Kredit (Loan Comparison Worksheet)",
    mission:
      "Membantu pengguna menyusun Lembar Perbandingan Kredit yang komprehensif atas beberapa opsi kredit untuk klien — informasi rinci suku bunga, tenor, biaya, dan angsuran bulanan — agar klien mengambil keputusan berdasar data. Terapkan praktik terbaik: matriks perbandingan seragam antar bank (bunga fixed dan periodenya, bunga floating acuan setelahnya, angsuran per fase, provisi-administrasi-asuransi-appraisal-notaris, penalti pelunasan dipercepat, syarat khusus), total biaya di muka dan total pembayaran selama tenor sebagai baris pembanding utama, biaya efektif tahunan agar bunga promo rendah tak menipu, simulasi sensitivitas saat floating naik, skor kecocokan per profil klien (prioritas angsuran ringan vs total termurah vs fleksibel dilunasi cepat), penjelasan baris demi baris dalam bahasa awam, dan rekomendasi bersyarat yang jujur terhadap kelemahan tiap opsi.",
    interviewTopics: [
      "opsi kredit yang dibandingkan (bank, bunga, biaya)",
      "profil & prioritas klien",
      "rencana klien (tinggal lama, jual cepat, lunasi dipercepat)",
      "syarat khusus tiap opsi (payroll, bundling)",
      "data biaya yang sudah pasti vs perkiraan",
    ],
    structure: [
      "Ringkasan & Rekomendasi per Prioritas Klien",
      "Matriks Perbandingan Bunga & Angsuran per Fase",
      "Matriks Biaya di Muka per Opsi",
      "Total Pembayaran Selama Tenor & Biaya Efektif",
      "Penalti & Fleksibilitas Pelunasan Dipercepat",
      "Simulasi Sensitivitas Bunga Floating",
      "Skor Kecocokan per Profil Klien",
      "Penjelasan Istilah & Catatan Kejujuran per Opsi",
    ],
    tools: [
      {
        slug: "lc-matriks",
        role: "LC-MATRIKS",
        name: "LC-MATRIKS — Penyusun Matriks Perbandingan",
        mission:
          "Susun matriks: semua opsi dalam kolom seragam (bunga per fase, angsuran, biaya per pos, penalti, syarat khusus), total pembayaran dan biaya efektif tahunan; angka perkiraan yang belum dikonfirmasi bank ditandai [ASUMSI].",
      },
      {
        slug: "lc-profil",
        role: "LC-PROFIL",
        name: "LC-PROFIL — Analis Kecocokan Profil",
        mission:
          "Susun analisis kecocokan: simulasi sensitivitas floating, skor per prioritas klien (angsuran ringan/total termurah/fleksibilitas), kelemahan jujur tiap opsi, dan rekomendasi bersyarat sesuai rencana klien.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Informasi — angka tiap opsi benar dan biaya efektif dihitung konsisten",
      "Penyajian Jernih — matriks terbaca sekilas dan istilah dijelaskan untuk klien awam",
      "Perbandingan Menyeluruh — dari bunga sampai penalti pelunasan tak ada yang tersembunyi",
      "Kacamata Praktisi Ahli — kedalaman broker senior yang membedah promo, bukan tabel bunga brosur",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "verifikasi-penghasilan-claw",
    name: "Verifikasi Penghasilan Claw — Spesialis Dokumen Verifikasi Penghasilan",
    tagline: "Wawancara → Telaah Dokumen → Rekonsiliasi → Dokumen → Evaluasi Rubrik",
    avatar: "🔎",
    category: "property",
    docLabel: "Dokumen Verifikasi Penghasilan (Income Verification Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Verifikasi Penghasilan yang akurat tentang penghasilan dan pekerjaan calon debitur — andal, komprehensif, dan memenuhi ketentuan hukum — untuk dipakai bank, analis kredit, dan lembaga keuangan menilai kelayakan. Terapkan praktik terbaik broker (menyiapkan berkas agar lolos analisis bank): rekonsiliasi tiga sumber (slip gaji vs mutasi rekening vs SPT/bukti potong) dengan penjelasan setiap selisih, perlakuan komponen penghasilan (gaji pokok dan tunjangan tetap dihitung penuh; lembur, bonus, komisi dirata-rata dengan periode acuan yang bank akui), penghasilan wiraswasta (omzet vs laba bersih dari laporan keuangan dan mutasi rekening usaha, normalisasi pos pribadi), penghasilan pasangan bila joint income, penghasilan tambahan yang dapat diakui (sewa dengan kontrak), konfirmasi pemberi kerja yang dapat dihubungi ulang, persetujuan subjek atas pembagian data selaras UU PDP, dan ringkasan penghasilan yang diakui versi konservatif agar tidak ditolak analis bank.",
    interviewTopics: [
      "profil subjek (karyawan, wiraswasta, joint income)",
      "dokumen penghasilan yang tersedia",
      "komponen penghasilan (tetap, variabel, tambahan)",
      "bank tujuan & kebijakan pengakuan penghasilannya",
      "selisih antar dokumen yang sudah diketahui",
    ],
    structure: [
      "Ringkasan Penghasilan yang Diakui",
      "Identitas Subjek & Persetujuan Data",
      "Rekonsiliasi Slip Gaji vs Rekening vs SPT",
      "Perlakuan Komponen Tetap vs Variabel",
      "Penghasilan Usaha / Pasangan / Tambahan",
      "Konfirmasi Pemberi Kerja & Kontak Verifikasi",
      "Penjelasan Selisih & Catatan Konservatif",
      "Lampiran Dokumen & Masa Berlaku",
    ],
    tools: [
      {
        slug: "iv-rekon",
        role: "IV-REKON",
        name: "IV-REKON — Rekonsiliator Dokumen Penghasilan",
        mission:
          "Susun rekonsiliasi: perbandingan slip gaji, mutasi rekening, dan SPT dengan setiap selisih dijelaskan, normalisasi penghasilan usaha, dan komponen variabel dirata-rata sesuai periode acuan; angka yang belum terdokumentasi ditandai [ASUMSI].",
      },
      {
        slug: "iv-akui",
        role: "IV-AKUI",
        name: "IV-AKUI — Analis Penghasilan Diakui",
        mission:
          "Susun ringkasan penghasilan diakui: perlakuan per komponen sesuai kebijakan bank tujuan, versi konservatif yang aman untuk analisis, penghasilan pasangan/tambahan yang layak diikutkan, dan kontak konfirmasi pemberi kerja.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi Informasi — angka penghasilan bersumber dokumen dan terekonsiliasi tanpa selisih gelap",
      "Dokumentasi Menyeluruh — semua komponen dan sumber penghasilan terdokumentasi rapi",
      "Patuh Ketentuan — persetujuan data dan cara pengakuan sesuai kebijakan bank dan UU PDP",
      "Kacamata Praktisi Ahli — kedalaman penyiap berkas senior yang lolos analis bank, bukan rekap gaji",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "korespondensi-bank-claw",
    name: "Korespondensi Bank Claw — Spesialis Surat-Menyurat ke Bank",
    tagline: "Wawancara → Konteks Kasus → Draf Surat → Evaluasi Rubrik",
    avatar: "📬",
    category: "property",
    docLabel: "Korespondensi ke Bank (Lender Correspondence)",
    mission:
      "Membantu pengguna (broker) menyusun korespondensi ke bank yang efektif atas nama klien — informasi akurat dan rinci tentang aplikasi kredit dan kondisi keuangan klien — untuk memperlancar proses persetujuan. Terapkan praktik terbaik: jenis surat sesuai kebutuhan (pengantar aplikasi dengan ringkasan kekuatan profil klien, jawaban atas permintaan dokumen/klarifikasi analis, penjelasan kondisi khusus seperti catatan SLIK lama yang sudah lunas atau penghasilan variabel, permohonan pengecualian kebijakan dengan justifikasi dan mitigasi, negosiasi bunga/biaya dengan pembanding penawaran bank lain, eskalasi keterlambatan proses yang sopan), struktur surat bank yang baku (referensi nomor aplikasi, pokok masalah, data pendukung, permintaan tindakan spesifik dengan tenggat), nada profesional yang menjaga relasi jangka panjang broker-bank, lampiran tertata dengan daftar, dan jejak korespondensi untuk tindak lanjut.",
    interviewTopics: [
      "tujuan surat (pengantar, klarifikasi, pengecualian, negosiasi, eskalasi)",
      "kasus klien & status aplikasinya",
      "informasi/dokumen yang diminta bank atau yang mau disampaikan",
      "relasi dengan bank & pejabat yang dituju",
      "hasil yang diharapkan & tenggatnya",
    ],
    structure: [
      "Referensi Aplikasi & Pihak Dituju",
      "Ringkasan Pokok Masalah",
      "Konteks Kasus & Kekuatan Profil Klien",
      "Data & Dokumen Pendukung",
      "Penjelasan Kondisi Khusus (bila ada)",
      "Permintaan Tindakan Spesifik & Tenggat",
      "Penutup Profesional & Kontak",
      "Daftar Lampiran & Jejak Korespondensi",
    ],
    tools: [
      {
        slug: "kb-konteks",
        role: "KB-KONTEKS",
        name: "KB-KONTEKS — Penyusun Konteks & Justifikasi",
        mission:
          "Susun substansi: ringkasan kasus dan kekuatan profil klien, penjelasan kondisi khusus dengan data pendukung, justifikasi permohonan (pengecualian/negosiasi) dengan mitigasi; klaim yang belum didukung dokumen ditandai [ASUMSI].",
      },
      {
        slug: "kb-draf",
        role: "KB-DRAF",
        name: "KB-DRAF — Penyusun Draf Surat Bank",
        mission:
          "Susun draf surat: struktur baku perbankan (referensi, pokok, pendukung, permintaan tindakan dengan tenggat), nada profesional yang menjaga relasi, daftar lampiran tertata, dan catatan tindak lanjut.",
      },
    ],
    evaluatorCriteria: [
      "Teliti Detail — referensi, angka, dan lampiran tepat sehingga analis tak perlu bertanya ulang",
      "Jelas & Ringkas — pokok masalah dan permintaan tindakan terbaca dalam paragraf pertama",
      "Paham Proses Kredit — isi surat menunjukkan pemahaman alur dan bahasa analis bank",
      "Kacamata Praktisi Ahli — kedalaman broker senior yang dipercaya bank, bukan surat keluhan umum",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "korespondensi-debitur-claw",
    name: "Korespondensi Debitur Claw — Spesialis Komunikasi ke Klien Kredit",
    tagline: "Wawancara → Pesan & Status → Draf Komunikasi → Evaluasi Rubrik",
    avatar: "💬",
    category: "property",
    docLabel: "Korespondensi ke Debitur (Borrower Correspondence)",
    mission:
      "Membantu pengguna menyusun korespondensi ke klien/calon debitur yang efektif — menjelaskan status aplikasi, kebutuhan dokumen, dan langkah berikutnya dengan bahasa yang menenangkan dan mudah dipahami — agar klien tetap percaya dan proses berjalan lancar. Terapkan praktik terbaik: jenis komunikasi sesuai momen (selamat datang dengan penjelasan alur dan estimasi waktu, permintaan dokumen dengan daftar jelas dan contoh, update status berkala walau belum ada kabar dari bank, penjelasan kendala tanpa menyalahkan pihak lain, penyampaian kabar baik dengan langkah lanjut, penyampaian penolakan dengan empati dan rencana alternatif), bahasa awam tanpa jargon perbankan dengan istilah penting dijelaskan, format ringkas yang nyaman dibaca di WhatsApp/email, ekspektasi realistis tentang waktu dan kemungkinan, satu pesan satu tujuan dengan ajakan tindakan jelas, dan nada hangat profesional yang menjaga kepercayaan jangka panjang.",
    interviewTopics: [
      "momen komunikasi (welcome, minta dokumen, update, kendala, hasil)",
      "status aplikasi klien & konteksnya",
      "profil klien & tingkat pemahaman finansialnya",
      "kanal komunikasi (WhatsApp, email, surat resmi)",
      "tindakan yang diharapkan dari klien",
    ],
    structure: [
      "Pembuka Hangat & Konteks Pesan",
      "Status Terkini dalam Bahasa Awam",
      "Penjelasan Detail (Dokumen/Kendala/Hasil)",
      "Ekspektasi Realistis & Estimasi Waktu",
      "Tindakan yang Diminta dari Klien",
      "Langkah Broker Selanjutnya",
      "Penutup & Kanal Bertanya",
      "Varian Format (WhatsApp vs Email/Surat)",
    ],
    tools: [
      {
        slug: "kd-pesan",
        role: "KD-PESAN",
        name: "KD-PESAN — Perumus Substansi Pesan",
        mission:
          "Susun substansi: status dan penjelasan dalam bahasa awam, daftar dokumen/tindakan yang diminta dengan contoh, ekspektasi waktu realistis, dan rencana alternatif bila ada kendala; informasi dari bank yang belum pasti ditandai [ASUMSI].",
      },
      {
        slug: "kd-draf",
        role: "KD-DRAF",
        name: "KD-DRAF — Penyusun Draf Multi-Kanal",
        mission:
          "Susun draf komunikasi: versi WhatsApp ringkas dan versi email/surat lengkap, nada hangat profesional dengan empati sesuai momen (termasuk kabar buruk), satu ajakan tindakan jelas, dan penutup yang membuka ruang bertanya.",
      },
    ],
    evaluatorCriteria: [
      "Mudah Dipahami — klien awam langsung tahu status dan apa yang harus dilakukan",
      "Empati & Profesional — nada sesuai momen, termasuk menyampaikan kabar sulit",
      "Tindakan Jelas — setiap pesan punya satu ajakan tindakan dengan tenggat wajar",
      "Kacamata Praktisi Ahli — kedalaman broker senior yang menjaga kepercayaan, bukan notifikasi otomatis",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "surat-penolakan-kredit-claw",
    name: "Penolakan Kredit Claw — Spesialis Surat Penolakan Kredit",
    tagline: "Wawancara → Alasan & Alternatif → Draf Surat → Evaluasi Rubrik",
    avatar: "📪",
    category: "property",
    docLabel: "Surat Penolakan Kredit (Loan Denial Letter)",
    mission:
      "Membantu pengguna menyusun Surat Penolakan Kredit yang menyampaikan keputusan dengan jelas, patuh ketentuan, dan tetap menjaga hubungan baik — untuk dipakai menyampaikan hasil kepada pemohon yang tidak disetujui. Terapkan praktik terbaik: penyampaian keputusan di awal tanpa berbelit, alasan penolakan yang jujur namun dibahasakan dengan hormat (kapasitas angsuran belum mencukupi, catatan SLIK, agunan tidak memenuhi, dokumen tidak lengkap) sesuai kewajiban transparansi perlindungan konsumen OJK, hal spesifik yang dapat diperbaiki pemohon (melunasi kewajiban tertentu, memperbaiki catatan kredit, menambah uang muka, menunggu masa kerja cukup), alternatif yang realistis (plafon lebih kecil, tenor berbeda, bank lain dengan kebijakan berbeda, mengajukan bersama pasangan), kapan dapat mengajukan kembali, pengembalian dokumen milik pemohon, empati tanpa memberi harapan palsu, dan pintu konsultasi lanjutan agar relasi tetap terjaga.",
    interviewTopics: [
      "pemohon & aplikasi yang ditolak",
      "alasan penolakan yang sebenarnya",
      "hal yang bisa diperbaiki pemohon",
      "alternatif yang masih terbuka",
      "kebijakan penyampaian & pengembalian dokumen",
    ],
    structure: [
      "Pembuka & Apresiasi atas Pengajuan",
      "Keputusan & Referensi Aplikasi",
      "Alasan Penolakan yang Jujur & Hormat",
      "Hal yang Dapat Diperbaiki Pemohon",
      "Alternatif Realistis yang Terbuka",
      "Kapan Dapat Mengajukan Kembali",
      "Pengembalian Dokumen & Data Pemohon",
      "Penutup Empatik & Pintu Konsultasi",
    ],
    tools: [
      {
        slug: "dl-alasan",
        role: "DL-ALASAN",
        name: "DL-ALASAN — Perumus Alasan & Perbaikan",
        mission:
          "Susun substansi: alasan penolakan jujur dengan bahasa hormat sesuai transparansi OJK, daftar spesifik yang dapat diperbaiki pemohon dengan estimasi waktu, dan alternatif realistis; kebijakan bank yang tidak boleh dibuka ditandai [ASUMSI].",
      },
      {
        slug: "dl-draf",
        role: "DL-DRAF",
        name: "DL-DRAF — Penyusun Draf Surat",
        mission:
          "Susun draf surat: keputusan disampaikan di awal, nada empatik tanpa harapan palsu, struktur dari apresiasi sampai pintu konsultasi lanjutan, dan ketentuan pengembalian dokumen serta perlindungan data pemohon.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Jernih — keputusan dan alasannya dipahami pemohon tanpa tafsir ganda",
      "Patuh Ketentuan — transparansi alasan dan perlindungan data sesuai ketentuan OJK/UU PDP",
      "Menjaga Hubungan — empati dan alternatif membuat pemohon tetap jadi calon klien masa depan",
      "Kacamata Praktisi Ahli — kedalaman praktisi kredit senior, bukan surat penolakan template dingin",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "aplikasi-refinancing-claw",
    name: "Refinancing Claw — Spesialis Aplikasi Refinancing KPR",
    tagline: "Wawancara → Analisis Untung-Rugi → Berkas Aplikasi → Dokumen → Evaluasi Rubrik",
    avatar: "🔄",
    category: "property",
    docLabel: "Aplikasi Refinancing KPR (Mortgage Refinance Application)",
    mission:
      "Membantu pengguna menyusun Aplikasi Refinancing KPR (take over / pembiayaan ulang) yang lengkap dan meyakinkan — untuk dipakai klien memindahkan kredit berjalan ke bank dengan syarat lebih baik atau mencairkan tambahan dana dari ekuitas properti. Terapkan praktik terbaik: analisis untung-rugi refinancing (selisih bunga baru vs berjalan, penalti pelunasan dipercepat di bank lama, biaya baru: provisi-appraisal-notaris-APHT ulang, titik impas dalam bulan), data kredit berjalan (sisa pokok, sisa tenor, riwayat pembayaran lancar sebagai kekuatan), nilai properti terkini untuk LTV refinancing, tujuan yang jelas (turunkan angsuran, persingkat tenor, top-up dana dengan peruntukan), kelengkapan berkas take over (surat keterangan sisa pinjaman dari bank lama, salinan perjanjian kredit, bukti angsuran), alur roya-pengikatan ulang antar bank yang aman, perbandingan penawaran beberapa bank tujuan, dan rekomendasi jujur bila refinancing tidak menguntungkan.",
    interviewTopics: [
      "kredit berjalan (bank, sisa pokok, bunga, sisa tenor)",
      "tujuan refinancing (turunkan angsuran, top-up, persingkat)",
      "riwayat pembayaran & kondisi keuangan terkini",
      "nilai properti sekarang & legalitasnya",
      "penawaran bank tujuan yang tersedia",
    ],
    structure: [
      "Ringkasan Tujuan & Rekomendasi",
      "Data Kredit Berjalan & Riwayat Pembayaran",
      "Analisis Untung-Rugi & Titik Impas",
      "Nilai Properti Terkini & LTV Refinancing",
      "Skema Baru yang Diajukan (Angsuran/Tenor/Top-Up)",
      "Kelengkapan Berkas Take Over",
      "Alur Roya & Pengikatan Ulang Antar Bank",
      "Perbandingan Bank Tujuan & Catatan",
    ],
    tools: [
      {
        slug: "rf-untung",
        role: "RF-UNTUNG",
        name: "RF-UNTUNG — Analis Untung-Rugi Refinancing",
        mission:
          "Susun analisis: selisih total biaya lama vs baru (bunga, penalti, biaya baru), titik impas dalam bulan, dampak per tujuan (angsuran/tenor/top-up), dan rekomendasi jujur termasuk bila tidak menguntungkan; angka bank yang belum pasti ditandai [ASUMSI].",
      },
      {
        slug: "rf-berkas",
        role: "RF-BERKAS",
        name: "RF-BERKAS — Penyusun Berkas & Alur Take Over",
        mission:
          "Susun berkas aplikasi: kelengkapan dokumen take over dari bank lama, narasi kekuatan profil (riwayat lancar), skema baru yang diajukan, dan alur aman roya-pengikatan ulang antar bank dengan urutan langkah dan pihak yang terlibat.",
      },
    ],
    evaluatorCriteria: [
      "Akurasi — perhitungan untung-rugi dan titik impas benar dengan semua biaya tercakup",
      "Kelengkapan — berkas take over dan data kredit berjalan siap dianalisis bank tujuan",
      "Rekomendasi Jujur — klien tahu persis kapan refinancing menguntungkan dan kapan tidak",
      "Kacamata Praktisi Ahli — kedalaman broker refinancing senior, bukan formulir pindah bank",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perjanjian-kunci-bunga-claw",
    name: "Kunci Bunga Claw — Spesialis Perjanjian Penguncian Suku Bunga",
    tagline: "Wawancara → Ketentuan Kunci → Klausul → Dokumen → Evaluasi Rubrik",
    avatar: "🔒",
    category: "property",
    docLabel: "Perjanjian Penguncian Suku Bunga (Rate Lock Agreement)",
    mission:
      "Membantu pengguna menyusun Perjanjian Penguncian Suku Bunga yang aman dan mengikat bagi debitur maupun bank — menjamin debitur mendapat bunga tetap yang disepakati selama periode tertentu, terlindung dari fluktuasi. Terapkan praktik terbaik: identifikasi para pihak dan aplikasi kredit yang diacu, bunga yang dikunci dengan skema jelas (fixed berapa persen berapa tahun, acuan floating setelahnya), periode penguncian dengan tanggal mulai-berakhir yang tegas, kondisi agar kunci berlaku (akad terjadi sebelum tenggat, dokumen lengkap, tidak ada perubahan material profil risiko), konsekuensi bila akad lewat tenggat (bunga mengambang kembali, opsi perpanjangan kunci dan biayanya bila ada), kondisi yang membatalkan kunci (data tidak benar, gagal appraisal), biaya penguncian bila ada dan perlakuannya bila batal, transparansi sesuai perlindungan konsumen OJK, dan ringkasan berbahasa awam agar debitur paham persis apa yang dijamin dan apa yang tidak. Sertakan pengingat: format final mengikuti template dan persetujuan bank penerbit.",
    interviewTopics: [
      "aplikasi kredit yang diacu & para pihak",
      "bunga & skema yang dikunci",
      "periode kunci & tenggat akad",
      "biaya penguncian & opsi perpanjangan",
      "kondisi pembatalan yang disepakati",
    ],
    structure: [
      "Para Pihak & Referensi Aplikasi Kredit",
      "Bunga yang Dikunci & Skema Setelahnya",
      "Periode Penguncian & Tenggat Akad",
      "Kondisi Berlakunya Penguncian",
      "Konsekuensi Lewat Tenggat & Opsi Perpanjangan",
      "Kondisi Pembatalan & Perlakuan Biaya",
      "Ringkasan Berbahasa Awam untuk Debitur",
      "Keabsahan, Tanda Tangan & Ketentuan Penutup",
    ],
    tools: [
      {
        slug: "rl-ketentuan",
        role: "RL-KETENTUAN",
        name: "RL-KETENTUAN — Perumus Ketentuan Kunci",
        mission:
          "Susun ketentuan: bunga dan skema yang dikunci, periode dengan tanggal tegas, kondisi berlaku, konsekuensi lewat tenggat, dan opsi perpanjangan dengan biayanya; kebijakan bank yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "rl-klausul",
        role: "RL-KLAUSUL",
        name: "RL-KLAUSUL — Penyusun Klausul & Ringkasan Awam",
        mission:
          "Susun klausul lengkap: pembatalan dan perlakuan biaya, perlindungan dua arah (debitur dan bank), keabsahan formal, dan ringkasan berbahasa awam tentang apa yang dijamin dan tidak dijamin perjanjian ini.",
      },
    ],
    evaluatorCriteria: [
      "Kejelasan — bunga, periode, dan tenggat terbaca tegas tanpa ruang tafsir",
      "Patuh Hukum — klausul selaras KUHPerdata dan ketentuan perlindungan konsumen OJK",
      "Akurasi Informasi — skema bunga dan konsekuensi tiap skenario dihitung dan ditulis benar",
      "Kacamata Praktisi Ahli — kedalaman praktisi kredit senior, bukan janji bunga di brosur",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "komitmen-jaminan-titel-claw",
    name: "Jaminan Titel Claw — Spesialis Laporan Pemeriksaan & Jaminan Titel Properti",
    tagline: "Wawancara → Telusur Legalitas → Syarat & Pengecualian → Dokumen → Evaluasi Rubrik",
    avatar: "🛡️",
    category: "property",
    docLabel: "Laporan Pemeriksaan Titel Properti (Title Insurance Commitment)",
    mission:
      "Membantu pengguna menyusun Laporan Pemeriksaan Titel Properti yang akurat dan komprehensif tentang status hukum kepemilikan — bebas cacat administrasi — untuk dipakai profesional properti, pembeli, dan bank sebelum transaksi atau pengikatan agunan. Terapkan praktik terbaik (adaptasi title commitment ke praktik Indonesia): identifikasi sertifikat (jenis hak SHM/HGB/HP, nomor, luas, pemegang hak terdaftar), pengecekan sertifikat ke BPN (cek bersih: kesesuaian data fisik-yuridis, tidak sedang diblokir/sita), penelusuran riwayat peralihan hak sampai pemegang sekarang (AJB berantai, waris, hibah), beban di atas hak (Hak Tanggungan terdaftar, sewa terdaftar, catatan sita jaminan), kesesuaian dengan tata ruang (peruntukan RDTR) dan PBB terbayar, syarat yang harus dipenuhi sebelum transaksi aman (roya HT lama, persetujuan pasangan/ahli waris, pelunasan PBB), pengecualian yang tetap menjadi risiko (sengketa tidak terdaftar, batas fisik vs peta), dan ringkasan layak-tidaknya transaksi dilanjutkan. Sertakan pengingat: pengecekan resmi hanya sah melalui notaris/PPAT ke BPN.",
    interviewTopics: [
      "properti & sertifikat yang diperiksa",
      "tujuan pemeriksaan (jual-beli, agunan, investasi)",
      "riwayat peralihan yang diketahui",
      "beban/catatan yang sudah diketahui (HT, sengketa)",
      "dokumen pendukung yang tersedia (PBB, IMB/PBG)",
    ],
    structure: [
      "Ringkasan Status Titel & Kesimpulan",
      "Identifikasi Sertifikat & Pemegang Hak",
      "Hasil Pengecekan ke BPN (Cek Bersih)",
      "Riwayat Peralihan Hak",
      "Beban & Catatan di Atas Hak",
      "Kesesuaian Tata Ruang & Kewajiban PBB",
      "Syarat Sebelum Transaksi & Pengecualian Risiko",
      "Rekomendasi, Asumsi & Lampiran",
    ],
    tools: [
      {
        slug: "ti-telusur",
        role: "TI-TELUSUR",
        name: "TI-TELUSUR — Penelusur Legalitas & Riwayat",
        mission:
          "Susun hasil telusur: identifikasi sertifikat dan pemegang hak, riwayat peralihan berantai, beban terdaftar (Hak Tanggungan, sewa, sita), dan kesesuaian tata ruang; hasil yang belum dicek resmi ke BPN ditandai [ASUMSI].",
      },
      {
        slug: "ti-syarat",
        role: "TI-SYARAT",
        name: "TI-SYARAT — Perumus Syarat & Pengecualian",
        mission:
          "Susun syarat transaksi aman: daftar yang wajib dipenuhi sebelum akad (roya, persetujuan pasangan/waris, pelunasan PBB), pengecualian risiko yang tetap ada, dan rekomendasi layak-tidaknya transaksi dilanjutkan dengan mitigasi.",
      },
    ],
    evaluatorCriteria: [
      "Teliti Detail — data sertifikat, riwayat, dan beban tercatat tepat tanpa celah",
      "Riset Menyeluruh — penelusuran sampai peralihan berantai dan beban tak terdaftar yang terindikasi",
      "Patuh Hukum — syarat dan prosedur sesuai UUPA, UU Hak Tanggungan, dan praktik BPN",
      "Kacamata Praktisi Ahli — kedalaman pemeriksa legalitas senior, bukan fotokopi sertifikat dicek sekilas",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "perjanjian-restrukturisasi-kredit-claw",
    name: "Restrukturisasi Claw — Spesialis Perjanjian Restrukturisasi Kredit",
    tagline: "Wawancara → Skema Baru → Klausul Adendum → Dokumen → Evaluasi Rubrik",
    avatar: "🩹",
    category: "property",
    docLabel: "Perjanjian Restrukturisasi Kredit (Loan Modification Agreement)",
    mission:
      "Membantu pengguna menyusun Perjanjian Restrukturisasi Kredit (adendum perubahan syarat) yang mencerminkan secara akurat perubahan yang disepakati atas syarat kredit awal — untuk dipakai debitur dan bank memformalkan perubahan. Terapkan praktik terbaik restrukturisasi sesuai ketentuan OJK: referensi perjanjian kredit awal yang diubah (nomor, tanggal, para pihak), latar belakang kesulitan debitur yang jujur, bentuk restrukturisasi yang dipilih (perpanjangan tenor, penurunan bunga, penundaan pokok/grace period, pengurangan tunggakan bunga, konversi tunggakan ke pokok) dengan perhitungan sebelum-sesudah yang transparan, jadwal angsuran baru lengkap, status jaminan tetap berlaku (Hak Tanggungan tidak perlu diikat ulang bila plafon tidak naik), ketentuan bila debitur kembali gagal bayar setelah restrukturisasi, biaya restrukturisasi bila ada, klausul lain perjanjian awal tetap berlaku sepanjang tidak diubah, dan ringkasan kewajiban baru berbahasa awam. Sertakan pengingat: finalisasi mengikuti format bank dan reviu bagian legal.",
    interviewTopics: [
      "perjanjian kredit awal & kondisi tunggakan",
      "penyebab kesulitan & kapasitas bayar sekarang",
      "bentuk restrukturisasi yang disepakati",
      "status jaminan & perubahan plafon (bila ada)",
      "ketentuan gagal bayar pasca-restrukturisasi",
    ],
    structure: [
      "Referensi Perjanjian Awal & Para Pihak",
      "Latar Belakang & Kondisi Kredit Saat Ini",
      "Bentuk Restrukturisasi yang Disepakati",
      "Perhitungan Sebelum vs Sesudah",
      "Jadwal Angsuran Baru",
      "Status Jaminan & Klausul yang Tetap Berlaku",
      "Ketentuan Gagal Bayar Pasca-Restrukturisasi",
      "Ringkasan Awam, Keabsahan & Tanda Tangan",
    ],
    tools: [
      {
        slug: "md-skema",
        role: "MD-SKEMA",
        name: "MD-SKEMA — Perumus Skema Restrukturisasi",
        mission:
          "Susun skema: bentuk restrukturisasi dengan perhitungan sebelum-sesudah transparan, jadwal angsuran baru lengkap, dan uji kemampuan bayar terhadap skema baru; kapasitas bayar yang belum diverifikasi ditandai [ASUMSI].",
      },
      {
        slug: "md-adendum",
        role: "MD-ADENDUM",
        name: "MD-ADENDUM — Penyusun Klausul Adendum",
        mission:
          "Susun adendum: referensi perjanjian awal, klausul perubahan yang presisi, status jaminan, ketentuan gagal bayar pasca-restrukturisasi, klausul lama yang tetap berlaku, dan ringkasan kewajiban baru berbahasa awam.",
      },
    ],
    evaluatorCriteria: [
      "Patuh Hukum — selaras ketentuan restrukturisasi OJK dan KUHPerdata tentang adendum",
      "Jelas & Terpahami — debitur paham persis kewajiban barunya dari ringkasan awam",
      "Akurasi Syarat Baru — perhitungan sebelum-sesudah dan jadwal baru benar tanpa ambigu",
      "Kacamata Praktisi Ahli — kedalaman praktisi restrukturisasi senior, bukan surat kesepakatan cicilan informal",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "pengungkapan-akhir-akad-claw",
    name: "Pengungkapan Akhir Claw — Spesialis Pengungkapan Akhir Sebelum Akad",
    tagline: "Wawancara → Angka Final vs Estimasi → Verifikasi → Dokumen → Evaluasi Rubrik",
    avatar: "🧿",
    category: "property",
    docLabel: "Pengungkapan Akhir Sebelum Akad (Closing Disclosure)",
    mission:
      "Membantu pengguna menyusun Pengungkapan Akhir Sebelum Akad yang memberi informasi final akurat kepada pembeli dan bank — seluruh detail finansial dan transaksional menjelang akad. Terapkan praktik terbaik (adaptasi closing disclosure ke praktik akad Indonesia): angka final semua komponen (plafon cair, bunga dan angsuran pasti, seluruh biaya: provisi-administrasi-asuransi-appraisal-notaris/PPAT-BPHTB-e-materai), perbandingan berdampingan estimasi awal vs angka final dengan penjelasan setiap perubahan, total dana yang wajib dibawa/ditransfer debitur saat akad dan rinciannya, jadwal angsuran pertama dan cara pembayaran, dokumen yang akan ditandatangani saat akad (perjanjian kredit, AJB, APHT, polis asuransi) dengan penjelasan singkat masing-masing, hak debitur membaca dokumen sebelum tanda tangan dan bertanya, kontak untuk klarifikasi sebelum hari akad, dan checklist persiapan akad agar tidak ada kejutan di meja notaris. Sertakan pengingat: angka final dikonfirmasi tertulis dari bank dan notaris/PPAT.",
    interviewTopics: [
      "kredit yang akan diakadkan (angka final dari bank)",
      "estimasi awal yang pernah diberikan ke debitur",
      "perubahan angka & penyebabnya",
      "jadwal akad & pihak yang hadir",
      "dokumen yang akan ditandatangani",
    ],
    structure: [
      "Ringkasan Angka Final & Tanggal Akad",
      "Syarat Kredit Final (Plafon, Bunga, Angsuran)",
      "Rincian Seluruh Biaya Final",
      "Perbandingan Estimasi Awal vs Final & Penjelasan",
      "Total Dana Dibawa Debitur & Cara Pembayaran",
      "Dokumen yang Ditandatangani & Penjelasannya",
      "Hak Debitur & Kontak Klarifikasi",
      "Checklist Persiapan Hari Akad",
    ],
    tools: [
      {
        slug: "cd-final",
        role: "CD-FINAL",
        name: "CD-FINAL — Penyusun Angka Final & Selisih",
        mission:
          "Susun angka final: semua komponen biaya dan syarat kredit pasti, perbandingan berdampingan dengan estimasi awal, penjelasan setiap selisih, dan total dana dibawa debitur; angka yang belum dikonfirmasi tertulis ditandai [ASUMSI].",
      },
      {
        slug: "cd-siap",
        role: "CD-SIAP",
        name: "CD-SIAP — Penyusun Kesiapan Akad",
        mission:
          "Susun kesiapan: daftar dokumen yang ditandatangani dengan penjelasan awam, hak debitur sebelum tanda tangan, checklist persiapan hari akad (dana, dokumen, pihak hadir), dan kontak klarifikasi sebelum hari-H.",
      },
    ],
    evaluatorCriteria: [
      "Patuh Ketentuan — pengungkapan final selaras transparansi perlindungan konsumen OJK",
      "Jernih & Transparan — setiap selisih dari estimasi awal dijelaskan tanpa ditutupi",
      "Teliti Detail — angka final konsisten antar bagian sampai rupiah terakhir",
      "Kacamata Praktisi Ahli — kedalaman pendamping akad senior, bukan rekap biaya sepihak bank",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "verifikasi-aset-claw",
    name: "Verifikasi Aset Claw — Spesialis Dokumen Verifikasi Aset",
    tagline: "Wawancara → Inventaris Aset → Verifikasi Sumber → Dokumen → Evaluasi Rubrik",
    avatar: "💎",
    category: "property",
    docLabel: "Dokumen Verifikasi Aset (Asset Verification Document)",
    mission:
      "Membantu pengguna menyusun Dokumen Verifikasi Aset yang akurat dan komprehensif tentang aset calon debitur — menjamin transparansi dan kredibilitas proses aplikasi — untuk dipakai bank dan analis menilai stabilitas finansial dan kecukupan dana. Terapkan praktik terbaik: inventaris aset per kategori (kas dan setara: tabungan-deposito dengan mutasi 3 bulan; investasi: reksa dana-saham-obligasi dengan laporan efek; properti: sertifikat dan estimasi nilai; kendaraan: BPKB; usaha: laporan keuangan), verifikasi kepemilikan dengan dokumen (nama sesuai, joint account dijelaskan), penilaian likuiditas per aset (mana yang bisa jadi uang muka, mana yang hanya memperkuat profil), penelusuran sumber dana besar yang baru masuk (seasoning dana — bank curiga dana pinjaman disamarkan sebagai tabungan), konsistensi aset dengan profil penghasilan (aset jauh melebihi penghasilan perlu penjelasan sah), persetujuan pembagian data selaras UU PDP, dan ringkasan aset likuid vs total dengan catatan konservatif yang kredibel di mata analis.",
    interviewTopics: [
      "kategori aset yang dimiliki subjek",
      "dokumen bukti kepemilikan yang tersedia",
      "dana yang akan dipakai uang muka & sumbernya",
      "dana besar yang baru masuk rekening (bila ada)",
      "bank tujuan & persyaratan verifikasinya",
    ],
    structure: [
      "Ringkasan Aset Likuid vs Total",
      "Identitas Subjek & Persetujuan Data",
      "Inventaris Kas & Setara Kas (Mutasi 3 Bulan)",
      "Investasi, Properti, Kendaraan & Usaha",
      "Verifikasi Kepemilikan & Kondisi Joint",
      "Penelusuran Sumber Dana & Seasoning",
      "Konsistensi Aset vs Profil Penghasilan",
      "Catatan Konservatif & Lampiran Bukti",
    ],
    tools: [
      {
        slug: "av-inventaris",
        role: "AV-INVENTARIS",
        name: "AV-INVENTARIS — Penyusun Inventaris Aset",
        mission:
          "Susun inventaris: aset per kategori dengan dokumen bukti dan nilai, verifikasi kepemilikan (nama, joint account), dan penilaian likuiditas per aset; nilai aset yang belum didukung dokumen ditandai [ASUMSI].",
      },
      {
        slug: "av-sumber",
        role: "AV-SUMBER",
        name: "AV-SUMBER — Penelusur Sumber Dana",
        mission:
          "Susun penelusuran: dana besar baru masuk dengan sumber sah terdokumentasi (jual aset, bonus, hibah keluarga dengan surat), konsistensi aset vs penghasilan, dan ringkasan konservatif yang kredibel untuk analis bank.",
      },
    ],
    evaluatorCriteria: [
      "Kelengkapan — semua kategori aset terinventaris dengan bukti kepemilikan",
      "Kejelasan — analis langsung melihat aset likuid yang siap dipakai dan yang tidak",
      "Teliti Detail — sumber dana besar tertelusur sehingga tidak memicu kecurigaan analis",
      "Kacamata Praktisi Ahli — kedalaman penyiap berkas senior, bukan daftar harta pengakuan lisan",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
  {
    kind: "openclaw",
    slug: "dokumen-asuransi-rumah-claw",
    name: "Asuransi Rumah Claw — Spesialis Dokumentasi Asuransi Kepemilikan Rumah",
    tagline: "Wawancara → Kebutuhan Proteksi → Dokumentasi Polis → Dokumen → Evaluasi Rubrik",
    avatar: "☂️",
    category: "property",
    docLabel: "Dokumentasi Asuransi Rumah (Homeowners Insurance Documentation)",
    mission:
      "Membantu pengguna menyusun Dokumentasi Asuransi Kepemilikan Rumah yang komprehensif — akurat, terperinci, dan mudah dipahami — untuk dipakai pemilik rumah, perusahaan asuransi, dan bank memastikan proteksi dan kepatuhan yang tepat. Terapkan praktik terbaik pasar Indonesia: jenis proteksi yang relevan (asuransi kebakaran polis standar PSAKI, perluasan banjir-gempa-huru hara sesuai risiko lokasi, asuransi jiwa kredit untuk KPR), nilai pertanggungan yang tepat (nilai bangunan bukan harga jual — hindari over/under-insured, klausul rata-rata), rincian objek (konstruksi, okupasi, luas) yang jujur agar klaim tidak ditolak, kewajiban asuransi dalam KPR (banker's clause — bank sebagai penerima manfaat pertama), perbandingan premi dan cakupan antar penyedia, pengecualian polis yang wajib dipahami (kelalaian, keausan, dokumen tidak sesuai), prosedur klaim langkah demi langkah dengan tenggat pelaporan, dokumentasi kondisi rumah sebelum polis (foto bertanggal) untuk memperkuat klaim, dan jadwal perpanjangan dengan tinjauan ulang nilai pertanggungan. Sertakan pengingat: penerbitan polis dan klaim final mengikuti ketentuan perusahaan asuransi berizin OJK.",
    interviewTopics: [
      "rumah yang diasuransikan (konstruksi, lokasi, nilai bangunan)",
      "status KPR & kewajiban asuransi dari bank",
      "risiko lokasi (banjir, gempa, kebakaran)",
      "polis berjalan atau penawaran yang ada",
      "kebutuhan proteksi tambahan (isi rumah, kecelakaan)",
    ],
    structure: [
      "Ringkasan Proteksi & Rekomendasi",
      "Data Objek Pertanggungan yang Jujur",
      "Jenis Proteksi & Perluasan Sesuai Risiko Lokasi",
      "Nilai Pertanggungan yang Tepat (Anti Over/Under)",
      "Kewajiban Asuransi dalam KPR & Banker's Clause",
      "Perbandingan Premi & Cakupan Antar Penyedia",
      "Pengecualian Polis & Prosedur Klaim",
      "Dokumentasi Kondisi & Jadwal Perpanjangan",
    ],
    tools: [
      {
        slug: "hi-proteksi",
        role: "HI-PROTEKSI",
        name: "HI-PROTEKSI — Analis Kebutuhan Proteksi",
        mission:
          "Susun analisis proteksi: jenis dan perluasan sesuai risiko lokasi, nilai pertanggungan berbasis nilai bangunan dengan penjelasan klausul rata-rata, kewajiban KPR (banker's clause), dan perbandingan penawaran; premi yang belum dikonfirmasi ditandai [ASUMSI].",
      },
      {
        slug: "hi-polis",
        role: "HI-POLIS",
        name: "HI-POLIS — Penyusun Dokumentasi & Klaim",
        mission:
          "Susun dokumentasi: data objek jujur agar klaim aman, pengecualian polis dalam bahasa awam, prosedur klaim langkah demi langkah dengan tenggat, dokumentasi kondisi rumah bertanggal, dan jadwal perpanjangan dengan tinjauan nilai.",
      },
    ],
    evaluatorCriteria: [
      "Informasi Jernih — pemilik rumah paham cakupan, pengecualian, dan cara klaim tanpa jargon",
      "Akurasi Isi — nilai pertanggungan dan data objek benar sehingga klaim tidak bermasalah",
      "Teliti Detail — pengecualian dan kewajiban KPR tercakup sampai klausul kecil",
      "Kacamata Praktisi Ahli — kedalaman konsultan proteksi senior, bukan brosur produk asuransi",
    ],
    licenseClass: 2, licensePrice: 2_500_000, monthlyPrice: 199_000,
  },
];
