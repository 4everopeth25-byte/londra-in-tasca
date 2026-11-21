/* Dati pubblici del viaggio. Qui NON vanno codici di prenotazione né nominativi: stanno nel file riservato, importato dall'app. */
const SPESE_CAT = [["cibo", "Cibo"], ["trasporti", "Trasporti"], ["ingressi", "Ingressi"], ["shopping", "Shopping"], ["altro", "Altro"]];
const ADULTI = ["uomo", "donna"];
const TUTTI = ["uomo", "donna", "bambina"];
const TRIP = {
  partenza: "2026-12-23T19:10:00",
  organizzatore: "Francesco",
  sintesiVoli: "Andata mer 23/12 alle 19:10 a Stansted, ritorno dom 27/12 alle 20:55 da Luton",
  gruppoDefault: ["Francesco", "Sara", "Rosa", "Giuliano"],
  alloggio: { testo: "77 Caledonian Road, Islington, Londra, N1 9BT, Regno Unito", q: "77 Caledonian Road, Islington, London N1 9BT, UK" },
  giorni: [
    {
      iso: "2026-12-23", breve: "23 mer", data: "Mercoledì 23 dicembre", titolo: "Arrivo a Stansted e prima sera", mezzo: "transit",
      tappe: [
        { ora: "19:10", nome: "Volo Ryanair FR 793", desc: "Venezia Marco Polo → Londra Stansted, arrivo alle 20:25 (ora di Londra). Carta d'imbarco solo sull'app." },
        { ora: "20:25", nome: "Arrivo a Stansted", desc: "Controllo passaporti e ETA, poi la stazione è a pochi minuti a piedi dal terminal.", q: "Stansted Airport Station" },
        { ora: "Poi", nome: "Stansted Express per Liverpool Street", desc: "Circa 48 minuti, pagamento con carta contactless. Bambini sotto i 5 anni gratis, da verificare.", costo: "circa £17-22 a testa, da verificare", q: "London Liverpool Street Station" },
        { ora: "Poi", nome: "Metro fino a King's Cross", desc: "Circle, Hammersmith & City o Metropolitan da Liverpool Street, circa 10 minuti.", q: "King's Cross St Pancras Station" },
        { ora: "~22:30", nome: "Check-in alloggio", desc: "77 Caledonian Road, vicino a King's Cross.", q: "King's Cross Station", casa: true },
        { ora: "Dopo il check-in", nome: "Cena da Dishoom King's Cross", desc: "Il mercoledì chiude alle 23: con l'arrivo verso le 22:30 è stretto. Se non ce la fate, una cena veloce vicino all'alloggio. Accoglie i bambini.", q: "Dishoom King's Cross" }
      ],
      pub: { nome: "The Parcel Yard", dove: "dentro la stazione di King's Cross", q: "The Parcel Yard King's Cross", alt: "Con la bambina: lo stesso Parcel Yard, che ha un menu bambini, oppure Dishoom." },
      nota: "Non avrete cenato, quindi cena e poi pub, senza orari rigidi. Atterrate a Stansted, non a Luton."
    },
    {
      iso: "2026-12-24", breve: "24 gio", data: "Giovedì 24 dicembre", titolo: "Vigilia: Borough, St Paul's, Tower e Sky Garden", mezzo: "transit",
      tappe: [
        { ora: "09:30", nome: "Borough Market", desc: "Colazione e spuntino tra le bancarelle. La vigilia di solito chiude presto, verso le 15, da verificare. Da King's Cross con la Northern line fino a London Bridge.", q: "Borough Market" },
        { ora: "11:30", nome: "Cattedrale di St Paul", desc: "Si arriva a piedi dal Millennium Bridge. Dentro solo se è aperta ai turisti il 24, da verificare (il 25 è chiusa). Altrimenti si vede da fuori.", q: "St Paul's Cathedral" },
        { ora: "13:00", nome: "Pranzo in zona St Paul's", desc: "Un pub o un locale tra St Paul's e Cheapside, aperti la vigilia da verificare.", q: "Cheapside, London" },
        { ora: "14:30", nome: "Tower of London e Tower Bridge, solo da fuori", desc: "La Tower è chiusa il 24, 25 e 26 dicembre. Passeggiata sul lungofiume con la luce del tardo pomeriggio.", q: "Tower Bridge" },
        { ora: "16:00", nome: "Leadenhall Market", desc: "Luci e decorazioni, a pochi minuti dallo Sky Garden. I negozi la vigilia chiudono presto, da verificare.", q: "Leadenhall Market" },
        { ora: "17:00", nome: "Sky Garden", desc: "20 Fenchurch Street. Ingresso gratuito con biglietto da prenotare in anticipo (vedi i promemoria). Arrivare 15 minuti prima.", costo: "gratis con prenotazione", q: "Sky Garden, 20 Fenchurch Street, London" },
        { ora: "18:30", nome: "Taxi per Olympia", desc: "Si va in taxi, la metro della vigilia chiude prima. Contare 45-60 minuti con il traffico.", q: "Pillar Hall, 5 Olympia Way, London W14 0EY" },
        { ora: "20:15", nome: "Cena da Idalia, Pillar Hall", desc: "5 Olympia Way, London W14 0EY. Tavolo per 5. Tolleranza di 15 minuti sul ritardo.", q: "Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY" },
        { ora: "22:30", nome: "Taxi di rientro", desc: "Ritorno all'alloggio.", q: "King's Cross Station", casa: true }
      ],
      pub: { nome: "The Queen's Head", dove: "66 Acton Street", q: "The Queen's Head, 66 Acton Street, London", alt: "Con la bambina: una sosta con una cioccolata calda a Leadenhall Market prima dello Sky Garden." },
      nota: "Il giro va da sud a est senza tornare indietro. Il pub si fa dopo la cena, se la bambina regge. Per il 25 conviene fare la spesa oggi."
    },
    {
      iso: "2026-12-25", breve: "25 ven", data: "Venerdì 25 dicembre", titolo: "Natale a piedi: Abbey, Big Ben, Buckingham e Soho", mezzo: "walking",
      tappe: [
        { ora: "08:30", nome: "Partenza dall'alloggio", desc: "Si va a piedi, circa 5 km fino all'Abbey: oggi non circolano metro, treni e bus TfL. Un taxi fino all'Abbey toglie 5 km alla giornata.", q: "King's Cross Station", casa: true },
        { ora: "10:30", nome: "Westminster Abbey, messa cantata di Natale", desc: "Si ascoltano i cori. Servizio gratuito, di solito con prenotazione: da verificare sul sito dell'Abbey. La visita turistica il 25 di solito è chiusa. Arrivare verso le 10:00.", costo: "gratis", q: "Westminster Abbey" },
        { ora: "11:45", nome: "Big Ben e Westminster Bridge", desc: "", q: "Big Ben" },
        { ora: "12:30", nome: "St James's Park e Buckingham Palace", desc: "", q: "Buckingham Palace" },
        { ora: "13:45", nome: "New Bond Street", desc: "Si passa da Green Park. Vetrine e luci: i negozi il 25 sono chiusi.", q: "New Bond Street, London" },
        { ora: "14:30", nome: "Piccadilly Circus", desc: "", q: "Piccadilly Circus" },
        { ora: "15:00", nome: "Pranzo a Chinatown", desc: "Pranzo tardivo: a metà mattina serve uno spuntino. Golden Phoenix è citato tra i locali aperti a Natale. Da verificare.", q: "Golden Phoenix Chinatown London" },
        { ora: "16:30", nome: "Soho e Carnaby Street", desc: "Luci natalizie.", q: "Carnaby Street, London" },
        { ora: "17:30", nome: "Rientro a piedi", desc: "Circa 3,5 km fino all'alloggio. Un taxi se Ludovica è stanca.", q: "King's Cross Station", casa: true }
      ],
      pub: null,
      nota: "Circa 14 km a piedi con la bambina, più dei 10 km del piano precedente; con il taxi all'andata scendono a circa 9. Pub quasi tutti chiusi. Spesa da fare il 24."
    },
    {
      iso: "2026-12-26", breve: "26 sab", data: "Sabato 26 dicembre", titolo: "Boxing Day: Harrods e Notting Hill", mezzo: "transit",
      tappe: [
        { ora: "09:00", nome: "Binario 9¾", desc: "Foto gratuita a King's Cross, a due passi dall'alloggio.", costo: "gratis", q: "Platform 9 3/4 King's Cross" },
        { ora: "10:15", nome: "Harrods", desc: "Knightsbridge, con la Piccadilly line da King's Cross. Orari del Boxing Day da verificare (negli anni scorsi aperto dalle 10 o dalle 11), saldi e code.", q: "Harrods, 87-135 Brompton Road, London SW1X 7XL" },
        { ora: "13:00", nome: "Pranzo a Notting Hill", desc: "Locali aperti il 26 da verificare.", q: "Westbourne Grove, London" },
        { ora: "14:30", nome: "Notting Hill e Portobello Road", desc: "Case colorate e negozi aperti. Il mercato il 26 è chiuso, da verificare: si vede la via senza bancarelle.", q: "Portobello Road, London" },
        { ora: "Facoltativa", nome: "Harry Potter Shop, Oxford Street", desc: "Central line da Notting Hill Gate a Bond Street. 134-140 Oxford St, apertura il 26 da verificare. Rientro con la Victoria line da Oxford Circus.", q: "Harry Potter Shop 134-140 Oxford Street" }
      ],
      pub: { nome: "The Scottish Stores", dove: "King's Cross", q: "The Scottish Stores King's Cross", alt: "Con la bambina: The Parcel Yard." },
      nota: "Metro ridotta e Elizabeth line ferma. Il Balloon Museum, a ExCeL, è stato tolto: troppo lontano da questo giro."
    },
    {
      iso: "2026-12-27", breve: "27 dom", data: "Domenica 27 dicembre", titolo: "Natural History Museum, Sunday roast e ritorno", mezzo: "transit",
      tappe: [
        { ora: "09:15", nome: "Check-out e deposito bagagli", desc: "", q: "King's Cross Station", casa: true },
        { ora: "10:00", nome: "Natural History Museum", desc: "Aperto il 27, dopo la chiusura del 24-26. Ingresso gratuito, prenotare lo slot se richiesto, da verificare. Piccadilly line da King's Cross a South Kensington. Se resta tempo, il Science Museum è accanto.", costo: "gratis", q: "Natural History Museum, Cromwell Road, London SW7 5BD" },
        { ora: "13:00", nome: "Sunday roast al The Coach Makers Arms", desc: "88 Marylebone Lane. Alternativa: The Volunteer su Baker Street.", q: "The Coach Makers Arms, 88 Marylebone Lane, London" },
        { ora: "14:30", nome: "Baker Street e statua di Sherlock Holmes", desc: "Facoltativa: facciata del 221B, a pochi minuti dal pranzo.", q: "Sherlock Holmes statue Baker Street" },
        { ora: "15:30", nome: "Ritiro bagagli", desc: "Da Baker Street con la Metropolitan o Hammersmith & City fino a King's Cross.", q: "King's Cross Station", casa: true },
        { ora: "16:30", nome: "Treno da St Pancras per Luton", desc: "Il ritorno parte da Luton, non da Stansted.", q: "St Pancras International" },
        { ora: "20:55", nome: "Volo Ryanair FR 761", desc: "Luton → Venezia, arrivo 00:05 del 28/12. Carta d'imbarco solo sull'app." }
      ],
      pub: null,
      nota: "Nessun pub la sera. Il Natural History Museum è aperto solo dal 27: per questo sta qui. Pixar e Balloon Museum sono stati tolti."
    }
  ],
  promemoria: [
    { id: "eta", t: "Richiedere l'ETA per tutti e 5", d: "Costo da verificare su gov.uk/eta (le fonti dicono £16 o £20 a persona)." },
    { id: "wizz", t: "Chiedere a Wizz Air il rimborso del vecchio volo", d: "È stato spostato al 21/12 e non lo usate più. Le opzioni sono nella mail di Wizz Air." },
    { id: "skygarden", t: "Prenotare lo Sky Garden (24/12 alle 17:00)", d: "Ingresso gratuito, biglietti rilasciati circa 3 settimane prima, di solito il lunedì mattina. Controllare su skygarden.london dal 30 novembre. Un tavolo al ristorante vale come ingresso." },
    { id: "stpaul", t: "Controllare se St Paul's è aperta alla visita il 24" },
    { id: "abbey", t: "Prenotare la messa cantata di Natale a Westminster Abbey (25/12, 10:30)", d: "Verificare sul sito dell'Abbey se serve la prenotazione." },
    { id: "harrods", t: "Controllare gli orari di Harrods del 26" },
    { id: "nhm", t: "Natural History Museum (27/12): prenotare lo slot gratuito se richiesto" },
    { id: "roast", t: "Prenotare il Sunday roast (27/12)" },
    { id: "idalia", t: "Correggere il nome della prenotazione da Idalia", d: "Risulta registrato con un refuso." },
    { id: "jacuzzi", t: "Cancellare l'avviso SevenRooms di Jacuzzi", d: "Non è una prenotazione." },
    { id: "spesa", t: "Fare la spesa il 24 per il giorno di Natale" }
  ],
  daVerificare: [
    "Orari di chiusura della metro la vigilia e servizio del 26 (TfL li pubblica a fine novembre)",
    "Quali pub sono aperti il 25",
    "Borough Market e Leadenhall Market il 24: probabile chiusura verso le 15",
    "St Paul's il 24 e messa del 25 a Westminster Abbey: visita e prenotazione",
    "Harrods e Harry Potter Shop il 26: orari. Portobello Market il 26: chiuso",
    "Dishoom il 23 chiude alle 23, con l'arrivo da Stansted è stretto",
    "Stansted Express: prezzo attuale e tariffa per la bambina",
    "Bagaglio a mano sul volo Ryanair di andata: misure consentite, la mail non le indica",
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
    { id: "piumino", cat: "Abbigliamento", t: "Giacca pesante o piumino", per: ADULTI, q: () => 1, d: "Da indossare in aereo: nel bagaglio a mano non entra." },
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
    { id: "imbarco-w", cat: "Documenti", t: "Carta d'imbarco Ryanair, andata", per: ADULTI, q: () => 1, d: "Solo sull'app. Volo di andata, 23/12, da Venezia a Stansted." },
    { id: "imbarco-r", cat: "Documenti", t: "Carta d'imbarco Ryanair, ritorno", per: ADULTI, q: () => 1, d: "Solo sull'app. Volo di ritorno, 27/12." },
    { id: "carta", cat: "Documenti", t: "Carta contactless e una carta di riserva", per: ADULTI, q: () => 1, d: "Serve per metro e treni." },
    { id: "assic", cat: "Documenti", t: "Assicurazione sanitaria di viaggio", per: TUTTI, q: () => 1, d: "Verifica cosa copre nel Regno Unito." },
    { id: "conferme", cat: "Documenti", t: "Conferme delle prenotazioni salvate offline", per: ADULTI, q: () => 1, d: "Idalia, alloggio, Sky Garden." },

    { id: "telefono", cat: "Tecnologia", t: "Telefono, caricabatterie e cavo", per: ADULTI, q: () => 1 },
    { id: "powerbank", cat: "Tecnologia", t: "Power bank carico", per: ADULTI, q: () => 1, d: "Nel bagaglio a mano." },
    { id: "adattatore", cat: "Tecnologia", t: "Adattatore di corrente per il Regno Unito (tipo G)", per: ADULTI, q: () => 1, d: "Ne basta uno ogni due persone." },
    { id: "multipresa", cat: "Tecnologia", t: "Caricatore da viaggio con più porte USB", per: ADULTI, q: () => 1, d: "Uno per gruppo: segna chi lo porta." },
    { id: "cuffie", cat: "Tecnologia", t: "Cuffie o auricolari", per: ADULTI, q: () => 1 },
    { id: "mappe", cat: "Tecnologia", t: "Mappe di Londra scaricate offline", per: ADULTI, q: () => 1, d: "Per esempio Google Maps e TfL Go." },
    { id: "app", cat: "Tecnologia", t: "App Ryanair con le carte d'imbarco", per: ADULTI, q: () => 1 },
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
    "Andata: Ryanair FR 793 da Venezia a Stansted (non Luton), carta d'imbarco solo sull'app.",
    "Ritorno: Ryanair FR 761 da Luton, carta d'imbarco solo sull'app.",
    "Bagaglio a mano: controlla le misure consentite nell'app Ryanair."
  ]
};
