// Initialize Lucide icons
lucide.createIcons();

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const htmlClass = document.documentElement.classList;

if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlClass.add('dark');
} else {
    htmlClass.remove('dark');
}

themeToggle.addEventListener('click', () => {
    htmlClass.toggle('dark');
    if (htmlClass.contains('dark')) {
        localStorage.theme = 'dark';
    } else {
        localStorage.theme = 'light';
    }
});

// Carrier configurations
const carriers = [
    // CZ / SK / CE
    { id: 'packeta', name: 'Zásilkovna', trackId: 100132, regex: /^Z\d{10}$/i, trackUrl: 'https://tracking.packeta.com/cs_CZ/?id=%s' },
    { id: 'cpost', name: 'Česká pošta', trackId: 3221, regex: /^[A-Z]{2}\d{9,10}[A-Z]{1,2}$/i, trackUrl: 'https://www.postaonline.cz/trackandtrace/-/zasilka/cislo?parcelNumbers=%s' },
    { id: 'ppl', name: 'PPL', trackId: 100346, regex: /^\d{11}$/i, trackUrl: 'https://www.ppl.cz/vyhledat-zasilku?shipmentId=%s' },
    
    // Globální & Evropské kurýrní služby
    { id: 'dpd', name: 'DPD', trackId: 100030, regex: /^\d{14,15}$/i, trackUrl: 'https://www.dpd.com/cz/cs/sledovani-zasilek/?parcelNumber=%s' },
    { id: 'gls', name: 'GLS', trackId: 100021, regex: /^\d{11,14}$/i, trackUrl: 'https://gls-group.eu/CZ/cs/sledovani-zasilek?match=%s' },
    { id: 'dhl', name: 'DHL', trackId: 100001, regex: /^\d{10}$|^\d{20}$/i, trackUrl: 'https://www.dhl.com/cz-cs/home/tracking/tracking-express.html?submit=1&tracking-id=%s' },
    { id: 'ups', name: 'UPS', trackId: 100002, regex: /^1Z[0-9A-Z]{16}$/i, trackUrl: 'https://www.ups.com/track?tracknum=%s' },
    { id: 'fedex', name: 'FedEx', trackId: 100003, regex: /^\d{12,20}$/i, trackUrl: 'https://www.fedex.com/fedextrack/?trknbr=%s' },
    
    // Evropské národní pošty (UPU standard a lokální formáty)
    { id: 'postnl', name: 'PostNL', regex: /^[A-Z]{2}\d{9}NL$|^3S[A-Z0-9]{13}$/i, trackUrl: 'https://postnl.post/tracktrace' },
    { id: 'royalmail', name: 'Royal Mail', regex: /^[A-Z]{2}\d{9}GB$/i, trackUrl: 'https://www.royalmail.com/track-your-item#/' },
    { id: 'bpost', name: 'Bpost (BE)', regex: /^[A-Z]{2}\d{9}BE$|^3232\d{20}$/i, trackUrl: 'https://track.bpost.cloud/btr/web/#/search?itemCode=%s' },
    { id: 'correos', name: 'Correos (ES)', regex: /^[A-Z]{2}\d{9}ES$|^P[A-Z0-9]{22}$/i, trackUrl: 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=%s' },
    { id: 'laposte', name: 'La Poste (FR)', regex: /^[A-Z]{2}\d{9}FR$|^(6A|8V|8U)\d{11}$/i, trackUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=%s' },
    { id: 'posteitaliane', name: 'Poste Italiane', regex: /^[A-Z]{2}\d{9}IT$/i, trackUrl: 'https://www.poste.it/cerca/index.html#/risultati-spedizioni/%s' },
    { id: 'postat', name: 'Österreichische Post', regex: /^[A-Z]{2}\d{9}AT$/i, trackUrl: 'https://www.post.at/s/sendungssuche?sendungsnummer=%s' },
    
    // Další služby
    { id: 'inpost', name: 'InPost (PL)', regex: /^6\d{23}$/i, trackUrl: 'https://inpost.pl/sledzenie-przesylek?number=%s' }
];

const STATUS_STAGES = [
    { level: 0, status: 'Přijato do přepravy', location: 'Depo podání' },
    { level: 1, status: 'V tranzitu', location: 'Centrální HUB' },
    { level: 2, status: 'Doručuje se', location: 'Kurýr / Výdejní místo' },
    { level: 3, status: 'Doručeno', location: 'Adresát' }
];

// Elements
const form = document.getElementById('tracking-form');
const input = document.getElementById('tracking-number');
const inputContainer = document.getElementById('input-container');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const carrierSelection = document.getElementById('carrier-selection');
const carrierChips = document.getElementById('carrier-chips');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const resultContainer = document.getElementById('result-container');

const historyContainer = document.getElementById('history-container');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const clearConfirm = document.getElementById('clear-confirm');

let selectedCarrierId = null;
let searchHistory = JSON.parse(localStorage.getItem('trackHistory') || '[]');

// Decode effect function
function decodeEffect(element, finalValue) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let iterations = 0;
    
    const interval = setInterval(() => {
        element.innerText = finalValue.split('').map((char, index) => {
            if (index < iterations) return finalValue[index];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        if (iterations >= finalValue.length) {
            clearInterval(interval);
            element.innerText = finalValue;
        }
        iterations += 1/2; 
    }, 30);
}

// Input handler
input.addEventListener('input', (e) => {
    const val = e.target.value.replace(/\s+/g, '').toUpperCase();
    selectedCarrierId = null;
    
    inputContainer.classList.remove('border-red-500', 'animate-shake');
    errorState.classList.add('hidden');
    
    if (val.length < 5) {
        carrierSelection.classList.add('hidden');
        return;
    }
    
    const matched = carriers.filter(c => c.regex.test(val));
    
    if (matched.length > 1) {
        carrierChips.innerHTML = matched.map(c => `
            <button type="button" data-id="${c.id}" class="carrier-chip px-3 py-1 border border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white text-xs font-mono uppercase transition-colors">
                ${c.name}
            </button>
        `).join('');
        carrierSelection.classList.remove('hidden');
        
        document.querySelectorAll('.carrier-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                selectedCarrierId = chip.dataset.id;
                document.querySelectorAll('.carrier-chip').forEach(c => {
                    c.classList.remove('bg-neutral-200', 'dark:bg-neutral-800', 'border-black', 'dark:border-white');
                });
                chip.classList.add('bg-neutral-200', 'dark:bg-neutral-800', 'border-black', 'dark:border-white');
            });
        });
    } else if (matched.length === 1) {
        selectedCarrierId = matched[0].id;
        carrierSelection.classList.add('hidden');
    } else {
        carrierSelection.classList.add('hidden');
    }
});

