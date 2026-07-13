---
title: "Flathub Banned the Wrong Thing"
slug: "flathub-banned-the-wrong-thing"
type: post
status: published
visibility: public
featured: false
excerpt: "Flathub had a real slop problem and aimed at the wrong target. The line was never AI or no-AI. It's whether the person shipping the code can read it and stand behind it."
created_at: 2026-06-07T16:30:00.000Z
updated_at: 2026-06-07T16:30:00.000Z
published_at: 2026-06-07T16:30:00.000Z
authors:
  - "John Crenshaw"
tags:
  - "ai"
  - "flathub"
  - "flatpak"
  - "open-source"
  - "linux"
  - "software"
---

<p>On May 29th Flathub rewrote its submission policy to forbid AI-generated and AI-assisted work, and they didn't stop at the source code. The ban covers the whole pipeline, the manifest, the metadata, the patches, the build scripts, the pull request itself. Touch any of it with a model or an agent and the submission is out. I read that and my first reaction wasn't anger. It was recognition. They are not wrong that there's a problem. They're aiming at the wrong part of it.</p>

<p>Let me say the thing the people on my side of this would rather I didn't. The flood is real. Linus Torvalds said the kernel's private security list went from two or three reports a week a couple of years ago to five or ten a day, most of them duplicates of each other, a dozen researchers all running the same AI tooling and filing the same bug, and he called the result almost entirely unmanageable. I believe him, because I've gone through that output too. I've audited AI-written applications with severe flaws in them, the kind that leak a stranger's data or hand a local user root, and the authors had no idea. Flathub is responding to something that exists. The slop is not a myth.</p>

<p>I've been writing software since the 80s, most of it below the line users ever see. EPROM tooling, in C++, against Intel silicon that hadn't shipped yet. Retinal biometric access control for Defense Department facilities, hundreds of installations in the field. Later, the payment providers that move debit, credit, and ACH transactions, where a mistake doesn't come back as a one-star review, it comes back as someone's money in the wrong account. A decade ending at Salesforce writing the SMPP-over-TCP/IP service that pushed Marketing Cloud's text messages to the carriers at platform scale. I'm retired now and I write Rust because I want to. I use AI to help me do it, and I read every line it gives me before any of it goes anywhere. That last part is the whole argument.</p>
<p>Here's what the dangerous apps had in common, and it wasn't the tool. I wrote about this in <a href="/posts/ai-is-not-the-enemy-its-not-the-savior-either">AI Is Not the Enemy. It's Not the Savior Either.</a> and Flathub apparently needs to hear it again: every one of them was shipped by someone who couldn't read what they'd shipped. One developer swore the privilege-escalation flaw I'd found didn't exist, right up until I pointed him at the exact lines in an installer script in his own repository. He didn't know his app was quietly installing a root service. He couldn't have known. He couldn't read it.</p>
<p>The line that matters was never AI or no-AI. It's whether the person shipping the thing can read what came out, find the flaw, and answer for it when it breaks at three in the morning. A policy that can't tell a career systems engineer using a model from someone pasting whatever the chat window handed back is measuring the wrong thing, and you don't get to quality by enforcing the wrong measurement harder.</p>

<p>I read every line by hand and I approve every commit, every pull request, every merge into my own repos, because my name is on them. Several of those repos carry a <code>.claude/</code> directory right out in the open, because I'm not hiding how the work gets done. What I don't do is bolt a "co-authored by a model" trailer onto a commit so I can look honest while the review that matters never happened. Who typed it was never the question. Who answers for it is, and on my projects that's me.</p>
<p>Keeping bad code away from the people who install my software was never one decision. It's a row of gates, and the gates are older than the AI by decades.</p>

<p>I spec the thing before I build it. I read every line, mine or the model's, the source doesn't change the job. The tests have to pass. CI won't go green on a broken build, so a bad commit can't quietly become a release. Before anything merges I run a second model over the diff, a local Ollama instance, qwen2.5-coder:14b, an independent reviewer with no stake in how I feel about my own code. Then a security pass. Releases get signed. Distribution is staged. Nothing reaches a user that hasn't cleared all of it.</p>

