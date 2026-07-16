# packages

The droplet APT/RPM/Flatpak aggregator for jcrenshaw.dev apps. It assembles one
signed APT repo and one signed RPM repo from each app's latest GitHub Release
`.deb` and `.rpm`, mirrors each app's GPG-signed OSTree flatpak repo into one
shared remote, install-verifies all three, and serves the result at
`pkg.jcrenshaw.dev`. Ported from the retired GitLab `vintagetechie/packages`. No
compilation happens here: each app builds its own packages in its own GitHub
Actions; the droplet only aggregates, signs, and serves.

## How it builds and gates

The build is a single multi-stage `Dockerfile` that IS the install-verify gate:

1. `aggregate` (Debian) imports the signing key and runs `aggregate.sh`, which
   downloads each app's latest Release assets, builds `public/deb` (reprepro) and
   `public/rpm` (createrepo_c), `ostree pull --mirror`s each app's Pages OSTree
   flatpak repo into `public/flatpak`, and signs all three with the store key.
2. `verify-apt` (Debian) installs `cosmic-ext-applet-tempest` from `public/deb`
   over `file://` with signature checking on.
3. `verify-rpm` (Fedora) installs `cosmic-ext-applet-tempest` from `public/rpm`
   over `file://` with signature checking on.
4. `verify-flatpak` (Debian) adds `public/flatpak` over `file://` with GPG
   verification on and lists the app ref, validating the signed summary.
5. `serve` (nginx) serves `public/`, gated on all three verify stages.

The flatpak side assumes each app in `apps.list` publishes an archive-z2 OSTree
repo to its GitHub Pages under `/repo`, its commit signed by the same store key
(tempest's `release.yml` does this). The aggregator mirrors those commits, so the
Pages repo must exist before the aggregator can build the flatpak stage — same
bootstrap ordering as the deb/rpm assets needing a published Release first.

A failed verify fails `docker build`, so Coolify never swaps the running
container and the previously published repo keeps serving unchanged.

## Build arg

- `GPG_SIGNING_KEY_B64` (required) — base64 of the exported private signing key,
  imported into the aggregate stage's keyring. In Coolify this is the Team secret
  `{{team.GPG_SIGNING_KEY_B64}}`, passed as a build-time `--build-arg` (never a
  runtime env). The key is passphraseless so signing runs non-interactively.

The signing key fingerprint is `7406571FFDA331EEB4E960418B03E021E43EC13A`
(defaulted in the Dockerfile as `PACKAGES_GPG_KEY`).

## Adding an app

Append one line to `apps.list`:

```
<app-id> | <github owner/repo> | <deb filename> | <rpm filename>
```

The assets are pulled from that repo's latest GitHub Release root. Only add an
app once it has a published Release; listing a not-yet-released app fails the
aggregate.

## Deploy

Deploys as a Coolify service on the DO droplet at `pkg.jcrenshaw.dev`, behind
Cloudflare Pro. On an app's `v*` release, that app's CI notifies the Coolify
deploy webhook (`AGGREGATOR_WEBHOOK_URL`), which force/no-cache-rebuilds and
republishes the aggregator; a manual Coolify redeploy is the fallback trigger.