function renderHistory() {
    if (searchHistory.length === 0) {
        historyContainer.classList.add('hidden');
        return;
    }
    
    historyContainer.classList.remove('hidden');
    historyList.innerHTML = searchHistory.map(item => `
        <button class="history-item flex justify-between items-center group py-2 border-b border-neutral-200 dark:border-neutral-800" data-number="${item.number}" data-carrier="${item.carrierId}">
            <span class="relative flex items-center">
                <i data-lucide="arrow-right" class="w-4 h-4 history-arrow text-accent absolute left-0"></i>
                <span class="history-code-wrapper font-mono text-sm tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-accent">${item.number}</span>
            </span>
            <span class="text-xs font-mono text-label uppercase">${carriers.find(c => c.id === item.carrierId)?.name || 'Auto'}</span>
        </button>
    `).join('');
    
    lucide.createIcons();
    
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.dataset.number;
            selectedCarrierId = item.dataset.carrier !== 'null' ? item.dataset.carrier : null;
            form.dispatchEvent(new Event('submit'));
        });
    });
}

// Clear history with confirm
let clearTimer = null;
clearHistoryBtn.addEventListener('click', () => {
    if (clearConfirm.classList.contains('hidden')) {
        clearConfirm.classList.remove('hidden');
        clearHistoryBtn.textContent = 'Potvrdit smazání';
        clearHistoryBtn.classList.add('text-red-500');
        clearTimer = setTimeout(() => {
            clearConfirm.classList.add('hidden');
            clearHistoryBtn.textContent = 'Vymazat';
            clearHistoryBtn.classList.remove('text-red-500');
        }, 3000);
    } else {
        clearTimeout(clearTimer);
        searchHistory = [];
        localStorage.removeItem('trackHistory');
        renderHistory();
        clearConfirm.classList.add('hidden');
        clearHistoryBtn.textContent = 'Vymazat';
        clearHistoryBtn.classList.remove('text-red-500');
    }
});

