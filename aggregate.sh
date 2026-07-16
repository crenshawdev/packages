#!/usr/bin/env bash
# Assemble one signed APT repo (public/deb) and one signed RPM repo (public/rpm)
# from the latest GitHub Release .deb/.rpm of every app in apps.list, all signed
# with the single jcrenshaw store key. No compilation happens here — each app
# builds its own packages in its own CI (the droplet only aggregates and signs).
#
# Env:
#   PACKAGES_GPG_KEY   signing key fingerprint. Required. Its private half must
#                      already be imported into the gpg keyring before this script
#                      runs (the Dockerfile aggregate stage imports it from
#                      GPG_SIGNING_KEY_B64).
#   PACKAGES_BASE_URL  public origin baked into the generated rpm .repo + apt hints.
#                      Default: https://pkg.jcrenshaw.dev
#   PULL_RETRIES       download attempts per asset (Release publish lag). Default: 10.
set -euo pipefail

GPG_KEY="${PACKAGES_GPG_KEY:?set PACKAGES_GPG_KEY to the signing key fingerprint}"
BASE_URL="${PACKAGES_BASE_URL:-https://pkg.jcrenshaw.dev}"
PULL_RETRIES="${PULL_RETRIES:-10}"
CODENAME="stable"

here="$(cd "$(dirname "$0")" && pwd)"
cd "$here"

# Whitespace trim via parameter expansion — never fails (unlike xargs, which
# exits 1 on an unmatched quote and, under set -e, would abort the whole run).
trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; s="${s%"${s##*[![:space:]]}"}"; printf '%s' "$s"; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
debs="$work/debs"; rpms="$work/rpms"
mkdir -p "$debs" "$rpms"

# Fresh output + reprepro workdir every run (CI starts clean; keeps state
# deterministic — the repos are a pure function of the current release assets).
rm -rf public apt
mkdir -p public/deb public/rpm apt/conf

# --- download every app's latest release packages ----------------------------
dl() { # <url> <dest>
  local url="$1" dest="$2" i
  for i in $(seq 1 "$PULL_RETRIES"); do
    if curl -fSL --retry 3 -o "$dest" "$url"; then return 0; fi
    echo "  attempt $i/$PULL_RETRIES failed for $url; waiting for Release lag..." >&2
    sleep 15
  done
  echo "FATAL: could not download $url after $PULL_RETRIES attempts" >&2
  return 1
}

# Resolve an app's current "latest" release tag from the web redirect (no API
# token, no rate limit). Downloading by explicit tag — and logging it — turns a
# stale `latest` (a new release marked prerelease, or GitHub pointer lag) from a
# SILENT old-version republish into a visible, auditable one: the build log shows
# exactly which tag each app resolved to, which the zero-touch EVT-01 check reads.
resolve_tag() { # <project>
  local eff
  eff="$(curl -fsSL -o /dev/null -w '%{url_effective}' \
        "https://github.com/$1/releases/latest")" || return 1
  case "$eff" in
    */releases/tag/*) printf '%s' "${eff##*/tag/}" ;;
    *) echo "FATAL: no release tag resolved for $1 (got: $eff)" >&2; return 1 ;;
  esac
}

# Skip comment/blank lines BEFORE splitting — a '#' comment may contain a ' | '
# and apostrophes, which must never reach the field parser.
while IFS= read -r line || [ -n "$line" ]; do
  line="$(trim "$line")"
  [ -z "$line" ] && continue
  case "$line" in \#*) continue;; esac
  IFS='|' read -r appid project debfile rpmfile <<< "$line"
  appid="$(trim "$appid")"; project="$(trim "$project")"
  debfile="$(trim "$debfile")"; rpmfile="$(trim "$rpmfile")"
  [ -z "$appid" ] && continue
  tag="$(resolve_tag "$project")"
  echo "==> $appid ($project) latest=$tag"
  rel="https://github.com/${project}/releases/download/${tag}"
  dl "${rel}/${debfile}" "$debs/$debfile"
  dl "${rel}/${rpmfile}" "$rpms/$rpmfile"
done < apps.list

# --- APT repo (reprepro) ------------------------------------------------------
# reprepro signs the per-suite Release into InRelease/Release.gpg with SignWith.
cat > apt/conf/distributions <<EOF
Origin: jcrenshaw
Label: jcrenshaw
Suite: ${CODENAME}
Codename: ${CODENAME}
Architectures: amd64
Components: main
Description: jcrenshaw.dev COSMIC apps (deb)
SignWith: ${GPG_KEY}
EOF

