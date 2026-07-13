---
title: "They're Not Building Child Safety. They're Building Infrastructure."
slug: "theyre-not-building-child-safety-theyre-building-infrastructure"
type: post
status: published
visibility: public
featured: false
excerpt: "Before this law, your operating system had no idea how old you were. That data relationship did not exist. Once you've built that pipe, you don't get to unscrew it."
created_at: 2026-03-06T13:11:50.000Z
updated_at: 2026-03-06T13:17:31.000Z
published_at: 2026-03-06T13:17:31.000Z
authors:
  - "John Crenshaw"
tags:
  - "linux"
  - "civil-liberties"
  - "Privacy"
  - "open-source"
---

<p>California signed AB 1043 into law last October. It takes effect January 1, 2027. The coverage has mostly been about whether Linux distros can comply, which is an interesting technical question and almost entirely the wrong one.</p>
<p>Let me tell you what this law actually does.</p>
<p>Starting next year, every operating system provider in California has to collect your age or date of birth during device setup and transmit an age bracket signal to any app developer who requests it, via a real-time API. Four brackets: under 13, 13 to 15, 16 to 17, 18 and up. The definition of "operating system provider" is anyone who develops, licenses, or controls the operating system software on a computer, mobile device, or any other general-purpose computing device. That's iOS, Android, Windows, macOS, Linux distributions, and SteamOS — and Ubuntu, Fedora, and Linux Mint are already trying to figure out what to do about it.</p>
<p>Vanilla Arch has no account setup flow, no app store, no API to implement, and no legal entity a regulator can serve. You can't subpoena a makepkg script. That's worth knowing. It's still not the point.</p>
<p>I've spent four plus decades in backend systems. Payment processing, HIPAA-compliant infrastructure, air-gapped architectures. I've built identity verification systems. Not audited them, not read whitepapers about them. Built them. So when somebody tells me this law creates an "encrypted age signal" I don't hear reassurance, I hear a question: who holds the keys? What does the API call log contain? How long is it retained? What happens when the developer gets acquired, or breached, or subpoenaed by a jurisdiction with different rules than California?</p>
<p>The law doesn't answer any of that. It leaves implementation to Apple and Google, two companies that have demonstrated, over and over, that their interests and your privacy interests are not the same thing.</p>
<p>Here's what I know about infrastructure from a career's worth of building it. You build a pipe, and eventually someone figures out what else they can push through it. The original scope never survives contact with the next administration, the next acquisition, the next legal demand from a foreign government. Before this law, your operating system had no idea how old you were. That data relationship did not exist. AB 1043 mandates it into existence for 40 million people, and once you've built that pipe, you don't get to unscrew it. Today it carries age brackets. What it carries in five years depends on who controls it and what laws get passed between now and then.</p>
<p>The people pushing back on this will tell you kids will just use VPNs anyway, so the law is harmless. That argument proves too much. An ineffective surveillance system is still a surveillance system. If it doesn't stop kids from accessing content, then the only thing it actually accomplishes is mandating OS-level identity infrastructure for everyone else. That's not a side effect. That's the outcome.</p>
<p>Anonymous access to information is a First Amendment value. Courts have recognized it. This law doesn't restrict content directly. It restricts access to an anonymous computing environment. That's a more subtle attack on the same principle, and it's harder to litigate because the harm is diffuse and the mechanism is technical. Most people don't know what an OS-level API does. The legislators who wrote this clearly didn't either. Governor Newsom admitted the law needed more work in the same statement where he signed it, which should tell you something about how well-thought-through it is.</p>
<p>New York has several bills working through the legislature along the same lines. S8102 is essentially the same device-level concept as AB 1043. S4609A targets platforms specifically. S3591 goes after pornography sites, which is narrower and has more political appetite behind it. None of them have passed. If California's law survives the constitutional challenges that are already being prepared, New York follows. If it gets enjoined, New York stalls. Watch the courts more than the legislatures on this one.</p>
<p>The Linux-specific risk that nobody is talking about isn't a regulator going after Arch Linux Trust. It's that age signal APIs become standard plumbing that developers require, and Linux ends up locked out of content platforms because it can't provide a verified signal. That's a slow-moving exclusion that will look like a technical incompatibility and function like a policy decision.</p>
<p>I'm not saying Microsoft wrote this bill. I'm saying Microsoft doesn't need to write a bill to benefit from it. In 1998 a series of internal Microsoft memos leaked — the Halloween Documents, later confirmed genuine — that showed their engineers explicitly strategizing about how to neutralize Linux as a competitive threat. Not by building better software. By "de-commoditizing" open protocols, extending standards with proprietary additions until open source projects couldn't keep up. They understood then that you don't have to attack Linux directly. You just have to make the ecosystem require things that Linux can't easily provide. Age signal APIs that only Apple, Google, and Microsoft can realistically implement at scale are exactly that kind of requirement. Nobody has to be scheming for the outcome to be the same. But if you've read the Halloween Documents, you know this industry has a confirmed paper trail of sitting down and explicitly planning for exactly this kind of structural exclusion. Pattern recognition isn't paranoia. It's paying attention.</p>
<p>I spent a long time building things on other people's platforms because that's what the work required. I know what it looks like when infrastructure gets built for one purpose and used for another. I know what it looks like when the people making the decisions aren't the ones who have to live with the consequences. This is that.</p>
<p>I'm not against protecting kids online. I'm against building a permanent identity layer into the operating system under the guise of protecting kids, because that infrastructure will outlast the political moment that created it and will be used for things nobody in that California committee room ever imagined.</p>
<p>That's not speculation. That's just how pipes work.</p>
