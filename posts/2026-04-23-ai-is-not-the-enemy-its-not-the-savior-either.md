---
title: "AI Is Not the Enemy. It's Not the Savior Either."
slug: "ai-is-not-the-enemy-its-not-the-savior-either"
type: post
status: published
visibility: public
featured: false
created_at: 2026-04-23T15:20:15.000Z
updated_at: 2026-04-23T15:22:48.000Z
published_at: 2026-04-23T15:22:48.000Z
authors:
  - "John Crenshaw"
---

<p>Some developers reject AI-generated code outright. Some embrace it uncritically. Both are missing the point.</p>
<p>I've recently audited two applications posted in Linux communities. Both had critical security flaws and carried the fingerprint of AI generation, and neither developer understood what they'd shipped. When I flagged a privilege escalation vulnerability to one of them, he denied it existed. I had to point him to the exact lines in his own repository, in an installer script he hadn't read, before he realized his application was silently installing a service that let any local user, any app, any browser tab running on that machine become root.</p>
<p>He didn't know, but he shipped it anyway.</p>
<p>That's the story people point to when they want to argue AI coding is dangerous, and in that specific case it is. But the danger isn't the AI, it's that the developer couldn't evaluate what he was publishing. Hand any developer code they can't evaluate, written by a human or a machine, and they'll ship it with the same flaw. The tool didn't create the gap between looking finished and being finished, it just made it easier to cross.</p>
<h2 id="the-purity-stance">The purity stance</h2>
<p>Some open source projects have responded to this by banning AI contributions outright, refusing PRs that look AI-generated and requiring contributors to attest that their code is human-written. The logic is defensible: we can't verify the contributor understands what they submitted, so we reject the risk entirely. From a maintainer's seat, you can't audit every line of every PR, and if AI-generated code is more likely to hide flaws the author doesn't understand, treating it as radioactive is a reasonable defense.</p>
<p>But it's also a position of privilege. These maintainers can afford to turn away contributions because they have enough volunteers, enough eyes, and enough time. The cost of a blanket ban is low for them, but it's not low for everyone.</p>
<h2 id="the-shortcut-stance">The shortcut stance</h2>
<p>The other extreme is worse. There's a growing population of developers who treat AI as a substitute for the skill they haven't built yet, prompting and pasting and shipping code they can't evaluate because it looks like working code and they have no way to tell when it isn't.</p>
<p>This isn't a personality flaw, it's economic pressure meeting a seductive tool. If you're in a country where a developer salary changes your family's trajectory, and you're competing against people with ten years of experience, and there's a tool that promises to close that gap overnight, you're going to reach for it. The problem is the gap doesn't close so much as it hides.</p>
<p>I'm seeing a flood of packages in AUR and similar ecosystems that carry the same fingerprint: plausible structure, confident syntax, subtle brokenness. The authors don't know the code is broken because they couldn't have written it themselves, and they're shipping what looks like competence without the thing underneath it. That hurts the developers building portfolios on sand, the users installing software that doesn't do what they think, and the ecosystem that ends up absorbing the maintenance burden.</p>
<h2 id="what-the-binary-misses">What the binary misses</h2>
<p>Both camps are arguing about the wrong thing. The question isn't whether AI wrote the code, it's whether the person shipping it understands what it does.</p>
<p>I've used AI on a threading problem I'd already solved years before. The system was complex: six controller threads, each spawning workers, all pulling from the same queue, and any blocking would tank the whole thing. The AI produced code that worked in testing but collapsed under any real load. I recognized what was missing because I'd built the solution before, and what it needed was an adaptive threading model that monitored queue depth and system resources and scaled workers dynamically. I directed the tool toward that and got there faster than writing it from scratch. Same tool, different outcome, and the difference was me.</p>
<p>This is what the purity crowd misses. AI in the hands of someone who understands the problem is a force multiplier, not a liability, and rejecting all AI-assisted contributions throws out legitimate work alongside the garbage. It treats the tool as the threat when the threat is and always has been shipping code you don't understand.</p>
<p>This is what the shortcut crowd misses. AI in the hands of someone who doesn't understand the problem produces confident-looking garbage they can't evaluate. The output feels like progress but you haven't learned anything, you haven't solved anything, and when it breaks you'll have no idea why.</p>
<p>The thing nobody wants to say because it sounds elitist is that expertise still matters, and it matters more now than it did before. The tools don't replace it, they amplify whatever direction you're already pointed.</p>
<h2 id="the-harder-conversation">The harder conversation</h2>
<p>The developers in poorer countries reaching for AI aren't villains, they're responding rationally to a system that rewards the appearance of productivity. The answer isn't to lecture them about craft, it's to be honest about what these tools can and can't do. They can accelerate people who already know what they're doing. They cannot substitute for the years of failure, debugging, and pattern recognition that produce real engineers. A developer who leans on AI without building the underlying skill is digging a hole they'll eventually have to climb out of, usually at the worst possible moment.</p>
<p>And the projects rejecting AI contributions wholesale are making their own mistake by treating provenance as a proxy for quality when the real signal is understanding. A PR from someone who can defend every line, explain every tradeoff, and debug the result when it breaks is valuable regardless of what helped them write it. A PR from someone who can't do those things is worthless regardless of whether a human or a machine produced it.</p>
<p>The tools aren't the problem, they never are. The problem is the gap between looking finished and being finished, and that gap has existed for as long as software has. AI just made it easier to fake.</p>
<h2 id="what-actually-works">What actually works</h2>
<p>Use the tools, but don't trust them. Read every line they produce and understand why it's there, because if you can't, you're not ready to ship it and no amount of apparent productivity changes that. Build the underlying skill anyway, because the tools can't think for you when the edge case hits production at three in the morning.</p>
<p>For maintainers: stop asking whether AI wrote the code and start asking whether the author understands it. That's harder to verify, but it's the right question.</p>
<p>For developers reaching for AI as a shortcut: the shortcut doesn't exist. The tool can make you faster at work you already know how to do, but it cannot teach you the work, and pretending otherwise costs you time you can't afford to lose.</p>
<p>The binary is the blindspot. Reject AI entirely and you throw out legitimate acceleration for experienced developers, embrace it uncritically and you ship code nobody understands. The middle isn't a compromise, it's the only position that survives contact with reality.</p>
