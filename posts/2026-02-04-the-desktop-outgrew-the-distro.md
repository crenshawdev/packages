---
title: "The Desktop Outgrew the Distro"
slug: "the-desktop-outgrew-the-distro"
type: post
status: published
visibility: public
featured: false
created_at: 2026-02-04T19:10:03.000Z
updated_at: 2026-02-04T19:11:35.000Z
published_at: 2026-02-04T19:11:35.000Z
authors:
  - "John Crenshaw"
---

<p>I loved Pop!_OS and ran 22.04 for years. System76 built something special with that distro, and when they announced they were writing a new desktop environment from scratch in Rust, I was all in. Three years of alphas and betas later, COSMIC shipped in December 2025 and it's everything they promised: fast, stable, with tiling that actually works without a PhD in config files.</p>
<p>Here's the problem: COSMIC is moving faster than Pop can carry it.</p>
<p>Pop!_OS 24.04 dropped in December, and System76 keeps the kernel and NVIDIA drivers current. I'm looking at 6.17.x and the 580 series drivers right now, so that's not the issue. The issue is everything else. Pop is built on Ubuntu 24.04, which means the repos are from April 2024. Mesa, GTK, glibc, toolchains, libraries—nearly two years old. System76 can ship their own kernel, but they can't fork every package in the Ubuntu repos.</p>
<p>Meanwhile, COSMIC is getting point releases every few weeks. Version 1.0.3 landed in mid-January, 1.0.4 came a few days later, and 1.0.5 just dropped. The desktop is evolving at rolling-release speed while the underlying system is frozen in time. If you're doing Rust development on COSMIC itself, this matters. You want current tooling and libraries that were built this year, not dependency hell because rustc in the repos is 22 months old.</p>
<p>System76 didn't build COSMIC just for Pop. It's already in the official Arch repos, Fedora has it, and NixOS has it too. They want it to spread because that's how you build an ecosystem. So I stopped fighting the mismatch.</p>
<p>Vanilla Arch. COSMIC selected right in archinstall. As of version 3.0.15, it's a standard option now with no flags or workarounds required—just pick it from the menu. The result is COSMIC running on a base that actually keeps pace with it. When System76 ships a fix, I get it. When Mesa updates or a library gets a security patch, I get it. The desktop and the system move together instead of one waiting for the other.</p>
<p>My setup ended up being vanilla Arch with Limine as the bootloader because it's lightweight, fast, and plays nice with BTRFS snapshots. BTRFS on all drives with compression enabled. I run two kernels: Zen for daily coding work because it's stable with good latency, and the CachyOS kernel for gaming with the BORE scheduler and optimizations tuned for that workload. I just swap at the boot menu depending on what I'm doing.</p>
<p>Here's the trick though. You can add the CachyOS optimized repos to vanilla Arch without running CachyOS. They compile packages for x86-64-v3, x86-64-v4, and Zen4 architectures. On a Ryzen 9 9800X3D, that's a measurable performance bump—Phoronix benchmarked it at 5-20% depending on the workload. Same packages, compiled for your actual hardware. So I get the purity and control of vanilla Arch, the desktop philosophy of System76, and the performance tuning of CachyOS. Best of all three worlds.</p>
<p>COSMIC scratches the tiling itch that Hyprland fills for a lot of people, but Hyprland has a maintenance problem. I've been doing this for 43 years, and one principle has never failed me: thou shalt not break API. Hyprland breaks things constantly. Every major update can blow up your plugins, your configs, sometimes basic functionality. If you're running Hyprland, you accept that your setup might need fixing after any update. COSMIC gives you tiling without the maintenance tax, and it's backed by a company that sells hardware. System76 can't afford to ship something that breaks their customers' workflows, and that's skin in the game.</p>
<p>Vaxry wrote a critical blog post when COSMIC was in alpha, calling it buggy and goalless while complaining that the devs were dismissive of his bug reports. Worth noting: he's the Hyprland dev. A competitor showing up during your alpha to file bugs and then complaining publicly that you weren't receptive enough might have an ax to grind. Since the 1.0 stable release? Radio silence. The criticism aged poorly.</p>
<p>I'm not abandoning System76. I'm running their desktop every day, I bought my Thelio and my laptop from them, and I'll probably buy more. But the desktop outgrew the distro. COSMIC is too good to be held back by Ubuntu's release cadence. System76 can maintain the kernel and drivers, but they can't outrun Canonical's repos for everything else. The math doesn't work.</p>
<p>Pop!_OS 26.04 might change the equation. They've said they're aligning with Ubuntu's release timing going forward, which means faster turnaround, but that's still point releases tied to LTS cycles. COSMIC is moving at a different pace.</p>
<p>If you love COSMIC and you're feeling the friction of stale packages, you don't have to wait. The desktop works on Arch, Fedora, and wherever else you want to put it. That's the whole point. System76 built COSMIC to travel. So can you.</p>
