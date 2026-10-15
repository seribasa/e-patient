import 'package:e_patient/core/utils/oauth_redirect.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('defaults to the existing HTTPS callback domain', () {
    expect(oauthRedirectUrl(null), 'https://eimunisasi-app.peltops.com/');
    expect(oauthRedirectUrl(''), 'https://eimunisasi-app.peltops.com/');
  });

  test('supports both declared App Link hosts and normalizes the root', () {
    expect(oauthRedirectUrl('https://e-patient-app.peltops.com'),
        'https://e-patient-app.peltops.com/');
    expect(oauthRedirectUrl(' https://eimunisasi-app.peltops.com/ '),
        'https://eimunisasi-app.peltops.com/');
  });

  test(
      'rejects undeclared hosts, non-HTTPS, credentials, and unsupported routes',
      () {
    for (final value in [
      'https://attacker.example/',
      'https://eimunisasi-app.peltops.com.attacker.example/',
      'http://eimunisasi-app.peltops.com/',
      'https://name:password@eimunisasi-app.peltops.com/',
      'https://eimunisasi-app.peltops.com:8443/',
      'https://eimunisasi-app.peltops.com/auth/callback',
      'https://eimunisasi-app.peltops.com/?redirect=other',
      'https://eimunisasi-app.peltops.com/#token',
      'not-a-url',
    ]) {
      expect(() => oauthRedirectUrl(value), throwsFormatException);
    }
  });
}
