import type { Express } from "express";
import { db } from "./db";
import { lmsCourses, lmsLessons, lmsEnrollments, lmsLessonProgress } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated?.() || req.user) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_COURSES = [
  // === ONBOARDING GUSTAFTA ===
  {
    title: "Mulai dengan Gustafta",
    slug: "mulai-gustafta",
    shortDesc: "Pelajari cara membuat chatbot AI pertama Anda dalam 30 menit.",
    description: "Kursus onboarding resmi Gustafta. Anda akan belajar membuat chatbot, mengisi knowledge base, mengatur persona, dan mempublish chatbot ke publik — langkah demi langkah.",
    category: "onboarding",
    subcategory: "Dasar",
    color: "#6366f1",
    emoji: "🚀",
    instructor: "Tim Gustafta",
    durationMinutes: 35,
    price: 0,
    level: "beginner",
    isFeatured: true,
    sortOrder: 1,
    lessons: [
      { title: "Apa itu Gustafta?", slug: "apa-itu-gustafta", type: "article", durationMinutes: 5, isPreview: true, content: `# Apa itu Gustafta?\n\nGustafta adalah platform **AI Chatbot Builder** yang memungkinkan Anda membuat, mengkonfigurasi, dan men-deploy asisten percakapan cerdas — tanpa coding.\n\n## Mengapa Gustafta?\n\n- **5-Level Modular Hierarchy** — Agen dari Master hingga Spesialis\n- **Multi-Agent Orchestration** — Beberapa agen bekerja paralel\n- **ABD v1.1 (Anti-Blocking Doctrine)** — Chatbot selalu jawab dari informasi minimal\n- **Widget Embed** — Pasang di website mana saja dengan 1 baris kode\n- **Knowledge Base** — Upload dokumen, chatbot otomatis belajar\n\n## Siapa yang cocok menggunakan Gustafta?\n\n- Konsultan konstruksi (SKK, SBU, K3, ISO)\n- Lembaga sertifikasi (LSP, BNSP)\n- Tim legal dan kepatuhan\n- Bisnis yang butuh customer service AI 24/7` },
      { title: "Buat Chatbot Pertama", slug: "buat-chatbot-pertama", type: "article", durationMinutes: 8, isPreview: true, content: `# Buat Chatbot Pertama Anda\n\n## Langkah 1: Login dan Buka Dashboard\n\nMasuk ke dashboard Gustafta. Di panel kiri, klik **+ New Agent**.\n\n## Langkah 2: Isi Informasi Dasar\n\n- **Nama**: Nama chatbot Anda (contoh: "Asisten SBU Konstruksi")\n- **Deskripsi**: Jelaskan keahlian chatbot secara singkat\n- **Persona**: Karakter chatbot (ramah, profesional, tegas, dll)\n- **Tagline**: Kalimat singkat yang muncul di widget\n\n## Langkah 3: Tulis System Prompt\n\nSystem prompt adalah instruksi utama yang mendefinisikan perilaku chatbot. Gunakan template dari Gustafta atau tulis sendiri.\n\n## Langkah 4: Simpan dan Test\n\nKlik **Simpan**, lalu buka tab **Chat** untuk test chatbot Anda langsung.` },
      { title: "Mengisi Knowledge Base", slug: "mengisi-knowledge-base", type: "article", durationMinutes: 7, content: `# Mengisi Knowledge Base\n\nKnowledge Base adalah "otak" chatbot Anda — kumpulan informasi yang digunakan untuk menjawab pertanyaan.\n\n## Cara Upload Konten\n\n### 1. Upload File\nDukung PDF, DOCX, TXT. Klik **Upload File** di tab Knowledge Base.\n\n### 2. Paste Teks\nCopy-paste konten langsung ke editor teks.\n\n### 3. Input URL\nMasukkan URL website — Gustafta akan crawl kontennya otomatis.\n\n## Tips Mengisi KB yang Baik\n\n- Gunakan judul dan subjudul yang jelas\n- Pecah konten panjang menjadi topik-topik spesifik\n- Pastikan konten up-to-date\n- Tambahkan FAQ yang sering ditanyakan user\n\n## Hierarki Konten\n\nGustafta mendukung hierarki: **Series → Big Idea → Toolbox → Agent → Knowledge Base**. Susun konten sesuai hierarki untuk navigasi yang lebih baik.` },
      { title: "Mengatur Widget & Embed", slug: "mengatur-widget-embed", type: "article", durationMinutes: 8, content: `# Mengatur Widget & Embed\n\n## Apa itu Widget?\n\nWidget adalah tombol chat mengambang yang bisa dipasang di website mana saja. Pengunjung klik tombol → chat langsung dengan chatbot Anda.\n\n## Kustomisasi Widget\n\nBuka tab **Widget** di chatbot Anda:\n\n- **Warna** — Sesuaikan dengan brand Anda\n- **Posisi** — Kanan bawah, kiri bawah, kanan atas, kiri atas\n- **Ukuran** — Kecil, Sedang, Besar\n- **Ikon** — Chat, Message, Bot, atau Help\n- **Pesan Sambutan** — Teks yang muncul saat widget dibuka\n\n## Cara Embed ke Website\n\n1. Buka tab **Widget** → scroll ke **Kode Embed**\n2. Copy 1 baris kode ini:\n\n\`\`\`html\n<script src="https://app.gustafta.com/widget/loader.js" data-agent-id="ID_CHATBOT_ANDA"></script>\n\`\`\`\n\n3. Paste sebelum tag \`</body>\` di website Anda\n4. Selesai! Widget langsung aktif.\n\n## Demo Page untuk Customer\n\nGunakan link \`/demo/[ID]\` untuk mengirim halaman demo siap pakai ke calon customer — mereka bisa langsung test chatbot dan salin kode embed sendiri.` },
      { title: "Publish dan Share Chatbot", slug: "publish-share-chatbot", type: "article", durationMinutes: 7, content: `# Publish dan Share Chatbot\n\n## Mengaktifkan Akses Publik\n\n1. Buka chatbot di dashboard\n2. Di panel atas, aktifkan toggle **"Publik"**\n3. Chatbot kini bisa diakses siapa saja via link\n\n## Link yang Bisa Dibagikan\n\n### 1. Link Chat Publik\n\`/bot/[ID]\` — Halaman chat minimal, langsung bisa ngobrol.\n\n### 2. Demo Page\n\`/demo/[ID]\` — Halaman showcase lengkap dengan embed code. Cocok untuk pitch ke customer.\n\n### 3. Kode Embed Widget\nSatu script tag untuk pasang di website manapun.\n\n## Mengontrol Akses\n\n- **Guest Message Limit** — Batasi berapa pesan yang bisa dikirim tanpa login\n- **Require Registration** — Wajib daftar sebelum bisa chat\n- **Trial Days** — Berikan trial gratis N hari\n\n## Monitoring\n\nPantau percakapan user di tab **Pesan** dashboard Anda.` },
    ],
  },
  {
    title: "Multi-Agent & Agentic AI",
    slug: "multi-agent-agentic-ai",
    shortDesc: "Kuasai sistem multi-agen — orchestrator, sub-agen, dan paralel dispatch.",
    description: "Pelajari cara membangun sistem AI agentic dengan beberapa agen yang bekerja secara paralel. Dari konfigurasi orchestrator hingga ABD v1.1 Anti-Blocking Doctrine.",
    category: "onboarding",
    subcategory: "Lanjutan",
    color: "#8b5cf6",
    emoji: "🕸️",
    instructor: "Tim Gustafta",
    durationMinutes: 45,
    price: 0,
    level: "intermediate",
    isFeatured: true,
    sortOrder: 2,
    lessons: [
      { title: "Konsep Agentic AI", slug: "konsep-agentic-ai", type: "article", durationMinutes: 8, isPreview: true, content: `# Konsep Agentic AI\n\nAgentic AI adalah sistem di mana beberapa agen AI bekerja bersama — satu agen mengkoordinasi (orchestrator), lainnya berspesialisasi (sub-agent).\n\n## Mengapa Agentic?\n\n- **Lebih akurat** — Setiap agen fokus pada domain spesifiknya\n- **Lebih lengkap** — Laporan dari banyak perspektif sekaligus\n- **Lebih cepat** — Sub-agen berjalan paralel, bukan satu per satu\n\n## Hierarki 5-Level Gustafta\n\n1. **Master** — Koordinator tertinggi\n2. **Series HUB** — Koordinator tema besar\n3. **Sub-HUB** — Koordinator subtema\n4. **Specialist** — Agen ahli domain\n5. **Deep Specialist** — Agen ultra-spesifik\n\n## Inter-Agent API v2\n\nGustafta menggunakan sistem orchestration internal: orchestrator memanggil sub-agen secara paralel, mengumpulkan hasilnya, lalu mensintesis jawaban komprehensif.` },
      { title: "Membuat Orchestrator", slug: "membuat-orchestrator", type: "article", durationMinutes: 10, content: `# Membuat Orchestrator\n\nOrchestrator adalah "manajer" yang mengkoordinasi sub-agen.\n\n## Konfigurasi Orchestrator\n\n1. Buat agen baru\n2. Di tab **Agentic AI**, aktifkan mode Orchestrator\n3. Tambahkan sub-agen yang akan dipanggil\n4. Atur timeout dan max tokens per sub-agen\n\n## System Prompt Orchestrator\n\nOrchestrator perlu instruksi khusus untuk:\n- Menentukan kapan memanggil sub-agen mana\n- Cara mensintesis hasil dari beberapa sub-agen\n- Fallback jika sub-agen tidak tersedia\n\n## SYNTHESIS ORCHESTRATOR Marker\n\nGunakan marker \`// SYNTHESIS ORCHESTRATOR\` di system prompt untuk menandai agen sebagai orchestrator aktif. Ini memicu Inter-Agent API v2.` },
      { title: "ABD v1.1 Anti-Blocking Doctrine", slug: "abd-anti-blocking", type: "article", durationMinutes: 12, content: `# ABD v1.1 — Anti-Blocking Doctrine\n\nABD adalah aturan utama yang memastikan chatbot **selalu memberikan jawaban substantif** — tidak pernah blok atau tanya-tanya berlebihan.\n\n## 7 Prinsip ABD\n\n1. **ABD-1 Jawab dengan minimum input** — Dari info sedikit, hasilkan output maksimal\n2. **ABD-2 Heuristik default** — Gunakan asumsi wajar jika data tidak lengkap\n3. **ABD-3 Nyatakan asumsi** — Tandai asumsi dengan \`[ASUMSI: ...]\`\n4. **ABD-4 Anti interrogasi** — Maksimal 1 putaran klarifikasi\n5. **ABD-5 Reflect sebelum deliver** — Review output sebelum kirim\n6. **ABD-6 Anti human-as-API** — Jangan minta user jadi input machine\n7. **ABD-7 Output terstruktur** — Gunakan tabel, poin, dan format jelas\n\n## State Machine 7-Langkah\n\n\`INIT → ELICIT → PLAN → DISPATCH → AGGREGATE → REFLECT → DELIVER\`\n\nSetiap siklus tanya-jawab mengikuti state machine ini untuk output yang konsisten dan berkualitas tinggi.` },
      { title: "Fallback Mode & Handover", slug: "fallback-handover", type: "article", durationMinutes: 10, content: `# Fallback Mode & Handover\n\n## Fallback Mode\n\nKetika sub-agen tidak tersedia, orchestrator masuk **FALLBACK MODE** — menjawab secara mandiri menggunakan domain knowledge dan menandai asumsi.\n\nFormat fallback:\n\`\`\`\n[FALLBACK MODE] Sub-agen tidak tersedia. Menjawab berdasarkan pengetahuan domain:\n[ASUMSI: nilai | basis: regulasi | verifikasi-ke: pihak]\n\`\`\`\n\n## T5-Handover\n\nKetika user bertanya di luar domain chatbot, gunakan **HANDOVER** — bot mengakui keterbatasannya, menyebutkan resource yang tepat, dan kembali ke topik utama.\n\nContoh handover:\n> "Pertanyaan ini berada di luar domain SKK yang saya layani. Untuk topik SBU, Anda bisa menghubungi [SBU Advisor Bot]. Kembali ke topik SKK, ada yang bisa saya bantu?"` },
    ],
  },

  // === KONSTRUKSI ===
  {
    title: "Panduan SBU Konstruksi Lengkap",
    slug: "panduan-sbu-konstruksi",
    shortDesc: "Semua yang perlu Anda tahu tentang Sertifikasi Badan Usaha Jasa Konstruksi.",
    description: "Kursus komprehensif tentang SBU Konstruksi berdasarkan Permen PU No. 6 Tahun 2025. Meliputi persyaratan, dokumen, proses OSS-RBA, biaya, dan tips lolos sertifikasi.",
    category: "konstruksi",
    subcategory: "SBU",
    color: "#f97316",
    emoji: "🏗️",
    instructor: "SBUClaw AI + Tim Konstruksi",
    durationMinutes: 90,
    price: 0,
    level: "intermediate",
    isFeatured: true,
    sortOrder: 3,
    lessons: [
      { title: "Apa itu SBU Konstruksi?", slug: "apa-itu-sbu", type: "article", durationMinutes: 8, isPreview: true, content: `# Apa itu SBU Konstruksi?\n\nSertifikat Badan Usaha (SBU) adalah bukti kemampuan dan kompetensi Badan Usaha Jasa Konstruksi (BUJK) dalam melaksanakan pekerjaan konstruksi.\n\n## Dasar Hukum\n\n- **Permen PU No. 6 Tahun 2025** — Regulasi utama SBU saat ini\n- **UU No. 2 Tahun 2017** — Undang-Undang Jasa Konstruksi\n- **PP No. 14 Tahun 2021** — Peraturan turunan UU Jasa Konstruksi\n\n> ⚠️ SK Dirjen No. 37/2025 masih mengacu Permen lama. Gunakan **Permen PU 6/2025** sebagai acuan utama.\n\n## Jenis SBU\n\n| Jenis | Keterangan |\n|-------|------------|\n| **SBU PK** | Pelaksana Konstruksi (kontraktor) |\n| **SBU KK** | Konsultansi Konstruksi |\n| **SBU AIO** | All-In-One (gabungan) |\n| **SBU Terintegrasi** | Untuk BUJK terintegrasi |\n| **SBU JPTL** | Jasa Penunjang Tenaga Listrik |\n| **SBU Migas/EBT** | Minyak, gas, energi terbarukan |` },
      { title: "Kualifikasi BUJK", slug: "kualifikasi-bujk", type: "article", durationMinutes: 10, content: `# Kualifikasi BUJK\n\nKualifikasi menentukan nilai pekerjaan yang boleh dikerjakan.\n\n## Kualifikasi Pelaksana Konstruksi\n\n| Kualifikasi | Nilai Pekerjaan |\n|-------------|------------------|\n| Kecil (K) | s.d. Rp 2,5 miliar |\n| Menengah (M) | Rp 2,5 M — Rp 50 M |\n| Besar (B) | > Rp 50 miliar |\n\n## Persyaratan Kualifikasi Kecil\n\n- Modal disetor minimal Rp 500 juta\n- Tenaga ahli bersertifikat (SKK minimal KKNI L4)\n- Peralatan konstruksi sesuai subklasifikasi\n\n## Subklasifikasi\n\nSubklasifikasi menentukan jenis pekerjaan yang boleh diambil:\n- **BS** — Bangunan Sipil\n- **BG** — Bangunan Gedung\n- **IL** — Instalasi Mekanikal & Elektrikal\n- **IM** — Instalasi Manufaktur\n- **KO** — Konstruksi Khusus` },
      { title: "Dokumen Persyaratan SBU", slug: "dokumen-sbu", type: "article", durationMinutes: 12, content: `# Dokumen Persyaratan SBU\n\n## Dokumen Perusahaan\n\n1. Akta Pendirian + SK Kemenkumham\n2. NPWP Perusahaan\n3. NIB (Nomor Induk Berusaha) dari OSS\n4. Laporan Keuangan 2 tahun terakhir (audited untuk Menengah/Besar)\n5. Rekening Koran 3 bulan terakhir\n\n## Dokumen Tenaga Ahli\n\n1. **SKK (Sertifikat Kompetensi Kerja)** — Wajib sesuai subklasifikasi\n2. KTP dan NPWP tenaga ahli\n3. Ijazah pendidikan formal\n4. Foto formal\n\n## Dokumen Peralatan\n\n1. Bukti kepemilikan/sewa peralatan\n2. STNK/faktur peralatan\n3. Foto peralatan\n\n## Tips Persiapan Dokumen\n\n- Mulai dari SKK tenaga ahli dulu — prosesnya paling lama\n- Pastikan nama di semua dokumen konsisten\n- Laporan keuangan harus ditandatangani akuntan publik (untuk Menengah/Besar)` },
      { title: "Proses Pengajuan via OSS-RBA", slug: "proses-oss-rba", type: "article", durationMinutes: 15, content: `# Proses Pengajuan SBU via OSS-RBA\n\n## Apa itu OSS-RBA?\n\nOSS (Online Single Submission) adalah sistem perizinan berusaha terintegrasi. SBU diajukan melalui OSS dengan mekanisme Risk-Based Approach (RBA).\n\n## Langkah-Langkah\n\n### 1. Siapkan Akun OSS\n- Daftar/login di oss.go.id\n- Pastikan NIB sudah aktif\n\n### 2. Pilih KBLI yang Tepat\n- KBLI menentukan jenis usaha dan subklasifikasi SBU\n- Contoh: KBLI 41011 = Konstruksi Gedung Hunian\n\n### 3. Upload Dokumen\n- Upload semua dokumen persyaratan\n- Verifikasi otomatis oleh sistem\n\n### 4. Verifikasi LPJK\n- LPJK (Lembaga Pengembangan Jasa Konstruksi) melakukan verifikasi\n- Proses 7-14 hari kerja\n\n### 5. Terbit SBU\n- SBU digital diterbitkan dan bisa didownload dari OSS\n- Berlaku 3 tahun dan harus diregistrasi ulang\n\n## Biaya\n\nBiaya SBU bervariasi berdasarkan kualifikasi dan subklasifikasi. Estimasi: Rp 2-10 juta.` },
      { title: "Pertanyaan Umum SBU", slug: "faq-sbu", type: "article", durationMinutes: 10, content: `# FAQ — Pertanyaan Umum SBU\n\n## Berapa lama proses SBU?\nEstimasi total 3-6 minggu dari dokumen lengkap. Bottleneck biasanya di verifikasi SKK tenaga ahli.\n\n## Apakah bisa mengurus SBU tanpa tenaga ahli SKK?\nTidak. SKK adalah persyaratan wajib. Minimal 1 tenaga ahli SKK sesuai subklasifikasi yang diajukan.\n\n## Apa bedanya SBU dan SIUJK lama?\nSIUJK sudah tidak berlaku sejak 2021. SBU adalah pengganti SIUJK yang terintegrasi dengan OSS.\n\n## Apakah SBU bisa dipakai lintas provinsi?\nYa. SBU berlaku nasional untuk semua jenis tender pemerintah di seluruh Indonesia.\n\n## Bagaimana jika SBU expired?\nHarus diregistrasi ulang sebelum expired. Jika sudah expired, BUJK tidak bisa mengikuti tender.` },
    ],
  },
  {
    title: "Persiapan SKK & Sertifikasi Kompetensi",
    slug: "persiapan-skk-sertifikasi",
    shortDesc: "Panduan lengkap persiapan Sertifikat Kompetensi Kerja (SKK) konstruksi.",
    description: "Pelajari cara mempersiapkan diri untuk uji kompetensi SKK — dari memahami SKKNI, menyiapkan portofolio, sampai proses asesmen di LSP.",
    category: "konstruksi",
    subcategory: "SKK",
    color: "#22c55e",
    emoji: "📋",
    instructor: "SKK Coach AI",
    durationMinutes: 60,
    price: 0,
    level: "beginner",
    sortOrder: 4,
    lessons: [
      { title: "Apa itu SKK?", slug: "apa-itu-skk", type: "article", durationMinutes: 7, isPreview: true, content: `# Apa itu SKK?\n\nSertifikat Kompetensi Kerja (SKK) adalah bukti kompetensi seseorang di bidang jasa konstruksi. Diterbitkan oleh **LSP (Lembaga Sertifikasi Profesi)** yang telah diakreditasi BNSP.\n\n## Dasar Hukum\n\n- **Permen PUPR No. 9 Tahun 2023** — Pedoman utama SKK\n- **SK Dirjen No. 114/KPTS/DK/2024** — Acuan teknis jabatan kerja\n- **SKKNI** — Standar Kompetensi Kerja Nasional Indonesia\n\n## Jenjang KKNI\n\n| Level | Keterangan |\n|-------|------------|\n| KKNI L2-3 | Operator/Teknisi |\n| KKNI L4-5 | Teknisi Madya |\n| KKNI L6 | Ahli Muda |\n| KKNI L7 | Ahli Madya |\n| KKNI L8 | Ahli Utama |\n\n## Mengapa SKK Penting?\n\n1. Syarat wajib SBU\n2. Syarat mengikuti tender pemerintah\n3. Meningkatkan nilai jual sebagai profesional` },
      { title: "Mengenal SKKNI", slug: "mengenal-skkni", type: "article", durationMinutes: 8, content: `# Mengenal SKKNI\n\nSKKNI (Standar Kompetensi Kerja Nasional Indonesia) adalah acuan standar kompetensi yang harus dikuasai untuk mendapatkan SKK.\n\n## Komponen SKKNI\n\n### Unit Kompetensi\nSetiap jabatan kerja terdiri dari beberapa unit kompetensi. Contoh untuk Ahli Muda Teknik Bangunan Gedung (KKNI L6):\n- Mengelola rencana kerja proyek\n- Mengendalikan mutu konstruksi\n- Mengelola keselamatan konstruksi\n\n### Elemen Kompetensi\nSetiap unit punya elemen-elemen spesifik yang harus bisa dilakukan.\n\n### Kriteria Unjuk Kerja (KUK)\nIndikator terukur bahwa elemen kompetensi dikuasai.\n\n## Cara Membaca SKKNI\n\nCari SKKNI jabatan Anda di website BNSP atau Kemen PUPR, lalu pelajari setiap unit kompetensi beserta KUK-nya.` },
      { title: "Portofolio & Dokumen", slug: "portofolio-dokumen-skk", type: "article", durationMinutes: 10, content: `# Portofolio & Dokumen SKK\n\n## Dokumen Wajib\n\n1. KTP\n2. Ijazah pendidikan terakhir\n3. NPWP pribadi\n4. Foto 3x4 formal\n\n## Portofolio Pekerjaan\n\nKumpulkan bukti pengalaman kerja:\n- Surat keterangan kerja dari perusahaan\n- Kontrak proyek yang pernah dikerjakan\n- Foto-foto proyek\n- Laporan pekerjaan\n\n## Tips Portofolio yang Kuat\n\n- Minimal 2-3 proyek yang relevan\n- Cantumkan nilai proyek dan peran Anda\n- Sertakan foto sebelum/sesudah jika ada\n- Testimonial dari atasan atau klien\n\n## FR-APL-01 — Formulir Permohonan Asesmen\n\nFR-APL-01 adalah form standar BNSP untuk mengajukan asesmen kompetensi. Isi dengan jelas dan jujur — ini dasar asesor menilai kelayakan Anda.` },
      { title: "Proses Asesmen LSP", slug: "proses-asesmen-lsp", type: "article", durationMinutes: 10, content: `# Proses Asesmen di LSP\n\n## Tahap Asesmen\n\n### 1. Pengajuan Permohonan\nSubmit FR-APL-01 + dokumen ke LSP pilihan Anda.\n\n### 2. Pra-Asesmen\nAsesor mereview portofolio Anda. Jika ada kekurangan, Anda diberi waktu melengkapi.\n\n### 3. Asesmen Kompetensi\nBisa berupa:\n- **Wawancara** — Asesor mengajukan pertanyaan teknis\n- **Observasi** — Asesor melihat Anda bekerja langsung\n- **Uji Tulis** — Soal tertulis berbasis SKKNI\n- **Portofolio Review** — Diskusi mendalam tentang proyek Anda\n\n### 4. Keputusan Asesmen\n- **Kompeten (K)** — SKK diterbitkan\n- **Belum Kompeten (BK)** — Bisa mengulang setelah remedial\n\n### 5. Penerbitan SKK\nSKK digital diterbitkan melalui sistem SIKI LPJK dalam 7-14 hari kerja.` },
    ],
  },
  {
    title: "Dasar-Dasar K3 Konstruksi",
    slug: "dasar-k3-konstruksi",
    shortDesc: "Keselamatan dan Kesehatan Kerja di proyek konstruksi — mulai dari SMK3 hingga CSMS.",
    description: "Pelajari prinsip K3 konstruksi, penerapan SMK3, program CSMS untuk kontraktor, dan cara membangun budaya keselamatan di lapangan.",
    category: "konstruksi",
    subcategory: "K3",
    color: "#ef4444",
    emoji: "⛑️",
    instructor: "AGENT-SAFIRA (K3 AI)",
    durationMinutes: 50,
    price: 0,
    level: "beginner",
    sortOrder: 5,
    lessons: [
      { title: "Mengapa K3 Itu Wajib?", slug: "mengapa-k3-wajib", type: "article", durationMinutes: 6, isPreview: true, content: `# Mengapa K3 Itu Wajib?\n\nKeselamatan dan Kesehatan Kerja (K3) bukan pilihan — ini kewajiban hukum dan etika profesional.\n\n## Dasar Hukum K3 Konstruksi\n\n- **UU No. 1 Tahun 1970** — UU Keselamatan Kerja\n- **PP No. 50 Tahun 2012** — SMK3 (Sistem Manajemen K3)\n- **Permen PUPR No. 10 Tahun 2021** — K3 Konstruksi\n- **ISO 45001:2018** — Standar internasional K3\n\n## Fakta K3 Konstruksi Indonesia\n\n- Konstruksi adalah salah satu sektor dengan angka kecelakaan kerja tertinggi\n- Biaya kecelakaan kerja jauh lebih besar dari biaya pencegahan\n- Pelanggaran K3 bisa berujung penghentian proyek dan sanksi pidana\n\n## Manfaat K3 yang Baik\n\n- Mengurangi kecelakaan kerja\n- Meningkatkan produktivitas\n- Memenuhi syarat tender (CSMS score)\n- Meningkatkan reputasi perusahaan` },
      { title: "SMK3 — Sistem Manajemen K3", slug: "smk3-sistem-manajemen", type: "article", durationMinutes: 10, content: `# SMK3 — Sistem Manajemen Keselamatan dan Kesehatan Kerja\n\nSMK3 adalah sistem manajemen yang mengintegrasikan K3 ke dalam keseluruhan manajemen perusahaan.\n\n## Elemen SMK3 (PP 50/2012)\n\n1. **Penetapan Kebijakan K3** — Komitmen manajemen puncak\n2. **Perencanaan K3** — Identifikasi bahaya, penilaian risiko\n3. **Pelaksanaan K3** — Prosedur, pelatihan, komunikasi\n4. **Pemantauan & Evaluasi** — Audit, inspeksi, investigasi kecelakaan\n5. **Peninjauan Ulang** — Review manajemen berkala\n\n## Level SMK3\n\n| Level | Elemen | Pencapaian |\n|-------|--------|------------|\n| Tingkat Awal | 64 elemen | 64% |\n| Tingkat Transisi | 122 elemen | 85% |\n| Tingkat Lanjutan | 166 elemen | 100% |\n\n## Audit SMK3\n\nAudit SMK3 dilakukan oleh lembaga audit eksternal terakreditasi. Sertifikat berlaku 3 tahun dengan surveillance audit tahunan.` },
      { title: "CSMS untuk Kontraktor", slug: "csms-kontraktor", type: "article", durationMinutes: 10, content: `# CSMS — Contractor Safety Management System\n\nCSMS adalah sistem penilaian K3 yang digunakan principal (pemilik proyek) untuk mengevaluasi kemampuan K3 kontraktor sebelum memberikan pekerjaan.\n\n## Tahap Penilaian CSMS\n\n### 1. Pra-Kualifikasi\nKontraktor mengisi kuesioner K3 dan menyerahkan dokumen:\n- Kebijakan K3\n- Statistik kecelakaan (LTIFR, TRIFR)\n- Sertifikat SMK3 (jika ada)\n- Daftar personel K3 bersertifikat\n\n### 2. Site Visit (untuk proyek besar)\nTim CSMS mengunjungi proyek yang sedang berjalan untuk verifikasi lapangan.\n\n### 3. Penilaian & Scoring\nSkor CSMS menentukan status kontraktor:\n- **Green** — Kontraktor pilihan utama\n- **Yellow** — Bisa bekerja dengan pengawasan ketat\n- **Red** — Tidak memenuhi syarat\n\n## Tips Meningkatkan CSMS Score\n\n- Investasi di pelatihan K3 personel\n- Maintain statistik kecelakaan yang baik (zero incident jika memungkinkan)\n- Dokumentasikan semua aktivitas K3 dengan baik` },
    ],
  },

  // === TENDER & PENGADAAN ===
  {
    title: "Tender & Pengadaan Barang/Jasa Pemerintah",
    slug: "tender-pbjp-dasar",
    shortDesc: "Panduan lengkap mengikuti tender pemerintah — dari persiapan dokumen hingga menang lelang.",
    description: "Kursus komprehensif tentang Pengadaan Barang/Jasa Pemerintah (PBJP) berdasarkan Perpres 46/2025. Meliputi jenis pengadaan, proses lelang di SPSE, strategi penawaran, dan manajemen kontrak.",
    category: "tender",
    subcategory: "PBJP",
    color: "#0ea5e9",
    emoji: "📑",
    instructor: "Tender AI + Tim PBJP",
    durationMinutes: 80,
    price: 0,
    level: "intermediate",
    isFeatured: true,
    sortOrder: 6,
    lessons: [
      { title: "Ekosistem Pengadaan Pemerintah", slug: "ekosistem-pengadaan-pemerintah", type: "article", durationMinutes: 8, isPreview: true, content: `# Ekosistem Pengadaan Barang/Jasa Pemerintah\n\nPengadaan Barang/Jasa Pemerintah (PBJP) adalah proses bagaimana pemerintah membeli barang, jasa, dan pekerjaan konstruksi menggunakan APBN/APBD.\n\n## Dasar Hukum\n\n- **Perpres 46/2025** — Regulasi utama PBJP saat ini (pengganti Perpres 16/2018)\n- **PerLKPP No. 12/2021** — Pedoman teknis pengadaan\n\n> ⚠️ Perpres 16/2018 sudah diganti. Gunakan **Perpres 46/2025** sebagai acuan utama.\n\n## Pelaku Pengadaan\n\n| Pelaku | Peran |\n|--------|-------|\n| **PA/KPA** | Pengguna Anggaran / Kuasa Pengguna Anggaran |\n| **PPK** | Pejabat Pembuat Komitmen — penandatangan kontrak |\n| **Pokja** | Kelompok Kerja — panitia lelang |\n| **UKPBJ** | Unit Kerja Pengadaan Barang/Jasa |\n| **Penyedia** | Kontraktor/vendor peserta lelang |\n\n## Jenis Pengadaan\n\n1. **Pengadaan Barang** — Peralatan, kendaraan, furnitur\n2. **Pekerjaan Konstruksi** — Gedung, jalan, jembatan, dll\n3. **Jasa Konsultansi** — Studi, desain, supervisi\n4. **Jasa Lainnya** — Kebersihan, keamanan, dll` },
      { title: "Metode Pemilihan Penyedia", slug: "metode-pemilihan-penyedia", type: "article", durationMinutes: 10, content: `# Metode Pemilihan Penyedia\n\n## Metode Berdasarkan Nilai\n\n| Metode | Nilai Pekerjaan | Keterangan |\n|--------|-----------------|------------|\n| **Pengadaan Langsung** | ≤ Rp 200 juta | Tanpa proses lelang formal |\n| **Penunjukan Langsung** | Kondisi tertentu | Darurat, rahasia negara |\n| **Tender Cepat** | Spesifikasi standar | Via katalog elektronik |\n| **Tender** | > Rp 200 juta | Proses kompetitif penuh |\n| **Seleksi** | Jasa konsultansi | Evaluasi teknis dulu |\n\n## Katalog Elektronik (e-Katalog)\n\nProduk/jasa yang sudah terstandarisasi bisa dibeli langsung via e-Katalog LKPP tanpa lelang. Ini semakin populer untuk pengadaan rutin.\n\n## E-Purchasing\n\nPembelian langsung lewat e-Katalog menggunakan SPSE. Lebih cepat dari tender biasa.` },
      { title: "Mendaftar & Menggunakan SPSE", slug: "mendaftar-spse", type: "article", durationMinutes: 12, content: `# Mendaftar & Menggunakan SPSE\n\nSPSE (Sistem Pengadaan Secara Elektronik) adalah platform resmi pengadaan pemerintah Indonesia.\n\n## Cara Mendaftar\n\n1. Buka **lpse.go.id** atau LPSE instansi target\n2. Klik **Pendaftaran Penyedia**\n3. Isi data perusahaan (NPWP, NIB, akta)\n4. Upload dokumen perusahaan\n5. Verifikasi oleh admin LPSE (1-3 hari)\n6. Aktivasi akun dan lengkapi profil\n\n## Melihat Tender Aktif\n\nSetelah login:\n- Dashboard → **Cari Paket** → Filter kategori, lokasi, nilai\n- Klik paket → Download dokumen pengadaan\n- Periksa jadwal: pendaftaran, aanwijzing, pemasukan penawaran\n\n## Aanwijzing (Rapat Penjelasan)\n\nAanwijzing adalah sesi tanya jawab resmi antara Pokja dan peserta. WAJIB dihadiri — pertanyaan yang diajukan di sini bisa mengubah dokumen pengadaan.` },
      { title: "Menyusun Dokumen Penawaran", slug: "dokumen-penawaran", type: "article", durationMinutes: 15, content: `# Menyusun Dokumen Penawaran\n\n## Komponen Penawaran Teknis\n\n1. **Metode Pelaksanaan** — Bagaimana Anda akan mengerjakan proyek\n2. **Jadwal Pelaksanaan** — Timeline detail (bar chart)\n3. **Daftar Personel** — CV + SKK tenaga ahli yang ditugaskan\n4. **Daftar Peralatan** — Jenis, jumlah, kondisi alat\n5. **RK3K** — Rencana Keselamatan Konstruksi\n6. **Pengalaman Perusahaan** — Rekam jejak proyek sejenis\n\n## Komponen Penawaran Harga\n\n- **RAB (Rencana Anggaran Biaya)** — Perinci semua item pekerjaan\n- **Analisa Harga Satuan** — Dasar perhitungan harga\n- **Surat Penawaran** — Dokumen formal dengan harga total\n\n## Tips Penawaran yang Kompetitif\n\n- Pelajari HPS (Harga Perkiraan Sendiri) — penawaran di atas HPS gugur otomatis\n- Bandingkan dengan pasar: jangan terlalu rendah (rugi) atau tinggi (kalah)\n- Pastikan spesifikasi teknis 100% sesuai dokumen pengadaan\n- Cek lagi semua tanda tangan dan stempel\n\n## Evaluasi Penawaran\n\nUrutan evaluasi:\n1. Administrasi → 2. Teknis → 3. Harga → 4. Kualifikasi\n\nGugur di satu tahap = tidak lanjut ke tahap berikutnya.` },
      { title: "Manajemen Kontrak Pengadaan", slug: "manajemen-kontrak-pengadaan", type: "article", durationMinutes: 12, content: `# Manajemen Kontrak Pengadaan\n\n## Jenis Kontrak\n\n| Jenis | Karakteristik |\n|-------|---------------|\n| **Lump Sum** | Harga tetap, volume tidak berubah |\n| **Harga Satuan** | Harga per unit tetap, volume bisa berubah |\n| **Terima Jadi** | Penyedia desain + bangun |\n| **Kontrak Payung** | Kontrak induk, order per kebutuhan |\n\n## Kewajiban Setelah Menang Tender\n\n1. **SPPBJ** — Surat Penunjukan Penyedia Barang/Jasa dalam 2 hari kerja\n2. **Jaminan Pelaksanaan** — 5% dari nilai kontrak\n3. **Penandatanganan Kontrak** — Dalam 14 hari kerja setelah SPPBJ\n4. **SPMK** — Surat Perintah Mulai Kerja\n\n## Klaim & Addendum\n\nJika ada perubahan lingkup pekerjaan:\n- Ajukan addendum kontrak sebelum pekerjaan dikerjakan\n- Dokumentasikan semua perubahan secara tertulis\n- Perubahan > 10% nilai kontrak perlu persetujuan PA/KPA` },
    ],
  },
  {
    title: "Legalitas Badan Usaha Jasa Konstruksi",
    slug: "legalitas-bujk",
    shortDesc: "Panduan perizinan lengkap BUJK — NIB, SBU, IUJK, dan perizinan sektor.",
    description: "Pelajari seluruh ekosistem legalitas Badan Usaha Jasa Konstruksi (BUJK): dari NIB di OSS, SBU di LPJK, hingga perizinan sektor khusus. Berdasarkan PP 28/2025 dan regulasi terbaru.",
    category: "legalitas",
    subcategory: "Perizinan",
    color: "#a855f7",
    emoji: "⚖️",
    instructor: "Legal AI Konstruksi",
    durationMinutes: 65,
    price: 0,
    level: "beginner",
    isFeatured: true,
    sortOrder: 7,
    lessons: [
      { title: "Ekosistem Perizinan BUJK", slug: "ekosistem-perizinan-bujk", type: "article", durationMinutes: 8, isPreview: true, content: `# Ekosistem Perizinan Badan Usaha Jasa Konstruksi\n\nUntuk beroperasi secara legal di sektor konstruksi, sebuah badan usaha perlu beberapa lapisan perizinan yang saling melengkapi.\n\n## Dasar Hukum\n\n- **PP 28/2025** — Peraturan Pemerintah tentang Perizinan Berusaha Berbasis Risiko (PBBR)\n- **UU No. 2/2017** — Undang-Undang Jasa Konstruksi\n- **Permen PU No. 6/2025** — Sertifikasi Badan Usaha\n\n> ⚠️ PP 28/2025 adalah regulasi perizinan berusaha (PBBR). Jangan keliru dengan Perpres 46/2025 yang mengatur PBJP/pengadaan.\n\n## Tiga Lapisan Legalitas BUJK\n\n### 1. Legalitas Dasar\n- **NIB** (Nomor Induk Berusaha) — dari OSS, wajib semua usaha\n- **NPWP Perusahaan** — dari DJP\n- **Akta Pendirian** — dari Notaris + SK Kemenkumham\n\n### 2. Perizinan Usaha\n- **SBU** (Sertifikat Badan Usaha) — dari LPJK via OSS\n- Wajib untuk mengikuti tender pemerintah\n\n### 3. Perizinan Sektor (jika relevan)\n- **IUJPTL** — Instalasi listrik\n- **Izin Migas** — Pekerjaan migas\n- **Izin Lingkungan/AMDAL** — Proyek berdampak lingkungan` },
      { title: "NIB dan OSS — Fondasi Perizinan", slug: "nib-oss-fondasi", type: "article", durationMinutes: 10, content: `# NIB dan OSS — Fondasi Semua Perizinan\n\n## Apa itu NIB?\n\nNomor Induk Berusaha (NIB) adalah identitas tunggal pelaku usaha yang dikeluarkan oleh sistem OSS. NIB sekaligus berfungsi sebagai:\n- Tanda Daftar Perusahaan (TDP)\n- Angka Pengenal Impor (API)\n- Akses kepabeanan\n\n## Mendapatkan NIB\n\n1. Buka **oss.go.id**\n2. Login dengan akun OSS (buat jika belum ada)\n3. Isi data dasar usaha:\n   - Nama badan usaha\n   - Bentuk badan usaha (PT, CV, Firma, dll)\n   - KBLI (Klasifikasi Baku Lapangan Usaha)\n4. Sistem otomatis menerbitkan NIB\n\n## KBLI untuk Konstruksi\n\n| KBLI | Kegiatan |\n|------|----------|\n| 41011 | Konstruksi Gedung Hunian |\n| 41012 | Konstruksi Gedung Non-Hunian |\n| 42101 | Konstruksi Jalan Raya |\n| 43211 | Instalasi Kelistrikan |\n| 71101 | Konsultansi Arsitektur |\n\n## Setelah NIB: Lanjut ke SBU\n\nNIB adalah prasyarat untuk mengajukan SBU. Pastikan KBLI di NIB sesuai dengan subklasifikasi SBU yang akan diajukan.` },
      { title: "Akta Perusahaan & Korporasi", slug: "akta-perusahaan-korporasi", type: "article", durationMinutes: 10, content: `# Akta Perusahaan & Korporasi\n\n## Bentuk Badan Usaha di Konstruksi\n\n### PT (Perseroan Terbatas)\n- Paling umum untuk BUJK Menengah dan Besar\n- Modal disetor minimum sesuai ketentuan\n- Direktur bertanggung jawab atas operasional\n\n### CV (Commanditaire Vennootschap)\n- Untuk BUJK Kecil\n- Proses pendirian lebih sederhana dari PT\n- Sekutu aktif bertanggung jawab penuh\n\n### BUMN/BUMD\n- Badan Usaha Milik Negara/Daerah\n- Regulasi khusus, SBU tetap wajib\n\n## Mengurus Akta\n\n1. Pilih nama perusahaan — cek ketersediaan di sistem AHU Online\n2. Siapkan data pendiri dan pengurus\n3. Kunjungi Notaris → Akta Pendirian dibuat\n4. SK Kemenkumham — diterbitkan otomatis via AHU Online dalam 1-3 hari\n\n## Perubahan Akta\n\nPerubahan direksi, modal, atau nama harus segera diaktakan. Dokumen SBU harus diperbarui mengikuti perubahan akta.` },
      { title: "Kepatuhan & Sanksi", slug: "kepatuhan-sanksi-bujk", type: "article", durationMinutes: 10, content: `# Kepatuhan & Sanksi BUJK\n\n## Kewajiban Kepatuhan Berkala\n\n| Kewajiban | Frekuensi | Sanksi Jika Tidak |\n|-----------|-----------|-------------------|\n| Registrasi ulang SBU | 3 tahun | SBU non-aktif |\n| Laporan pajak | Bulanan/Tahunan | Denda + bunga |\n| Update data OSS | Setiap perubahan | NIB tidak valid |\n| Laporan LPJK | Sesuai regulasi | Penangguhan SBU |\n\n## Sanksi Pelanggaran\n\n### Administratif\n- Teguran tertulis\n- Pembekuan SBU\n- Pencabutan SBU\n\n### Perdata\n- Ganti rugi akibat pelanggaran kontrak\n- Klaim jaminan pelaksanaan dicairkan\n\n### Pidana\n- UU Jasa Konstruksi mengatur sanksi pidana untuk pelanggaran berat\n- Kegagalan konstruksi yang menimbulkan korban jiwa: ancaman penjara\n\n## Tips Menjaga Kepatuhan\n\n- Set reminder 6 bulan sebelum SBU expired\n- Tunjuk penanggung jawab legal/compliance di perusahaan\n- Dokumentasikan semua perizinan dalam satu folder terorganisir` },
    ],
  },

  // === ISO & STANDAR ===
  {
    title: "ISO 9001:2015 — Manajemen Mutu untuk Konstruksi",
    slug: "iso-9001-manajemen-mutu",
    shortDesc: "Terapkan sistem manajemen mutu ISO 9001 di perusahaan jasa konstruksi Anda.",
    description: "Pelajari prinsip ISO 9001:2015, cara membangun Sistem Manajemen Mutu (SMM), persiapan audit sertifikasi, dan integrasi dengan sistem manajemen lainnya.",
    category: "konstruksi",
    subcategory: "ISO",
    color: "#14b8a6",
    emoji: "🏆",
    instructor: "ISO Quality AI",
    durationMinutes: 70,
    price: 0,
    level: "intermediate",
    sortOrder: 8,
    lessons: [
      { title: "Prinsip Dasar ISO 9001", slug: "prinsip-iso-9001", type: "article", durationMinutes: 8, isPreview: true, content: `# Prinsip Dasar ISO 9001:2015\n\nISO 9001:2015 adalah standar internasional Sistem Manajemen Mutu (SMM) yang paling banyak digunakan di dunia.\n\n## 7 Prinsip Manajemen Mutu\n\n1. **Fokus pada Pelanggan** — Kepuasan pelanggan adalah tujuan utama\n2. **Kepemimpinan** — Pimpinan menetapkan arah dan menciptakan kondisi yang mendukung\n3. **Keterlibatan Orang** — Kompetensi dan pemberdayaan di semua level\n4. **Pendekatan Proses** — Aktivitas sebagai proses yang saling terhubung\n5. **Perbaikan Berkelanjutan** — Selalu mencari cara untuk lebih baik\n6. **Pengambilan Keputusan Berbasis Bukti** — Data dan analisis, bukan asumsi\n7. **Manajemen Hubungan** — Hubungan saling menguntungkan dengan pemasok\n\n## Mengapa ISO 9001 Penting untuk BUJK?\n\n- Syarat tender pemerintah untuk proyek besar\n- Meningkatkan kepercayaan klien swasta\n- Mengurangi cacat pekerjaan dan rework\n- Meningkatkan efisiensi operasional` },
      { title: "Klausul-Klausul ISO 9001", slug: "klausul-iso-9001", type: "article", durationMinutes: 12, content: `# Klausul-Klausul ISO 9001:2015\n\nISO 9001:2015 menggunakan struktur High Level Structure (HLS) dengan 10 klausul.\n\n## Klausul Utama (4-10)\n\n### Klausul 4 — Konteks Organisasi\nPahami faktor internal/eksternal yang memengaruhi organisasi (analisis SWOT, PESTLE).\n\n### Klausul 5 — Kepemimpinan\nDirektur harus menunjukkan komitmen nyata terhadap SMM, bukan hanya di atas kertas.\n\n### Klausul 6 — Perencanaan\nIdentifikasi risiko dan peluang. Tetapkan sasaran mutu yang terukur.\n\n### Klausul 7 — Dukungan\nSumber daya, kompetensi, kesadaran, komunikasi, informasi terdokumentasi.\n\n### Klausul 8 — Operasi\nPengendalian proses operasional: desain, pengadaan, produksi/konstruksi, inspeksi.\n\n### Klausul 9 — Evaluasi Kinerja\nPemantauan, pengukuran, analisis, evaluasi kepuasan pelanggan, audit internal, tinjauan manajemen.\n\n### Klausul 10 — Perbaikan\nPenanganan ketidaksesuaian, tindakan korektif, dan perbaikan berkelanjutan.` },
      { title: "Implementasi di Proyek Konstruksi", slug: "implementasi-iso-konstruksi", type: "article", durationMinutes: 12, content: `# Implementasi ISO 9001 di Proyek Konstruksi\n\n## Dokumen Wajib SMM Konstruksi\n\n### Prosedur\n- Prosedur Pengendalian Dokumen\n- Prosedur Audit Internal\n- Prosedur Tindakan Korektif\n- Prosedur Tinjauan Manajemen\n\n### Rekaman/Bukti\n- Hasil inspeksi dan pengujian\n- Laporan audit internal\n- Risalah tinjauan manajemen\n- Catatan pelatihan SDM\n\n## Quality Plan per Proyek\n\nSetiap proyek harus punya **Quality Plan** yang mendefinisikan:\n- Standar mutu yang berlaku\n- Titik-titik inspeksi (Inspection Test Plan / ITP)\n- Metode pengujian material\n- Personel yang bertanggung jawab\n\n## Pengendalian Mutu Konstruksi\n\n- **Pre-construction review** — Review gambar dan spesifikasi sebelum mulai\n- **In-process inspection** — Inspeksi selama pekerjaan berlangsung\n- **Material approval** — Persetujuan material sebelum dipasang\n- **As-built documentation** — Gambar dan dokumen akhir sesuai kondisi terpasang` },
      { title: "Audit & Sertifikasi ISO 9001", slug: "audit-sertifikasi-iso-9001", type: "article", durationMinutes: 10, content: `# Audit & Sertifikasi ISO 9001\n\n## Jenis Audit\n\n### 1. Audit Internal\nDilakukan oleh tim internal yang telah dilatih sebagai auditor ISO. Wajib minimal 1x/tahun.\n\n### 2. Audit Sertifikasi (Eksternal)\nDilakukan oleh Lembaga Sertifikasi (LS) yang terakreditasi KAN.\n\n### 3. Surveillance Audit\nAudit tahunan setelah sertifikasi diterbitkan untuk memastikan konsistensi penerapan.\n\n## Proses Sertifikasi\n\n1. **Pilih Lembaga Sertifikasi** — Pastikan terakreditasi KAN\n2. **Gap Analysis** — Identifikasi kesenjangan terhadap standar\n3. **Implementasi** — Bangun dan jalankan SMM minimal 3 bulan\n4. **Audit Tahap 1** — Review kesiapan dokumentasi\n5. **Audit Tahap 2** — Audit implementasi di lapangan\n6. **Sertifikat Terbit** — Berlaku 3 tahun\n\n## Biaya Sertifikasi\n\nBervariasi berdasarkan ukuran perusahaan: Rp 20-80 juta untuk perusahaan konstruksi skala menengah.` },
    ],
  },

  // === MANAJEMEN PROYEK ===
  {
    title: "Manajemen Proyek Konstruksi",
    slug: "manajemen-proyek-konstruksi",
    shortDesc: "Kuasai perencanaan, pengendalian, dan pelaporan proyek konstruksi dari awal hingga serah terima.",
    description: "Kursus praktis manajemen proyek konstruksi: perencanaan biaya dan jadwal, pengendalian mutu lapangan, manajemen risiko, pelaporan progres, dan penanganan klaim kontrak.",
    category: "konstruksi",
    subcategory: "Manajemen Proyek",
    color: "#f59e0b",
    emoji: "📊",
    instructor: "Project Management AI",
    durationMinutes: 75,
    price: 0,
    level: "intermediate",
    sortOrder: 9,
    lessons: [
      { title: "Siklus Hidup Proyek Konstruksi", slug: "siklus-hidup-proyek", type: "article", durationMinutes: 7, isPreview: true, content: `# Siklus Hidup Proyek Konstruksi\n\nSetiap proyek konstruksi melewati 5 fase utama:\n\n## Fase 1: Inisiasi\n- Identifikasi kebutuhan dan tujuan proyek\n- Studi kelayakan awal\n- Pembentukan tim inti\n\n## Fase 2: Perencanaan\n- Desain dan gambar teknis\n- RAB (Rencana Anggaran Biaya)\n- Jadwal Pelaksanaan (S-Curve, Gantt Chart)\n- RK3K (Rencana Keselamatan Konstruksi)\n\n## Fase 3: Pelaksanaan\n- Mobilisasi material dan alat\n- Konstruksi sesuai gambar dan spesifikasi\n- Pengawasan kualitas dan keselamatan\n\n## Fase 4: Pengendalian\n- Monitoring progres vs jadwal\n- Pengendalian biaya vs anggaran\n- Inspeksi mutu dan tindakan korektif\n\n## Fase 5: Penutupan\n- Uji fungsi dan commissioning\n- Serah terima (PHO dan FHO)\n- As-built documentation\n- Garansi dan masa pemeliharaan` },
      { title: "Perencanaan Jadwal & S-Curve", slug: "jadwal-s-curve", type: "article", durationMinutes: 12, content: `# Perencanaan Jadwal & S-Curve\n\n## Master Schedule\n\nDokumen jadwal utama yang menampilkan semua pekerjaan dari awal hingga selesai.\n\n### Komponen Master Schedule\n- **Work Breakdown Structure (WBS)** — Daftar terstruktur semua pekerjaan\n- **Durasi setiap aktivitas** — Dalam hari atau minggu\n- **Ketergantungan antar aktivitas** — Mana yang harus selesai dulu\n- **Jalur Kritis (Critical Path)** — Rangkaian aktivitas yang menentukan durasi total\n\n## S-Curve (Kurva S)\n\nS-Curve menunjukkan akumulasi progres (%) terhadap waktu.\n\n### Cara Membaca S-Curve\n- Sumbu X = Waktu (minggu/bulan)\n- Sumbu Y = Progres kumulatif (%)\n- **Kurva Rencana** vs **Kurva Aktual** — Selisih = deviasi\n\n### Deviasi > 5%\n- Laporkan ke PPK\n- Analisis penyebab\n- Susun Rencana Percepatan (Recovery Plan)\n\n## Earned Value Management (EVM)\n\n| Indikator | Formula | Arti |\n|-----------|---------|------|\n| **SPI** | EV/PV | Schedule Performance Index |\n| **CPI** | EV/AC | Cost Performance Index |\n| SPI < 1 | — | Proyek terlambat |\n| CPI < 1 | — | Proyek over budget |` },
      { title: "Pengendalian Mutu Lapangan", slug: "pengendalian-mutu-lapangan", type: "article", durationMinutes: 12, content: `# Pengendalian Mutu Lapangan\n\n## Inspection Test Plan (ITP)\n\nITP adalah dokumen yang menetapkan apa yang harus diinspeksi, kapan, oleh siapa, dan dengan standar apa.\n\n### Format ITP\n\n| No | Aktivitas | Standar | Metode | PIC | Frekuensi |\n|----|-----------|---------|--------|-----|----------|\n| 1 | Pekerjaan beton | SNI 03-2847 | Slump test + uji tekan | QC | Per batch |\n| 2 | Pekerjaan baja | AISC/SNI | Visual + NDT | QC | 100% |\n\n## Material Approval\n\nSebelum material dipasang:\n1. Submit material sample + data sheet\n2. Review oleh engineer\n3. Approval tertulis\n4. Simpan bukti approval sebagai rekaman\n\n## Non-Conformance Report (NCR)\n\nJika ditemukan pekerjaan tidak sesuai:\n1. Buat NCR — deskripsikan ketidaksesuaian\n2. Tentukan tindakan korektif\n3. Perbaiki dan verifikasi\n4. Tutup NCR setelah OK` },
      { title: "Serah Terima Proyek (PHO & FHO)", slug: "serah-terima-pho-fho", type: "article", durationMinutes: 10, content: `# Serah Terima Proyek\n\n## PHO — Provisional Hand Over\n\nSerah terima pertama setelah konstruksi selesai secara fisik.\n\n### Persyaratan PHO\n- Progres fisik minimal 100%\n- Semua NCR sudah ditutup\n- Uji fungsi sistem MEP berhasil\n- As-built drawing sudah diserahkan\n- Manual O&M sudah diserahkan\n\n### Prosedur PHO\n1. Kontraktor mengajukan permohonan PHO tertulis\n2. PPK membentuk Panitia Serah Terima\n3. Pemeriksaan lapangan bersama\n4. Berita Acara PHO ditandatangani\n5. Masa Pemeliharaan dimulai\n\n## FHO — Final Hand Over\n\nSerah terima kedua setelah Masa Pemeliharaan selesai.\n\n### Masa Pemeliharaan\n- Umum: 6 bulan setelah PHO\n- Konstruksi besar: 12 bulan\n- Selama masa ini, kontraktor wajib perbaiki semua cacat\n\n### Retensi\n5% dari nilai kontrak ditahan sampai FHO. Bisa diganti dengan Jaminan Pemeliharaan.` },
    ],
  },

  // === BIM ===
  {
    title: "Pengantar BIM — Building Information Modelling",
    slug: "pengantar-bim-konstruksi",
    shortDesc: "Kuasai dasar-dasar BIM dan transformasi digital di industri konstruksi Indonesia.",
    description: "Kursus pengantar BIM: memahami konsep dan manfaat BIM, standar internasional (ISO 19650), BIM Execution Plan, peran tim BIM, dan roadmap adopsi BIM di perusahaan konstruksi.",
    category: "konstruksi",
    subcategory: "BIM",
    color: "#3b82f6",
    emoji: "🏛️",
    instructor: "BIM AI Coach",
    durationMinutes: 55,
    price: 0,
    level: "beginner",
    sortOrder: 10,
    lessons: [
      { title: "Apa itu BIM?", slug: "apa-itu-bim", type: "article", durationMinutes: 8, isPreview: true, content: `# Apa itu BIM?\n\nBuilding Information Modelling (BIM) adalah pendekatan proses berbasis data digital untuk manajemen informasi bangunan sepanjang siklus hidupnya.\n\n## BIM Bukan Sekadar Software 3D\n\nBIM adalah:\n- **Proses** — Cara bekerja yang berbeda, kolaboratif\n- **Data** — Informasi terstruktur tentang setiap elemen bangunan\n- **Kolaborasi** — Semua pihak bekerja di model yang sama\n\nBIM **bukan** hanya software CAD 3D. Model BIM mengandung data (dimensi, material, biaya, jadwal, dll).\n\n## Level BIM\n\n| Level | Deskripsi |\n|-------|----------|\n| Level 0 | CAD 2D, tidak ada kolaborasi |\n| Level 1 | CAD 3D terisolasi |\n| Level 2 | Kolaborasi model terpisah per disiplin |\n| Level 3 | Model tunggal bersama (Open BIM) |\n\n## Manfaat BIM\n\n- Deteksi clash (benturan) antar disiplin sebelum konstruksi\n- Estimasi biaya otomatis dari model (5D BIM)\n- Simulasi jadwal (4D BIM)\n- Operasi dan pemeliharaan (6D BIM / Facility Management)\n- Reduksi rework hingga 30-40%` },
      { title: "Dimensi BIM: 3D hingga 7D", slug: "dimensi-bim", type: "article", durationMinutes: 10, content: `# Dimensi BIM: 3D hingga 7D\n\nBIM tidak hanya tentang geometri 3D. Informasi tambahan ditambahkan sebagai "dimensi" ekstra.\n\n## 3D — Geometri & Visualisasi\nModel 3D dasar: dinding, kolom, balok, MEP, dll.\n\n## 4D — Jadwal (Schedule)\nModel + informasi waktu = simulasi proses konstruksi. Lihat urutan pembangunan secara visual.\n\n## 5D — Biaya (Cost)\nModel + schedule + biaya = estimasi otomatis dari quantity take-off.\n\n## 6D — Keberlanjutan (Sustainability)\nAnalisis energi, simulasi daylighting, LEED/Greenship scoring.\n\n## 7D — Facility Management\nInformasi aset untuk operasi dan pemeliharaan gedung sepanjang umur hidupnya.\n\n## Software BIM Populer\n\n| Software | Vendor | Keunggulan |\n|----------|--------|------------|\n| Revit | Autodesk | Arsitektur & Struktur |\n| ArchiCAD | Graphisoft | Desain arsitektur |\n| Tekla | Trimble | Struktur baja & beton |\n| Navisworks | Autodesk | Clash detection |\n| OpenBIM tools | berbagai | Interoperabilitas |` },
      { title: "BIM di Proyek Konstruksi Indonesia", slug: "bim-indonesia", type: "article", durationMinutes: 12, content: `# BIM di Proyek Konstruksi Indonesia\n\n## Regulasi BIM di Indonesia\n\n- **Permen PUPR No. 22/2018** — Pembangunan Bangunan Gedung Negara, mewajibkan BIM untuk gedung negara > 2000 m²\n- **Surat Edaran PUPR** — Percepatan adopsi BIM di proyek infrastruktur\n- **SIBIMA** — Sistem Informasi Bangunan Indonesia berbasis BIM\n\n## Persyaratan BIM di Tender Pemerintah\n\nSemakin banyak tender pemerintah, terutama proyek infrastruktur besar, yang mensyaratkan:\n- BIM Execution Plan (BEP)\n- Personel bersertifikat BIM\n- Model BIM sebagai bagian deliverable\n\n## Roadmap Adopsi BIM di Perusahaan\n\n### Tahap 1: Edukasi (0-6 bulan)\n- Pelatihan tim inti (3-5 orang)\n- Pilih software dan standar\n\n### Tahap 2: Pilot Project (6-12 bulan)\n- Pilih 1 proyek sebagai pilot\n- Kembangkan template dan standar internal\n\n### Tahap 3: Scaling (12-24 bulan)\n- Roll-out ke seluruh proyek\n- Evaluasi dan penyesuaian\n\n## Sertifikasi BIM\n\nSKK BIM untuk tenaga ahli konstruksi tersedia di beberapa LSP terakreditasi BNSP.` },
    ],
  },

  // === LEGALITAS TAMBAHAN ===
  {
    title: "Keuangan & Perpajakan untuk BUJK",
    slug: "keuangan-perpajakan-bujk",
    shortDesc: "Kelola keuangan proyek dan kewajiban pajak BUJK secara benar dan efisien.",
    description: "Pelajari dasar-dasar manajemen keuangan proyek konstruksi: cash flow, retensi, jaminan, serta kewajiban perpajakan BUJK termasuk PPh 23, PPN jasa konstruksi, dan SPT tahunan.",
    category: "legalitas",
    subcategory: "Keuangan & Pajak",
    color: "#84cc16",
    emoji: "💰",
    instructor: "Keuangan AI",
    durationMinutes: 60,
    price: 0,
    level: "beginner",
    sortOrder: 11,
    lessons: [
      { title: "Cash Flow Proyek Konstruksi", slug: "cashflow-proyek", type: "article", durationMinutes: 8, isPreview: true, content: `# Cash Flow Proyek Konstruksi\n\nCash flow adalah aliran masuk dan keluar uang dalam proyek. Mengelola cash flow yang buruk adalah penyebab utama kegagalan kontraktor.\n\n## Pola Cash Flow Konstruksi\n\nKonstruksi biasanya punya pola **negative cash flow** di awal:\n- Kontraktor bayar material, upah, dan alat dulu\n- Pembayaran dari owner baru datang setelah progres tertentu\n- Gap ini harus ditutup dengan modal kerja atau kredit\n\n## Sumber Pembiayaan Proyek\n\n1. **Uang Muka (DP)** — 10-20% dari nilai kontrak, dibayar di awal\n2. **Termin** — Pembayaran bertahap sesuai progres (biasanya per 25%)\n3. **Retensi** — 5% ditahan sampai FHO\n\n## Tips Mengelola Cash Flow\n\n- Negotiasi uang muka sebesar mungkin\n- Dorong pembayaran termin segera setelah progres tercapai\n- Jangan overstock material — beli sesuai kebutuhan mingguan\n- Siapkan fasilitas kredit modal kerja di bank` },
      { title: "Perpajakan Jasa Konstruksi", slug: "perpajakan-jasa-konstruksi", type: "article", durationMinutes: 12, content: `# Perpajakan Jasa Konstruksi\n\n## Jenis Pajak BUJK\n\n### PPh Final Jasa Konstruksi\nBerdasarkan PP 9/2022, penghasilan dari jasa konstruksi dikenakan PPh Final:\n\n| Jenis Usaha | Tarif PPh Final |\n|-------------|------------------|\n| Pelaksana Konstruksi (kualifikasi kecil) | 1.75% |\n| Pelaksana Konstruksi (kualifikasi menengah/besar) | 2.65% |\n| Pelaksana Konstruksi (tidak bersertifikat) | 4% |\n| Perencana/Pengawas (bersertifikat) | 3.5% |\n| Perencana/Pengawas (tidak bersertifikat) | 6% |\n\n### PPN Jasa Konstruksi\n- PPN 11% berlaku untuk jasa konstruksi\n- Faktur Pajak harus diterbitkan saat penagihan\n\n### PPh 23 (jika menjadi subkontraktor)\n- 2% dari nilai bruto jika penerima ber-NPWP\n- 4% jika tidak ber-NPWP\n\n## Kewajiban Bulanan\n\n- SPT Masa PPN — setiap bulan\n- SPT Masa PPh — sesuai jenis PPh\n\n## Kewajiban Tahunan\n\n- SPT Tahunan PPh Badan — akhir April\n- Laporan Keuangan — untuk kebutuhan bank dan tender` },
      { title: "Jaminan Kontrak Konstruksi", slug: "jaminan-kontrak-konstruksi", type: "article", durationMinutes: 10, content: `# Jaminan Kontrak Konstruksi\n\nJaminan (surety bond atau bank garansi) adalah instrumen keuangan yang melindungi pemilik proyek dari wanprestasi kontraktor.\n\n## Jenis Jaminan\n\n### 1. Jaminan Penawaran (Bid Bond)\n- Nilai: 1-3% dari nilai penawaran\n- Tujuan: Memastikan pemenang lelang tidak mengundurkan diri\n- Berlaku: Selama proses lelang\n\n### 2. Jaminan Pelaksanaan (Performance Bond)\n- Nilai: 5% dari nilai kontrak\n- Tujuan: Memastikan kontraktor selesaikan pekerjaan\n- Berlaku: Sampai PHO\n\n### 3. Jaminan Uang Muka\n- Nilai: Sama dengan uang muka yang diterima\n- Tujuan: Keamanan uang muka pemilik proyek\n- Berlaku: Sampai uang muka terpotong habis\n\n### 4. Jaminan Pemeliharaan\n- Nilai: 5% dari nilai kontrak\n- Tujuan: Jaminan perbaikan cacat selama masa pemeliharaan\n- Bisa mengganti retensi\n\n## Penerbit Jaminan\n- Bank Umum\n- Perusahaan Asuransi yang terdaftar di OJK\n- Perusahaan Surety Bond` },
    ],
  },

  // === PENGAWASAN KONSTRUKSI ===
  {
    title: "Pengawasan Konstruksi Profesional",
    slug: "pengawasan-konstruksi-profesional",
    shortDesc: "Teknik pengawasan konstruksi yang efektif — lapangan, mutu, biaya, dan dokumentasi.",
    description: "Kursus untuk konsultan pengawas dan owner representative: teknik inspeksi lapangan, pengendalian mutu pekerjaan, manajemen RFI, shop drawing review, dan pelaporan progres yang efektif.",
    category: "konstruksi",
    subcategory: "Pengawasan",
    color: "#ec4899",
    emoji: "🔍",
    instructor: "Pengawas AI",
    durationMinutes: 65,
    price: 0,
    level: "intermediate",
    sortOrder: 12,
    lessons: [
      { title: "Peran dan Tanggung Jawab Pengawas", slug: "peran-pengawas-konstruksi", type: "article", durationMinutes: 7, isPreview: true, content: `# Peran dan Tanggung Jawab Pengawas Konstruksi\n\n## Siapa Pengawas Konstruksi?\n\nPengawas Konstruksi (Konsultan Pengawas / MK) adalah pihak yang bertindak atas nama pemilik proyek untuk memastikan pekerjaan dilaksanakan sesuai kontrak.\n\n## Jenis Pengawas\n\n| Jenis | Keterangan |\n|-------|------------|\n| **Konsultan Pengawas** | Perusahaan konsultansi pengawasan |\n| **Manajemen Konstruksi (MK)** | Lebih luas — dari desain sampai serah terima |\n| **Owner Representative** | Staf owner yang ditugaskan mengawasi |\n| **Pengawas Internal** | Kontraktor mengawasi sub-kontraktornya |\n\n## Tanggung Jawab Utama\n\n1. **Quality Control** — Memastikan pekerjaan sesuai spesifikasi\n2. **Schedule Monitoring** — Memantau progres vs jadwal\n3. **Cost Control** — Mengontrol biaya vs anggaran\n4. **Safety Oversight** — Memastikan K3 diterapkan\n5. **Documentation** — Merekam semua kejadian di lapangan\n6. **RFI Management** — Merespons permintaan informasi kontraktor` },
      { title: "Inspeksi Lapangan & Dokumentasi", slug: "inspeksi-lapangan-dokumentasi", type: "article", durationMinutes: 12, content: `# Inspeksi Lapangan & Dokumentasi\n\n## Daily Site Inspection\n\nPengawas harus hadir setiap hari kerja dan mendokumentasikan:\n- Cuaca\n- Jumlah pekerja per disiplin\n- Alat berat beroperasi\n- Material yang datang\n- Pekerjaan yang dilaksanakan\n- Kejadian khusus (kecelakaan, keterlambatan material, dll)\n\n## Site Instruction (SI)\n\nPerintah tertulis pengawas kepada kontraktor untuk:\n- Melakukan pekerjaan tambah\n- Mengubah metode pelaksanaan\n- Menghentikan pekerjaan yang tidak sesuai\n\nSemua SI harus ditandatangani kedua pihak.\n\n## RFI — Request for Information\n\nKontraktor mengajukan RFI ketika ada ambiguitas di gambar atau spesifikasi.\n- Pengawas wajib merespons dalam 7-14 hari kerja\n- Jawaban RFI bisa mempengaruhi harga (klaim)\n- Catat semua RFI dalam RFI Log\n\n## Shop Drawing Review\n\nKontraktor submit shop drawing (gambar pelaksanaan detail) → Pengawas review → Approved/Rejected/Revise.\n\nJangan mulai pekerjaan sebelum shop drawing diapprove.` },
      { title: "Laporan Progres & Pelaporan", slug: "laporan-progres-pelaporan", type: "article", durationMinutes: 10, content: `# Laporan Progres & Pelaporan\n\n## Jenis Laporan\n\n### Laporan Harian\n- Isi: Aktivitas, cuaca, personel, alat, material, kejadian\n- Frekuensi: Setiap hari kerja\n- Dibuat: Kontraktor + dikonfirmasi pengawas\n\n### Laporan Mingguan\n- Isi: Rangkuman kemajuan, deviasi jadwal, isu yang perlu diselesaikan\n- Frekuensi: Setiap minggu\n- Distribusi: Tim proyek + PPK\n\n### Laporan Bulanan\n- Isi: Progres kumulatif, S-curve aktual vs rencana, keuangan, foto progres\n- Frekuensi: Bulanan\n- Distribusi: Manajemen + PPK + owner\n\n## Foto Dokumentasi\n\nFoto adalah bukti paling kuat. Standar foto dokumentasi:\n- **Before** — Sebelum pekerjaan dimulai\n- **During** — Saat pekerjaan berlangsung (termasuk yang tertutup)\n- **After** — Setelah pekerjaan selesai\n\nBeri metadata: tanggal, lokasi, deskripsi pekerjaan.\n\n## Rapat Mingguan (Site Meeting)\n\nForum koordinasi rutin antara kontraktor, pengawas, dan pemilik proyek:\n- Bahas progres minggu lalu\n- Rencanakan minggu depan\n- Selesaikan isu yang tertunda\n- Catat dalam Notulen yang ditandatangani semua pihak` },
    ],
  },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────
// Reconcile-per-slug: never early-return based on row count alone.
// This ensures new courses added to SEED_COURSES are inserted even when
// the table already has older courses from a previous boot.
async function seedLmsData() {
  try {
    let added = 0;
    for (const courseData of SEED_COURSES) {
      const { lessons, ...course } = courseData;

      // Skip if this slug already exists
      const [existing] = await db.select({ id: lmsCourses.id })
        .from(lmsCourses)
        .where(eq(lmsCourses.slug, course.slug))
        .limit(1);
      if (existing) continue;

      const [created] = await db.insert(lmsCourses).values({
        title: course.title,
        slug: course.slug,
        shortDesc: course.shortDesc,
        description: course.description,
        category: course.category,
        subcategory: course.subcategory,
        color: course.color,
        emoji: course.emoji,
        instructor: course.instructor,
        durationMinutes: course.durationMinutes,
        price: course.price,
        level: course.level,
        isFeatured: course.isFeatured ?? false,
        sortOrder: course.sortOrder,
        isPublic: true,
        isActive: true,
      }).returning();

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        await db.insert(lmsLessons).values({
          courseId: created.id,
          title: lesson.title,
          slug: lesson.slug,
          content: lesson.content,
          type: lesson.type,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview ?? false,
          sortOrder: i + 1,
          isActive: true,
        });
      }
      added++;
    }
    if (added > 0) {
      console.log(`[LMS] Seed selesai — ${added} kursus baru ditambahkan (total target: ${SEED_COURSES.length}).`);
    }
  } catch (e) {
    console.error("[LMS] Seed error:", e);
  }
}

