Zaprojektuj prezentację (deck) do zgłoszenia na hackathon HackYeah 2026, kategoria **Sport & Healthcare**, dla projektu **„Telefon do seniora”**.

## Twarde wymagania
- **Maksymalnie 10 slajdów**, format 16:9. Eksport do PDF poniżej 10 MB.
- **Język polski**, krótkie zdania: najwyżej 1 nagłówek i 3–4 punkty na slajd. Deck służy do 3-minutowego pitchu na żywo i jako samodzielny PDF dla jury.
- **Uczciwość:** dane w demo są syntetyczne, skuteczność nie była walidowana klinicznie, a finansowanie z programu rządowego to hipoteza. Nie obiecuj niczego, czego nie zbudowaliśmy.
- **Odbiorca produktu:** dorosłe dzieci (i wnuki) seniorów mieszkających samotnie, czyli osoba, która kupuje usługę i czyta podsumowania. Nie ośrodki pomocy społecznej. Pisz do niej bezpośrednio („Twoja mama”, „Ty dostajesz”).
- **Kryteria jury** (zaznacz je subtelnie w treści): pomysł i innowacja 30%, związek z kategorią 20%, praktyczna użyteczność 20%, design 20%, kompletność i wartość wdrożeniowa 10%.

## Design system (zgodny z aplikacją)
- **Font:** „M PLUS Rounded 1c” (Google Fonts), wagi 800–900 dla nagłówków, 500–700 dla tekstu. Nagłówki z lekko ujemnym trackingiem.
- **Kolory:**
  - fiolet `#6A4BEB` (główny), `#5A3FD6` (tekst/akcent), `#EEE9FF` (tła kart);
  - mięta `#3DDC97` / `#DCF8EC` („w porządku”);
  - słońce `#FFC53D` / `#FFF5D6` („warto zadzwonić”);
  - czerwień `#D61F4B` / `#FFE6EC` („pilne”);
  - tekst `#2B2140`, tekst drugorzędny `#5E5470`, tło `#F7F5FF`, linie `#E7E3F0`.
  - Kontrast AA, status zawsze ikona + tekst, nigdy sam kolor.
- **Kształty:** karty z zaokrągleniem 24 px i ramką 2 px `#E7E3F0`, bez cieni. Przyciski i „pigułki” w stylu 3D (dolny cień w ciemniejszym odcieniu).
- **Maskotka „Słuchawka”:** fioletowa słuchawka telefoniczna z buzią, różowymi policzkami i miętowym spiralnym kablem. Ma 4 nastroje: radość, zamyślenie, troska, czeka. Pojawia się na okładce, slajdzie z rozwiązaniem i na końcu. Nie wstawiaj jej na każdy slajd.
- **Styl:** przyjazny i czysty, dużo powietrza. Ilustracje płaskie, bez zdjęć stockowych. Zrzuty ekranu aplikacji osadź w prostej ramce telefonu lub przeglądarki.

## Slajdy

1. **Okładka.** „Telefon do seniora”, podtytuł: „Codzienny telefon do mamy, nawet gdy nie możesz zadzwonić.” Maskotka (radość) z dymkiem „Dzień dobry, Pani Halino! Jak minęła noc?”. Na dole: HackYeah 2026 · Sport & Healthcare · [nazwa zespołu].

2. **Problem (z perspektywy dorosłego dziecka).** „Mama mieszka sama 300 km ode mnie. Dzwonię, kiedy mogę, i zawsze słyszę: wszystko dobrze.” Co czwarty Polak ma 60+ lat (Demagog / GUS). Ponad 90% owdowiałych seniorów to kobiety mieszkające same (GUS, „Sytuacja osób starszych w Polsce w 2024 r.”). Pogorszenie zdrowia przychodzi po cichu: kilka dni gorszego snu, mniej jedzenia, brak rozmów z ludźmi. Dziecko dowiaduje się, gdy jest już upadek albo szpital. Źródła drobnym drukiem na dole slajdu.

3. **Luka.** Dzieci pracują, mają swoje rodziny i nie zadzwonią codziennie o tej samej porze. Seniorzy nie chcą „robić kłopotu”, więc nie mówią o gorszych dniach. Opaska SOS reaguje dopiero, gdy coś się stało, a kamera narusza prywatność. Pokaż prostą oś czasu: „spadek formy (dni) → kryzys”. Opaska działa dopiero w punkcie kryzysu, my na odcinku spadku formy, czyli wtedy, gdy telefon od dziecka jeszcze wiele zmienia.

4. **Rozwiązanie.** Asystent AI dzwoni raz dziennie o stałej porze, po polsku, wolno i ciepło. Pyta o sen, apetyt, samopoczucie, ból, leki, wyjście z domu, kontakt z ludźmi i o to, czego senior potrzebuje. Dziecko dostaje e-mail i pulpit: status dnia, czego mama potrzebuje (np. zakupy, podwiezienie do lekarza), a alert tylko wtedy, gdy zmienia się jej wzorzec. Pokaż maskotkę i 3 kroki: Ustaw → Asystent dzwoni → Dostajesz podsumowanie.

