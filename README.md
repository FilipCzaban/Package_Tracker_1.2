# 📦 Brutalist Parcel Tracker (EU & CZ)

Minimalistický, technicky laděný sledovač zásilek s důrazem na vysoký kontrast, přehlednost a rychlost. Inspirováno brutalistním stylem (Linear, Vercel).

Podporuje české i mezinárodní dopravce s automatickou detekcí čísla zásilky a živými daty přes **17TRACK API (v2.2)** s automatickým překladem do češtiny.

---

## ✨ Klíčové funkce

- **Automatická detekce dopravce:**
  - 🇨🇿 **Česko / Slovensko:** Zásilkovna (Packeta), Česká pošta (Balíkovna, Balík do ruky), PPL
  - 🌍 **Globální & Evropští kurýři:** DHL, DPD, GLS, UPS, FedEx, PostNL, Royal Mail, Bpost a další
- **Živá data bez prodlev:** Komunikace s API 17TRACK v2.2.
- **Automatický překladač:** Anglické stavové zprávy z API jsou automaticky přeloženy do srozumitelné češtiny.
- **Formátování kódu:** Vizuální formátování mezer podle zvyklostí dopravce (např. `Z 449 4111 470` nebo `NB 1182147625 C`).
- **Lokální historie:** Ukládání posledních vyhledávání do `localStorage` s možností rychlého opětovného vyhledání nebo smazání.
- **Klávesové zkratky:** Stisknutí klávesy `/` okamžitě aktivuje vyhledávací pole.
- **Oficiální odkaz:** Přímý proklik na původní sledovací stránku konkrétního dopravce.
- **Dark / Light mode:** Přepínání světlého a tmavého režimu s pamětí v prohlížeči.

---

## 🛠️ Použité technologie

- **Frontend:** HTML5, Vanilla JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/) (CDN), [Lucide Icons](https://lucide.dev/)
- **Typografie:** `JetBrains Mono` & `Inter`
- **Backend / Proxy:** Python 3 (standardní knihovna `http.server`, `urllib` – bez nutnosti instalovat externí knihovny)

---

## 🚀 Jak spustit projekt lokálně

Projekt je navržen tak, aby běžel na jedno kliknutí bez složité konfigurace:

1. Stáhněte nebo naklonujte tento repozitář.
2. Dvakrát klikněte na soubor **`start.bat`**.
3. Otevře se konzolové okno se spuštěným lokálním serverem.
4. V prohlížeči otevřete:
   - **Na tomto počítači:** [http://localhost](http://localhost)
   - **Na mobilu ve stejné Wi-Fi:** `http://<vase-lokalni-ip>` (např. `http://192.168.0.9`)

> **Tip:** Chcete na PC používat hezkou adresu jako `http://track.cz`?  
> Otevřete soubor `C:\Windows\System32\drivers\etc\hosts` jako správce a přidejte řádek:  
> `127.0.0.1 track.cz`

---

## 🌐 Nasazení na web

### 1. GitHub Pages
- Nahrajte soubory (`index.html`, `app.js`, `styles.css`) do repozitáře.
- V **Settings** -> **Pages** vyberte větev `main` a uložte.
- Aplikace v kódu automaticky rozpozná běh na GitHub Pages a přesměruje požadavky přes online CORS proxy.

### 2. Vercel / Netlify
- Propojte svůj GitHub účet s [Vercel](https://vercel.com).
- Importujte repozitář na jedno kliknutí – získáte HTTPS adresu bez nutnosti řešit lokální servery.

---

## 📂 Struktura souborů

```text
├── index.html       # Hlavní rozhraní aplikace
├── app.js           # Aplikační logika, regexy dopravců, API & překladový slovník
├── styles.css       # Vlastní brutalistní CSS animace a drobné styly
├── server.py        # Lokální Python server fungující jako 17TRACK proxy
├── start.bat        # Jednoklikový spouštěč pro Windows
└── README.md        # Dokumentace projektu
```

---

## 📄 Licence
Tento projekt je open-source pod licencí [MIT](LICENSE).
