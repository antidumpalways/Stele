# STELE: Demo Video Script
### Panduan Lengkap Pembuatan Video Demo Hackathon

---

## Info Umum

| | |
|---|---|
| **Target durasi** | 2 menit 30 detik (maks 3 menit) |
| **Format** | Screen recording + voice-over |
| **Tone suara** | Tenang, tegas, berwibawa. Bukan salesy. Seperti menjelaskan sesuatu yang sudah terbukti. |
| **Bahasa** | Bahasa Inggris (untuk juri) |
| **Tools yang disarankan** | OBS / Loom untuk rekam layar, Descript / CapCut untuk editing + VO |

---

## Urutan Scene

```
Scene 01 — Hook / Problem Statement        (0:00 - 0:20)  20 detik
Scene 02 — Landing Page                    (0:20 - 0:40)  20 detik
Scene 03 — The Feed (Browse)               (0:40 - 1:00)  20 detik
Scene 04 — Inspect and Verify              (1:00 - 1:20)  20 detik
Scene 05 — Publish: Upload + ELA + AI Fill (1:20 - 1:55)  35 detik
Scene 06 — World ID Verification           (1:55 - 2:15)  20 detik
Scene 07 — Vouch and Flag                  (2:15 - 2:30)  15 detik
Scene 08 — Network Page + Chain Explorer   (2:30 - 2:45)  15 detik
Scene 09 — Closing                         (2:45 - 3:00)  15 detik
```

---

## Scene 01: Hook / Problem Statement
**Durasi: 0:00 - 0:20**
**Tampilan: Layar hitam atau foto/footage viral news yang diragukan kebenarannya (boleh stock footage)**

### Voice-Over:
> "Every day, millions of news stories are shared online. And every day, we have no way to know if the person who published it was even real."
>
> "A bot can create an account. A bot can post a story. A bot can vouch for another bot."
>
> "STELE is built to make that impossible."

### Catatan sutradara:
- Tone: lambat, serius. Tidak terburu-buru.
- Jika pakai b-roll, pilih footage yang menggambarkan "keraguan" atau "berita palsu" secara visual
- Alternatif: mulai langsung dari Scene 02 jika durasi terasa mepet

---

## Scene 02: Landing Page
**Durasi: 0:20 - 0:40**
**Tampilan: Buka https://stele.replit.app, hero section terlihat penuh**

### Voice-Over:
> "This is STELE. An immutable witness protocol."
>
> "Every inscription on STELE is anchored by three things: WHO published it, proven by World ID biometric verification. WHAT was published, locked by a SHA-256 content hash. And WHERE it lives, permanently stored on IPFS via Storacha and anchored on World Chain."
>
> "Change one byte of the content, and the entire proof collapses."

### Yang harus terlihat di layar:
- Hero title "STELE" dan tagline "Immutable Witness Protocol"
- Tiga kartu "How It Works" (Verify Humanity, Seal the Evidence, Reach Consensus)
- ProofCard animasi di sisi kanan
- Scroll sedikit ke bawah untuk menampilkan stats strip (stories sealed, IPFS CIDs, On-Chain)

### Catatan sutradara:
- Mouse jangan diam. Gerakkan perlahan ke elemen yang disebut di VO.
- Tidak perlu klik apapun di scene ini.

---

## Scene 03: The Feed (Browse)
**Durasi: 0:40 - 1:00**
**Tampilan: Klik menu "FEED" di navbar**

### Voice-Over:
> "In the Feed, every inscription displays its verification status in real time."
>
> "Green badge: this story has been verified by the community. The World Chain badge means it has been permanently anchored on-chain."
>
> "Blue badge: Device-verified human. Gold badge: Orb-verified. The tier matters: one Orb vouch carries ten times the weight of a Device vouch."

