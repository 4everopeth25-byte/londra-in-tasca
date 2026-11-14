/* Dati pubblici del viaggio. Qui NON vanno codici di prenotazione né nominativi: stanno nel file riservato, importato dall'app. */
const ADULTI = ["uomo", "donna"];
const TUTTI = ["uomo", "donna", "bambina"];
const TRIP = {
  partenza: "2026-12-23T19:05:00",
  gruppoDefault: ["Adulto 1", "Adulto 2", "Adulto 3", "Adulto 4"],
  giorni: [
    {
      iso: "2026-12-23", breve: "23 mer", data: "Mercoledì 23 dicembre", titolo: "Arrivo e prima sera", mezzo: "transit",
      tappe: [
        { ora: "19:05", nome: "Volo Wizz Air W4 6747", desc: "Venezia Marco Polo → Londra Luton, arrivo alle 20:25. Solo bagaglio a mano 40x30x20." },
        { ora: "20:25", nome: "Arrivo a Luton", desc: "Luton DART (4 minuti) fino a Luton Airport Parkway.", costo: "£4,90 il DART", q: "Luton Airport Parkway Station" },
        { ora: "Poi", nome: "Treno per St Pancras", desc: "Thameslink o Luton Airport Express, pagamento con carta contactless.", costo: "circa £15,10 off-peak", q: "St Pancras International" },
        { ora: "~22:00", nome: "Check-in alloggio", desc: "Vicino a King's Cross. L'indirizzo è nei dati riservati.", q: "King's Cross Station", casa: true },
        { ora: "Dopo il check-in", nome: "Cena da Dishoom King's Cross", desc: "Il mercoledì chiude alle 23. Accoglie i bambini.", q: "Dishoom King's Cross" }
      ],
      pub: { nome: "The Parcel Yard", dove: "dentro la stazione di King's Cross", q: "The Parcel Yard King's Cross", alt: "Con la bambina: lo stesso Parcel Yard, che ha un menu bambini, oppure Dishoom." },
      nota: "Non avrete cenato, quindi cena e poi pub, senza orari rigidi."
    },
    {
      iso: "2026-12-24", breve: "24 gio", data: "Giovedì 24 dicembre", titolo: "Vigilia: Harry Potter, Soho, Winter Wonderland", mezzo: "transit",
      tappe: [
        { ora: "08:30", nome: "Binario 9¾", desc: "Foto gratuita a King's Cross.", costo: "gratis", q: "Platform 9 3/4 King's Cross" },
        { ora: "10:00", nome: "Harry Potter Shop, Oxford Street", desc: "134-140 Oxford St, aperto dal 4 novembre 2026.", q: "Harry Potter Shop 134-140 Oxford Street" },
        { ora: "Tarda mattina", nome: "Regent Street, Carnaby e Liberty", desc: "Passeggiata tra le luci, poi pranzo a Soho.", q: "Liberty London" },
        { ora: "14:30", nome: "Hyde Park Winter Wonderland", desc: "Biglietto a orario, serve anche ai bambini dai 2 anni.", costo: "ingresso £1-8,25", q: "Hyde Park Winter Wonderland" },
        { ora: "19:00", nome: "Taxi per Olympia", desc: "Si va in taxi, la metro della vigilia chiude prima.", q: "Pillar Hall, 5 Olympia Way, London W14 0EY" },
        { ora: "20:15", nome: "Cena da Idalia, Pillar Hall", desc: "5 Olympia Way, London W14 0EY. Tavolo per 5. Tolleranza di 15 minuti sul ritardo.", q: "Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY" },
        { ora: "22:30", nome: "Taxi di rientro", desc: "Ritorno all'alloggio.", q: "King's Cross Station", casa: true }
      ],
      pub: { nome: "The Queen's Head", dove: "66 Acton Street", q: "The Queen's Head, 66 Acton Street, London", alt: "Con la bambina: sosta prima di cena al Churchill Arms di Kensington. Da verificare se ammette bambini." },
      nota: "Il pub si fa dopo la cena. Per il 25 conviene fare la spesa oggi."
    },
    {
      iso: "2026-12-25", breve: "25 ven", data: "Venerdì 25 dicembre", titolo: "Natale a piedi, anello di 10 km", mezzo: "walking",
      tappe: [
        { ora: "Via", nome: "Partenza dall'alloggio", desc: "Si va a piedi: oggi non circolano metro, treni e bus TfL.", q: "King's Cross Station", casa: true },
        { ora: "", nome: "Russell Square e British Museum", desc: "Solo esterno.", q: "British Museum" },
        { ora: "", nome: "Covent Garden", desc: "Mercato e decorazioni.", q: "Covent Garden" },
        { ora: "", nome: "Trafalgar Square", desc: "", q: "Trafalgar Square" },
        { ora: "", nome: "Whitehall e Horse Guards", desc: "", q: "Horse Guards Parade" },
        { ora: "", nome: "Big Ben e Westminster Abbey", desc: "", q: "Big Ben" },
        { ora: "", nome: "St James's Park e Buckingham Palace", desc: "", q: "Buckingham Palace" },
        { ora: "Pranzo", nome: "Chinatown", desc: "Golden Phoenix è citato tra i locali aperti a Natale. Da verificare.", q: "Golden Phoenix Chinatown London" },
        { ora: "Rientro", nome: "Soho e Bloomsbury", desc: "Ritorno a piedi verso l'alloggio.", q: "King's Cross Station", casa: true }
      ],
      pub: null,
      nota: "Pub quasi tutti chiusi. Spesa da fare il 24."
    },
    {
      iso: "2026-12-26", breve: "26 sab", data: "Sabato 26 dicembre", titolo: "Boxing Day: Sherlock e Balloon Museum", mezzo: "transit",
      tappe: [
        { ora: "09:30", nome: "Speedy's Café", desc: "187 North Gower St, la facciata del 221B nella serie BBC.", q: "Speedy's Cafe, 187 North Gower Street, London" },
        { ora: "Mattina", nome: "Baker Street", desc: "Statua di Sherlock e facciata del 221B.", q: "Sherlock Holmes statue Baker Street" },
        { ora: "12:00", nome: "Pranzo al Sherlock Holmes Pub", desc: "10 Northumberland St. Da prenotare.", q: "The Sherlock Holmes Pub, 10 Northumberland Street, London" },
        { ora: "14:30", nome: "Balloon Museum «Euphoria»", desc: "ImmerseLDN, ExCeL, Royal Docks. Jubilee line fino a Canning Town, poi DLR fino a Custom House.", costo: "adulti £28,50-34,50, bambini £23,50-28,50", q: "ExCeL London" },
        { ora: "Facoltativa", nome: "Funivia sul Tamigi", desc: "Orari da verificare per il 26.", q: "IFS Cloud Cable Car, London" }
      ],
      pub: { nome: "The Scottish Stores", dove: "King's Cross", q: "The Scottish Stores King's Cross", alt: "Con la bambina: The Parcel Yard." },
      nota: "Metro ridotta e Elizabeth line ferma."
    },
    {
      iso: "2026-12-27", breve: "27 dom", data: "Domenica 27 dicembre", titolo: "Pixar, Sunday roast e ritorno", mezzo: "transit",
      tappe: [
        { ora: "09:15", nome: "Check-out e deposito bagagli", desc: "", q: "King's Cross Station", casa: true },
        { ora: "10:00", nome: "Mundo Pixar Experience", desc: "Fulton Road, Wembley Park HA9 0TF. Aperta dal 21/12 al 3/1 tranne Natale. Visita di 45-55 minuti.", costo: "circa £34 adulti, £22 bambini", q: "Fulton Road, Wembley Park HA9 0TF" },
        { ora: "12:30", nome: "Sunday roast al The Coach Makers Arms", desc: "88 Marylebone Lane. Alternativa: The Volunteer su Baker Street.", q: "The Coach Makers Arms, 88 Marylebone Lane, London" },
        { ora: "15:00", nome: "Ritiro bagagli", desc: "", q: "King's Cross Station", casa: true },
        { ora: "16:30", nome: "Treno da St Pancras per Luton", desc: "", q: "St Pancras International" },
        { ora: "20:55", nome: "Volo Ryanair FR 761", desc: "Luton → Venezia, arrivo 00:05 del 28/12. Carta d'imbarco solo sull'app." }
      ],
      pub: null,
      nota: "Nessun pub la sera."
    }
  ],
  promemoria: [
    { id: "eta", t: "Richiedere l'ETA per tutti e 5", d: "Costo da verificare su gov.uk/eta (le fonti dicono £16 o £20 a persona)." },
    { id: "pixar", t: "Prenotare Mundo Pixar (27/12)" },
    { id: "ww", t: "Prenotare Winter Wonderland (24/12, biglietto a orario)" },
    { id: "balloon", t: "Prenotare Balloon Museum (26/12)" },
    { id: "roast", t: "Prenotare il Sunday roast (27/12)" },
    { id: "sherlock", t: "Prenotare il pranzo al Sherlock Holmes Pub (26/12)" },
    { id: "idalia", t: "Correggere il nome della prenotazione da Idalia", d: "Risulta registrato con un refuso." },
    { id: "jacuzzi", t: "Cancellare l'avviso SevenRooms di Jacuzzi", d: "Non è una prenotazione." },
    { id: "spesa", t: "Fare la spesa il 24 per il giorno di Natale" }
  ],
  daVerificare: [
    "Orari di chiusura della metro la vigilia e servizio del 26 (TfL li pubblica a fine novembre)",
    "Quali pub sono aperti il 25",
    "Apertura del Sherlock Holmes Pub e orari della funivia il 26",
    "Prezzi effettivi di Pixar e Balloon Museum per le date scelte",
    "Stime dei taxi",
    "Regole sui bambini nei pub: molti non li accettano dopo le 19-21"
  ],
  profili: { uomo: "Uomo", donna: "Donna", bambina: "Bambina" },
  /* Lista valigia: per = profili a cui si applica, q = quantità calcolata sui giorni (g) e sulle notti (n), d = nota (testo o funzione) */
  valigia: [
    { id: "mutande", cat: "Abbigliamento", t: "Mutande", per: ADULTI, q: g => g + 1 },
    { id: "calze", cat: "Abbigliamento", t: "Calze", per: ADULTI, q: g => g + 1, d: "Almeno due paia pesanti." },
    { id: "termiche", cat: "Abbigliamento", t: "Magliette o maglie termiche", per: ADULTI, q: g => Math.ceil(g * 0.8), d: "Da mettere a strati." },
    { id: "maglioni", cat: "Abbigliamento", t: "Maglioni o felpe", per: ADULTI, q: g => Math.ceil(g / 2), d: "Uno si indossa in aereo." },
    { id: "pantaloni", cat: "Abbigliamento", t: "Pantaloni caldi", per: ADULTI, q: () => 1 },
    { id: "jeans", cat: "Abbigliamento", t: "Jeans", per: ADULTI, q: g => Math.ceil(g / 3), d: "Uno si indossa in aereo." },
    { id: "piumino", cat: "Abbigliamento", t: "Giacca pesante o piumino", per: ADULTI, q: () => 1, d: "Da indossare in aereo: nel bagaglio a mano 40x30x20 non entra." },
    { id: "impermeabile", cat: "Abbigliamento", t: "Giacca impermeabile o k-way", per: ADULTI, q: () => 1 },
    { id: "sciarpa", cat: "Abbigliamento", t: "Sciarpa", per: ADULTI, q: () => 1 },
    { id: "guanti", cat: "Abbigliamento", t: "Guanti", per: ADULTI, q: () => 1 },
    { id: "cappello", cat: "Abbigliamento", t: "Cappello", per: ADULTI, q: () => 1 },
    { id: "pigiama", cat: "Abbigliamento", t: "Pigiama", per: ADULTI, q: () => 1, d: (g, n) => `Per ${n} notti.` },
    { id: "scarpe", cat: "Abbigliamento", t: "Scarpe comode e impermeabili", per: ADULTI, q: () => 1, d: "Si indossano in aereo. Si cammina molto, anche il giorno di Natale." },
    { id: "scarpe-eleg", cat: "Abbigliamento", t: "Scarpe più curate per la cena", per: ADULTI, q: () => 1, d: "Cena da Idalia, 24/12." },
    { id: "camicia", cat: "Abbigliamento", t: "Camicia o maglione elegante per la cena", per: ["uomo"], q: () => 1, d: "Cena da Idalia, 24/12." },
    { id: "cintura", cat: "Abbigliamento", t: "Cintura", per: ["uomo"], q: () => 1 },
    { id: "abito", cat: "Abbigliamento", t: "Abito o completo elegante per la cena", per: ["donna"], q: () => 1, d: "Cena da Idalia, 24/12." },
    { id: "collant", cat: "Abbigliamento", t: "Collant o calze coprenti", per: ["donna"], q: () => 2 },
    { id: "b-mutande", cat: "Abbigliamento", t: "Mutandine", per: ["bambina"], q: g => g + 2, d: "Due in più per gli imprevisti." },
    { id: "b-calze", cat: "Abbigliamento", t: "Calze", per: ["bambina"], q: g => g + 2, d: "Almeno due paia pesanti." },
    { id: "b-termiche", cat: "Abbigliamento", t: "Magliette o maglie termiche", per: ["bambina"], q: g => g },
    { id: "b-maglioni", cat: "Abbigliamento", t: "Maglioni o felpe", per: ["bambina"], q: g => Math.ceil(g / 2) },
    { id: "b-pantaloni", cat: "Abbigliamento", t: "Pantaloni o leggings", per: ["bambina"], q: g => Math.ceil(g * 0.8) },
    { id: "b-giacca", cat: "Abbigliamento", t: "Giacca imbottita", per: ["bambina"], q: () => 1 },
    { id: "b-imperm", cat: "Abbigliamento", t: "Giacca impermeabile o k-way", per: ["bambina"], q: () => 1 },
    { id: "b-sciarpa", cat: "Abbigliamento", t: "Sciarpa o scaldacollo", per: ["bambina"], q: () => 1 },
    { id: "b-guanti", cat: "Abbigliamento", t: "Guanti", per: ["bambina"], q: () => 2, d: "Un paio di riserva, si bagnano." },
    { id: "b-cappello", cat: "Abbigliamento", t: "Cappello", per: ["bambina"], q: () => 1 },
    { id: "b-pigiama", cat: "Abbigliamento", t: "Pigiama", per: ["bambina"], q: () => 2 },
    { id: "b-stivali", cat: "Abbigliamento", t: "Scarpe o stivaletti impermeabili", per: ["bambina"], q: () => 1 },
    { id: "b-vestito", cat: "Abbigliamento", t: "Vestito per la cena", per: ["bambina"], q: () => 1, d: "Cena da Idalia, 24/12." },
    { id: "b-cambio", cat: "Abbigliamento", t: "Cambio completo di riserva, nello zaino", per: ["bambina"], q: () => 1 },

    { id: "ombrello", cat: "Accessori da viaggio", t: "Ombrello pieghevole", per: ADULTI, q: () => 1, d: "Ne basta uno ogni due persone." },
    { id: "zaino", cat: "Accessori da viaggio", t: "Zainetto da giornata", per: ADULTI, q: () => 1 },
    { id: "borraccia", cat: "Accessori da viaggio", t: "Borraccia vuota", per: TUTTI, q: () => 1, d: "Si riempie dopo i controlli in aeroporto." },
    { id: "liquidi", cat: "Accessori da viaggio", t: "Sacchetto trasparente per i liquidi", per: ADULTI, q: () => 1, d: "Contenitori fino a 100 ml. Controlla le regole del tuo aeroporto." },
    { id: "beauty", cat: "Accessori da viaggio", t: "Spazzolino, dentifricio, deodorante in formato mini", per: ADULTI, q: () => 1 },
    { id: "rasoio", cat: "Accessori da viaggio", t: "Rasoio", per: ["uomo"], q: () => 1 },
    { id: "trucchi", cat: "Accessori da viaggio", t: "Trucchi, struccante e prodotti per l'igiene in formato mini", per: ["donna"], q: () => 1 },
    { id: "medicine", cat: "Accessori da viaggio", t: "Medicine personali", per: ADULTI, q: () => 1 },
    { id: "occhiali", cat: "Accessori da viaggio", t: "Occhiali o lenti di ricambio", per: ADULTI, q: () => 1 },
    { id: "sporco", cat: "Accessori da viaggio", t: "Sacchetto per la biancheria sporca", per: ADULTI, q: () => 1 },
    { id: "contanti", cat: "Accessori da viaggio", t: "Qualche sterlina in contanti", per: ADULTI, q: () => 1 },

    { id: "passaporto", cat: "Documenti", t: "Passaporto", per: TUTTI, q: () => 1, d: "Verifica i documenti richiesti per l'ingresso su gov.uk." },
    { id: "eta", cat: "Documenti", t: "ETA approvata", per: TUTTI, q: () => 1, d: "Salvata sul telefono anche in PDF o screenshot, per usarla senza rete." },
    { id: "imbarco-w", cat: "Documenti", t: "Carta d'imbarco Wizz Air", per: ADULTI, q: () => 1, d: "Volo di andata, 23/12." },
    { id: "imbarco-r", cat: "Documenti", t: "Carta d'imbarco Ryanair", per: ADULTI, q: () => 1, d: "Solo sull'app. Volo di ritorno, 27/12." },
    { id: "carta", cat: "Documenti", t: "Carta contactless e una carta di riserva", per: ADULTI, q: () => 1, d: "Serve per metro e treni." },
    { id: "assic", cat: "Documenti", t: "Assicurazione sanitaria di viaggio", per: TUTTI, q: () => 1, d: "Verifica cosa copre nel Regno Unito." },
    { id: "conferme", cat: "Documenti", t: "Conferme delle prenotazioni salvate offline", per: ADULTI, q: () => 1, d: "Idalia, alloggio, Pixar, Balloon Museum, Winter Wonderland." },

    { id: "telefono", cat: "Tecnologia", t: "Telefono, caricabatterie e cavo", per: ADULTI, q: () => 1 },
    { id: "powerbank", cat: "Tecnologia", t: "Power bank carico", per: ADULTI, q: () => 1, d: "Nel bagaglio a mano." },
    { id: "adattatore", cat: "Tecnologia", t: "Adattatore di corrente per il Regno Unito (tipo G)", per: ADULTI, q: () => 1, d: "Ne basta uno ogni due persone." },
    { id: "multipresa", cat: "Tecnologia", t: "Caricatore da viaggio con più porte USB", per: ADULTI, q: () => 1, d: "Uno per gruppo: segna chi lo porta." },
    { id: "cuffie", cat: "Tecnologia", t: "Cuffie o auricolari", per: ADULTI, q: () => 1 },
    { id: "mappe", cat: "Tecnologia", t: "Mappe di Londra scaricate offline", per: ADULTI, q: () => 1, d: "Per esempio Google Maps e TfL Go." },
    { id: "app", cat: "Tecnologia", t: "App di Wizz Air e Ryanair con le carte d'imbarco", per: ADULTI, q: () => 1 },
    { id: "esim", cat: "Tecnologia", t: "Roaming dati attivo o eSIM", per: ADULTI, q: () => 1 },
    { id: "tablet", cat: "Tecnologia", t: "Tablet con cartoni scaricati", per: ["bambina"], q: () => 1, d: "Per il volo e per i tempi morti." },
    { id: "b-cuffie", cat: "Tecnologia", t: "Cuffie per bambini con limite di volume", per: ["bambina"], q: () => 1 },

    { id: "b-passeggino", cat: "Per la bambina", t: "Passeggino piccolo da viaggio", per: ["bambina"], q: () => 1 },
    { id: "b-telo", cat: "Per la bambina", t: "Telo antipioggia per il passeggino", per: ["bambina"], q: () => 1 },
    { id: "b-snack", cat: "Per la bambina", t: "Snack per il viaggio e per le attese", per: ["bambina"], q: () => 1 },
    { id: "b-giochi", cat: "Per la bambina", t: "Giochi, colori e libretti", per: ["bambina"], q: () => 1 },
    { id: "b-peluche", cat: "Per la bambina", t: "Peluche o copertina preferita", per: ["bambina"], q: () => 1 },
    { id: "b-salviette", cat: "Per la bambina", t: "Salviette umidificate e sacchetti", per: ["bambina"], q: () => 1 },
    { id: "b-medicine", cat: "Per la bambina", t: "Medicine pediatriche e cerotti", per: ["bambina"], q: () => 1 }
  ],
  frasi: [
    ["Un tavolo per cinque, per favore.", "A table for five, please."],
    ["Abbiamo una prenotazione a nome...", "We have a booking under the name..."],
    ["Avete un menu per bambini?", "Do you have a children's menu?"],
    ["Possiamo pagare con la carta?", "Can we pay by card?"],
    ["Il conto, per favore.", "Could we have the bill, please?"],
    ["Dov'è la stazione della metropolitana più vicina?", "Where is the nearest tube station?"],
    ["Può chiamarci un taxi, per favore?", "Could you call us a taxi, please?"],
    ["Il passeggino può entrare?", "Is the pushchair allowed in?"],
    ["Siamo in ritardo di dieci minuti.", "We're running ten minutes late."],
    ["Ho bisogno di aiuto.", "I need some help, please."]
  ],
  emergenze: [
    { n: "999", t: "Emergenze: polizia, ambulanza, pompieri. Funziona anche il 112." },
    { n: "111", t: "Servizio sanitario NHS, per consigli medici non urgenti." },
    { n: "101", t: "Polizia, casi non urgenti." }
  ],
  info: [
    "Mezzi: metro e treni con carta contactless.",
    "Passeggino piccolo da viaggio: sì.",
    "Andata: bagaglio a mano 40x30x20 (Wizz Air).",
    "Ritorno: carta d'imbarco solo sull'app Ryanair."
  ]
};