// ─── Route registration ───────────────────────────────────────────────────────
export function registerLmsRoutes(app: Express) {
  seedLmsData();

  // GET /api/lms/courses — list all public courses (optionally filter by category)
  app.get("/api/lms/courses", async (req, res) => {
    try {
      const { category } = req.query as { category?: string };
      let rows;
      if (category && category !== "all") {
        rows = await db.select().from(lmsCourses)
          .where(and(eq(lmsCourses.isActive, true), eq(lmsCourses.isPublic, true), eq(lmsCourses.category, category)))
          .orderBy(asc(lmsCourses.sortOrder));
      } else {
        rows = await db.select().from(lmsCourses)
          .where(and(eq(lmsCourses.isActive, true), eq(lmsCourses.isPublic, true)))
          .orderBy(asc(lmsCourses.sortOrder));
      }
      // Attach lesson count
      const withCounts = await Promise.all(rows.map(async (c) => {
        const lessons = await db.select().from(lmsLessons)
          .where(and(eq(lmsLessons.courseId, c.id), eq(lmsLessons.isActive, true)));
        return { ...c, lessonCount: lessons.length };
      }));
      res.json(withCounts);
    } catch (e) {
      console.error("[LMS] GET courses:", e);
      res.status(500).json({ error: "Gagal mengambil kursus" });
    }
  });

  // GET /api/lms/courses/:id — course detail + lessons
  app.get("/api/lms/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, id));
      if (!course) return res.status(404).json({ error: "Kursus tidak ditemukan" });
      const lessons = await db.select().from(lmsLessons)
        .where(and(eq(lmsLessons.courseId, id), eq(lmsLessons.isActive, true)))
        .orderBy(asc(lmsLessons.sortOrder));
      res.json({ ...course, lessons });
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil detail kursus" });
    }
  });

  // GET /api/lms/lessons/:id — single lesson (check enrollment or preview)
  app.get("/api/lms/lessons/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const [lesson] = await db.select().from(lmsLessons).where(eq(lmsLessons.id, id));
      if (!lesson) return res.status(404).json({ error: "Lesson tidak ditemukan" });

      const userId = req.user?.id;
      // If not preview, check enrollment
      if (!lesson.isPreview && !userId) {
        return res.status(403).json({ error: "Harus login untuk mengakses lesson ini", requireLogin: true });
      }
      if (!lesson.isPreview && userId) {
        const [enrollment] = await db.select().from(lmsEnrollments)
          .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, lesson.courseId)));
        // For free courses (price=0) auto-enroll
        const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, lesson.courseId));
        if (!enrollment && course?.price === 0) {
          await db.insert(lmsEnrollments).values({ userId, courseId: lesson.courseId, progress: 0 });
        } else if (!enrollment) {
          return res.status(403).json({ error: "Harus terdaftar di kursus ini", requireEnrollment: true });
        }
      }
      res.json(lesson);
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil lesson" });
    }
  });

  // POST /api/lms/enroll/:courseId — enroll in a course
  app.post("/api/lms/enroll/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      const [existing] = await db.select().from(lmsEnrollments)
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));
      if (existing) return res.json(existing);
      const [enrollment] = await db.insert(lmsEnrollments)
        .values({ userId, courseId, progress: 0 }).returning();
      res.json(enrollment);
    } catch (e) {
      res.status(500).json({ error: "Gagal mendaftar kursus" });
    }
  });

  // POST /api/lms/progress — mark lesson as complete
  app.post("/api/lms/progress", isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId, courseId } = req.body;
      const userId = req.user.id;

      // Upsert progress
      const [existing] = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.lessonId, lessonId)));
      if (!existing) {
        await db.insert(lmsLessonProgress).values({ userId, courseId, lessonId });
      }

      // Recalculate course progress
      const allLessons = await db.select().from(lmsLessons)
        .where(and(eq(lmsLessons.courseId, courseId), eq(lmsLessons.isActive, true)));
      const completedLessons = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, courseId)));
      const progress = Math.round((completedLessons.length / allLessons.length) * 100);

      await db.update(lmsEnrollments)
        .set({ progress, completedAt: progress === 100 ? new Date() : null })
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));

      res.json({ progress, completed: completedLessons.map(l => l.lessonId) });
    } catch (e) {
      res.status(500).json({ error: "Gagal update progress" });
    }
  });

  // GET /api/lms/my-courses — enrolled courses with progress
  app.get("/api/lms/my-courses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const enrollments = await db.select().from(lmsEnrollments)
        .where(eq(lmsEnrollments.userId, userId));
      const results = await Promise.all(enrollments.map(async (e) => {
        const [course] = await db.select().from(lmsCourses).where(eq(lmsCourses.id, e.courseId));
        const completed = await db.select().from(lmsLessonProgress)
          .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, e.courseId)));
        return { ...e, course, completedLessons: completed.map(l => l.lessonId) };
      }));
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil kursus saya" });
    }
  });

  // GET /api/lms/progress/:courseId — get my progress for a specific course
  app.get("/api/lms/progress/:courseId", isAuthenticated, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      const [enrollment] = await db.select().from(lmsEnrollments)
        .where(and(eq(lmsEnrollments.userId, userId), eq(lmsEnrollments.courseId, courseId)));
      const completed = await db.select().from(lmsLessonProgress)
        .where(and(eq(lmsLessonProgress.userId, userId), eq(lmsLessonProgress.courseId, courseId)));
      res.json({
        enrolled: !!enrollment,
        progress: enrollment?.progress ?? 0,
        completedLessons: completed.map(l => l.lessonId),
        completedAt: enrollment?.completedAt ?? null,
      });
    } catch (e) {
      res.status(500).json({ error: "Gagal mengambil progress" });
    }
  });

  // GET /api/lms/ecourses — public orchestrator agents grouped by category, usable as ecourses
  app.get("/api/lms/ecourses", async (req, res) => {
    try {
      const { category } = req.query as { category?: string };
      let extra = "";
      if (category && category !== "all") {
        const safe = category.replace(/'/g, "''");
        extra = ` AND lower(a.category) = lower('${safe}')`;
      }
      const rows = await db.execute(sql.raw(`
        SELECT
          a.id,
          a.name,
          a.description,
          a.tagline,
          a.avatar,
          a.category,
          a.subcategory,
          a.widget_color,
          (SELECT COUNT(*)::int FROM knowledge_bases kb WHERE kb.agent_id = a.id AND kb.status = 'active') AS kb_count
        FROM agents a
        WHERE a.is_public = true
          AND a.is_orchestrator = true
          AND a.category IS NOT NULL AND a.category != ''
          AND (a.description IS NOT NULL AND length(a.description) > 20)
          ${extra}
        ORDER BY a.category ASC, a.id ASC
        LIMIT 200
      `));
      res.json(rows.rows ?? rows);
    } catch (e) {
      console.error("[LMS] GET ecourses:", e);
      res.status(500).json({ error: "Gagal mengambil ecourse" });
    }
  });
}
