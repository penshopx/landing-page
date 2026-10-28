#!/usr/bin/env bash
# Download-only test tools, never installed into the application's runtime.
set -euo pipefail
cd "$(dirname "$0")/.."
root="$(pwd)/generated-artifacts/visual-env"
mkdir -p "$root"

download() {
  local url="$1" name="$2" checksum="$3"
  if ! echo "$checksum  $root/$name" | sha256sum --check --status 2>/dev/null; then
    curl --fail --location --retry 3 --silent --show-error "$url" -o "$root/$name"
  fi
  echo "$checksum  $root/$name" | sha256sum --check
}

# This Chromium major/version matches the original reviewed reference captures.
download \
  "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.100/linux64/chrome-linux64.zip" \
  chrome.zip 6613fbf1a2ae36f9a63496612ef946cc65f29271d32172a34f145745b89873cd
download \
  "https://archive.ubuntu.com/ubuntu/pool/main/f/fonts-dejavu/fonts-dejavu-core_2.37-8_all.deb" \
  fonts-core.deb 40049660c194f3b8a2541fc7369efebb10e9f94bdac836a2f38fafedd10fa73a
download \
  "https://archive.ubuntu.com/ubuntu/pool/main/f/fonts-dejavu/fonts-dejavu-mono_2.37-8_all.deb" \
  fonts-mono.deb 8a599d6553307db7ecb795d2f0e5a301e03234afc75c7358b0ba43466454c89a

rm -rf "$root/chrome-linux64" "$root/fonts" "$root/font-cache"
unzip -q "$root/chrome.zip" -d "$root"
dpkg-deb -x "$root/fonts-core.deb" "$root/fonts"
dpkg-deb -x "$root/fonts-mono.deb" "$root/fonts"
mkdir -p "$root/font-cache"
# No system font directories: runner image updates cannot change fallback fonts.
cat > "$root/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <dir>$root/fonts/usr/share/fonts/truetype/dejavu</dir>
  <cachedir>$root/font-cache</cachedir>
  <alias><family>sans-serif</family><prefer><family>DejaVu Sans</family></prefer></alias>
  <alias><family>serif</family><prefer><family>DejaVu Serif</family></prefer></alias>
  <alias><family>monospace</family><prefer><family>DejaVu Sans Mono</family></prefer></alias>
  <!-- Match the hinting policy used for the reviewed original captures. -->
  <match target="pattern">
    <edit name="antialias" mode="assign"><bool>true</bool></edit>
    <edit name="hinting" mode="assign"><bool>true</bool></edit>
    <edit name="hintstyle" mode="assign"><const>hintslight</const></edit>
    <edit name="rgba" mode="assign"><const>rgb</const></edit>
    <edit name="lcdfilter" mode="assign"><const>lcddefault</const></edit>
  </match>
</fontconfig>
EOF
FONTCONFIG_FILE="$root/fonts.conf" fc-cache -f
echo "Lingkungan visual siap: Chromium 138.0.7204.100, DejaVu 2.37-8 (Ubuntu, SHA-256 diverifikasi)."