### Yang harus terlihat di layar:
- Halaman Feed terbuka
- Beberapa kartu terlihat dengan badge VERIFIED, WORLD CHAIN, DEVICE VERIFIED / ORB VERIFIED
- Scroll perlahan ke bawah untuk menampilkan lebih banyak kartu
- Filter category boleh diklik sekilas (klik "Governance" lalu "All")

### Catatan sutradara:
- Zoom sedikit ke area badge jika perlu agar badge terbaca jelas di video
- Tidak perlu membuka kartu apapun di scene ini

---

## Scene 04: Inspect and Verify
**Durasi: 1:00 - 1:20**
**Tampilan: Klik tombol "INSPECT EVIDENCE" pada salah satu kartu**

### Voice-Over:
> "Any visitor can verify any inscription at any time."
>
> "The app re-fetches the original evidence from IPFS, recomputes the SHA-256 hash in the browser, and compares it against what was anchored on-chain."
>
> "If the content matches: True Human Witness. If anything was changed after publication: the proof fails immediately."

### Yang harus terlihat di layar:
- Klik tombol INSPECT EVIDENCE pada kartu pertama
- Panel inspect terbuka, menampilkan: CID, SHA-256 hash, World Chain tx link
- Jika ada tombol "Verify Integrity" atau "Re-hash", klik dan tunggu hasilnya
- Tampilkan hasil "TRUE HUMAN WITNESS" atau hash match

### Catatan sutradara:
- Ini salah satu scene paling powerful secara teknis. Berikan jeda 1-2 detik saat hasil verifikasi muncul.
- Jika loading agak lama dari IPFS, potong video dan langsung cut ke hasil.

---

## Scene 05: Publish — Upload + ELA + AI Fill
**Durasi: 1:20 - 1:55**
**Tampilan: Klik "INSCRIBE" di navbar, halaman Publish terbuka**

### Voice-Over:
> "Publishing a story starts here."
>
> "The journalist uploads their evidence. Before anything is sent anywhere, the browser computes a SHA-256 hash of the file — locally, privately."
>
> "It also runs Error Level Analysis: a pixel-level tamper detection algorithm that flags edited images before they can be inscribed."
>
> "Then, one click: AI reads the image and generates the title, summary, and category automatically."

### Yang harus terlihat di layar:
- Halaman Publish terbuka
- Upload gambar (siapkan gambar sample sebelum rekam — foto berita yang sudah ada di laptop)
- Tunggu ELA score muncul (AUTHENTIC / SUSPECT)
- Klik tombol AI auto-fill
- Lihat title, excerpt, category terisi otomatis
- Form terisi lengkap: title, excerpt, category, location

### Catatan sutradara:
- Siapkan file gambar sebelumnya agar tidak ada pause saat pilih file
- Jika ELA loading lama, boleh potong video
- AI fill adalah moment yang visual dan impresi — berikan 2 detik untuk dilihat hasilnya sebelum lanjut

---

## Scene 06: World ID Verification
**Durasi: 1:55 - 2:15**
**Tampilan: Klik tombol "Verify Identity and Inscribe" atau langsung muncul QR World ID**

### Voice-Over:
> "Before anything is stored, the journalist must prove they are a real human using World ID."
>
> "This is the critical step. The SHA-256 hash of their content becomes the verification signal — creating an atomic binding between who they are and what they published."
>
> "One nullifier hash. One real human. One permanent inscription."

### Yang harus terlihat di layar:
- IDKit QR code widget muncul
- Jika mau memakai World App yang sudah Orb-verified: scan QR, approve di World App, verifikasi selesai
- Jika tidak punya World App / Orb: tampilkan QR sejenak, lalu CUT ke hasil setelah inscripsi berhasil (bisa pre-record)
- Tampilan success: "Inscription Sealed: Permanent Record Created" + CID muncul

### Catatan sutradara:
- OPSI A (ideal): Rekam dengan World App yang sudah Orb-verified untuk demo paling kuat
- OPSI B (fallback): Rekam sesi sebelumnya yang berhasil, cut langsung ke hasil sukses
- Jangan biarkan layar di QR terlalu lama jika tidak scan live. Cut ke success screen.

