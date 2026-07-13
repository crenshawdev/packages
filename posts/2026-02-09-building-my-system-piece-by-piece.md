---
title: "Building My System, Piece by Piece"
slug: "building-my-system-piece-by-piece"
type: post
status: published
visibility: public
featured: false
excerpt: "My career in backend development taught me how systems work from the inside out, but I spent those years using systems other people built. Now I get to ask what if we did it differently, and actually find out"
created_at: 2026-02-09T22:57:45.000Z
updated_at: 2026-02-09T23:11:44.000Z
published_at: 2026-02-09T23:11:44.000Z
authors:
  - "John Crenshaw"
tags:
  - "arch"
  - "open-source"
  - "btrfs"
---

<h1 id="building-my-system-piece-by-piece">Building My System, Piece by Piece</h1>
<p>In <a href="__GHOST_URL__/still-skidding-broadside/">Still Skidding Broadside</a> I wrote about spending 43 years using other people's tools and finally getting to build my own system in retirement. Here's how I layer CachyOS repos on vanilla Arch, why I run dual kernels, and what BTRFS snapshots have to do with staying sane on a rolling release.</p>
<h2 id="starting-with-vanilla-arch">Starting with Vanilla Arch</h2>
<p>I started with vanilla Arch, not Manjaro or EndeavourOS or one of the "easy Arch" derivatives, just plain Arch. Throughout my career I've used a lot of systems other people configured, like Windows desktops across multiple companies, four years working on an AWS transition, company data centers before that. They all worked, most of them worked well, but I never really knew what was under the hood because someone else made those choices and I just lived with them.</p>
<p>Retirement meant I could finally build something from scratch, learn what actually matters and what's just noise, understand the pieces before I put them together. That said, I'm not a masochist, so I used archinstall to handle the setup. I picked manual partitioning and set up the BTRFS subvolumes myself based on what Arch recommends, giving myself a 24GB EFI partition because if I'm building this thing I might as well never worry about running out of boot space. Let archinstall set up Limine as the bootloader and get me to a working desktop. No shame in using good tools when the point isn't to prove I can do everything by hand but to understand what those pieces do and why they're structured that way.</p>
<p>The BTRFS layout has @ holding root with @home, @log, @pkg all separate, plus Limine as the bootloader which is simpler than GRUB with no auto-generation complexity, and linux-zen kernel which comes desktop-optimized from the start. Good bones to build on.</p>
<h2 id="layering-cachyos">Layering CachyOS</h2>
<p>Once I had a working base, I added the CachyOS repositories, which recompile Arch packages targeting x86-64-v3 and x86-64-v4 feature levels along with compiler optimizations including LTO, PGO, and BOLT. On my Ryzen 7 9800X3D the theory is you get 5-20% performance gains, though the reality turns out to be more nuanced than the benchmarks suggest.</p>
<p>I added them with their automated script, downloaded it and ran <code>./cachyos-repo.sh</code>, which detected my CPU's instruction set and configured pacman in maybe two minutes. Did I see massive speed improvements in day-to-day use? Not really. Opening my browser, editing code, running <code>pacman -Syu</code> all feel the same as before.</p>
<p>But compiling Rust projects is where I notice the difference, not in raw speed numbers I never bothered measuring, but in the fact that I can keep working on other things without feeling any lag while a heavy build runs in the background. That's what actually matters when you're iterating through development cycles.</p>
<p>The performance claims aren't lies, they're just workload-dependent in ways the benchmarks don't always make clear. If you spend your day in a terminal and a browser, you probably won't notice much difference, but if you're compiling large codebases regularly, the gains can be real.</p>
<p>I kept the repos enabled because they don't hurt anything and occasionally they help, though if they caused problems I'd drop them without hesitation.</p>
<h2 id="running-two-kernels">Running Two Kernels</h2>
<p>I run two kernels on this system, linux-zen for daily work and linux-cachyos for gaming. linux-zen is Arch's desktop-optimized kernel with low-latency patches, the BFQ I/O scheduler, and CPU scheduling tweaks built specifically for interactive workloads, prioritizing responsiveness over raw throughput.</p>
<p>linux-cachyos uses the BORE scheduler, which stands for Burst-Oriented Response Enhancer and works by tracking how much CPU time a task burns before yielding, then adjusting priorities dynamically to keep interactive tasks responsive even when background processes are hammering the CPU.</p>
<p>In practice, Zen handles my normal workflow fine. Coding, browsing, watching videos all stay smooth without any issues. But when I'm gaming and running other stuff in the background like Discord and Steam, BORE handles the chaos better with no stuttering, no audio dropouts, and the game staying responsive while everything else keeps running.</p>
<p>Is it placebo? Maybe, though I've got the disk space for two kernels and switching between them in the Limine boot menu takes all of three seconds, so I keep both around. Installing a new kernel is automatic anyway thanks to the limine-mkinitcpio-hook, which updates the boot menu entries whenever pacman installs a kernel without any manual config file editing.</p>
<h2 id="btrfs-snapshots-as-safety-net">BTRFS Snapshots as Safety Net</h2>
<p>Running a rolling release without snapshots is like walking a tightrope without a net, you can do it and lots of people do, but one bad update and you're rebuilding from scratch. I use Snapper with the archinstall default layout where the .snapshots subvolume lives inside @, not beside it like some guides recommend.</p>
<p>Some older guides will tell you this is wrong, that you need the OpenSUSE-style layout with .snapshots as a sibling to @ for proper rollbacks, but those guides are outdated now. With btrfs-assistant and limine-snapper-sync, the archinstall layout works perfectly fine for rollbacks without any manual intervention.</p>
<p>When I update the system, snap-pac creates automatic before and after snapshots that show up in the Limine boot menu if I ever need them. I tested the rollback process early on by installing KDE to try it out, hated it, opened btrfs-assistant while the system was running, selected the snapshot from before I installed KDE, clicked restore, rebooted, and I was back to where I started. Then I tried GNOME, found it boring, and rolled back the same way. The whole process takes maybe two minutes and works exactly like it should.</p>
<p>That's what good infrastructure does, it stays invisible until you need it, and then it just works without making you think about the mechanics.</p>
<h2 id="custom-subvolumes-and-ramdisk">Custom Subvolumes and Ramdisk</h2>
<p>Beyond the base setup, I created custom BTRFS subvolumes on a separate 4TB drive for @code, @storage, @games, and @symlinks. I keep these separate because I don't want my Rust projects or Steam library included in root snapshots, they're large, they change constantly, and rolling them back makes no sense when snapshots are meant for the system, not user data.</p>
<p>The @symlinks subvolume holds directories I symlink into my home folder like Downloads, Documents, .ssh, and .gnupg for the same reason. These shouldn't be part of system snapshots, but I want them on BTRFS anyway for compression and data safety without the snapshot overhead.</p>
<p>For @code, @storage, and @games, I set the nodatacow attribute (<code>chattr +C</code>) because these directories have files that change frequently and don't benefit from BTRFS copy-on-write behavior. Database files, game assets, compiled binaries, they're better off without COW overhead.</p>
<p>I also set up a 12GB ramdisk mounted at <code>/mnt/ramdisk</code> for Cargo build targets and browser cache, because Rust compilation generates massive amounts of temporary files and browsers write cache constantly. Building on RAM instead of SSD reduces wear on the drives while also being faster. When I'm done coding for the day or close the browser, the ramdisk contents disappear, which is fine because I don't need them since the actual source code lives on the SSD where it belongs.</p>
<p>This is the kind of tuning you can do when you understand the pieces well enough to know what you actually need. It's not about following a guide or copying someone else's setup, it's about knowing your workflow and building the infrastructure around it instead of adapting your workflow to fit someone else's infrastructure.</p>
<h2 id="control-over-defaults">Control Over Defaults</h2>
<p>My career in backend development taught me how systems work from the inside out, but I spent those years using systems other people built, Windows desktops and corporate infrastructure where the decisions were already made and the tools were already chosen. I never got to ask "what if we did it differently?" because the infrastructure was already there.</p>
<p>Building this Arch system from vanilla up, choosing each piece and understanding what it does before deciding whether to keep it, that's what I wanted retirement for. Not because vanilla Arch is objectively better than the alternatives or because there's some moral superiority in doing things the hard way, but because building it myself means I know every layer of the stack.</p>
<p>When something breaks, I know where to look. When I want to change something, I know what's safe to touch and what will cascade into other systems. CachyOS repos for optimized packages when they matter, dual kernels for different workloads, BTRFS snapshots for safety, custom subvolumes for workflow optimization, ramdisk for performance where it counts.</p>
<p>None of this is magic or rocket science, it's just paying attention to what I actually need instead of accepting what came in the box and hoping it matches my use case. This is the starting point, the foundation that actually works the way I need it to work, and now I can build the desktop environment on top of it.</p>
<p>That's next time.</p>
