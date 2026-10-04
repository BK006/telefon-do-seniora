# Zgłoszenie HackYeah 2026 (PL) — wersja pod rodziny

Edycja możliwa do dziś 11:00. W [nawiasach] rzeczy do uzupełnienia.

## 1. Project Name

Telefon do seniora

## 2. Published

Tak (gdy będzie gotowe do pokazania jury)

## 3. Problem

„Mama mieszka sama, 300 km ode mnie. Dzwonię, kiedy mogę, i zawsze słyszę: wszystko dobrze.”

Tak żyją setki tysięcy polskich rodzin. Już mniej więcej co czwarta osoba w Polsce ma 60 lat lub więcej (Demagog, na podstawie danych GUS). Ponad 90% owdowiałych seniorów to kobiety mieszkające samotnie (GUS / MRiPS, „Sytuacja osób starszych w Polsce w 2024 r.”).

Ich dorosłe dzieci pracują, mają własne rodziny i często mieszkają w innym mieście. Nie zadzwonią codziennie o tej samej porze. Seniorzy nie chcą „robić kłopotu”, więc rzadko mówią o gorszym tygodniu.

Zdrowie rzadko pogarsza się z dnia na dzień. Najpierw jest kilka nocy słabego snu, pominięte posiłki, brak rozmów z ludźmi, zapomniana tabletka. Dziecko zwykle dowiaduje się dopiero przy upadku, odwodnieniu albo w szpitalu.

Dzisiejsze rozwiązania nie zamykają tej luki:
- opaska SOS reaguje dopiero, gdy coś się stało;
- kamera to inwigilacja;
- sporadyczny telefon zapracowanego dziecka nie wychwyci powolnego trendu.

Źródła:
- https://www.gov.pl/web/senior/sytuacja-osob-starszych-w-polsce-w-2024--informacja-na-komisji-senacie
- https://demagog.org.pl/wypowiedzi/polska-sie-starzeje-juz-dzisiaj-co-czwarty-polak-jest-seniorem/

## 4. Solution

„Telefon do seniora” to codzienny telefon do Twojego rodzica od ciepłego asystenta AI i prosta aplikacja dla Ciebie.

**Jak to działa dla dorosłego dziecka (naszego klienta):**
1. **Konfiguracja w kilka minut.** Ustawiasz:
   - kim jest dla Ciebie rodzic i jak asystent ma się do niego zwracać („Pani Halino”, „Mamo”);
   - numer telefonu;
   - kontekst zdrowotny (choroby, pory leków);
   - o czym lubi rozmawiać, a czego unikać;
   - które pytania zadawać;
   - w jakie dni i o której dzwonić;
   - gdzie wysyłać powiadomienia.

   Szybki start (3 pytania) pozwala zrobić pierwszy testowy telefon w mniej niż minutę.
2. **Asystent dzwoni** na zwykły telefon; rodzic nie potrzebuje aplikacji ani smartfona. Mówi po polsku, wolno i życzliwie. Pyta o sen, apetyt, samopoczucie, ból, leki, wyjście z domu, kontakt z ludźmi i o to, czy czegoś potrzebuje.
3. **Dostajesz powiadomienie push i podsumowanie w aplikacji** (aplikacja instaluje się na telefonie jako PWA):
   - status dnia (wszystko w porządku / warto zadzwonić / pilne);
   - czego rodzic potrzebuje (np. chleb i mleko, podwiezienie do lekarza w czwartek);
   - odpowiedzi poparte jego własnymi słowami;
   - pełny zapis rozmowy.

   Powiadamiamy Cię, gdy zmienia się wzorzec, a nie przy każdym gorszym dniu.

**Rola AI i współpraca komponentów:**
- **Głos:** ElevenLabs Conversational AI dzwoni z polskiego numeru +48. Prompt agenta budujemy dla każdego seniora z tego, co wpisała rodzina, więc rozmowa jest osobista („Dzwoniła Zosia z Krakowa?”).
- **Zrozumienie:** OpenAI (structured outputs) zamienia zapis rozmowy w stały rekord. Czego nie poruszono, zostaje puste, nigdy nie jest zgadywane. Każda wartość ma dosłowny cytat jako dowód.
- **Wychwytywanie zmiany:** prosta, wyjaśnialna statystyka zamiast czarnej skrzynki. Każda osoba ma własną normę (mediana + MAD z 14 dni). Oznaczamy zmiany, które utrzymują się kilka dni albo kumulują w kilku wskaźnikach (CUSUM). Pojedynczy gorszy dzień to tylko „obserwuj”. Czerwone flagi (upadek, ból w klatce, dezorientacja) oznaczają od razu „pilne”.
- **Status dnia** liczą przejrzyste reguły w kodzie, nie model.

**Jak użytkownik zachowuje kontrolę:** każdy status mówi dlaczego („silny ból biodra, leki nie wzięte”) i prowadzi do dokładnych słów rodzica. Decyzję podejmuje rodzina, a AI nigdy nie diagnozuje i nie doradza medycznie.

**Bezpieczeństwo i zaufanie:**
- Asystent w pierwszym zdaniu zawsze mówi, że jest AI (art. 50 AI Act).
- Nigdy nie prosi o pieniądze, PIN, hasła ani PESEL, co chroni przed oszustwami „na wnuczka”.
- Gdy rodzic mówi o upadku lub bólu w klatce, asystent spokojnie wskazuje numer 112 i nie obiecuje, że pomoc jedzie. Rodzina dostaje pilne powiadomienie z przyciskiem „Zadzwoń do mamy”.
- Na końcu rozmowy rodzic słyszy, co zostanie przekazane, i może wstrzymać dowolny temat („tego Kasi nie mów”). Wstrzymane tematy nie trafiają do rodziny.

