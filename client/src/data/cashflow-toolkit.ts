// ─────────────────────────────────────────────────────────────────────────────
// TOOLKIT CASHFLOW-PBJ — data statis untuk 7 alat arus kas proyek pemerintah
// (dari metode buku "Kas Merah, RAB Hijau": Cash Triage, Tracker 7-Titik,
//  Buffer Protocol, Zero-Defect, Friday Review, Red Flags, Surat Generator)
// ─────────────────────────────────────────────────────────────────────────────

// ── T2: Termin Tracker 7-Titik ──────────────────────────────────────────────
export interface TrackerTitik { no: number; nama: string; pemegang: string; batasWajarHari: number; tip: string }
export const TRACKER_7_TITIK: TrackerTitik[] = [
  { no: 1, nama: "Pengajuan Berkas", pemegang: "Kontraktor → PPK", batasWajarHari: 1, tip: "Pastikan zero-defect sebelum diajukan. Minta tanda terima tertulis/foto." },
  { no: 2, nama: "Verifikasi Lapangan", pemegang: "Konsultan pengawas / tim teknis", batasWajarHari: 5, tip: "Dampingi saat cek fisik. Siapkan back-up volume & foto progres." },
  { no: 3, nama: "Verifikasi PPK", pemegang: "PPK", batasWajarHari: 7, tip: "Follow-up sopan tiap 3 hari. Catat setiap jawaban & janji." },
  { no: 4, nama: "Proses Keuangan Dinas", pemegang: "Bendahara / PPK-SKPD", batasWajarHari: 5, tip: "Tanyakan nomor antrean/registrasi. Ini titik berkas sering 'tenggelam'." },
  { no: 5, nama: "Penerbitan SPM", pemegang: "Pejabat Penandatangan SPM", batasWajarHari: 3, tip: "Minta info tanggal SPM terbit — jadi dasar estimasi cair." },
  { no: 6, nama: "Proses KPPN / BUD", pemegang: "KPPN (APBN) / BUD (APBD)", batasWajarHari: 2, tip: "Umumnya cepat jika SPM benar. Kesalahan rekening = pengembalian." },
  { no: 7, nama: "SP2D Cair", pemegang: "Bank → rekening Anda", batasWajarHari: 1, tip: "Begitu cair: sisihkan buffer & pajak DULU, baru bayar kewajiban." },
];

// ── T5: Zero-Defect Checklist ───────────────────────────────────────────────
export interface ZeroDefectItem { id: string; nama: string; detail: string }
export const ZERO_DEFECT_ITEMS: ZeroDefectItem[] = [
  { id: "bast", nama: "BAST / BAPP ditandatangani lengkap", detail: "Semua pihak tanda tangan + stempel; tanggal konsisten dengan laporan progres." },
  { id: "progres", nama: "Laporan progres / MC (Monthly Certificate)", detail: "Persentase fisik sesuai back-up volume, disetujui pengawas." },
  { id: "backup", nama: "Back-up volume & perhitungan", detail: "Hitungan volume per item pekerjaan, ditandatangani pengawas." },
  { id: "foto", nama: "Dokumentasi foto 0% / 50% / 100%", detail: "Titik pengambilan sama, ada penanda lokasi & tanggal." },
  { id: "invoice", nama: "Invoice / kuitansi bermeterai", detail: "Nilai SAMA PERSIS dengan BAST & kontrak. Selisih = alasan penundaan." },
  { id: "faktur", nama: "Faktur pajak / dokumen pajak", detail: "e-Faktur valid, NPWP benar, nilai sesuai invoice." },
  { id: "jaminan", nama: "Jaminan masih berlaku", detail: "Jaminan pelaksanaan/uang muka belum kedaluwarsa saat penagihan." },
  { id: "kontrak", nama: "Referensi kontrak & adendum", detail: "Nomor kontrak, nilai termin sesuai skema pembayaran di kontrak." },
  { id: "rekening", nama: "Data rekening & identitas benar", detail: "Nama rekening = nama badan usaha di kontrak. Salah huruf = SP2D gagal." },
  { id: "laphar", nama: "Laporan harian / mingguan lapangan", detail: "Sering diminta verifikator sebagai pendukung — siapkan sebelum ditanya." },
];

