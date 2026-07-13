---
title: "The Gap Runs Both Ways"
slug: "the-gap-runs-both-ways"
type: post
status: published
visibility: public
featured: false
created_at: 2026-05-06T23:30:00.000Z
updated_at: 2026-05-06T23:30:00.000Z
published_at: 2026-05-06T23:30:00.000Z
authors:
  - "John Crenshaw"
---

<p>Expertise matters more with AI in the room, not less. I argued that and I stand by it. What I missed is a piece of what expertise around AI means.</p>

<p>The argument I made was about expertise on the output side. Knowing what to look for in code you didn't write, being able to tell when code that runs is still broken, having the pattern memory to direct the tool toward an answer that holds up in production. That part is still right. What I left out is the input side. There's a layer of expertise about the AI tooling itself, what it can do, what it can't, how it costs, how to operate it, that has nothing to do with the code it produces and everything to do with whether you're using the thing at all.</p>

<p>Most people calling themselves AI users haven't met that layer. They're working a chat box, and the chat box is a fraction of what's there. I was the same a month ago.</p>

<h2 id="what-the-chat-box-hides">What the chat box hides</h2>

<p>Skills are the first thing. Not prompt sugar, not templates, not "system prompts you can save and reuse." Enforcement gates. A skill in a properly set up agent is a gate the agent has to pass through, and if the gate fails the work doesn't move. TDD that has to pass, code review that has to clear before the work moves on, workflows that fail loudly when something tries to skip them. What I'd been doing in the chat box for a year was a small fraction of what was possible, and I didn't know it because nothing in the chat box told me skills existed.</p>

<p>Tokens are the second thing. They're not a free resource and they're not a metering trick, they're a budget. Every prompt is a bet on whether the answer is worth what it costs to produce. Burning a heavy model on a rote edit is wasted capital, the same way running an enterprise database on a t-shirt-sized server is wasted capital. The chat box hides this because in the chat box you don't see what you're spending. A serious workflow does see it, and pretending the cost isn't there means losing it.</p>

<p>Agents are the third. Inside an agent there's a per-task model knob, which is a way of saying the agent can call a different model for different jobs and the operator controls which goes where. Heavy model for the parts that need judgment, planning a multi-step change, reading a tricky stack trace, deciding what tests to write. Light model for the mechanical work, applying a known edit across thirty files, formatting, lint sweeps. Match the model to the job and the same budget goes much farther. This is craft. There's no shortcut to learning it that doesn't involve doing it wrong a few times and watching the meter.</p>

<h2 id="the-chat-box-is-what-they-show-you">The chat box is what they show you</h2>

<p>None of that is visible from the chat box. The product hands you a text input and a response, and that's the whole interface. Nothing in it tells you those layers exist. People in the chat box aren't lazy or stupid for not finding the rest, they're operating the entry point they were given. "AI doesn't work" is a reasonable verdict from inside the chat box, because from inside the chat box it doesn't work well. It works enough to look impressive on a demo and not enough to ship anything serious.</p>

<p>The thing past the chat box does work, and it works hard. It just isn't where the marketing arrows point.</p>

<h2 id="the-gap-runs-both-directions">The gap runs both directions</h2>

<p>I wrote in <a href="/posts/ai-is-not-the-enemy-its-not-the-savior-either">AI Is Not the Enemy. It's Not the Savior Either.</a> that the binary of "ban AI" or "trust AI" is the wrong fight, and the real signal is whether the developer shipping the code understands what it does. That argument was about the output side, evaluating what the tool produced. The same gap runs the other direction. Knowing what the tool is capable of is part of being able to evaluate what it produced, because if you don't know the ceiling you can't tell when the tool isn't reaching it.</p>

<p>A developer who has only operated the chat box and hands me code from one of those sessions has no way to tell me whether it's the best the tool could have done, because the tool can do far more than that interface exposes. They're showing me the floor and calling it the ceiling, and they don't know they're doing it. Tool literacy isn't a separate concern from code literacy. It's part of the same skill.</p>

<h2 id="cost-honestly">Cost, honestly</h2>

<p>People reach for cost as the objection here, so let's deal with it. The free tier won't carry real development work. It just won't, and pretending otherwise wastes everyone's time. The subscription is the floor and the floor costs money, and that's a real line. Different people will weigh it differently depending on their economic situation and they're right to. I'm not arguing you need to stack per-use paid features on top of the subscription. The lift past the floor doesn't come from buying more, it comes from learning to use what you already have. The whole point of the model-routing rabbit hole is that you stay inside the subscription allowance because you're spending the budget you have well. Spend smarter, not more.</p>

<h2 id="the-apprenticeship-is-here">The apprenticeship is here</h2>

<p>That piece said the tools amplify whatever direction you're already pointed, and that the developer who can't evaluate the output is the problem, not the AI. That still holds. I'd add that learning to operate the tool is itself the kind of expertise that piece was defending. The apprenticeship around software didn't disappear when AI showed up, it grew a new wing, and that wing is currently being walked by everyone who's paying attention. Skills, budgets, routing, gates, workflows, the whole shape of how you run an agent like a junior who doesn't get to skip the parts you already learned. None of it shows up on the front page.</p>

<p>I'm a month into that wing. I have a fluency I didn't have when I wrote the prior post, and I didn't know I was missing it. If you wrote off the tool from the chat box, you wrote off something you hadn't seen yet. Go look.</p>