renderHistory();

// === KONFIGURACE ===
const USE_REAL_API = true; 
const API_KEY = '2F67B64127F5DF46107DC83162CE3757'; // 17TRACK klíč 

async function fetchTrackingData(trackingNumber, carrierId) {
    if (!USE_REAL_API) {
        return mockApiCall(trackingNumber, carrierId); 
    }
    
    // Hybridní podpora: Lokální server.py vs. GitHub Pages (CORS proxy)
    try {
        const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.protocol !== 'file:';
        
        const carrierObj = carriers.find(c => c.id === carrierId);
        const payload = [{ "number": trackingNumber }];
        if (carrierObj && carrierObj.trackId) {
            payload[0].carrier = carrierObj.trackId;
        }
        
        const fetch17Track = async (endpoint) => {
            let url;
            let headers = { 'Content-Type': 'application/json' };
            
            if (isLocalServer) {
                // Lokální Python server (proxy)
                url = `/api/17track${endpoint}`;
            } else {
                // GitHub Pages / statický web (CORS proxy přímo na 17TRACK)
                url = `https://cors-anywhere.herokuapp.com/https://api.17track.net/track/v2.2${endpoint}`;
                headers['17token'] = API_KEY;
                headers['X-Requested-With'] = 'XMLHttpRequest';
            }
            
            const res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const text = await res.text();
                if (res.status === 403 && text.includes('/corsdemo')) {
                    throw new Error('cors_locked');
                }
                throw new Error(`network_error|STATUS: ${res.status} | BODY: ${text.substring(0, 50)}`);
            }
            return await res.json();
        };

        let apiData = await fetch17Track('/gettrackinfo');
        
        // Pokud není v evidenci (unregistered), musíme ho nejdřív zaregistrovat
        if (apiData.data?.rejected?.[0]?.error?.code === -18019902 || apiData.data?.accepted?.length === 0) {
            apiData = await fetch17Track('/register');
            
            // 17track potřebuje chvilku na stažení dat po nové registraci
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Znovu zavoláme gettrackinfo, abychom dostali plná data s events
            apiData = await fetch17Track('/gettrackinfo');
        }
        
        const accepted = apiData.data?.accepted?.[0];
        if (!accepted) throw new Error('not_found');
        
        const trackInfo = accepted.track_info || accepted.track;
        const tracking = trackInfo?.tracking || trackInfo;
        const provider = tracking?.providers?.[0];
        let events = provider?.events;
        
        if (!events || events.length === 0) {
            if (trackInfo.latest_status?.status === 'Pending' || trackInfo.latest_status?.status === 'NotFound') {
                events = [{
                    description: "Zásilka byla zaregistrována, čekáme na první data od dopravce...",
                    time_iso: new Date().toISOString(),
                    location: ""
                }];
            } else {
                throw new Error('not_found');
            }
        }
        
        // --- 17TRACK TRANSLATION DICTIONARY ---
        const translateText = (text) => {
            if (!text) return text;
            
            // Sjednotíme typografické a obyčejné apostrofy
            let translated = text.toLowerCase().replace(/['’]/g, "'");
            
            const dict = {
                "the consignment was delivered": "Zásilka byla doručena",
                "email alert for the addressee": "E-mailové upozornění adresátovi",
                "sms alert for the addressee": "SMS upozornění adresátovi",
                "the consignment was deposited to post office": "Zásilka byla uložena na poště",
                "the consignment was deposited": "Zásilka byla uložena",
                "the consignment is being transported to balikovna": "Zásilka se přepravuje do Balíkovny",
                "the consignment is transported": "Zásilka je v přepravě",
                "the consignment was sent for transportation": "Zásilka byla odeslána k přepravě",
                "the consignment left the logistics hub": "Zásilka opustila třídící centrum",
                "receipt of data about consignment": "Přijata elektronická data o zásilce",
                "balikovna operating restrictions": "Omezený provoz Balíkovny",
                // Zásilkovna
                "the parcel is with you. thank you, and we look forward to next time.": "Zásilka je u vás. Děkujeme a těšíme se na příště.",
                "the parcel is ready for pickup": "Zásilka je připravena k vyzvednutí",
                "it's almost there! your parcel is on its way to you.": "Už se to blíží! Zásilka je na cestě k vám.",
                "your parcel has arrived at the depot": "Zásilka dorazila na depo",
                "we're now preparing it for delivery": "Připravujeme ji k doručení",
                "we have successfully received the parcel for transport": "Zásilku jsme úspěšně převzali k přepravě",
                "we are aware of your parcel and are waiting for the sender to hand it over to us": "O zásilce víme a čekáme, až nám ji odesílatel předá"
            };
            
            for (const [eng, cze] of Object.entries(dict)) {
                translated = translated.replace(new RegExp(eng.replace(/['’]/g, "'"), 'g'), cze);
            }
            return translated.charAt(0).toUpperCase() + translated.slice(1);
        };

        const latestEvent = events[0]; 
        
        return {
            number: trackingNumber,
            carrier: carriers.find(c => c.id === carrierId) || { name: provider.provider?.name || 'Neznámý' },
            statusLevel: trackInfo.latest_status?.status === 'Delivered' || trackInfo.status === 'Delivered' ? 3 : 1, 
            statusText: translateText(latestEvent.description || latestEvent.stage),
            eta: '--',
            timeline: events.map(event => ({
                status: translateText(event.description || event.stage),
                location: event.location || 'Neznámé místo',
                date: event.time_iso.replace('T', ' ').substring(0, 16),
                isFuture: false,
                isCurrent: event === latestEvent
            }))
        };
    } catch (err) {
        throw err;
    }
}

// Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trackingNumber = input.value.replace(/\s+/g, '').toUpperCase();
    
    if (!trackingNumber) return;
    
    const formatVisualNumber = (num, carrier) => {
        if (!carrier) return num;
        if (carrier.id === 'packeta' && /^Z\d{10}$/i.test(num)) {
            return num.replace(/^(Z)(\d{3})(\d{4})(\d{3})$/i, '$1 $2 $3 $4').toUpperCase();
        }
        if (carrier.id === 'cpost' && /^[A-Z]{2}\d{9,10}[A-Z]{1,2}$/i.test(num)) {
            return num.replace(/^([A-Z]{2})(\d+)([A-Z]+)$/i, '$1 $2 $3').toUpperCase();
        }
        return num.toUpperCase();
    };
    
    if (!selectedCarrierId) {
        const matched = carriers.filter(c => c.regex.test(trackingNumber));
        if (matched.length === 1) {
            selectedCarrierId = matched[0].id;
        } else if (matched.length > 1) {
            alert('Nalezeno více shod. Prosím vyberte dopravce v menu níže.');
            return;
        }
    }
    
    if (selectedCarrierId) {
        input.value = formatVisualNumber(trackingNumber, carriers.find(c => c.id === selectedCarrierId));
    }
    
    carrierSelection.classList.add('hidden');
    inputContainer.classList.remove('border-red-500', 'animate-shake');
    
    btnText.classList.add('opacity-0');
    btnLoader.classList.remove('hidden');
    document.getElementById('track-btn').disabled = true;
    
    errorState.classList.add('hidden');
    resultContainer.classList.add('hidden');
    resultContainer.innerHTML = '';
    loadingState.classList.remove('hidden');
    
    if (!searchHistory.find(h => h.number === trackingNumber)) {
        searchHistory.unshift({ number: trackingNumber, carrierId: selectedCarrierId, date: new Date().toISOString() });
        if (searchHistory.length > 5) searchHistory.pop();
        localStorage.setItem('trackHistory', JSON.stringify(searchHistory));
        renderHistory();
    }
    
    try {
        const data = await fetchTrackingData(trackingNumber, selectedCarrierId);
        renderResult(data);
    } catch (err) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        inputContainer.classList.add('border-red-500', 'animate-shake');
        
        setTimeout(() => inputContainer.classList.remove('animate-shake'), 400);
        
        if (err.message === 'not_found') {
            errorMessage.innerHTML = 'Zásilka tohoto podacího čísla není v evidenci.';
        } else if (err.message === 'cors_locked') {
            errorMessage.innerHTML = 'Pro testování klikněte na tento odkaz: <a href="https://cors-anywhere.herokuapp.com/corsdemo" target="_blank" class="underline font-bold text-red-500">Odemknout proxy</a> a klikněte na "Request temporary access". Poté zkuste hledat znovu.';
        } else if (err.message.includes('network_error|')) {
            errorMessage.textContent = 'Detaily chyby: ' + err.message.split('|')[1] + (err.message.split('|')[2] || '');
        } else {
            errorMessage.textContent = 'Došlo k chybě sítě. Zkuste to znovu.';
        }
    } finally {
        btnText.classList.remove('opacity-0');
        btnLoader.classList.add('hidden');
        document.getElementById('track-btn').disabled = false;
    }
});

function mockApiCall(number, carrierId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (number.includes('ERROR')) return reject(new Error('network_error'));
            if (number.includes('404')) return reject(new Error('not_found'));
            
            const carrier = carriers.find(c => c.id === carrierId) || carriers[0];
            
            let currentLevelIdx = Math.floor(Math.random() * 4);
            if (number.includes('DELIVERED')) currentLevelIdx = 3;
            if (number.includes('TRANSIT')) currentLevelIdx = 1;

            const baseDate = new Date();
            
            const timeline = STATUS_STAGES.map((stage) => {
                let date = null;
                if (stage.level <= currentLevelIdx) {
                    const hoursAgo = (currentLevelIdx - stage.level) * 12; // pseudo realistic spacing
                    date = new Date(baseDate.getTime() - hoursAgo * 3600000 - Math.random() * 3600000).toISOString();
                }
                return {
                    status: stage.status,
                    location: stage.location,
                    date: date,
                    isFuture: stage.level > currentLevelIdx,
                    isCurrent: stage.level === currentLevelIdx
                };
            }).reverse(); // Latest on top (level 3 -> 0)
            
            resolve({
                number,
                carrier,
                statusLevel: currentLevelIdx,
                statusText: STATUS_STAGES[currentLevelIdx].status,
                eta: currentLevelIdx < 3 ? 'Dnes, 14:00 - 16:00 (za cca 3 h)' : '--',
                timeline
            });
        }, 800);
    });
}