---

## Scene 07: Vouch and Flag
**Durasi: 2:15 - 2:30**
**Tampilan: Kembali ke Feed, buka kartu, tampilkan tombol Vouch dan Flag**

### Voice-Over:
> "The community then validates or disputes the inscription."
>
> "Vouch: a verified human confirms this story is credible. Flag: a verified human disputes it."
>
> "Every vouch and every flag is also anchored on World Chain. One human, one action, per story."

### Yang harus terlihat di layar:
- Kembali ke Feed
- Klik kartu, panel bawah terlihat ada tombol VOUCH dan FLAG
- Klik "Simulate Orb Vouch" (tombol demo) agar tidak perlu World ID lagi
- Tampilkan counter vouch naik, badge berubah menjadi VERIFIED jika sudah cukup poin
- Sekilas tampilkan toast notification "Vouch recorded, anchoring on World Chain..."

### Catatan sutradara:
- Gunakan tombol Simulate untuk demo agar cepat dan tidak perlu scan QR lagi
- Moment badge berubah dari "Pending" ke "Verified" sangat visual — slow down jika perlu

---

## Scene 08: Network Page + Chain Explorer
**Durasi: 2:30 - 2:45**
**Tampilan: Klik "NETWORK" di navbar**

### Voice-Over:
> "The Network page shows the full transparency dashboard."
>
> "Every story, every CID, every on-chain anchor — live. And every badge links directly to the World Chain block explorer so anyone can independently verify."

### Yang harus terlihat di layar:
- Halaman Network terbuka, stats terlihat (Stories Sealed, IPFS CIDs, On-Chain Anchored)
- Scroll ke bawah sekilas, tampilkan World Chain section
- Klik salah satu link "World Chain" badge di kartu (dari Feed) untuk buka block explorer
- Block explorer terbuka, tampilkan transaksi yang ada

### Catatan sutradara:
- Jika block explorer loading lama, boleh potong setelah URL terbuka
- Yang penting juri melihat URL worldchain-sepolia.explorer.alchemy.com

---

## Scene 09: Closing
**Durasi: 2:45 - 3:00**
**Tampilan: Kembali ke Landing Page, tampilkan hero section**

### Voice-Over:
> "STELE. Human-verified. Content-addressed. On-chain anchored."
>
> "The truth, permanently."

### Yang harus terlihat di layar:
- Landing page hero dengan STELE wordmark dan subtitle "Immutable Witness Protocol"
- ProofCard animasi berjalan
- Tampilkan live demo URL: stele.replit.app
- Tampilkan contract address di layar (atau badge di UI yang sudah ada)

### Catatan sutradara:
- Ini adalah outro. Tenang, tidak terburu-buru.
- Jika mau, tambahkan title card di akhir: "STELE — Protocol Labs x World Hackathon 2025"

---

## Checklist Persiapan Sebelum Rekam

### Teknis
- [ ] Buka https://stele.replit.app dan pastikan semua halaman loading normal
- [ ] Siapkan 1 file gambar sample (foto berita/kejadian) untuk demo upload di Publish
- [ ] Pastikan ada minimal 3 inscripsi di Feed agar terlihat ramai
- [ ] Test tombol "Simulate Orb Vouch" berfungsi
- [ ] Test tombol "INSPECT EVIDENCE" dan pastikan hash match berjalan
- [ ] Cek Network page menampilkan stats yang realistis (bukan semua 0)
- [ ] Buka block explorer sebelumnya agar sudah ada cache (loading lebih cepat)

### Recording
- [ ] Set resolusi layar ke 1920x1080
- [ ] Set zoom browser ke 100%
- [ ] Pastikan tidak ada notifikasi yang muncul saat rekam (aktifkan Do Not Disturb)
- [ ] Tutup semua tab lain kecuali STELE dan block explorer
- [ ] Record audio terpisah dari screen jika mungkin (kualitas lebih baik)
- [ ] Rekam beberapa kali, ambil take terbaik