5. **Jak to działa (architektura, prosto).** Schemat w 4 blokach:
   - **Telefon:** ElevenLabs Conversational AI + numer +48 przez SIP. Prompt jest budowany dla każdego seniora z danych z kreatora.
   - **Analiza:** OpenAI structured outputs. Każda wartość ma cytat jako dowód, a tematy nieporuszone dostają null zamiast zgadywania.
   - **Wykrywanie zmiany:** norma każdej osoby z 14 dni (mediana + MAD), utrzymywanie się zmiany przez kilka dni, CUSUM na kilku wskaźnikach. Czerwona flaga oznacza od razu „pilne”. Wszystko jest wyjaśnialne, bez czarnej skrzynki.
   - **Aplikacja dla rodziny:** Supabase (Postgres + RLS, Edge Functions), React.
   - Podpis: „AI tylko słucha i porządkuje. Co z tym zrobić, decyduje rodzina.”

6. **Demo: aplikacja dla rodziny.** 2–3 zrzuty ekranu: pulpit „Dziś” (status dnia, „Potrzebuje”, seria rozmów), kreator (7 kroków: o kim, zdrowie, co lubi, pytania, kiedy dzwonić, powiadomienia, zgoda) i szczegóły rozmowy z cytatami. Krótkie podpisy pod zrzutami.

7. **Prawdziwa rozmowa (dowód, że działa).** Fragment autentycznego testowego połączenia na żywy numer jako dymki czatu: senior „Biodro. Mm, mocny.”, „Nie wzięłam.”, „Potrzebuję papieru toaletowego”. Obok karta wyniku analizy: „Warto zadzwonić — silny ból (biodro), leki nie zgodnie z planem · Potrzebuje: papier toaletowy”. Podpis: „Test 3.10.2026, rozmowa 4 min, analiza automatyczna z cytatami.”

8. **Bezpieczeństwo i zaufanie.** Ikony z krótkimi hasłami:
   - Pierwsze zdanie: „Jestem asystentem AI” (art. 50 AI Act).
   - Nigdy nie prosi o pieniądze, PIN ani PESEL, co chroni przed oszustwami „na wnuczka”.
   - Upadek lub ból w klatce: spokojnie mówi o numerze 112, nie obiecuje pomocy, a dziecko dostaje natychmiastowe powiadomienie z przyciskiem „Zadzwoń do mamy”.
   - Mama wie, co zostanie przekazane dziecku, i może wstrzymać dowolną kategorię („tego Kasi nie mów”). Zgoda jest egzekwowana w bazie danych, a pierwszą rozmowę zapowiada rodzina.
   - Nastrój bierzemy tylko z deklaracji seniora, nie analizujemy barwy głosu.

9. **Wyniki i uczciwe ograniczenia.** Lewa kolumna, „Co już działa”:
   - silnik na 30 seniorach (875 osobodni danych syntetycznych): 9/9 scenariuszy pogorszenia wykrytych, średnio 0,8 dnia od oczekiwanego momentu, 0 fałszywych alarmów, w tym u seniorów z „gorszymi dniami w swojej normie”;
   - 13 testów automatycznych;
   - działające połączenia na prawdziwy numer.

   Prawa kolumna, „Czego jeszcze nie wiemy”:
   - brak walidacji klinicznej, potrzebny pilotaż z prawdziwymi rodzinami;
   - historia 30 dni w demo jest syntetyczna (prawdziwe są tylko testowe połączenia);
   - cena abonamentu i gotowość rodzin do płacenia są do sprawdzenia;
   - przegląd prawny (RODO, AI Act, zgoda seniora) przed wdrożeniem.

10. **Wdrożenie i prośba.** Model: miesięczny abonament kupowany przez dorosłe dziecko. Senior nie instaluje niczego i nie potrzebuje smartfona, wystarczy zwykły telefon. Rodzeństwo może dzielić jedno konto i dostawać te same podsumowania. Następne kroki: pilotaż z 20 rodzinami przez 6 tygodni; mierzymy, czy dzieci szybciej reagują na gorszy tydzień rodzica i czy seniorzy chcą odbierać. Opcjonalnie w przyszłości ten sam silnik może obsłużyć ośrodki pomocy społecznej, ale to nie jest nasz pierwszy klient. Na dole link do demo `telefon-do-seniora.vercel.app`, kod QR i maskotka (radość, iskry). Hasło końcowe: „Żeby nikt nie był sam z gorszym tygodniem.”

## Notatki prelegenta
Dodaj do każdego slajdu 2–3 zdania notatek prelegenta. Razem ok. 3 minut mówienia (ok. 18 s na slajd, dłużej na 4, 6 i 7).
