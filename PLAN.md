# Telefon do seniora — plan (HackYeah 2026, Sport & Healthcare)

Status: **plan do akceptacji**. Kod jeszcze nie powstał.

## Stan infrastruktury (sprawdzone 2026-10-03)

- Composio → Supabase: połączenie **aktywne** (konto `supabase-mik.j`).
- Organizacja Supabase: `hackyeah` (`vxjjbfjmtjukivjdjojw`). Jest w niej już projekt `namiar` (eu-central-1) — nie ruszamy go.
- Composio udostępnia wszystko, czego potrzebujemy: tworzenie projektu, migracje (`SUPABASE_APPLY_A_MIGRATION`), SQL, deploy Edge Functions (`SUPABASE_DEPLOY_FUNCTION`), wywołanie funkcji, logi, a nawet ustawianie secrets (`SUPABASE_CREATE_BULK_SECRETS`). Mimo to wartości secrets wpisujesz Ty w panelu Supabase, żeby klucze nie przechodziły przez czat.

## Struktura katalogów

```
telefon do seniora hackyeah 2026/
├── web/                          # Vite + React + TS + Tailwind + shadcn/ui (wykresy: shadcn chart = Recharts)
│   ├── src/
│   │   ├── routes/               # /login, /panel, /panel/senior/:id, /panel/alert/:id, /panel/zbiorczo, /rodzina, /symulator
│   │   ├── components/ui/        # shadcn
│   │   ├── components/           # LevelBadge (ikona + tekst), MetricTimeline (pasmo normy), AlertCard, QuoteList...
│   │   └── lib/supabase.ts       # tylko VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│   └── vercel.json               # rewrite SPA → index.html (po kroku 3)
├── supabase/
│   ├── migrations/               # 0001_schema, 0002_rls, 0003_consent_views, 0004_cron
│   └── functions/
│       ├── _shared/
│       │   ├── engine/           # CZYSTY TypeScript, bez Deno/Node API → testowany Vitestem, używany w Edge Functions
│       │   │   ├── config.ts     # wszystkie progi w jednym miejscu
│       │   │   ├── baseline.ts   # mediana + MAD, 14 dni, min. 7
│       │   │   ├── detect.ts     # robust z, utrzymanie 2–3 dni, CUSUM, red flags, brak kontaktu
│       │   │   └── explain.ts    # wyjaśnienie alertu generowane z danych
│       │   ├── extractCheckIn.ts # jedyne miejsce, które zna OpenAI (structured outputs, strict)
│       │   ├── synthetic/        # generator 30 seniorów × 30 dni + scenariusze + zbiór ewaluacyjny
│       │   └── cors.ts, db.ts
│       ├── elevenlabs-session/   # signed URL dla przeglądarki
│       ├── elevenlabs-webhook/   # weryfikacja HMAC, zapis transkryptu → analyze-call
│       ├── analyze-call/         # extractCheckIn → check_ins → engine → alerts
│       ├── send-digest/          # tygodniowe podsumowanie przez Resend (pg_cron)
│       └── seed-synthetic/       # jednorazowy seed z blokadą ponownego uruchomienia
├── scripts/bundle-functions.mjs  # esbuild → jeden plik na funkcję (deploy przez Composio przyjmuje file_content)
├── tests/engine.test.ts          # testy scenariuszy (Vitest)
├── docs/ ARCHITECTURE, AI_DISCLOSURE, SECRETS, PRE_EXISTING, PITCH
└── README.md
```

Decyzja do obrony: silnik wykrywania to czysty TS bez zależności, więc ten sam kod działa w Edge Function (Deno), w testach (Vitest) i w generatorze danych do ewaluacji. Deploy przez Composio przyjmuje jeden plik, więc każdą funkcję bundlujemy esbuildem lokalnie (importy `npm:`/`jsr:` zostają zewnętrzne i rozwiązuje je Deno).

## Model danych (Postgres)