<p>That's four decades of habit. The only thing AI changed is how fast the first draft shows up.</p>

<p>Engineers run that gauntlet without thinking about it, because to us it's just what shipping means. The people drowning Flathub don't run it, and not because they're lazy. They don't know it's there. Nothing in a chat window tells you the gauntlet exists, so they get something that looks finished and they push it, and the distance between looking finished and being finished goes out the door with their name on it. What Flathub is buried under isn't AI code. It's ungated code. The gates were always the job.</p>
<p>Now set that next to what the rest of the industry is telling the same people. Open source is banning AI from the bottom while the companies signing these developers' paychecks are mandating it from the top. Marc Benioff, who signed mine for ten years, says AI is now doing up to half the work at Salesforce. Satya Nadella put twenty to thirty percent of Microsoft's code on it. Sundar Pichai said north of thirty percent at Google. Some of these shops run usage quotas and internal leaderboards that rank engineers by how much AI they use. So a developer can spend his week being measured on AI output and then watch a project he contributes to on the weekend tell him the same tool makes him unwelcome. Both messages can't be right, and the whiplash lands on one person.</p>
<p>Banning the tool is easier than holding a standard, and that's the whole appeal. A standard means reading submissions, judging whether the person understood what they sent, and being willing to be wrong about it. A ban means writing one sentence. So they wrote the sentence, and then they wrote themselves a way out: exceptions "may be granted for mature, well-maintained projects." No process. No timeline. No criteria. Just a door that opens for projects that already have standing and stays shut for everyone else.</p>

<p>That gives the game away. If the tool were really the problem, an established project using it would be just as disqualified as a newcomer. It isn't, because the problem was never the tool. It's trust, and they'll extend trust to people who already have it and withhold it from people who don't. I understand the instinct. I don't mistake it for a technical rule.</p>

<p>And it won't even work, because the people who won't stop using AI, which is most of them, just won't say so. They'll scrub the fingerprints and submit it clean. The policy lands hardest on exactly the wrong people. It would bounce me, who ships a <code>.claude/</code> directory in the open and reads every line, while a closed shop that strips every trace and ships output nobody read walks right past it. It punishes the disclosure and rewards the hiding.</p>
<p>The better answer isn't theoretical. It's written down and running. In April the Linux kernel, after months of fighting about it, did the obvious thing. AI-assisted code is allowed. It can't ride in under a Signed-off-by, because a model can't take legal responsibility, so it gets an Assisted-by tag instead, and the human who submits it owns every line and every bug that falls out of it. The tool is permitted. The accountability is mandatory. QEMU, one of the most security-sensitive codebases on the planet, moved the same direction, with Paolo Bonzini proposing to allow AI for mechanical changes, tests, docs, and fixes under twenty lines. His reasoning is the part Flathub should read: a blanket ban was easy to maintain while the output was rarely usable on its own, but as the tools improved an absolute prohibition got harder to justify.</p>

<p>Flathub reached for the ban anyway. I get it. The ban is right there, and pulling it feels like doing something.</p>
<p>My guess is they walk it back. Not with an apology, just quietly, the way stale rules always go, once it reads a year from now the way the old "Wayland isn't ready" posts read today, frozen at the moment they were written while everything moved on around them. Whatever replaces it will look a lot like the kernel's rule, pointed forward instead of swung in anger.</p>

<p>I didn't wait to find out, and I didn't argue in the comments. I stood up my own Flatpak repository in an afternoon, one GPG key as the trust root for everything I publish, and I shipped Tempest 2.8.6 through it the same week. Self-hosting isn't a tantrum. It's one more gate, and it's one I hold instead of handing my trust to a gatekeeper who can't tell an engineer from someone pasting what a chat window gave back.</p>

<p>They had a real problem and grabbed the nearest lever. It was the wrong one. The right one was sitting in plain sight the whole time, the same one it has always been: whether the person shipping the code can stand behind it.</p>

<p>I can. So I shipped.</p>
