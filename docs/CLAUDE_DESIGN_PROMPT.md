Zaprojektuj aplikację webową (responsywną, mobile-first, ale wygodną też na desktopie) o nazwie **„Telefon do seniora”**. Cały interfejs po polsku.

## Czym jest produkt
Usługa, w której asystent AI codziennie dzwoni do starszej osoby mieszkającej samotnie. Krótko i ciepło z nią rozmawia, zbiera odpowiedzi na ustalone pytania i wysyła rodzinie e-mail o tym, jak ta osoba się czuje i czy czegoś potrzebuje. Użytkownikiem aplikacji jest **osoba, która wykupiła usługę**: zwykle dorosłe dziecko lub wnuk seniora. Konfiguruje rozmowy i czyta ich wyniki.

## Styl i brand
- Przyjazny, ciepły, radosny, „clean”. Dużo powietrza, duże zaokrąglenia (16–24 px), grube, czytelne fonty (np. „Nunito” lub „DIN Round”-podobny, zaokrąglony sans).
- Paleta inspirowana Duolingo, ale własna, nie kopia:
  - główny zielony `#58CC02` (ciemniejszy `#46A302` na cień przycisku),
  - niebieski `#1CB0F6`, żółty `#FFC800`, pomarańczowy `#FF9600`, czerwony `#FF4B4B`, fiolet `#CE82FF`,
  - tła białe i bardzo jasnoszare `#F7F7F7`, tekst prawie czarny `#3C3C3C`.
  - Tekst na kolorowych tłach musi mieć kontrast AA. Jasny zielony nie nadaje się na tekst na białym, tam użyj ciemniejszego odcienia.
- Przyciski „3D”: pełny kolor z wyraźnym dolnym cieniem w ciemniejszym odcieniu, wciskają się przy kliknięciu (translateY + mniejszy cień). Karty z delikatną ramką 2 px zamiast mocnych cieni.
- **Maskotka/brand hero:** sympatyczna, prosta postać, np. zaokrąglona słuchawka telefoniczna z oczami albo ptaszek ze słuchawką. Pojawia się w hero, w onboardingu (podpowiada, co robić na danym kroku), w stanach pustych i przy sukcesie („Pierwsza rozmowa zaplanowana!”). Ma zmieniać wyraz twarzy: radość, zamyślenie, troska.
- Ikony zaokrąglone i grube. Mikrointerakcje krótkie (150–250 ms), z lekką sprężystością tylko przy sukcesie.

## Ekrany do zaprojektowania

### 1. Landing / hero
Duży nagłówek, np. „Codzienny telefon do mamy, nawet gdy nie możesz zadzwonić”, maskotka, przycisk „Zacznij za darmo”. Pod spodem 3 kroki „Jak to działa”: ustaw rozmowy → asystent dzwoni → dostajesz podsumowanie. Na dole sekcja zaufania: asystent zawsze przedstawia się jako AI, nie stawia diagnoz, nigdy nie prosi o pieniądze ani hasła.

### 2. Onboarding: kreator w krokach
Pasek postępu jak w Duolingo (gruby, zielony), maskotka z dymkiem podpowiedzi przy każdym kroku. Kroki:

1. **O kim się troszczysz:** imię, jak się do tej osoby zwracać (np. „Pani Halino”, „Mamo”, „Panie Janie”), rok urodzenia, numer telefonu, relacja („mama”, „dziadek”). Do tego przełączniki: „słabiej słyszy” (asystent mówi wolniej i głośniej) i „woli krótkie rozmowy”.
2. **Zdrowie i kontekst:** choroby przewlekłe (chipsy do wyboru plus własne), krótka historia chorób, przyjmowane leki i pora ich brania, ograniczenia ruchowe. Wyraźna informacja: „To kontekst dla asystenta, nie podstawa do porad medycznych”.
3. **Co lubi i o czym rozmawiać:** zainteresowania (chipsy: ogród, radio, krzyżówki, kot, wnuki, gotowanie…), imiona bliskich i zwierząt, ulubione tematy oraz tematy, których należy unikać.
4. **Co asystent ma zebrać:** lista pytań jako karty, które można przeciągać, włączać i wyłączać. Gotowe pytania: sen, apetyt, samopoczucie, ból, leki, wyjście z domu, kontakt z ludźmi, „czy czegoś potrzebujesz (zakupy, lekarstwa, pomoc)”. Do tego przycisk „+ Dodaj własne pytanie”. Przy każdym pytaniu: jak często je zadawać (codziennie / 2× w tygodniu).
5. **Kiedy dzwonić:** wybór dni jako duże okrągłe przyciski Pn–Nd, ze skrótami „Pn–Pt” i „Codziennie”. Godzina połączenia (time picker, możliwe 1–2 sloty). Ponowna próba, gdy nie odbierze (np. po 2 godzinach, maks. 2 próby).
6. **Powiadomienia:** jeden lub więcej adresów e-mail (chipsy). Co wysyłać: natychmiast przy niepokojącym sygnale; podsumowanie po każdej rozmowie albo raz dziennie; tygodniowe podsumowanie; gdy osoba czegoś potrzebuje; gdy nie odebrała 2 dni z rzędu.
7. **Podgląd i zgoda:** karta „Tak przedstawi się asystent” z przykładowym pierwszym zdaniem w dymku („Dzień dobry, Pani Halino, tu asystent AI Telefonu do seniora…”) i przyciskiem odsłuchu. Checkbox: senior wie o rozmowach i się na nie zgadza. Na końcu duży przycisk „Zaplanuj pierwszą rozmowę” i ekran sukcesu z maskotką.

### 3. Pulpit osoby, o którą się troszczysz
- Nagłówek z imieniem i avatarem (inicjały) oraz statusem dnia jako dużą kartą:
  - „Wszystko w porządku” (zielony),
  - „Warto zadzwonić” (żółty/pomarańczowy),
  - „Pilne” (czerwony),
  - „Nie odebrała” (szary/niebieski).
  - Status zawsze ma ikonę i tekst, nie tylko kolor.
- Karta „Potrzebuje”: rzeczy, o które prosiła w rozmowie, np. „chleb i mleko”, „podwiezienie do lekarza w czwartek”. Każda z checkboxem „załatwione”.
- Seria dni jak streak w Duolingo, np. „🔥 12 dni rozmów z rzędu”, oraz mini-kalendarz tygodnia z kropkami: odebrała / nie odebrała / ponowiona.
- Najbliższa zaplanowana rozmowa z przyciskami „Zadzwoń teraz” i „Pomiń dziś”.
- Proste trendy z 30 dni (sen, apetyt, samopoczucie) jako przyjazne wykresy z pasmem „jej normy”.

### 4. Historia rozmów (sesje)
- Lista sesji: data, godzina, czas trwania, status (odebrała / nie odebrała / ponowiona), 1-zdaniowe podsumowanie.
- Szczegóły sesji:
  - odpowiedzi na pytania z listy jako karty, np. „Sen: 2/5 — «budziłam się co chwilę»”, z cytatem jako dowodem;
  - pytania bez odpowiedzi oznaczone „nie rozmawialiśmy o tym”;
  - zwijany transkrypt w formie dymków czatu;
  - na dole: „Mama poprosiła, by nie przekazywać: samopoczucie” (kategoria wstrzymana przez seniora).

### 5. Ustawienia
Te same sekcje co w onboardingu, do edycji w dowolnym momencie, plus pauza rozmów (np. „Mama jest w sanatorium do 15.10”).

## Stany do pokazania
Pusty pulpit przed pierwszą rozmową (maskotka czeka przy telefonie), ładowanie, „nie odebrała” z informacją o ponownej próbie, alert pilny z czerwonym banerem.

Alert pilny ma brzmieć tak: „Mama wspomniała o upadku. Asystent poinformował ją o numerze 112. Zadzwoń do niej teraz.” i mieć duży przycisk „Zadzwoń do mamy”.

## Zasady UX i treści
- Ton ciepły, prosty, bez żargonu medycznego. Nigdy nie stawiaj diagnoz w copy.
- Duże cele dotyku (min. 44 px), nawigacja klawiaturą, kontrast AA.
- Na mobile dolny pasek zakładek: „Dziś”, „Rozmowy”, „Pytania”, „Ustawienia”.
- Pokaż desktop i mobile dla pulpitu oraz jednego kroku onboardingu.