### Voice-Over Tips
- Bicara 20% lebih lambat dari biasanya (terasa aneh saat rekam, tapi hasilnya lebih baik)
- Pause 0.5 detik setelah setiap kalimat penting
- Jangan terburu-buru di Scene 06 (World ID) — ini bagian yang paling teknis dan paling ingin dilihat juri
- Tidak perlu background musik, atau jika pakai: pilih yang sangat subtle dan tidak ada vocal

---

## Alternatif Opening (Pilih Salah Satu)

### Opsi A: Langsung ke masalah (Rekomendasi)
> "In 2025, we cannot trust a news story just because it exists online. Anyone can post anything. STELE changes that. Here's how."

### Opsi B: Langsung ke produk
> "This is STELE: the first journalism protocol where every story is cryptographically tied to a real, verified human being."

### Opsi C: Data-driven
> "Disinformation costs democracies billions per year. But the root problem is simple: we don't know if the person who published a story was even real. STELE solves that."

---

## Kalimat Penutup Alternatif

### Untuk World Build 3
> "STELE: where World ID doesn't just verify an account — it verifies a witness."

### Untuk Infrastructure and Digital Rights
> "No server to seize. No account to ban. No identity to fake. STELE is journalism infrastructure built to survive."

### Untuk Storacha
> "Every inscription is content-addressed on IPFS via Storacha, with no central upload authority and no single point of failure. That's not just decentralized storage. That's permanent truth."

---

## Full Voice-Over Text (Gabungan, untuk TTS atau Recording)

> "Every day, millions of news stories are shared online. And every day, we have no way to know if the person who published it was even real. A bot can create an account. A bot can post a story. A bot can vouch for another bot. STELE is built to make that impossible.
>
> This is STELE. An immutable witness protocol. Every inscription on STELE is anchored by three things: WHO published it, proven by World ID biometric verification. WHAT was published, locked by a SHA-256 content hash. And WHERE it lives, permanently stored on IPFS via Storacha and anchored on World Chain. Change one byte of the content, and the entire proof collapses.
>
> In the Feed, every inscription displays its verification status in real time. Green badge: this story has been verified by the community. The World Chain badge means it has been permanently anchored on-chain. One Orb vouch carries ten times the weight of a Device vouch.
>
> Any visitor can verify any inscription at any time. The app re-fetches the original evidence from IPFS, recomputes the SHA-256 hash in the browser, and compares it against what was anchored on-chain. If the content matches: True Human Witness. If anything was changed after publication: the proof fails immediately.
>
> Publishing a story starts here. The journalist uploads their evidence. Before anything is sent anywhere, the browser computes a SHA-256 hash of the file — locally, privately. It also runs Error Level Analysis: a pixel-level tamper detection algorithm that flags edited images before they can be inscribed. Then, one click: AI reads the image and generates the title, summary, and category automatically.
>
> Before anything is stored, the journalist must prove they are a real human using World ID. This is the critical step. The SHA-256 hash of their content becomes the verification signal — creating an atomic binding between who they are and what they published. One nullifier hash. One real human. One permanent inscription.
>
> The community then validates or disputes the inscription. Vouch: a verified human confirms this story is credible. Flag: a verified human disputes it. Every vouch and every flag is also anchored on World Chain. One human, one action, per story.
>
> The Network page shows the full transparency dashboard. Every story, every CID, every on-chain anchor — live. And every badge links directly to the World Chain block explorer so anyone can independently verify.
>
> STELE. Human-verified. Content-addressed. On-chain anchored. The truth, permanently."

---

*Total kata: ~380 kata — diucapkan dengan pace normal (130 kata/menit) = sekitar 2 menit 55 detik.*
