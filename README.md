# e-Patient

e-Patient adalah aplikasi Flutter untuk pengelolaan perjalanan kesehatan pasien dan keluarga lintas usia. Repository ini berkembang dari baseline e-Imunisasi, dengan migrasi fitur secara bertahap berdasarkan kebutuhan bisnis dan produk.

**Status:** dalam pengembangan. Branding, setup Flutter/FVM, konfigurasi VS Code, dan build Android telah disesuaikan. Source masih memiliki alur orang tua/anak, booking vaksin, dan buku sehat dari baseline. Household berizin, booking lintas layanan, serta timeline longitudinal adalah target migrasi; belum semuanya tersedia.

## Dokumen produk

| Dokumen | Kegunaan |
|---|---|
| [Business requirements](docs/plans/2026-09-30-e-patient-business-requirements.md) | Tujuan bisnis, model akun/pasien/keluarga, scope MVP/P1 |
| [Product requirements](docs/product/2026-10-02-e-patient-prd.md) | Journey, requirement, state, acceptance criteria |
| [Detail pemetaan e-Imunisasi → e-Patient](docs/product/2026-10-11-e-imunisasi-to-e-patient-capability-mapping.md) | Elaborasi 15 kapabilitas dan urutan adaptasi |
| [Build timeline](docs/plans/2026-10-04-e-patient-build-timeline.md) | Rencana delivery dan dependensi |
| [Migration tracker](docs/engineering/2026-10-09-e-imunisasi-to-e-patient-migration.md) | Catatan awal copy baseline; metadata historis perlu dicek terhadap Git sebelum digunakan |
| [GitHub Actions setup](docs/engineering/github-actions-setup.md) | Workflow, secrets, artifact, dan troubleshooting CI |
| [Brand assets](docs/product/2026-10-11-e-patient-brand-assets.md) | Logo, ilustrasi, prompt, dan regenerasi ikon |
| [AGENTS.md](AGENTS.md) | Panduan kerja bagi coding agent dan contributor |

## Prasyarat

- FVM dan Flutter sesuai [.fvmrc](.fvmrc), saat ini **3.29.3**. Gunakan SDK ini agar local dan CI konsisten.
- Android SDK dan **JDK 17**, dengan perangkat/emulator yang siap digunakan. Project memakai compile/target SDK 35 dan minimum SDK 23.
- VS Code dengan ekstensi Dart dan Flutter jika memakai Run & Debug.
- Untuk iOS: macOS, Xcode, CocoaPods, serta konfigurasi signing yang sesuai. Build/deployment iOS tidak dicakup workflow CI saat ini.
- Node.js untuk script konfigurasi CI; Node.js dan macOS `sips` untuk regenerasi ikon. Bukan dependency runtime aplikasi Flutter.

## Setup lokal

```sh
git clone https://github.com/seribasa/e-patient.git
cd e-patient
fvm install
```

Salin `.env.example` menjadi `.env` **jika `.env` belum ada**, lalu isi nilai development. Jangan menimpa konfigurasi lokal yang sudah digunakan.

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-client-anon-or-publishable-key
STRIPE_PUBLISHABLE_KEY=
PAYMENT_URL=https://your-payment-backend.example
PAYMENT_GATEWAY=midtrans
PAYMENT_CURRENCY=IDR
```

| Konfigurasi | Kebutuhan |
|---|---|
| `SUPABASE_URL` dan `SUPABASE_ANON_KEY` | Wajib untuk startup; harus menunjuk project yang sama |
| `PAYMENT_URL` | Diperlukan saat repository payment diinisialisasi; wajib pada build development CI |
| `STRIPE_PUBLISHABLE_KEY` | Diperlukan bila gateway Stripe dipakai |
| `PAYMENT_GATEWAY` | Default `midtrans`; workflow development mendukung `midtrans` atau `stripe` |
| `PAYMENT_CURRENCY` | Default `IDR`; sesuaikan dengan backend/gateway |

`.env` dibaca sebagai **aset Flutter**, bukan otomatis dari environment terminal/VS Code. File ini telah didaftarkan di `pubspec.yaml` dan tidak dilacak Git. Perubahan `.env`/aset memerlukan penghentian dan peluncuran ulang aplikasi.

Konfigurasi client ikut berada dalam APK. Jangan memasukkan Supabase service-role key, OAuth client secret, Stripe secret key, atau Midtrans server key; credential server tetap di backend.

Setelah `.env` tersedia:

```sh
fvm flutter pub get
fvm dart run build_runner build --delete-conflicting-outputs
fvm flutter devices
fvm flutter run -d <device-id>
```

Code generation menyiapkan dependency injection, adapter, dan mocks dari source/annotation. Beberapa generated files masih dilacak dari baseline meskipun polanya ada di `.gitignore`; jangan mengeditnya manual.

## Run & Debug di VS Code

1. Buka root repository, bukan hanya folder `lib` atau `android`.
2. Setelah `fvm install`, pastikan `.fvm/flutter_sdk` tersedia; [settings.json](.vscode/settings.json) mengarah ke SDK tersebut.
3. Pilih perangkat lewat status bar atau **Flutter: Select Device**.
4. Pilih **e-Patient (Debug)** pada Run & Debug, kemudian tekan **F5**.

[launch.json](.vscode/launch.json) menyediakan Debug, Profile, dan Release dengan entrypoint `lib/main.dart`. Profile/release bukan alternatif signing produksi; konfigurasi release Android memerlukan keystore tersendiri.

## Verifikasi dan build

```sh
fvm flutter analyze
fvm flutter test --coverage --reporter expanded
fvm flutter build apk --debug
```

APK berada di `build/app/outputs/flutter-apk/app-debug.apk`; coverage di `coverage/lcov.info`. Android memakai application ID `com.peltops.e_patient`, dengan suffix `.debug` untuk build debug. Release signing belum disiapkan oleh pipeline baru.

Saat mengubah source yang menghasilkan kode, jalankan build_runner sebelum analysis/test. Untuk format, batasi pada file Dart yang diubah:

```sh
fvm dart format path/to/changed_file.dart
```

## Struktur repository

```text
lib/
  main.dart              # Env dan inisialisasi dependency/platform
  app.dart               # Material 3 dan tema monokrom
  core/                  # Widget, utilitas, model dan dependency umum
  features/              # Modul fitur: data, logic, presentation
  routers/               # GoRouter dan route paths
  services/              # Layanan lintas fitur, termasuk notifikasi
