# HackYeah 2026 submission (EN) — family version

## 1. Project Name

Telefon do seniora (A Daily Call for Your Parent)

## 2. Published

Yes (when ready to show the jury)

## 3. Problem

"Mum lives alone, 300 km away. I call when I can, and she always says she's fine."

This is the reality for hundreds of thousands of Polish families. Roughly one in four people in Poland is already 60 or older (Demagog, based on Statistics Poland data). Over 90% of widowed seniors are women living alone (GUS / Ministry of Family, "Situation of older people in Poland in 2024").

Their adult children work, have their own families and often live in another city. They cannot call every day at the same time. Seniors don't want to "be a bother", so they rarely mention a bad week.

Health rarely collapses overnight. First come a few nights of poor sleep, skipped meals, no one to talk to, or a forgotten pill. Children usually find out only after a fall, dehydration or a hospital admission.

Today's options don't close this gap:
- an SOS wristband reacts only once something has already happened;
- cameras feel like surveillance;
- a busy child's occasional call can't spot a slow trend.

Sources:
- https://www.gov.pl/web/senior/sytuacja-osob-starszych-w-polsce-w-2024--informacja-na-komisji-senacie
- https://demagog.org.pl/wypowiedzi/polska-sie-starzeje-juz-dzisiaj-co-czwarty-polak-jest-seniorem/

## 4. Solution

"Telefon do seniora" is a daily phone call to your parent from a warm AI assistant, plus a simple app for you.

**How it works for the adult child (our customer):**
1. **Set up in minutes.** Who your parent is and how the assistant should address them ("Pani Halino", "Mamo"), their phone number, health context (conditions, medication times), what they enjoy talking about and what to avoid, which questions to ask, which days and times to call, and where to send updates. A 3-question quick start gets you to a first test call in under a minute.
2. **The assistant calls.** It rings a regular phone, with no app or smartphone needed on the parent's side. It speaks Polish slowly and kindly and asks about sleep, appetite, mood, pain, medication, going out, contact with people and whether they need anything.
3. **You get a short summary.** It shows a day status (all good / worth calling / urgent), what your parent needs (e.g. bread and milk, a lift to the doctor on Thursday), answers backed by your parent's own words, and the full transcript. You're alerted when the pattern changes, not on every bad day.

**The role of AI and how the parts work together:**
- **Voice:** ElevenLabs Conversational AI calls from a Polish +48 number. The agent's prompt is built per senior from what the family entered, so the conversation is personal ("Did Zosia call from Kraków?").
- **Understanding:** OpenAI structured outputs turn the transcript into a fixed record. If something wasn't discussed it stays empty and is never guessed. Every value carries a verbatim quote as evidence.
- **Spotting change:** simple, explainable statistics instead of a black box. Each person gets their own baseline (median + MAD over 14 days). We flag changes that persist over several days or accumulate across several indicators (CUSUM). A single bad day is only "watch". Red flags (a fall, chest pain, confusion) are "urgent" immediately.
- **Day status** comes from transparent rules in code, not from the model.

**How the user stays in control:** every status says why ("strong hip pain, medication not taken") and links to the exact words. The family decides what to do, and the AI never diagnoses or gives medical advice.

**Safety and trust:**
- The assistant always says it is an AI in the first sentence (EU AI Act, Art. 50).
- It never asks for money, PINs, passwords or ID numbers, which protects against "grandparent scams".
- If a fall or chest pain comes up, it calmly points to 112 and never promises help is on the way. The family gets an urgent alert with a "Call Mum" button.
- At the end of each call the parent hears what will be passed on and can withhold any topic ("don't tell Kasia that"). Withheld topics never reach the family.

**What is real today:**
- A working web app.
- Real outbound phone calls to a test number (a 4-minute live test call on 3 Oct 2026 was transcribed and analysed end to end).
- A detection engine with 13 automated tests. On a labelled synthetic set (30 seniors, 875 senior-days) it detected 9 of 9 deterioration scenarios, on average 0.8 days after the expected day, with 0 false alarms, including seniors whose "bad days" are their normal.