// ── T7: Red Flags Scanner (15 poin klausul kontrak) ─────────────────────────
export interface RedFlag { id: string; klausul: string; bahaya: string; mitigasi: string; bobot: number }
export const RED_FLAGS: RedFlag[] = [
  { id: "bayar-kabur", klausul: "Jangka waktu pembayaran tidak disebut angka harinya", bahaya: "PPK bisa menunda tanpa melanggar kontrak.", mitigasi: "Minta klausul tegas: dibayar maks. X hari kerja setelah dokumen lengkap.", bobot: 3 },
  { id: "syarat-cair", klausul: "Syarat pencairan termin bertele-tele / multi-tafsir", bahaya: "Setiap syarat kabur = alasan sah menahan uang Anda.", mitigasi: "Rinci daftar dokumen syarat cair sebagai lampiran kontrak.", bobot: 3 },
  { id: "pay-when-paid", klausul: "Pay-when-paid di kontrak subkon (dibayar jika owner bayar)", bahaya: "Jika Anda subkon: nasib kas Anda tergantung pihak yang tak bisa Anda tagih.", mitigasi: "Nego jangka waktu tetap + hak menghentikan pekerjaan jika telat.", bobot: 3 },
  { id: "denda-sepihak", klausul: "Denda keterlambatan hanya untuk kontraktor", bahaya: "Anda didenda telat kerja, tapi PPK bebas telat bayar.", mitigasi: "Minta klausul kompensasi/bunga keterlambatan pembayaran (haknya ada di UU 2/2017).", bobot: 2 },
  { id: "uang-muka-nol", klausul: "Tidak ada uang muka padahal proyek butuh mobilisasi besar", bahaya: "Anda talangi penuh — gali lubang sejak hari pertama.", mitigasi: "Ajukan uang muka sesuai ketentuan pengadaan; hitung ulang buffer bila ditolak.", bobot: 2 },
  { id: "retensi-lama", klausul: "Retensi besar / masa pemeliharaan panjang tanpa jadwal jelas", bahaya: "5% nilai kontrak menginap setahun = kas mati.", mitigasi: "Perjelas tanggal FHO & mekanisme pencairan retensi / jaminan pemeliharaan.", bobot: 2 },
  { id: "cco-lisan", klausul: "Perubahan pekerjaan cukup 'persetujuan lisan'", bahaya: "Kerja tambah tidak dibayar karena tak ada bukti tertulis.", mitigasi: "Semua CCO/adendum WAJIB tertulis sebelum dikerjakan.", bobot: 3 },
  { id: "sepihak-putus", klausul: "PPK bisa memutus kontrak sepihak tanpa kewajiban bayar prestasi", bahaya: "Pekerjaan terpasang bisa tidak dibayar.", mitigasi: "Pastikan klausul: pemutusan tetap membayar prestasi yang sudah diakui.", bobot: 3 },
  { id: "force-majeure", klausul: "Force majeure tidak mengatur perpanjangan waktu & biaya", bahaya: "Bencana/kejadian luar biasa jadi risiko Anda sendirian.", mitigasi: "Minta rincian: kejadian apa, dampak waktu, dampak biaya.", bobot: 1 },
  { id: "spesifikasi-kabur", klausul: "Spesifikasi material multi-tafsir ('atau setara')", bahaya: "Verifikator bisa menolak material & menahan BAST.", mitigasi: "Kunci merek/standar yang disepakati secara tertulis sebelum pengadaan.", bobot: 2 },
  { id: "volume-lumpsum", klausul: "Lumpsum tapi gambar/BQ tidak lengkap", bahaya: "Selisih volume jadi beban Anda tanpa bisa klaim.", mitigasi: "Klarifikasi tertulis saat aanwijzing; hitung risiko ke harga penawaran.", bobot: 2 },
  { id: "sanksi-tidak-imbang", klausul: "Nilai denda tidak wajar (>1‰/hari atau tanpa batas maksimal)", bahaya: "Telat sedikit, denda memakan seluruh margin.", mitigasi: "Minta batas maksimal denda (umumnya 5% nilai kontrak).", bobot: 2 },
  { id: "serah-terima-kabur", klausul: "Prosedur & batas waktu pemeriksaan serah terima tidak diatur", bahaya: "PHO digantung berbulan-bulan, termin akhir ikut menggantung.", mitigasi: "Minta batas hari pemeriksaan setelah permohonan PHO diajukan.", bobot: 2 },
  { id: "eskalasi-tanpa", klausul: "Kontrak tahun jamak tanpa penyesuaian harga", bahaya: "Kenaikan harga material memakan kas Anda diam-diam.", mitigasi: "Untuk multi-years, pastikan klausul penyesuaian harga sesuai aturan.", bobot: 1 },
  { id: "dispute-jauh", klausul: "Penyelesaian sengketa langsung ke pengadilan tanpa musyawarah/mediasi", bahaya: "Sengketa kecil jadi mahal dan lama.", mitigasi: "Minta lapisan musyawarah → mediasi → arbitrase/pengadilan.", bobot: 1 },
];

