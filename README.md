# packages

The droplet APT/RPM aggregator for jcrenshaw.dev apps. It assembles one signed
APT repo and one signed RPM repo from each app's latest GitHub Release `.deb` and
`.rpm`, install-verifies them, and serves the result at `pkg.jcrenshaw.dev`.
Ported from the retired GitLab `vintagetechie/packages`. No compilation happens
here: each app builds its own packages in its own GitHub Actions; the droplet only
aggregates, signs, and serves.

## How it builds and gates

The build is a single multi-stage `Dockerfile` that IS the install-verify gate:

1. `aggregate` (Debian) imports the signing key and runs `aggregate.sh`, which
   downloads each app's latest Release assets, builds `public/deb` (reprepro) and
   `public/rpm` (createrepo_c), and signs both with the store key.
2. `verify-apt` (Debian) installs `cosmic-ext-applet-tempest` from `public/deb`
   over `file://` with signature checking on.
3. `verify-rpm` (Fedora) installs `cosmic-ext-applet-tempest` from `public/rpm`
   over `file://` with signature checking on.
4. `serve` (nginx) serves `public/`, gated on both verify stages.

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
Cloudflare Pro. This phase's rebuild trigger is a Coolify manual redeploy; the
release webhook wiring is a later phase.
