import { createServerFn } from "@tanstack/react-start";
import type { Channel, GeneratedCopy } from "./types";

type SpawnInput = {
  productName: string;
  sku: string;
  price: number;
  job: string;
  proof: string;
  pain: string;
  format: string;
  intent: string;
  count?: number;
};

type EvolveInput = {
  intent: string;
  productName: string;
  proof: string;
  winners: {
    channel: Channel;
    headline: string;
    body: string;
    proofHook: string;
    cta: string;
  }[];
};

const SYSTEM = `You write SWARM ads for MultiNiche AI (multinicheai.com).
SWARM is an intent-hijack engine: ads answer a sentence someone already typed. They never create demand.
Rules:
- Lead with a proof (a run, a number, a spec). Never a slogan.
- No emoji. No hype (revolutionary, unlock, game-changing, seamless, magic).
- Sound like a spec sheet, not a startup.
- Channels:
  search = Google-style headline + description answering the query
  conversation = a reply someone would actually post on X or Reddit (not an ad)
  proof = a spec-sheet card: SKU, job, proof, one-time price
  shadow = a native listing in a "what should I use" thread
- CTA verbs: Watch the run / Open the spec / Get the instrument / See it work on your task
Return ONLY a JSON array of objects: {"channel","headline","body","proofHook","cta"}`;

function parseCopies(text: string): GeneratedCopy[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as GeneratedCopy[];
    if (!Array.isArray(parsed)) return [];
    const channels: Channel[] = ["search", "conversation", "proof", "shadow"];
    return parsed
      .filter((x) => x && typeof x.headline === "string" && typeof x.body === "string")
      .map((x) => ({
        channel: channels.includes(x.channel) ? x.channel : "proof",
        headline: String(x.headline).slice(0, 140),
        body: String(x.body).slice(0, 420),
        proofHook: String(x.proofHook ?? "").slice(0, 220),
        cta: String(x.cta ?? "Watch the run").slice(0, 48),
      }));
  } catch {
    return [];
  }
}

async function complete(user: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.7,
      max_tokens: 1600,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true, text: body.choices[0]?.message.content ?? "" };
}

export const generateSwarmCopy = createServerFn({ method: "POST" })
  .validator((input: SpawnInput) => input)
  .handler(async ({ data }) => {
    const count = Math.min(data.count ?? 8, 8);
    const prompt = `Write ${count} ads (2 per channel: search, conversation, proof, shadow) for:
Product: ${data.productName} (${data.sku}) — $${data.price} one-time ${data.format}
Job: ${data.job}
Proof: ${data.proof}
Pain: ${data.pain}
Intent utterance to hijack: "${data.intent}"
Each ad must answer that exact intent.`;
    const result = await complete(prompt);
    if (!result.ok) return result;
    const copies = parseCopies(result.text);
    if (copies.length === 0) return { ok: false as const, error: "Could not parse ad copy" };
    return { ok: true as const, copies };
  });

export const evolveSwarmCopy = createServerFn({ method: "POST" })
  .validator((input: EvolveInput) => input)
  .handler(async ({ data }) => {
    const prompt = `These winner ads survived. Breed the next generation — mutate headlines, cross proof with body, keep the intent.
Intent: "${data.intent}"
Product: ${data.productName}
Proof: ${data.proof}
Winners:
${data.winners
  .map(
    (w, i) =>
      `${i + 1}. [${w.channel}] ${w.headline}\n${w.body}\nproof: ${w.proofHook}\ncta: ${w.cta}`,
  )
  .join("\n\n")}
Return 6 new ads as JSON (mix of channels).`;
    const result = await complete(prompt);
    if (!result.ok) return result;
    const copies = parseCopies(result.text);
    if (copies.length === 0) return { ok: false as const, error: "Could not parse evolved copy" };
    return { ok: true as const, copies };
  });