// ── T6: Friday Review — agenda rapat triase 30 menit ────────────────────────
export interface FridayItem { id: string; menit: string; agenda: string; pertanyaan: string }
export const FRIDAY_REVIEW: FridayItem[] = [
  { id: "saldo", menit: "5'", agenda: "Cek posisi kas", pertanyaan: "Saldo hari ini? Runway berapa hari? Buffer masih utuh?" },
  { id: "termin", menit: "5'", agenda: "Cek Termin Tracker", pertanyaan: "Setiap tagihan ada di titik berapa? Ada yang lewat batas wajar?" },
  { id: "kewajiban", menit: "5'", agenda: "Kewajiban 7 hari ke depan", pertanyaan: "Siapa harus dibayar minggu depan? Sudah ada dananya?" },
  { id: "lapangan", menit: "5'", agenda: "Sinkron lapangan", pertanyaan: "Progres fisik mengejar syarat termin berikutnya? Ada subkon/supplier mulai gelisah?" },
  { id: "berkas", menit: "5'", agenda: "Berkas minggu depan", pertanyaan: "Dokumen apa yang harus disiapkan/diperbaiki untuk tagihan berikutnya?" },
  { id: "aksi", menit: "5'", agenda: "Tetapkan 3 aksi", pertanyaan: "3 langkah taktis minggu depan — siapa mengerjakan, selesai kapan?" },
];

// ── T4: Surat Generator — 12 template ───────────────────────────────────────
export interface SuratField { key: string; label: string; placeholder: string; multiline?: boolean }
export interface SuratTemplate { id: string; nama: string; kapan: string; fields: SuratField[]; render: (f: Record<string, string>) => string }

const F = {
  kop: { key: "perusahaan", label: "Nama perusahaan Anda", placeholder: "CV Karya Bangun Sejahtera" },
  kota: { key: "kota", label: "Kota & tanggal surat", placeholder: "Bandung, 14 Agustus 2026" },
  tujuan: { key: "tujuan", label: "Nama & jabatan tujuan", placeholder: "Bpk. .... , PPK Kegiatan ...." },
  instansi: { key: "instansi", label: "Instansi / dinas tujuan", placeholder: "Dinas PUPR Kab. ...." },
  proyek: { key: "proyek", label: "Nama paket pekerjaan", placeholder: "Pembangunan Gedung ...." },
  kontrak: { key: "kontrak", label: "Nomor & tanggal kontrak", placeholder: "No. 027/.../2026 tgl ...." },
  nilai: { key: "nilai", label: "Nilai yang ditagih (Rp)", placeholder: "Rp 500.000.000" },
  termin: { key: "termin", label: "Termin ke- / uraian tagihan", placeholder: "Termin II (progres 55%)" },
  tglTagih: { key: "tglTagih", label: "Tanggal pengajuan tagihan", placeholder: "1 Juli 2026" },
  hari: { key: "hari", label: "Sudah tertunda berapa hari", placeholder: "45 hari" },
  ttd: { key: "ttd", label: "Nama & jabatan penandatangan", placeholder: "...., Direktur" },
};
const kop = (f: Record<string, string>) => `${f.perusahaan || "[NAMA PERUSAHAAN]"}\n${f.kota || "[Kota, tanggal]"}\n\nKepada Yth.\n${f.tujuan || "[Nama & jabatan]"}\n${f.instansi || "[Instansi]"}\ndi tempat\n`;
const ttd = (f: Record<string, string>) => `\nDemikian surat ini kami sampaikan. Atas perhatian dan kerja samanya kami ucapkan terima kasih.\n\nHormat kami,\n${f.perusahaan || "[NAMA PERUSAHAAN]"}\n\n\n${f.ttd || "[Nama, Jabatan]"}`;
const dataProyek = (f: Record<string, string>) => `Paket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl kontrak]"}\nTagihan         : ${f.termin || "[termin]"} — ${f.nilai || "[nilai]"}\nDiajukan tanggal: ${f.tglTagih || "[tanggal pengajuan]"}`;

