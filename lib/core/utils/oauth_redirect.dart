/// Keep native OAuth callbacks on a manifest-declared host and the root route.
String oauthRedirectUrl(String? configuredUrl) {
  final value = configuredUrl?.trim();
  final uri = Uri.tryParse(value == null || value.isEmpty
      ? 'https://eimunisasi-app.peltops.com/'
      : value);
  if (uri == null ||
      uri.scheme != 'https' ||
      !const ['eimunisasi-app.peltops.com', 'e-patient-app.peltops.com']
          .contains(uri.host) ||
      uri.hasPort ||
      uri.userInfo.isNotEmpty ||
      (uri.path.isNotEmpty && uri.path != '/') ||
      uri.hasQuery ||
      uri.hasFragment) {
    throw const FormatException(
      'AUTH_REDIRECT_URL harus berupa root HTTPS domain App Link yang terdaftar.',
    );
  }
  return uri.replace(path: '/').toString();
}