reprepro -b apt includedeb "$CODENAME" "$debs"/*.deb
# Publish only the servable tree (dists/ + pool/); leave conf/ and db/ behind.
cp -r apt/dists apt/pool public/deb/

# --- RPM repo (rpm --addsign + createrepo_c + signed repomd) ------------------
# rpm's sign-command macro is %__gpg_sign_cmd (double underscore); it already
# templates the correct args. Rather than override the whole command (whose arg
# macros differ across rpm versions), extend it via the documented hook so a
# passphraseless key signs non-interactively in CI.
cat > "$HOME/.rpmmacros" <<EOF
%_gpg_name ${GPG_KEY}
%__gpg $(command -v gpg)
%_gpg_sign_cmd_extra_args --batch --pinentry-mode loopback
EOF

cp "$rpms"/*.rpm public/rpm/
rpm --addsign public/rpm/*.rpm
createrepo_c public/rpm
gpg --batch --yes --detach-sign --armor --local-user "$GPG_KEY" public/rpm/repodata/repomd.xml

# --- landing page ------------------------------------------------------------
# Install-instructions page served at the repo root (avoids a bare 404). The app
# list is generated from the debs we just pulled, so it always matches the repo:
# each app's `apt install` name is the deb's own Package field (authoritative —
# it's exactly what a user types), sorted for a deterministic page.
mapfile -t pkgs < <(for d in "$debs"/*.deb; do dpkg-deb -f "$d" Package; done | sort)
pkg_list="$(printf '    <li><code class="inline">%s</code></li>\n' "${pkgs[@]}")"
awk -v list="$pkg_list" -v ex="${pkgs[0]}" '
  { gsub(/__EXAMPLE_PKG__/, ex) }
  /__PACKAGE_LIST__/ { print list; next }
  { print }
' index.html > public/index.html

# --- public key + rpm .repo descriptor ---------------------------------------
gpg --batch --yes --armor --export "$GPG_KEY" > public/jcrenshaw.asc
cat > public/rpm/jcrenshaw.repo <<EOF
[jcrenshaw]
name=jcrenshaw.dev Packages
baseurl=${BASE_URL}/rpm
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=${BASE_URL}/jcrenshaw.asc
EOF

# --- Flatpak repo (mirror each app's signed OSTree, re-served as one remote) --
# Each app's own CI (tempest's release.yml) builds an archive-z2 OSTree flatpak
# repo, signs the commit with THIS SAME jcrenshaw store key, and publishes it to
# GitHub Pages under /repo. We ostree-pull --mirror every app's stable ref into
# one shared archive repo (public/flatpak), regenerate + re-sign the summary with
# the store key, and serve it as a single remote at ${BASE_URL}/flatpak. Because
# the upstream commits are already signed by the store key, the pull verifies
# their signatures against it (no --no-gpg-verify) and the mirror stays trusted.
#
# Assumption for the current tempest-only scope: every app in apps.list publishes
# such a Pages OSTree repo. When a flatpak-less app is added, gate this loop on a
# per-app marker rather than mirroring unconditionally.
fp="public/flatpak"
store_pub="$work/store.gpg"
gpg --batch --yes --export "$GPG_KEY" > "$store_pub"   # binary keyring for --gpg-import
ostree --repo="$fp" init --mode=archive

while IFS= read -r line || [ -n "$line" ]; do
  line="$(trim "$line")"
  [ -z "$line" ] && continue
  case "$line" in \#*) continue;; esac
  IFS='|' read -r appid project _debfile _rpmfile <<< "$line"
  appid="$(trim "$appid")"; project="$(trim "$project")"
  [ -z "$appid" ] && continue
  owner="${project%%/*}"; reponame="${project##*/}"
  pages="https://${owner}.github.io/${reponame}/repo"   # Pages root serves public/, OSTree under repo/
  ref="app/${appid}/x86_64/stable"
  echo "==> flatpak mirror $appid from $pages ($ref)"
  ostree --repo="$fp" remote add --if-not-exists --gpg-import="$store_pub" "up-${appid}" "$pages" "$ref"
  ostree --repo="$fp" pull --mirror --depth=-1 "up-${appid}" "$ref"
done < apps.list

# Regenerate the summary/appstream/static-deltas of the mirrored repo and sign
# the summary with the store key so `flatpak remote-ls` / install verifies it.
flatpak build-update-repo \
  --generate-static-deltas \
  --prune --prune-depth=20 \
  --gpg-sign="$GPG_KEY" \
  "$fp"

# One .flatpakrepo descriptor for the whole remote. GPGKey is the base64 of the
# store public key (the key that signed every mirrored commit and the summary).
store_pub_b64="$(gpg --batch --yes --export "$GPG_KEY" | base64 -w0)"
cat > "$fp/jcrenshaw.flatpakrepo" <<EOF
[Flatpak Repo]
Version=1
Title=jcrenshaw.dev Apps
Url=${BASE_URL}/flatpak
Homepage=https://jcrenshaw.dev
Comment=COSMIC apps from jcrenshaw.dev
Description=Flatpak remote for jcrenshaw.dev COSMIC apps
DefaultBranch=stable
GPGKey=${store_pub_b64}
EOF

echo "Done. APT: ${BASE_URL}/deb (${CODENAME} main)  RPM: ${BASE_URL}/rpm  Flatpak: ${BASE_URL}/flatpak"