export const SURAT_TEMPLATES: SuratTemplate[] = [
  {
    id: "info-status", nama: "1. Permohonan Informasi Status Pembayaran", kapan: "Tahap awal — sopan, sekadar menanyakan posisi berkas (H+7 setelah pengajuan).",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, F.termin, F.nilai, F.tglTagih, F.ttd],
    render: f => `${kop(f)}\nPerihal: Permohonan Informasi Status Pembayaran\n\nDengan hormat,\n\nSehubungan dengan tagihan yang telah kami ajukan:\n\n${dataProyek(f)}\n\nDengan ini kami mohon informasi mengenai status proses pembayaran dimaksud, serta dokumen tambahan yang mungkin masih diperlukan agar proses dapat berjalan lancar.\n${ttd(f)}`,
  },
  {
    id: "tagih-1", nama: "2. Surat Penagihan Pertama", kapan: "Tagihan melewati batas wajar tanpa kejelasan — tegas tapi tetap santun.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, F.termin, F.nilai, F.tglTagih, F.hari, F.ttd],
    render: f => `${kop(f)}\nPerihal: Penagihan Pembayaran ${f.termin || "[termin]"}\n\nDengan hormat,\n\nMenunjuk tagihan berikut yang hingga surat ini dibuat belum kami terima pembayarannya (${f.hari || "[...]"} sejak pengajuan):\n\n${dataProyek(f)}\n\nSeluruh prestasi pekerjaan telah diperiksa dan diterima sebagaimana dituangkan dalam Berita Acara, dan kelengkapan dokumen penagihan telah kami penuhi. Sesuai ketentuan kontrak serta peraturan perundang-undangan di bidang jasa konstruksi, penyedia berhak menerima pembayaran atas prestasi yang telah diterima.\n\nUntuk itu kami mohon pembayaran dapat segera diproses, dan mohon kabar tertulis mengenai perkiraan tanggal pembayaran.\n${ttd(f)}`,
  },
  {
    id: "tagih-2", nama: "3. Surat Penagihan Kedua (dengan dasar hukum)", kapan: "Penagihan pertama tidak direspons — cantumkan dasar hukum.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, F.termin, F.nilai, F.tglTagih, F.hari, F.ttd],
    render: f => `${kop(f)}\nPerihal: Penagihan Kedua — Pembayaran ${f.termin || "[termin]"}\n\nDengan hormat,\n\nMenunjuk surat penagihan kami sebelumnya yang hingga kini belum memperoleh penyelesaian (total keterlambatan ${f.hari || "[...]"}), bersama ini kami sampaikan kembali:\n\n${dataProyek(f)}\n\nKami ingatkan dengan hormat bahwa:\n1. Pasal 55 UU No. 2 Tahun 2017 tentang Jasa Konstruksi menjamin hak penyedia jasa untuk menerima pembayaran sesuai prestasi;\n2. Ketentuan pengadaan barang/jasa pemerintah (Perpres No. 46 Tahun 2025) mewajibkan pembayaran diproses setelah dokumen tagihan dinyatakan lengkap;\n3. Keterlambatan pembayaran berdampak langsung pada kewajiban kami kepada tenaga kerja, subkontraktor, dan pemasok pada paket pekerjaan ini.\n\nKami mohon kepastian tertulis tanggal pembayaran selambat-lambatnya 7 (tujuh) hari kerja sejak surat ini diterima.\n${ttd(f)}`,
  },
  {
    id: "somasi", nama: "4. Somasi / Teguran Resmi", kapan: "Jalur persuasif buntu — langkah terakhir sebelum jalur hukum. Disarankan didampingi penasihat hukum.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, F.termin, F.nilai, F.tglTagih, F.hari, F.ttd],
    render: f => `${kop(f)}\nPerihal: SOMASI — Kelalaian Pembayaran Prestasi Pekerjaan\n\nDengan hormat,\n\nBersama ini kami sampaikan somasi atas belum dibayarkannya kewajiban berikut (${f.hari || "[...]"} sejak pengajuan):\n\n${dataProyek(f)}\n\nBahwa seluruh prestasi telah diterima dan dokumen tagihan lengkap, sehingga tidak terdapat alasan yang sah untuk menunda pembayaran, sebagaimana dijamin UU No. 2 Tahun 2017 tentang Jasa Konstruksi dan ketentuan Perpres No. 46 Tahun 2025.\n\nApabila dalam 14 (empat belas) hari kalender sejak diterimanya surat ini pembayaran belum juga dilaksanakan, dengan berat hati kami akan menempuh langkah hukum yang tersedia, termasuk namun tidak terbatas pada pengaduan kepada aparat pengawasan internal pemerintah dan/atau upaya hukum perdata.\n\nSomasi ini kami sampaikan dengan tetap mengedepankan itikad baik untuk penyelesaian secara musyawarah.\n${ttd(f)}`,
  },
  {
    id: "nego-subkon", nama: "5. Permohonan Penjadwalan Ulang ke Subkon/Supplier", kapan: "Kas seret, perlu nego jadwal bayar — jujur dan terikat tanggal.",
    fields: [F.kop, F.kota, { key: "tujuan", label: "Nama subkon/supplier", placeholder: "Toko Bangunan ...." }, F.proyek, { key: "hutang", label: "Nilai kewajiban", placeholder: "Rp 150.000.000" }, { key: "token", label: "Pembayaran sebagian (token) yang sanggup", placeholder: "Rp 30.000.000" }, { key: "tglCair", label: "Perkiraan tanggal termin cair", placeholder: "akhir September 2026" }, F.ttd],
    render: f => `${f.perusahaan || "[NAMA PERUSAHAAN]"}\n${f.kota || "[Kota, tanggal]"}\n\nKepada Yth.\n${f.tujuan || "[Nama mitra]"}\n\nPerihal: Permohonan Penjadwalan Ulang Pembayaran\n\nDengan hormat,\n\nTerkait kewajiban kami sebesar ${f.hutang || "[nilai]"} untuk pekerjaan ${f.proyek || "[paket]"}, kami sampaikan secara terbuka bahwa pembayaran termin dari pemberi kerja sedang mengalami keterlambatan proses di birokrasi.\n\nSebagai bentuk itikad baik, kami sanggup membayar sebagian sebesar ${f.token || "[nilai token]"} pada minggu ini, dan melunasi sisanya selambat-lambatnya 7 hari kerja setelah termin kami cair (perkiraan ${f.tglCair || "[perkiraan]"}), yang akan kami tuangkan dalam kesepakatan tertulis.\n\nKemitraan dengan Bapak/Ibu sangat kami jaga, karena itu kami memilih menyampaikan kondisi ini secara langsung dan tidak menghilang.\n${ttd(f)}`,
  },
  {
    id: "bast-mohon", nama: "6. Permohonan Pemeriksaan & Serah Terima (BAST)", kapan: "Fisik selesai — minta jadwal pemeriksaan agar PHO tidak digantung.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "progres", label: "Progres fisik", placeholder: "100%" }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Permohonan Pemeriksaan Pekerjaan & Serah Terima\n\nDengan hormat,\n\nKami sampaikan bahwa pekerjaan berikut telah mencapai progres ${f.progres || "[..%]"}:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\n\nSehubungan dengan itu, kami mohon dapat dijadwalkan pemeriksaan bersama dalam waktu dekat guna proses serah terima pekerjaan. Kami siap mendampingi tim pemeriksa dan telah menyiapkan seluruh dokumen pendukung (laporan progres, back-up volume, dokumentasi foto, dan as-built drawing).\n${ttd(f)}`,
  },
  {
    id: "klarifikasi-selisih", nama: "7. Klarifikasi Selisih Angka BAST vs Invoice", kapan: "Ada selisih nilai yang menahan proses — luruskan tertulis.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "selisih", label: "Uraian selisih", placeholder: "Nilai BAST Rp 500.000.000, invoice tertulis Rp 500.500.000" }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Klarifikasi & Perbaikan Dokumen Tagihan\n\nDengan hormat,\n\nMenindaklanjuti pemberitahuan mengenai ketidaksesuaian dokumen tagihan pada:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\nUraian          : ${f.selisih || "[uraian selisih]"}\n\nBersama ini kami sampaikan dokumen perbaikan sebagaimana terlampir, dan mohon proses pembayaran dapat dilanjutkan setelah perbaikan ini diterima. Mohon konfirmasi apabila masih terdapat dokumen lain yang perlu disesuaikan.\n${ttd(f)}`,
  },
  {
    id: "perpanjang-jaminan", nama: "8. Pemberitahuan Perpanjangan Jaminan", kapan: "Jaminan mendekati kedaluwarsa (H-14) — cegah alasan penundaan.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "jaminan", label: "Jenis & nomor jaminan", placeholder: "Jaminan Pelaksanaan No. ...." }, { key: "masa", label: "Masa berlaku baru", placeholder: "s.d. 31 Desember 2026" }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Penyampaian Perpanjangan Jaminan\n\nDengan hormat,\n\nDalam rangka menjaga kelancaran pelaksanaan dan pembayaran paket pekerjaan:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\n\nBersama ini kami sampaikan perpanjangan ${f.jaminan || "[jenis & nomor jaminan]"} dengan masa berlaku ${f.masa || "[masa baru]"}, sebagaimana dokumen terlampir.\n${ttd(f)}`,
  },
  {
    id: "cco-tertulis", nama: "9. Permohonan Instruksi Tertulis (CCO/Pekerjaan Tambah)", kapan: "Diminta kerja tambah secara lisan — amankan bukti tertulis SEBELUM dikerjakan.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "perubahan", label: "Uraian perubahan yang diminta", placeholder: "Penambahan volume pekerjaan ...." }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Permohonan Instruksi Tertulis atas Perubahan Pekerjaan\n\nDengan hormat,\n\nMenindaklanjuti arahan yang kami terima terkait perubahan pekerjaan pada:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\nUraian perubahan: ${f.perubahan || "[uraian]"}\n\nAgar perubahan tersebut memiliki dasar pelaksanaan dan pembayaran yang sah, kami mohon berkenan menerbitkan instruksi tertulis/adendum sebelum pekerjaan dimaksud kami laksanakan, termasuk kesepakatan mengenai dampak biaya dan waktu.\n${ttd(f)}`,
  },
  {
    id: "keterlambatan-nonkontraktor", nama: "10. Pemberitahuan Kendala di Luar Kendali (Perpanjangan Waktu)", kapan: "Ada kendala eksternal (cuaca, lahan, pasokan) — dokumentasikan agar tidak kena denda.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "kendala", label: "Uraian kendala & buktinya", placeholder: "Hujan ekstrem 10 hari (data BMKG terlampir)" }, { key: "dampak", label: "Dampak waktu yang dimohon", placeholder: "perpanjangan 14 hari kalender" }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Pemberitahuan Kendala Pelaksanaan & Permohonan Perpanjangan Waktu\n\nDengan hormat,\n\nKami sampaikan bahwa pelaksanaan paket pekerjaan:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\n\nmengalami kendala di luar kendali kami, yaitu: ${f.kendala || "[uraian kendala]"}.\n\nSehubungan dengan itu kami mohon dapat dipertimbangkan ${f.dampak || "[dampak waktu]"}, dengan bukti pendukung sebagaimana terlampir. Kami tetap berkomitmen menyelesaikan pekerjaan dengan mutu sesuai kontrak.\n${ttd(f)}`,
  },
  {
    id: "retensi", nama: "11. Permohonan Pencairan Retensi / Jaminan Pemeliharaan", kapan: "Masa pemeliharaan selesai (FHO) — jangan biarkan 5% menginap.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, F.kontrak, { key: "fho", label: "Tanggal selesai masa pemeliharaan", placeholder: "30 Juni 2026" }, { key: "retensi", label: "Nilai retensi", placeholder: "Rp 250.000.000" }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Permohonan Pencairan Retensi\n\nDengan hormat,\n\nSehubungan dengan telah berakhirnya masa pemeliharaan pada ${f.fho || "[tanggal]"} untuk:\n\nPaket Pekerjaan : ${f.proyek || "[nama paket]"}\nKontrak         : ${f.kontrak || "[no & tgl]"}\n\nkami mohon dapat dijadwalkan pemeriksaan akhir (FHO) serta diproses pencairan retensi sebesar ${f.retensi || "[nilai]"}. Seluruh kewajiban perbaikan selama masa pemeliharaan telah kami selesaikan sebagaimana dokumentasi terlampir.\n${ttd(f)}`,
  },
  {
    id: "audit-jejak", nama: "12. Konfirmasi Hasil Pertemuan (Jejak Tertulis)", kapan: "Setelah rapat/telepon penting — kunci janji lisan jadi catatan tertulis.",
    fields: [F.kop, F.kota, F.tujuan, F.instansi, F.proyek, { key: "pertemuan", label: "Tanggal & bentuk komunikasi", placeholder: "rapat 12 Agustus 2026 / telepon" }, { key: "hasil", label: "Poin kesepakatan yang ingin dikunci", placeholder: "Pembayaran termin II diproses paling lambat ....", multiline: true }, F.ttd],
    render: f => `${kop(f)}\nPerihal: Konfirmasi Hasil Pembicaraan\n\nDengan hormat,\n\nMenindaklanjuti ${f.pertemuan || "[tanggal & bentuk komunikasi]"} mengenai paket pekerjaan ${f.proyek || "[nama paket]"}, bersama ini kami konfirmasikan pemahaman kami atas hal-hal berikut:\n\n${f.hasil || "[poin-poin kesepakatan]"}\n\nApabila terdapat perbedaan pemahaman, mohon koreksi secara tertulis dalam 3 (tiga) hari kerja. Tanpa koreksi, kami akan berpedoman pada poin-poin di atas.\n${ttd(f)}`,
  },
];

