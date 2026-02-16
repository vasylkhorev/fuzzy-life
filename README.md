# Fuzzy Life

## Prehľad projektu

"Fuzzy Life" je interaktívna, webová simulácia Conwayovej Hry života a jej mnohých variantov. Aplikácia poskytuje vizuálne a interaktívne prostredie na skúmanie emergentného správania celulárnych automatov. Názov "fuzzy" odkazuje na zahrnutie režimov, ktoré používajú spojité stavy (napr. hodnoty medzi 0 a 1) a pravdepodobnostné pravidlá, na rozdiel od striktne binárnej povahy klasickej Hry života.

Aplikácia je postavená ako single-page aplikácia (SPA) pomocou Reactu. Ponúka posúvateľnú a priblížiteľnú mriežku, rôzne simulačné režimy, knižnicu preddefinovaných vzorov a možnosť pre používateľov ukladať a načítať vlastné výtvory. Používateľské rozhranie je navrhnuté tak, aby bolo intuitívne a užívateľsky prívetivé, s jasnými ovládacími prvkami a informatívnymi dialógovými oknami. Aplikácia je tiež internacionalizovaná s podporou angličtiny a slovenčiny.

## Technológie

*   **Frontend Framework:** React
*   **Nástroj na buildovanie:** Create React App
*   **Štýlovanie:**
    *   Tailwind CSS: Pre utilitárne CSS.
    *   Styled Components: Pre štýly špecifické pre komponenty.
*   **Správa stavu:**
    *   React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`): Pre stav na úrovni komponentov.
    *   Zustand: Pre globálnu správu stavu.
    *   RxJS: Pre správu komplexných asynchrónnych udalostí.
*   **Grafika:** HTML5 Canvas API
*   **Internationalizácia:** `i18next` a `react-i18next`
*   **Ďalšie knižnice:**
    *   `react-draggable`: Pre presúvateľné UI prvky.
    *   `react-icons`: Pre ikony.

## Vlastnosti

*   **Interaktívna Mriežka:** Posúvateľná a priblížiteľná mriežka pre vizualizáciu celulárnych automatov.
*   **Rôzne Simulačné Režimy:**
    *   **Klasický:** Štandardná Conwayova Hra života (B3/S23).
    *   **Spojitý (Continuous):** "Fuzzy" verzia Hry života so spojitými stavmi buniek medzi 0 a 1.
    *   **1D:** Jednorozmerný celulárny automat s Wolframovými pravidlami.
    *   **Half-Life:** Trojstavový režim s diskrétnymi hodnotami buniek 0, 0.5, 1.
    *   **Vlastný Half-Life:** Prispôsobiteľná verzia Half-Life režimu.
    *   **Quartiles:** Päťstavový režim s diskrétnymi hodnotami buniek 0, 0.25, 0.5, 0.75, 1.
    *   **Konečná Teplota (Finite Temperature):** Model spojitého stavu založený na logistickej energetickej funkcii.
*   **Správa Vzorov:** Knižnica preddefinovaných vzorov a možnosť ukladať a načítať vlastné konfigurácie.
*   **Ukladanie a Načítanie:** Možnosť ukladať aktuálny stav mriežky a konfigurácie.
*   **Medzinárodná Podpora:** Aplikácia je internacionalizovaná s podporou anglického a slovenského jazyka.

## Informácie o diplomovej práci

Táto aplikácia je súčasťou diplomovej práce s názvom "Fuzzy Life", ktorú vypracoval Bc. Vasyl Khorev v roku 2026 na Ústave informatiky v Košiciach pod vedením prof. RNDr. Stanislava Krajčiho, PhD.


Abstract práce:
"Fuzzy Life" je interaktívna webová aplikácia, ktorá simuluje Conwayovu Hru života a jej rozšírené varianty. Používa spojité stavy a pravdepodobnostné pravidlá, čím presahuje binárnu povahu klasickej Hry života. Aplikácia, vyvinutá v Reacte, ponúka vizuálne prostredie s prispôsobiteľnou mriežkou, rôznymi simulačnými režimami a možnosťou ukladania vzorov. Cieľom je intuitívne skúmanie celulárnych automatov s podporou anglického a slovenského jazyka.

Kľúčové slová: lorem ipsum, dolor, sit amet