**Limitations (honestly):**
- The 30-day history in the demo is synthetic; only the test calls are real.
- There is no clinical validation yet; the next step is a pilot with real families.
- Pricing and willingness to pay still need testing.
- Mood is taken only from what the senior says; we deliberately do not analyse tone of voice.
- A legal review (GDPR, AI Act, senior consent flow) is needed before launch.

## 5. Challenges

Sport & Healthcare (plus OPEN TASK: ARTIFICIAL INTELLIGENCE if more than one can be selected)

## 6. Cover image

[Screenshot of the "Dziś" dashboard or the deck cover with the mascot]

## 7. Idea stage

New idea (built entirely at HackYeah 2026)

## 8. What's done so far and goal of your project

**Before HackYeah:** nothing. The idea, code, design and infrastructure were all created at the event. The only pre-existing assets are third-party services we configured during the hackathon: an ElevenLabs workspace and a Polish phone number on our Telnyx SIP trunk. [Confirm / adjust in docs/PRE_EXISTING.md.]

**During HackYeah:**
- **Family web app:**
  - landing page;
  - 7-step setup wizard and a quick 3-question start;
  - dashboard with day status, needs and 30-day trends against the parent's own baseline;
  - conversation history with quotes and transcripts;
  - editable question list (drag to reorder);
  - call schedule, notifications and pause.
- **Voice agent:**
  - Polish female voice;
  - prompt fully generated per senior;
  - safety rules (AI disclosure, 112, anti-scam, consent);
  - real outbound calls from a +48 number, with automatic hang-up.
- **AI analysis:** transcript → structured, quoted check-in (OpenAI structured outputs, strict JSON schema), cached per call.
- **Detection engine:** personal baselines, persistence + CUSUM, red flags, no-contact rule. Evaluated on a labelled synthetic dataset with 13 unit tests.
- **Backend:** Supabase (Postgres with row-level security, consent enforced in the database, Edge Functions). API keys exist only as server-side secrets. Public endpoints only call or read demo test numbers.

**Goal after the hackathon:** a 6-week pilot with ~20 families to check whether children react earlier to a parent's bad week and whether seniors keep answering. Then email digests and a subscription model.

## 9. Team status

[Full team / Looking for teammates]

## 10. Current team size

[number]

## 13. Your video presentation

[YouTube link, Unlisted — ideally showing a live call ringing a phone and the analysis appearing in the app]

## 14. Website

https://telefon-do-seniora.vercel.app

## 15. Code Repository

[GitHub link]

## 16. Instructions on how to open project

1. Open https://telefon-do-seniora.vercel.app (any modern browser, desktop or mobile). No login is needed for the family demo.
2. On the landing page click **"Zobacz przykładowy pulpit"** (see a sample dashboard). A quick-start window asks who to call and how to address them. You can close it to browse the sample data.
3. **Dziś (Today):**
   - day status, "Potrzebuje" (needs) and the call streak;
   - 30-day trends against the parent's own norm;
   - "Demo: pokaż inny stan pulpitu" at the bottom switches between all states (all good, worth calling, urgent, no answer, empty, loading).
4. **Rozmowy (Calls):**
   - the "Prawdziwe połączenia" section holds a real test call;
   - open it to see the AI analysis (status, needs, scored answers with quotes) and the full transcript.
5. **Pytania / Ustawienia:** edit the questions, the schedule and the profile. These settings feed the agent's prompt for the next call.
6. **"Zacznij za darmo"** on the landing page opens the full 7-step setup wizard.
7. **Live calls:** for safety, the public demo can only dial our team's test numbers, so pressing "Zadzwoń teraz" with another number shows an explanation. The video shows a live call.

**AI and external resources disclosure:**
- Models and APIs: ElevenLabs Conversational AI (voice agent, Polish TTS/STT), OpenAI gpt-4.1-mini (structured transcript analysis).
- Telephony: Telnyx SIP trunk.
- Infrastructure: Supabase (Postgres, Auth, Edge Functions), Vercel (hosting).
- Libraries: React, Vite, Tailwind CSS, shadcn/ui (Radix), Recharts, Sonner.
- Font: M PLUS Rounded 1c (Google Fonts).
- Code and design were produced with substantial help from AI coding and design assistants (Claude Code, Claude Design); details are in docs/AI_DISCLOSURE.md.

## 17. Presentation

[PDF, max 10 slides — generated from docs/DECK_PROMPT.md]