**Co działa już dziś:**
- Działająca aplikacja webowa.
- Prawdziwe połączenia wychodzące na numer testowy: 4-minutowa rozmowa testowa z 3.10.2026 została zapisana i przeanalizowana od początku do końca.
- Silnik wykrywania z 13 testami automatycznymi. Na oznaczonym zbiorze syntetycznym (30 seniorów, 875 osobodni) wykrył 9 z 9 scenariuszy pogorszenia, średnio 0,8 dnia po oczekiwanym dniu, bez fałszywych alarmów, także u seniorów, dla których „gorsze dni” to norma.

**Ograniczenia (uczciwie):**
- 30-dniowa historia w demo jest syntetyczna; prawdziwe są tylko połączenia testowe.
- Brak walidacji klinicznej; kolejny krok to pilotaż z prawdziwymi rodzinami.
- Cena i gotowość do płacenia są do sprawdzenia.
- Nastrój bierzemy wyłącznie z deklaracji rodzica; świadomie nie analizujemy barwy głosu.
- Przed startem potrzebny jest przegląd prawny (RODO, AI Act, proces zgody seniora).

## 5. Challenges

Sport & Healthcare (oraz OPEN TASK: ARTIFICIAL INTELLIGENCE, jeśli można wybrać więcej niż jedno)

## 6. Cover image

[Zrzut pulpitu „Dziś” albo okładka decka z maskotką]

## 7. Idea stage

Nowy pomysł (powstał w całości na HackYeah 2026)

## 8. What's done so far and goal of your project

**Przed HackYeah:** nic. Pomysł, kod, design i infrastruktura powstały na wydarzeniu. Jedyne wcześniej istniejące elementy to usługi zewnętrzne, które skonfigurowaliśmy podczas hackathonu: workspace ElevenLabs i polski numer telefonu na naszym trunku SIP Telnyx. [Potwierdź / popraw w docs/PRE_EXISTING.md.]

**Podczas HackYeah:**
- **Aplikacja webowa dla rodziny:**
  - landing;
  - kreator w 7 krokach i szybki start z 3 pytań;
  - pulpit ze statusem dnia, potrzebami i trendami z 30 dni na tle normy rodzica;
  - historia rozmów z cytatami i zapisem;
  - edytowalna lista pytań (przeciąganie);
  - harmonogram, powiadomienia, pauza.
- **Agent głosowy:**
  - polski kobiecy głos;
  - prompt generowany w całości per senior;
  - zasady bezpieczeństwa (ujawnienie AI, 112, ochrona przed oszustwami, zgoda);
  - prawdziwe połączenia wychodzące z numeru +48 z automatycznym rozłączaniem.
- **Powiadomienia push (PWA):** aplikację można dodać do ekranu głównego; po każdej zakończonej rozmowie zadanie cykliczne (pg_cron, co minutę) analizuje ją i wysyła Web Push (VAPID) ze statusem dnia i potrzebami.
- **Analiza AI:** zapis rozmowy → ustrukturyzowany rekord z cytatami (OpenAI structured outputs, schemat JSON w trybie strict), zapamiętywany per rozmowa.
- **Silnik wykrywania:** normy osobiste, utrzymywanie się zmiany + CUSUM, czerwone flagi, reguła „brak kontaktu”. Ewaluacja na oznaczonym zbiorze syntetycznym, 13 testów jednostkowych.
- **Backend:** Supabase (Postgres z row-level security, zgoda egzekwowana w bazie, Edge Functions). Klucze API wyłącznie jako sekrety po stronie serwera. Połączenia wymagają zalogowania, idą tylko na numery +48 i mają limit na godzinę.

**Cel po hackathonie:** 6-tygodniowy pilotaż z ok. 20 rodzinami. Sprawdzamy, czy dzieci szybciej reagują na gorszy tydzień rodzica i czy seniorzy chętnie odbierają. Potem model abonamentowy i wspólne konta dla rodzeństwa.

## 9. Team status

[Full team / Looking for teammates]

## 10. Current team size

[liczba osób]

## 13. Your video presentation

[Link YouTube „Niepubliczny”, najlepiej z telefonem, który dzwoni na żywo, i analizą pojawiającą się w aplikacji]

## 14. Website

https://telefon-do-seniora.vercel.app

## 15. Code Repository

https://github.com/BK006/telefon-do-seniora

## 16. Instructions on how to open project

1. Otwórz https://telefon-do-seniora.vercel.app (dowolna nowoczesna przeglądarka, komputer lub telefon).
2. Kliknij **„Zaloguj się”** (prawy górny róg) i zaloguj się kontem dla jury: **jury@telefondoseniora.pl** (hasło w formularzu zgłoszeniowym HackYeah) (konto demo, wyłącznie dane syntetyczne). Okno szybkiego startu zapyta, do kogo dzwonić i jak się zwracać. Możesz je zamknąć, żeby przeglądać przykładowe dane.
3. **Dziś:** startuje czysto („Czekam na pierwszą rozmowę”). Kliknij **„Zadzwoń teraz na próbę”** z własnym polskim numerem (wpisz go w oknie szybkiego startu), żeby odebrać prawdziwy telefon; potem pulpit pokaże status dnia, potrzeby i podsumowanie z tej rozmowy. „Demo: pokaż inny stan pulpitu” na dole pokazuje przykładowe stany (w porządku, warto zadzwonić, pilne, nie odebrała, ładowanie) z trendami z 30 dni.
4. **Rozmowy:** każde połączenie wykonane z aplikacji, z analizą AI (status, potrzeby, oceny z cytatami) i pełnym zapisem.