| Tabela | Najważniejsze kolumny | Uwagi |
|---|---|---|
| `centers` | id, name, city | ośrodek (OPS) |
| `staff` | user_id → auth.users, center_id, full_name | pracownik ośrodka |
| `seniors` | id, center_id, display_name, birth_year, city, persona, phone_masked, calibration_until | dane syntetyczne |
| `consents` | senior_id, category, share_with_family, share_with_center, updated_at | kategorie: sleep, appetite, mood, pain, social, medication, activity |
| `family_links` | user_id, senior_id, relation | rodzina widzi tylko „swojego” seniora |
| `calls` | id, senior_id, started_at, attempt_no, answered, duration_s, source (`synthetic`/`simulator`/`phone`), transcript jsonb, el_conversation_id | |
| `check_ins` | call_id, senior_id, date, sleep_quality, sleep_hours, appetite, mood, pain, pain_location, talked_to_someone, meds_taken, left_home, avg_answer_words, evidence jsonb, red_flags jsonb, withheld_categories text[], summary_pl | null = „senior nie powiedział” |
| `metric_scores` | senior_id, date, metric, value, median, mad, z, cusum, calibrating | cache wyników silnika → wykresy z pasmem normy |
| `alerts` | id, senior_id, level 1–3, kind (`deviation`/`red_flag`/`no_contact`), status, explanation jsonb, started_on, created_at | |
| `alert_events` | alert_id, actor_id, from_status, to_status, note, at | dziennik działań (pętla zamknięta) |
| `eval_labels` | senior_id, date, expected_level, scenario | zbiór ewaluacyjny |
| `digests` | id, family_user_id, senior_id, week_start, payload jsonb, sent_at, resend_id | |
| `seed_runs` | id, ran_at | blokada ponownego seedu |

Statusy alertu: `new → acknowledged → contacted → visit_planned → resolved | false_alarm`.

**RLS:** włączone na wszystkich tabelach. Pracownik widzi rekordy z `center_id` swojego ośrodka (funkcja `auth_center_id()` security definer). Rodzina **nie ma** SELECT na `check_ins`/`alerts` — czyta wyłącznie widok/funkcję `family_feed(senior_id)`, która zeruje kategorie bez zgody i wstrzymane w rozmowie. Zgoda jest więc egzekwowana w bazie, nie w UI. Zapis z Edge Functions przez service role.

Konta demo (Supabase Auth): `ops.krakow@demo.test` (pracownik), `rodzina.nowak@demo.test` (córka seniora), opcjonalnie drugi pracownik innego ośrodka — do pokazania izolacji RLS.

## Silnik wykrywania (krótko)

- Norma: mediana + MAD z 14 ostatnich dni (≥ 7 dni, inaczej kalibracja — tylko poziom ≤ 1, poza czerwonymi flagami).
- `z = (x − mediana) / (1.4826·MAD)`, z podłogą MAD, żeby stabilny senior nie dawał wielkich z przy drobnej zmianie.
- 1 gorszy dzień → max poziom 1. Poziom 2: odchylenie ≥ 2 dni z rzędu w jednym wskaźniku **lub** CUSUM przekroczony w ≥ 2 wskaźnikach. Poziom 3: czerwona flaga.
- Brak odebrania: ponowienie tego samego dnia; 2 dni bez kontaktu → poziom 2 `no_contact` („brak kontaktu”, nie „pogorszenie”).
- Wycofanie: średnia długość odpowiedzi i `talked_to_someone` jako wskaźniki.
- Wyjaśnienie: wskaźnik, o ile odbiega (w języku ludzkim: „sen 2/5, zwykle 4/5”), od ilu dni, cytaty z `evidence`.

## Kroki i szacunek czasu (~24 h, 2–3 osoby)

| # | Krok | Czas | Wynik do sprawdzenia |
|---|---|---|---|
| 0 | Projekt Supabase przez Composio, migracje + RLS, szkielet Edge Function `health`, lista secrets | 1,5 h | zapytanie testowe + wywołanie funkcji |
| 1 | Model danych, generator syntetyczny (30 × 30 dni, 6 scenariuszy), zbiór ewaluacyjny, konta demo | 3 h | liczby wierszy, przykładowe rekordy |
| 2 | Silnik wykrywania + testy Vitest na scenariuszach, metryki trafności / fałszywych alarmów | 2,5 h | `npm test`, tabela wyników |
| 3 | Panel ośrodka (lista priorytetów, karta seniora, karta alertu, pętla zamknięta, widok zbiorczy) | 6 h | `npm run dev` → logowanie demo |
| 4 | `extractCheckIn` (OpenAI structured outputs) + `analyze-call`, weryfikacja na transkryptach scenariuszy | 2,5 h | wywołanie funkcji z transkryptem |
| 5 | Symulator rozmowy (ElevenLabs, `elevenlabs-session` + webhook) | 3 h | rozmowa → pojawia się w panelu |
| 6 | Widok rodziny + `send-digest` (Resend, tryb testowy) | 2 h | e-mail testowy |
| 7 | README, docs/*, pitch | 2 h | |
| — | Bufor + Vercel po kroku 3 | 1,5 h | link do demo |

Kroki 0–4 muszą działać; jeśli zabraknie czasu, tniemy od 7 w dół.

## Secrets (ustawiasz Ty: Supabase → Edge Functions → Secrets)

`OPENAI_API_KEY`, `OPENAI_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_WEBHOOK_SECRET`, `RESEND_API_KEY`.
Vercel (publiczne): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
