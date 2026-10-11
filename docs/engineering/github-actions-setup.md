# GitHub Actions — e-Patient

## Pipeline

- **e-Patient CI:** push seluruh branch, pull request, atau manual. Memakai konfigurasi dummy; code generation → analysis → seluruh test → APK debug. Tidak membutuhkan secret. APK CI hanya untuk verifikasi build, bukan uji login/payment dengan backend nyata.
- **e-Patient Development APK:** manual, dengan GitHub Environment `development`. Pilih `midtrans`, `stripe`, atau `both` saat Run workflow. Quality gates memakai dummy; konfigurasi development ditulis sebelum build. Setiap gateway menghasilkan APK/artifact terpisah.
- Flutter mengikuti `.fvmrc` (3.29.3 saat setup), Java 17, signing debug bawaan Android. Coverage disimpan sebagai artifact. Tidak publish release atau deploy ke Play Store.
- Workflow release e-Imunisasi lama serta konfigurasi Dependabot yang belum lengkap diarsipkan dalam `.github/legacy-workflows/` dan tidak aktif.

## Secrets dan variables

Repository GitHub → **Settings → Environments → New environment → development**. Tambahkan secrets:

| Secret | Wajib | Isi |
|---|---|---|
| `SUPABASE_URL` | Ya | URL project Supabase development |
| `SUPABASE_ANON_KEY` | Ya | Anon/publishable client key project yang sama; bukan service-role key |
| `PAYMENT_URL` | Ya bila override gateway tidak tersedia | Endpoint backend payment development bersama, sebagai fallback |
| `PAYMENT_URL_MIDTRANS` | Opsional | Endpoint khusus Midtrans; mengoverride PAYMENT_URL pada build Midtrans |
| `PAYMENT_URL_STRIPE` | Opsional | Endpoint khusus Stripe; mengoverride PAYMENT_URL pada build Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Jika Stripe | Publishable key sandbox; boleh kosong untuk Midtrans |

Repository secrets bernama sama dapat digunakan jika environment tidak mengoverride nilainya. Tidak perlu mengubah repository/environment Variables untuk memilih gateway atau currency. Pilihan berasal dari **Run workflow inputs**:

| Input | Default | Pilihan |
|---|---|---|
| `payment_gateway` | `midtrans` | `midtrans`, `stripe`, atau `both` |
| `midtrans_currency` | `IDR` | Kode currency tiga huruf uppercase yang didukung backend Midtrans |
| `stripe_currency` | `IDR` | Kode currency tiga huruf uppercase yang didukung backend Stripe |

Pada pilihan `both`, dua job berjalan independen dengan currency masing-masing. Currency valid secara format belum berarti didukung akun/backend; gunakan konfigurasi sandbox yang telah disepakati. Key publishable Stripe tidak dimasukkan ke APK Midtrans.

Pipeline baru tidak memerlukan `ENV_MIDTRANS_DEV`, `ENV_STRIPE_DEV`, `ENV_PAYPAL_DEV`, `DEBUG_KEY_ALIAS`, `DEBUG_KEY_PASSWORD`, `DEBUG_KEYSTORE_PASSWORD`, atau `CODECOV_TOKEN`. `GITHUB_TOKEN` disediakan otomatis oleh GitHub.

File `.env` masuk ke APK sebagai aset Flutter. GitHub Secrets menghindari penyimpanan nilai di source/log, tetapi tidak merahasiakan nilai dari pemegang APK. Hanya konfigurasi client development yang boleh dimasukkan. Key server Midtrans/Stripe, Supabase service-role key, password database, dan OAuth client secret tetap di backend.

## Menjalankan

1. Push/merge workflow; file workflow manual harus tersedia di default branch agar dapat ditemukan melalui Actions.
2. Buat environment `development` dan isi konfigurasi di atas.
3. Actions → **e-Patient Development APK** → **Run workflow** → pilih branch, gateway, serta currency per gateway.
4. Unduh artifact `e-patient-midtrans-debug-<run id>` dan/atau `e-patient-stripe-debug-<run id>`. File di dalamnya bernama `app-midtrans-debug.apk` / `app-stripe-debug.apk`.
5. Debug application ID memakai suffix `.debug` dari Gradle. Callback OAuth/App Link perlu cocok dengan package, certificate signing, domain, serta allowlist Supabase; build sukses belum membuktikan login berfungsi.

PR fork tidak memperoleh secrets; CI tetap bekerja dengan placeholder. Workflow tidak menggunakan pull_request_target. Atur proteksi environment/branch development sesuai proses tim.

Pilihan gateway ini belum berupa Android product flavors: kedua APK menggunakan application ID debug yang sama, sehingga tidak dapat diinstall berdampingan. Signing debug antarrunner juga dapat berbeda. Artifact terpisah memudahkan distribusi, tetapi tidak menjamin kedua versi dapat saling diupdate tanpa penanganan signing.

## Release/Play Store nanti

Belum diaktifkan. Saat menyiapkan release, nilai kembali secret signing/deployment lama:

| Secret | Kegunaan |
|---|---|
| `KEYSTORE_FILE` | Upload keystore Android dalam base64 |
| `KEY_ALIAS` | Alias upload key |
| `KEY_PASSWORD` | Password key |
| `KEYSTORE_PASSWORD` | Password keystore |
| `GPLAY_SERVICE_ACCOUNT_KEY_JSON` | Credential Play Console dengan izin minimum |

Secret signing/deployment tidak masuk `.env` aplikasi. Perlu review application ID, listing Play Console, Fastlane metadata, version code, track, dan konfigurasi produksi sebelum mengaktifkan deployment. Jangan langsung mengaktifkan workflow legacy hanya dengan mengisi secrets.

## Troubleshooting

- Missing configuration: nama secret wajib belum tersedia pada environment development; nilai tidak dicetak ke log.
- File .env.dev tidak diperlukan lagi; `.env` dibuat saat workflow berjalan dan dihapus saat selesai.
- Generated import/mock hilang: langkah build_runner harus sukses; generated files tidak dilacak Git.
- Analysis/test gagal: perbaiki temuan; pipeline tidak mematikan fatal warnings atau memakai continue-on-error.
- APK CI tidak dapat login: gunakan Development APK; CI memakai placeholder.
- Update APK debug antarrunner dapat gagal karena signing bawaan berbeda; signing development konsisten perlu dirancang sebelum distribusi tester berulang. Jangan menghapus data aplikasi tanpa pertimbangan.

## Referensi

- [Flutter Action dan dukungan FVM](https://github.com/subosito/flutter-action)
- [GitHub: penggunaan secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub: artifact workflow](https://docs.github.com/en/actions/tutorials/store-and-share-data)
