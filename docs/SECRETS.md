# Secrets i zmienne

Żadne wartości tajne nie trafiają do repozytorium, frontendu ani logów.

## Projekt Supabase

- Nazwa: `telefon-do-seniora`, organizacja `hackyeah`, region `eu-central-1` (Frankfurt)
- Ref: `wdugtsyurqocycqskkko`
- URL: `https://wdugtsyurqocycqskkko.supabase.co`
- Panel: https://supabase.com/dashboard/project/wdugtsyurqocycqskkko

## Secrets Edge Functions (ustawiasz ręcznie)

Gdzie: Supabase → Project → Edge Functions → **Secrets** → Add new secret.

| Nazwa | Do czego | Używa |
|---|---|---|
| `OPENAI_API_KEY` | analiza transkryptu do ustrukturyzowanego rekordu | `analyze-call` |
| `OPENAI_MODEL` | model ze wsparciem structured outputs (np. `gpt-4.1-mini` lub nowszy) | `analyze-call` |
| `ELEVENLABS_API_KEY` | podpisany URL rozmowy dla przeglądarki | `elevenlabs-session` |
| `ELEVENLABS_AGENT_ID` | ID agenta głosowego | `elevenlabs-session` |
| `ELEVENLABS_WEBHOOK_SECRET` | weryfikacja podpisu HMAC webhooka po rozmowie | `elevenlabs-webhook` |
| `RESEND_API_KEY` | wysyłka tygodniowego podsumowania (tryb testowy) | `send-digest` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` są w Edge Functions dostępne domyślnie — nie ustawiamy ich.

Sprawdzenie, czy secrets są ustawione (zwraca tylko true/false, nigdy wartości):

```bash
curl -s https://wdugtsyurqocycqskkko.supabase.co/functions/v1/health -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
```

## Zmienne publiczne frontendu (Vercel → Project → Settings → Environment Variables)

| Nazwa | Wartość |
|---|---|
| `VITE_SUPABASE_URL` | `https://wdugtsyurqocycqskkko.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | klucz `anon` (legacy JWT) z Supabase → Project Settings → API Keys |

Klucz anon jest publiczny z założenia; dane chroni RLS. Klucza `service_role` / `sb_secret_...` nigdy nie wpisujemy we frontend ani na Vercel.

## ElevenLabs — agent i numer (identyfikatory, nie sekrety)

- Agent: **TELEFON DO SENIORA(DONT DELETE)** — `agent_1401m41jqxcqev586efttgk8t6ez` → wpisz jako secret `ELEVENLABS_AGENT_ID`.
  Prompt = `{{system_prompt}}`, pierwsza wiadomość = `{{first_message}}`; backend przekazuje obie wartości w `dynamic_variables` przy każdym połączeniu.
- Numer: +48 732 098 804 (Telnyx SIP), `phnum_1201m1hh0znbe8rvdksm0ehqx6hy` → secret `ELEVENLABS_PHONE_NUMBER_ID`.
  Inbound: przypięty do agenta. Outbound: `POST /v1/convai/sip-trunk/outbound-call` z `agent_id`, `agent_phone_number_id`, `to_number` i `conversation_initiation_client_data.dynamic_variables`.
- Dzwonienie: `place-call` wymaga zalogowanego użytkownika (JWT Supabase Auth), dzwoni tylko na numery +48 i ma limit 20 połączeń na godzinę (tabela `call_log`). Secret `ALLOWED_CALL_NUMBERS` nie jest już używany.
