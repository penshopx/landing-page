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
  // ── Batch 3 (aiforwork electrical-engineer, engineering) ───────────────────
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
  // ── Batch 4 (aiforwork electrical-engineer lanjutan, engineering) ──────────
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
  // ── Batch 5 (aiforwork mechanical-engineer, engineering) ───────────────────
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

  // ── Batch 6: real-estate-developer (property) — dari prompt aiforwork ──
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
];