// ── T3: Buffer Calculator konstanta ─────────────────────────────────────────
export const BUFFER_TARGETS = { APBN: { min: 10, max: 15 }, APBD: { min: 15, max: 20 } } as const;

// ── T1: Cash Triage — kuadran ───────────────────────────────────────────────
export interface TriageQuadrant { key: string; label: string; warna: string; contoh: string; aksi: string }
export const TRIAGE_QUADRANTS: TriageQuadrant[] = [
  { key: "kritis", label: "KRITIS — bayar duluan", warna: "red", contoh: "Gaji tukang, material penentu progres termin, kewajiban berisiko pidana/aset", aksi: "Bayar minggu ini, jangan ditawar." },
  { key: "nego", label: "PENTING — bisa dinego", warna: "amber", contoh: "Subkon & supplier langganan, cicilan alat", aksi: "Nego jadwal + token payment terikat tanggal cair termin." },
  { key: "jadwal", label: "BISA DIJADWAL", warna: "blue", contoh: "Tagihan tidak mendesak, kewajiban tanpa denda berjalan", aksi: "Jadwalkan setelah termin cair; beri tahu tanggalnya." },
  { key: "tunda", label: "TUNDA DULU", warna: "slate", contoh: "Pengeluaran non-proyek, pembelian yang bisa menunggu", aksi: "Bekukan sampai status kas kembali 🟢." },
];