function renderResult(data) {
    loadingState.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    const formatDate = (isoString) => {
        if (!isoString) return { date: '--', time: '--' };
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const timelineHtml = data.timeline.map((event, idx) => {
        const { date, time } = formatDate(event.date);
        
        let squareClasses = "w-[12px] h-[12px] rounded-none absolute left-[0px] top-[7px] z-10 animate-badge-pop delay-" + idx;
        
        if (event.isCurrent && data.statusLevel === 3) {
            squareClasses += " bg-green-500 shadow-[0_0_0_3px_#f5f5f4] dark:shadow-[0_0_0_3px_#0a0a0a]";
        } else if (event.isCurrent) {
            squareClasses += " bg-accent pulse-square shadow-[0_0_0_3px_#f5f5f4] dark:shadow-[0_0_0_3px_#0a0a0a]";
        } else if (event.isFuture) {
            squareClasses += " border-[2px] border-neutral-400 dark:border-neutral-600 bg-[#f5f5f4] dark:bg-[#0a0a0a] shadow-[0_0_0_3px_#f5f5f4] dark:shadow-[0_0_0_3px_#0a0a0a]";
        } else {
            squareClasses += " bg-neutral-400 dark:bg-neutral-600 shadow-[0_0_0_3px_#f5f5f4] dark:shadow-[0_0_0_3px_#0a0a0a]";
        }
        
        const textColor = event.isCurrent ? 'text-neutral-900 dark:text-white font-bold' : 
                          (event.isFuture ? 'text-neutral-400 dark:text-neutral-500' : 'text-timeline-sub');
                          
        const dateColor = event.isCurrent ? 'text-neutral-500 dark:text-neutral-400' : 'text-timeline-sub';
                          
        const lineClass = event.isFuture ? 'dashed' : '';

        return `
            <div class="timeline-item relative pl-8 pb-8 animate-stagger-item delay-${idx}">
                <div class="timeline-line ${lineClass}"></div>
                <div class="${squareClasses}"></div>
                <div class="grid grid-cols-[140px_1fr] items-baseline gap-4 sm:gap-6">
                    <span class="font-mono text-xs ${dateColor} whitespace-nowrap">${date} ${time !== '--' ? time : ''}</span>
                    <div>
                        <h4 class="text-sm uppercase tracking-wider ${textColor}">${event.status}</h4>
                        ${event.location && event.location !== 'Neznámé místo' ? `<p class="text-xs font-mono text-timeline-sub mt-1">${event.location}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const statusBadgeColor = data.statusLevel === 3 ? 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-500/10' : 'text-accent border-accent/30 bg-accent/10';

    resultContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 border-t border-neutral-200 dark:border-neutral-800 pt-8 animate-fade-in">
            
            <!-- Info Panel -->
            <div class="flex flex-col gap-8 animate-stagger-item delay-0">
                <div>
                    <p class="text-xs font-mono uppercase text-label mb-1">Dopravce</p>
                    <p class="text-lg font-semibold">${data.carrier.name}</p>
                </div>
                <div>
                    <p class="text-xs font-mono uppercase text-label mb-1">Kód zásilky</p>
                    <div class="flex items-center gap-2">
                        <p id="result-tracking-number" class="text-lg font-mono tracking-tight">${data.number}</p>
                        <button id="copy-btn" class="text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                        <span id="copy-toast" class="text-xs font-mono text-green-500 opacity-0 transition-opacity">Zkopírováno</span>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-mono uppercase text-label mb-1">Aktuální stav</p>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-mono font-bold uppercase tracking-wider border ${statusBadgeColor} animate-badge-pop delay-1">
                        ${data.statusText}
                    </span>
                </div>
                ${data.statusLevel < 3 ? `
                <div>
                    <p class="text-xs font-mono uppercase text-label mb-1">Odhad doručení</p>
                    <p class="text-lg font-semibold animate-fade-in">${data.eta}</p>
                </div>
                ` : ''}
                
                <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <p class="text-xs font-mono uppercase text-label mb-2">Ověření zdroje</p>
                    <a href="${data.carrier.trackUrl.replace('%s', data.number)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 hover:text-accent dark:hover:text-accent transition-colors group">
                        Oficiální web dopravce 
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                    </a>
                </div>
            </div>

            <!-- Timeline Panel -->
            <div>
                <div class="flex justify-between items-end mb-6">
                    <p class="text-xs font-mono uppercase tracking-widest text-label">Trasa</p>
                    <p class="text-xs font-mono text-label bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">${data.statusLevel + 1} / 4</p>
                </div>
                <div>
                    ${timelineHtml}
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();

    // Decode effect on number
    decodeEffect(document.getElementById('result-tracking-number'), data.number);

    document.getElementById('copy-btn')?.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('track', data.number);
        navigator.clipboard.writeText(url.toString());
        
        const btn = document.getElementById('copy-btn');
        const icon = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-green-500"></i>';
        document.getElementById('copy-toast').classList.remove('opacity-0');
        lucide.createIcons();
        
        setTimeout(() => {
            btn.innerHTML = icon;
            document.getElementById('copy-toast').classList.add('opacity-0');
        }, 1500);
    });
}

const urlParams = new URLSearchParams(window.location.search);
const trackParam = urlParams.get('track');
if (trackParam) {
    input.value = trackParam;
    form.dispatchEvent(new Event('submit'));
}
