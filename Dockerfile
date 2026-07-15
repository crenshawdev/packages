# Multi-stage build that IS the install-verify gate for the jcrenshaw.dev
# APT/RPM aggregator. A failed verify fails `docker build`, so Coolify never
# swaps the running container and pkg.jcrenshaw.dev keeps serving the prior repo.
#
#   aggregate   -> imports the signing key, runs aggregate.sh -> /work/public
#   verify-apt  -> installs cosmic-ext-applet-tempest from public/deb (file://)
#   verify-rpm  -> installs cosmic-ext-applet-tempest from public/rpm (file://)
#   serve       -> nginx serving public/, gated on both verify stages

# --- aggregate: build the signed repos -------------------------------------
FROM debian:bookworm-slim AS aggregate
RUN apt-get update && apt-get install -y --no-install-recommends \
      reprepro createrepo-c rpm gnupg ca-certificates curl coreutils \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /work
COPY aggregate.sh apps.list index.html ./

# Private signing key: passed as a build ARG, imported only in this intermediate
# stage (discarded from the final image), never COPY/ENV'd into a served layer.
ARG GPG_SIGNING_KEY_B64
ARG PACKAGES_GPG_KEY=7406571FFDA331EEB4E960418B03E021E43EC13A
ARG CACHE_BUST=

# Cache-bust the aggregate layer. aggregate.sh fetches each app's LATEST GitHub
# Release, so an identical-input rebuild would cache-hit and republish the OLD
# release. Each app's releases Atom feed content (and Last-Modified) changes when
# a new release publishes, so these ADD layers invalidate and cascade into the
# aggregate RUN below, forcing a re-fetch. CACHE_BUST is the deterministic in-repo
# bust (a deploy passing --build-arg CACHE_BUST=<version|timestamp> always
# invalidates the layer); the Atom feeds are the zero-config backup. Same order
# and set as the active apps.list lines (tempest).
ADD https://github.com/crenshawdev/tempest/releases.atom /tmp/cachebust/tempest.atom
RUN echo "cache-bust: $CACHE_BUST" \
    && echo "$GPG_SIGNING_KEY_B64" | base64 -d | gpg --batch --import \
    && PACKAGES_GPG_KEY="$PACKAGES_GPG_KEY" ./aggregate.sh

# --- verify-apt: install from the built APT repo over file:// ---------------
FROM debian:bookworm-slim AS verify-apt
RUN apt-get update && apt-get install -y --no-install-recommends \
      gnupg ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=aggregate /work/public /public
RUN gpg --dearmor < /public/jcrenshaw.asc > /usr/share/keyrings/jcrenshaw.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/jcrenshaw.gpg] file:/public/deb stable main" \
         > /etc/apt/sources.list.d/jcrenshaw.list \
    && apt-get update \
    && apt-get install -y cosmic-ext-applet-tempest \
    && dpkg -s cosmic-ext-applet-tempest | grep -q '^Status: install ok installed' \
    && touch /verified-apt

# --- verify-rpm: install from the built RPM repo over file:// ---------------
FROM fedora:latest AS verify-rpm
COPY --from=aggregate /work/public /public
RUN rpm --import /public/jcrenshaw.asc \
    && printf '%s\n' \
         '[jcrenshaw-verify]' \
         'name=jcrenshaw verify' \
         'baseurl=file:///public/rpm' \
         'enabled=1' \
         'gpgcheck=1' \
         'repo_gpgcheck=1' \
         'gpgkey=file:///public/jcrenshaw.asc' \
         > /etc/yum.repos.d/jcrenshaw-verify.repo \
    && dnf install -y cosmic-ext-applet-tempest \
    && rpm -q cosmic-ext-applet-tempest \
    && touch /verified-rpm

# --- serve: nginx static, gated on both verify stages -----------------------
FROM nginx:alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=aggregate /work/public /usr/share/nginx/html
# These two COPYs pull both verify stages into the build graph. Without them
# Docker would skip the unreferenced verify stages and the gate would be dead.
COPY --from=verify-apt /verified-apt /tmp/verified-apt
COPY --from=verify-rpm /verified-rpm /tmp/verified-rpm
EXPOSE 80
