# Telefon do seniora

**Codzienny telefon do mamy, nawet gdy nie możesz zadzwonić.** HackYeah 2026 · Sport & Healthcare.

Asystent AI dzwoni codziennie do starszego rodzica mieszkającego samotnie, ciepło rozmawia po polsku i zbiera odpowiedzi na pytania ustalone przez rodzinę. Dorosłe dziecko dostaje status dnia, listę potrzeb rodzica i cytaty z rozmowy. Alert przychodzi, gdy zmienia się wzorzec tej konkretnej osoby, a nie przy każdym gorszym dniu.

**Demo:** https://telefon-do-seniora.vercel.app — konto dla jury: `jury@telefondoseniora.pl` (hasło w formularzu zgłoszeniowym HackYeah) (Supabase Auth, tylko dane demo).

## Jak to działa

```
Rodzina (aplikacja)  →  place-call  →  ElevenLabs agent (+48, SIP)  →  rozmowa z seniorem
                                              ↓
                         list-calls / analyze-call  →  OpenAI structured outputs  →  rekord z cytatami
                                              ↓
                         reguły statusu dnia + silnik wykrywania zmiany wzorca  →  pulpit / alert
```

- **Agent głosowy** (ElevenLabs): prompt i pierwsza wiadomość to wyłącznie zmienne `{{system_prompt}}` i `{{first_message}}`. Funkcja `place-call` buduje je dla każdego seniora z danych z kreatora ([prompt.ts](supabase/functions/_shared/agent/prompt.ts)). Agent zawsze ujawnia, że jest AI, kieruje do 112, nie prosi o pieniądze ani hasła i pyta o zgodę na przekazanie informacji.
- **Analiza** ([extract.ts](supabase/functions/_shared/analysis/extract.ts)): jedna funkcja `extractCheckIn()`, więc dostawcę modelu zmienia się w jednym miejscu. Schemat JSON działa w trybie strict. Czego nie poruszono, to `null`. Każda wartość ma cytat.
- **Wykrywanie zmiany** ([engine/](supabase/functions/_shared/engine/)): norma osobista (mediana + MAD z 14 dni, minimum 7 dni kalibracji), odporny z-score, utrzymywanie się zmiany przez 3 dni albo CUSUM na ≥2 wskaźnikach. Czerwona flaga oznacza od razu poziom 3, a 2 dni bez kontaktu poziom „brak kontaktu”. Wszystkie progi są w [config.ts](supabase/functions/_shared/engine/config.ts).
- **Powiadomienia push** (PWA): aplikacja instaluje się na telefonie; pg_cron co minutę wywołuje `process-calls`, który po zakończonej rozmowie robi analizę i wysyła Web Push (VAPID) ze statusem dnia i potrzebami.
- **Baza** (Supabase): RLS na wszystkich tabelach. Zgoda seniora jest egzekwowana w widokach SQL ([0002_rls.sql](supabase/migrations/0002_rls.sql)), nie tylko w UI.

## Struktura

```
web/                         React + Vite + Tailwind + shadcn/ui
  src/care/                  aplikacja dla rodziny (landing, kreator, pulpit, rozmowy, pytania, ustawienia)
  src/pages, src/components  panel dla ośrodków pomocy społecznej (/ops) na tym samym silniku
supabase/
  migrations/                schemat, RLS, widoki zgody
  functions/                 place-call, list-calls, analyze-call, push, process-calls, seed-synthetic, health
  functions/_shared/         engine (detekcja), analysis (OpenAI), agent (prompt), synthetic (dane demo)
tests/engine.test.ts         testy silnika na scenariuszach
scripts/                     bundler Edge Functions, ewaluacja
docs/                        zgłoszenie, sekrety, ujawnienie AI, prompty
```

## Uruchomienie

```bash
npm install && npm test          # testy silnika (Vitest)
npx tsx scripts/eval.ts          # ewaluacja na zbiorze syntetycznym
cd web && npm install && npm run dev
```

Aby podpiąć prawdziwe połączenia lokalnie, ustaw przy buildzie publiczne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. Klucze API są wyłącznie sekretami Edge Functions (lista w [docs/SECRETS.md](docs/SECRETS.md)). Edge Functions bundlujemy (`npm run bundle`) i wdrażamy przez Composio.

## Wyniki ewaluacji (dane syntetyczne)

30 seniorów, 875 osobodni, 8 scenariuszy:
- stabilny;
- „gorsze dni w normie”;
- przewlekły ból;
- stopniowe pogorszenie;
- wycofanie;
- nagłe zagubienie;
- przestaje odbierać;
- kalibracja.

| Miara | Wynik |
|---|---|
| Wykryte pogorszenia | **9 / 9** |
| Fałszywe alarmy | **0** |
| Średnie opóźnienie wykrycia | 0,8 dnia |
| Testy automatyczne | 13 / 13 |

Plus prawdziwe połączenie testowe (3.10.2026, 4 min): transkrypt przeanalizowany automatycznie, status „Warto zadzwonić” (silny ból biodra, leki nie wzięte), potrzeba „papier toaletowy”, wszystko z cytatami.

## Ograniczenia

- Historia w demo jest syntetyczna; prawdziwe są tylko połączenia testowe.
- Brak walidacji klinicznej. To nie jest wyrób medyczny i nie diagnozuje.
- Nastrój bierzemy tylko z deklaracji seniora; świadomie nie analizujemy barwy głosu (do weryfikacji prawnej).
- Połączenia tylko dla zalogowanych, wyłącznie na numery +48, limit 20 na godzinę (`call_log`).
- Przed wdrożeniem potrzebny jest przegląd RODO / AI Act i proces zgody seniora.

## Dokumenty

[Zgłoszenie (PL)](docs/SUBMISSION.md) · [Submission (EN)](docs/SUBMISSION_EN.md) · [Sekrety](docs/SECRETS.md) · [Ujawnienie AI](docs/AI_DISCLOSURE.md) · [Elementy sprzed hackathonu](docs/PRE_EXISTING.md) · [Plan](PLAN.md)
