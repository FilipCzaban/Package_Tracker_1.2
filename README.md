# TrackEU - Sledování zásilek

Tato aplikace je funkční demo moderního jednostránkového rozhraní pro sledování zásilek. Momentálně funguje v **Demo režimu**, kdy vrací náhodná fiktivní data pro libovolné platné číslo (můžete zkusit např. přidat do čísla `ERROR` nebo `404` pro test chybových stavů).

## 🚀 Jak přidat reálné API (např. 17TRACK nebo AfterShip)

Aby API klíč nebyl viditelný ve zdrojovém kódu frontendu (což by bylo bezpečnostní riziko a způsobovalo by CORS chyby), je nutné nasadit malý server/proxy.

Nejjednodušší cesta v dnešní době je využít **Serverless funkce** (např. Vercel, Netlify nebo Cloudflare Workers). Zde je ukázka, jak by to vypadalo na Vercelu pomocí Node.js.

### 1. Vytvoření backend endpointu (Vercel Serverless Function)
Ve složce projektu vytvořte složku `api` a v ní soubor `track.js`:

```javascript
// api/track.js
export default async function handler(req, res) {
    const { number, carrier } = req.query;

    if (!number) {
        return res.status(400).json({ error: 'Missing tracking number' });
    }

    try {
        // Příklad s 17TRACK API (nebo AfterShip)
        const response = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                '17token': process.env.TRACKING_API_KEY // Klíč z proměnné prostředí!
            },
            body: JSON.stringify([{ number, carrier }])
        });

        const data = await response.json();
        
        // Zde by proběhla transformace dat z formátu 17TRACK do našeho formátu
        const formattedData = transformDataForFrontend(data);

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'API Error' });
    }
}
```

### 2. Úprava frontendu (`app.js`)
V souboru `app.js` nahradíte funkci `mockApiCall` skutečným voláním našeho endpointu:

```javascript
async function realApiCall(number, carrierId) {
    const response = await fetch(`/api/track?number=${number}&carrier=${carrierId}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('not_found');
        throw new Error('network_error');
    }
    return await response.json();
}
```

## 🌍 Jak nastavit a nasadit aplikaci (Vercel)

1. Vytvořte si účet na [Vercel.com](https://vercel.com).
2. Propojte svůj GitHub účet a vytvořte repozitář s těmito soubory (`index.html`, `styles.css`, `app.js`, `api/track.js`).
3. Ve Vercelu klikněte na **Add New Project** a vyberte váš repozitář.
4. V nastavení projektu (před deployem) jděte do **Environment Variables**.
5. Přidejte novou proměnnou:
   - Key: `TRACKING_API_KEY`
   - Value: `váš_tajný_klíč_z_17track_nebo_aftership`
6. Klikněte na **Deploy**.

Během pár sekund bude vaše aplikace běžet globálně na rychlé CDN, backend funkce pořeší bezpečné volání API a hotovo! Můžete také použít Netlify (funguje velmi podobně přes složku `netlify/functions`) nebo Cloudflare Pages.
