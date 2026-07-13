---
title: "The Gap Between Looking Finished and Being Finished"
slug: "the-gap-between-looking-finished-and-being-finished"
type: post
status: published
visibility: public
featured: false
excerpt: "The code was broken, but that's not the real problem. The developers copied code they didn't understand, didn't review, and if they did, they didn't or couldn't understand what they were reviewing. That is the problem."
created_at: 2026-04-09T19:51:00.000Z
updated_at: 2026-04-09T20:12:05.000Z
published_at: 2026-04-09T20:12:05.000Z
authors:
  - "John Crenshaw"
tags:
  - "software"
  - "code"
  - "ai"
---

<p>I've audited two applications posted in Linux communities over the past few months. Both had critical security flaws and showed the fingerprint of AI generation. Neither developer understood what they'd shipped. The code was broken, but that's not the real problem. The developers copied code they didn't understand, didn't review, and if they did, they didn't or couldn't understand what they were reviewing. That is the problem.</p>
<p>When you ship code you didn't write and can't evaluate, you can't recognize a valid security flaw. The developer of an app I audited initially denied the flaw existed. When I pressed him to look at the source, he insisted I was wrong. Only when I showed him the exact lines of code and pointed him to the installer script in his own repository did he realize what his application actually did. He had no idea a service was being auto-installed. He didn't understand the architecture of his own application. To make matters worse, this wasn't a minor flaw. It was a critical privilege escalation vulnerability. Any local user, any app, any browser tab running on the machine could exploit it to become root.</p>
<p>AI-assisted coding tools aren't the problem. How you use them is. And yes, there are legitimate concerns about how these models were trained, but that's a separate conversation. I tested an AI model against a threading problem I'd solved years before. The problem was straightforward: read data from a queue, hand it to a worker thread, wait for the response, move the data forward. But the system it needed to handle was complex. Six controller threads, each spawning their own workers, all pulling from the same queue. Any blocking would tank the whole system. The AI generated code that under testing worked but couldn't scale or handle any kind of load. I knew from experience what was actually needed. An adaptive threading model that monitored queue depth and system resources, dynamically scaling workers as load increased. The difference between those two outcomes wasn't the AI. It was me. I knew the problem deeply enough to recognize what was wrong and to direct a better solution.</p>
<p>The real issue isn't AI. It's expertise. AI amplifies what you already know. Without deep knowledge of your domain, it amplifies your mistakes. With it, it amplifies your capabilities. That's the middle ground between the hype and the fear.</p>