test/                    # Test model, repository, Cubit/BLoC, dan utilitas
assets/                  # Gambar dan font
android/ ios/ web/       # Project platform
docs/                    # Business/product/delivery/engineering
.github/workflows/       # CI dan build development manual
.github/legacy-workflows/# Arsip workflow baseline, tidak dijalankan
```

Baseline menggunakan BLoC/Cubit, GetIt/Injectable, Supabase, Hive, SharedPreferences, serta integrasi payment. Nama modul seperti `vaccination`, `healthy_book`, dan model parent/child masih dipertahankan sampai migrasi domain terkait dilakukan. Theme utama memakai Material 3, hitam-putih, dan border radius nol.

## GitHub Actions dan APK

- **e-Patient CI:** berjalan pada push seluruh branch, pull request, atau manual. Menjalankan code generation, analysis, test, dan build debug dengan konfigurasi placeholder. Tidak membutuhkan secret. Artifact CI tidak ditujukan untuk login/payment nyata.
- **e-Patient Development APK:** manual, memakai environment GitHub `development`. Isi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PAYMENT_URL`, serta `STRIPE_PUBLISHABLE_KEY` jika Stripe. Variables `PAYMENT_GATEWAY`/`PAYMENT_CURRENCY` dapat mengubah default.
- Unduh APK dari artifact run yang berhasil, bukan tautan release e-Imunisasi lama. Workflow release/Play Store lama diarsipkan; deployment produksi belum aktif.

Lihat [petunjuk GitHub Actions](docs/engineering/github-actions-setup.md) untuk setup environment, batas signing debug, dan daftar secret produksi yang belum dipakai.

## Troubleshooting

| Gejala | Pemeriksaan |
|---|---|
| `.env` tidak terbaca atau konfigurasi Supabase kosong | Pastikan file ada di root, key terisi, terdaftar sebagai aset, lalu Stop dan Run ulang |
| VS Code memakai Flutter berbeda | Jalankan `fvm install`, cek `.fvm/flutter_sdk`, lalu Reload Window |
| Import `.g.dart`, `.config.dart`, atau `.mocks.dart` hilang | Jalankan build_runner sebelum analysis/test/build |
| OAuth tidak membuka browser | Periksa error Cubit/launcher dan konfigurasi URL; jangan menganggap perubahan callback saja menyelesaikan launch |
| OAuth berhasil tetapi tidak kembali | Cocokkan redirect URL, allowlist Supabase, konfigurasi Keycloak, App Link, package, dan signing certificate |
| Sudah login tetapi profil tidak ditemukan | Periksa provisioning/link profil backend; login berhasil tidak otomatis membuat row profil |
| APK CI tidak bisa login | Gunakan Development APK karena CI memakai konfigurasi dummy |

## Kontribusi

Baca [AGENTS.md](AGENTS.md) dan requirement fitur sebelum mengubah domain. Gunakan perubahan bertahap dengan acceptance criteria yang jelas; akun, pasien, actor, payer, dan grant tidak boleh dicampur. Sertakan hasil verifikasi serta batas fitur dalam PR. Hindari mengaktifkan deployment produksi atau mengganti identitas backend sekadar untuk membuat build lolos.
