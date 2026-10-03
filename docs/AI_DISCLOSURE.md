# Ujawnienie użycia AI i zasobów zewnętrznych

## Modele i API używane przez produkt
| Zasób | Do czego | Gdzie w kodzie |
|---|---|---|
| ElevenLabs Conversational AI (agent „TELEFON DO SENIORA(DONT DELETE)”, głos „Aleksandra”) | rozmowa głosowa po polsku, STT/TTS, połączenia wychodzące | `supabase/functions/place-call`, `list-calls` |
| OpenAI `gpt-4.1-mini` (structured outputs, strict JSON schema) | zamiana zapisu rozmowy w rekord z cytatami | `supabase/functions/_shared/analysis/extract.ts`, `analyze-call` |
| Telnyx (trunk SIP, numer +48) | telefonia | konfiguracja w ElevenLabs |

Wykrywanie zmiany wzorca (`supabase/functions/_shared/engine/`) **nie używa AI** — to jawna statystyka (mediana, MAD, CUSUM) z testami.

## Infrastruktura i biblioteki
Supabase (Postgres, RLS, Edge Functions), Vercel, React, Vite, Tailwind CSS, shadcn/ui (Radix UI), Recharts, Sonner, lucide-react, Vitest, esbuild. Font: M PLUS Rounded 1c (Google Fonts), Geist.

## AI użyte do tworzenia projektu
- **Claude Code** (Anthropic) — znacząca część kodu: schemat bazy i RLS, Edge Functions, silnik wykrywania i testy, generator danych syntetycznych, frontend, prompt agenta; konfiguracja Supabase (przez Composio), ElevenLabs i wdrożenie na Vercel. Zespół przeglądał, testował i akceptował zmiany.
- **Claude Design** — projekt interfejsu aplikacji dla rodziny (design system, maskotka, ekrany), odtworzony w kodzie; prompt do prezentacji.

## Dane
Historia 30 dni w demo jest w całości syntetyczna (`supabase/functions/_shared/synthetic/`). Prawdziwe są wyłącznie testowe połączenia na numer członka zespołu, za jego zgodą.
