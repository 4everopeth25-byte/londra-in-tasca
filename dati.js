/* Dati pubblici del viaggio. Qui NON vanno codici di prenotazione né nominativi: stanno nel file riservato, importato dall'app. */
const SPESE_CAT = [["cibo", "Cibo"], ["trasporti", "Trasporti"], ["ingressi", "Ingressi"], ["shopping", "Shopping"], ["altro", "Altro"]];
const ADULTI = ["uomo", "donna"];
const TUTTI = ["uomo", "donna", "bambina"];
const TRIP = {
  partenza: "2026-12-23T19:10:00",
  organizzatore: "Francesco",
  /* mappa offline: dati scaricati una volta sola dal telefono (nomi con la data della versione); area coperta O,S,E,N; area in cui l'app considera di «essere a Londra» */
  mappa: { url: "https://4everopeth25-byte.github.io/londra-in-tasca-dati/", file: [{ nome: "londra-20261121.pmtiles", byte: 34735695 }, { nome: "pedonale-20261123.bin.gz", byte: 3855055 }], bbox: [-0.25, 51.46, 0.02, 51.57], londra: [-0.6, 51.2, 0.4, 51.75] },
  sintesiVoli: "Andata mer 23/12 alle 19:10 a Stansted, ritorno dom 27/12 alle 20:55 da Luton",
  gruppoDefault: ["Francesco", "Sara", "Rosa", "Giuliano"],
  alloggio: { testo: "77 Caledonian Road, Islington, Londra, N1 9BT, Regno Unito", q: "77 Caledonian Road, Islington, London N1 9BT, UK", ll: [51.53312, -0.11943] },
  giorni: [
    {
      iso: "2026-12-23", breve: "23 mer", data: "Mercoledì 23 dicembre", titolo: "Arrivo a Stansted e prima sera", mezzo: "transit",
      pianoB: "Stansted Express e metro sono al coperto fino a King's Cross. Con la pioggia cena vicino all'alloggio, senza spostarti.",
      tappe: [
        { ora: "19:10", utc: "2026-12-23T18:10:00Z", durata: 135, nome: "Volo Ryanair FR 793", desc: "Venezia Marco Polo → Londra Stansted, arrivo alle 20:25 (ora di Londra). Carta d'imbarco solo sull'app." },
        { ora: "20:25", nome: "Arrivo a Stansted", desc: "Controllo passaporti e ETA, poi la stazione è a pochi minuti a piedi dal terminal.", q: "Stansted Airport Station", ll: [51.5441, -0.004] },
        { ora: "Poi", nome: "Stansted Express per Liverpool Street", desc: "Circa 48 minuti, pagamento con carta contactless. Bambini sotto i 5 anni gratis, da verificare.", costo: "circa £17-22 a testa, da verificare", q: "London Liverpool Street Station", ll: [51.51821, -0.08143] },
        { ora: "Poi", nome: "Metro fino a King's Cross", desc: "Circle, Hammersmith & City o Metropolitan da Liverpool Street, circa 10 minuti.", q: "King's Cross St Pancras Station", ll: [51.53061, -0.12395] },
        { ora: "~22:30", nome: "Check-in alloggio", desc: "77 Caledonian Road, vicino a King's Cross.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true },
        { ora: "Dopo il check-in", nome: "Cena da Dishoom King's Cross", desc: "Il mercoledì chiude alle 23: con l'arrivo verso le 22:30 è stretto. Se non ce la fate, una cena veloce vicino all'alloggio. Accoglie i bambini.", q: "Dishoom King's Cross", ll: [51.53612, -0.12552] }
      ],
      pub: { nome: "The Parcel Yard", dove: "dentro la stazione di King's Cross", q: "The Parcel Yard King's Cross", ll: [51.53248, -0.1238], alt: "Con la bambina: lo stesso Parcel Yard, che ha un menu bambini, oppure Dishoom." },
      nota: "Non avrete cenato, quindi cena e poi pub, senza orari rigidi. Atterrate a Stansted, non a Luton."
    },
    {
      iso: "2026-12-24", breve: "24 gio", data: "Giovedì 24 dicembre", titolo: "Vigilia: Borough, Tamigi, St Paul's e Tower, poi a casa prima di cena", mezzo: "transit",
      pianoB: "Con la pioggia salta il lungofiume e la passeggiata fino a Tower Bridge: dopo Borough Market e Southwark Cathedral vai a St Paul's e a Leadenhall Market, che ha la copertura. Borough Market è in parte coperto.",
      tappe: [
        { ora: "09:15", nome: "Metro per London Bridge", desc: "Dall'alloggio a King's Cross St Pancras a piedi (10 minuti), poi la Northern line fino a London Bridge, circa 15 minuti.", q: "London Bridge Station", ll: [51.505, -0.0865], mezzo: "transit" },
        { ora: "09:45", nome: "Borough Market", desc: "Colazione e spuntino tra le bancarelle. La vigilia di solito chiude presto, verso le 15, da verificare.", q: "Borough Market", ll: [51.50553, -0.0904] },
        { ora: "10:45", nome: "Southwark Cathedral", desc: "Cattedrale gotica accanto al mercato, ingresso libero. Orari della vigilia da verificare.", q: "Southwark Cathedral, London", ll: [51.50613, -0.08962] },
        { ora: "11:15", nome: "Lungofiume: Clink Street, Golden Hinde e Globe", desc: "Passeggiata di circa 1,3 km sul Tamigi: le rovine del palazzo dei vescovi di Winchester, la replica del galeone Golden Hinde e lo Shakespeare's Globe da fuori.", q: "Shakespeare's Globe, Bankside, London", ll: [51.50812, -0.09719] },
        { ora: "12:00", nome: "Millennium Bridge e Tate Modern", desc: "Il ponte pedonale ha la cupola di St Paul proprio davanti. La Tate Modern si vede da fuori: dal 24 al 26 dicembre di solito è chiusa, da verificare.", q: "Millennium Bridge, London", ll: [51.50989, -0.09851] },
        { ora: "12:30", nome: "Cattedrale di St Paul", desc: "Dentro solo se è aperta ai turisti il 24, da verificare (il 25 è chiusa). Altrimenti da fuori, con Paternoster Square dietro.", q: "St Paul's Cathedral", ll: [51.51379, -0.09845] },
        { ora: "13:15", nome: "Pranzo in zona St Paul's", desc: "Un pub o un locale tra St Paul's e Cheapside, aperti la vigilia da verificare.", q: "Cheapside, London", ll: [51.51391, -0.09289] },
        { ora: "14:15", nome: "Royal Exchange e Mansion House", desc: "Si passa da Bank: le facciate neoclassiche e le luci della City.", q: "Royal Exchange, London", ll: [51.51365, -0.087] },
        { ora: "14:40", nome: "Monument", desc: "La colonna di 61 metri ricorda il grande incendio del 1666. Da fuori.", q: "The Monument, Fish Street Hill, London", ll: [51.51014, -0.08595] },
        { ora: "15:10", nome: "Leadenhall Market", desc: "Luci e decorazioni sotto la copertura in vetro. I negozi la vigilia chiudono presto, da verificare.", q: "Leadenhall Market", ll: [51.51273, -0.0834] },
        { ora: "15:45", nome: "Tower of London e Tower Bridge, solo da fuori", desc: "La Tower è chiusa il 24, 25 e 26 dicembre. Il tramonto è verso le 15:55: il ponte con la luce di fine giornata.", q: "Tower Bridge", ll: [51.50554, -0.07537] },
        { ora: "16:30", nome: "Metro da Tower Hill a King's Cross", desc: "Circle o Hammersmith & City line, circa 20 minuti. Da qui si va a casa.", q: "Tower Hill station, London", ll: [51.50985, -0.0767], mezzo: "transit" },
        { ora: "17:00", nome: "A casa: riposo, doccia e cambio", desc: "Un paio d'ore per lavarsi e cambiarsi con calma prima della cena.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true },
        { ora: "19:25", nome: "Taxi per Olympia", desc: "Dall'alloggio a Olympia sono circa 9 km: 35-45 minuti con il traffico della vigilia. Partire non oltre le 19:30.", q: "Pillar Hall, 5 Olympia Way, London W14 0EY", ll: [51.49731, -0.21072], mezzo: "driving" },
        { ora: "20:15", nome: "Cena da Idalia, Pillar Hall", desc: "5 Olympia Way, London W14 0EY. Tavolo per 5. Tolleranza di 15 minuti sul ritardo.", q: "Idalia, Pillar Hall, 5 Olympia Way, London W14 0EY", ll: [51.49731, -0.21072] },
        { ora: "22:30", nome: "Taxi di rientro", desc: "Ritorno all'alloggio.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true, mezzo: "driving" }
      ],
      pub: null,
      nota: "Giornata spostata a est e anticipata: lo Sky Garden è passato al 26. Con Ludovica niente pub la sera della vigilia. Per il 25 conviene fare la spesa oggi, nel pomeriggio o al rientro."
    },
    {
      iso: "2026-12-25", breve: "25 ven", data: "Venerdì 25 dicembre", titolo: "Natale a piedi: Bloomsbury, Westminster, Buckingham, Mayfair e Soho", mezzo: "walking",
      pianoB: "Il 25 quasi tutto è chiuso: con la pioggia forte accorcia il giro e prendi un taxi tra una tappa e l'altra (di solito circolano, da verificare). L'Abbey, per la messa, è al coperto.",
      tappe: [
        { ora: "08:15", nome: "Partenza dall'alloggio", desc: "Si va a piedi: oggi non circolano metro, treni e bus TfL. Fino all'Abbey sono circa 5,5 km passando da Bloomsbury e Covent Garden; un taxi fino all'Abbey toglie 5 km alla giornata.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true },
        { ora: "08:35", nome: "Russell Square", desc: "Giardini e fontana, tranquilli la mattina di Natale.", q: "Russell Square, London", ll: [51.52305, -0.12425] },
        { ora: "08:50", nome: "British Museum, solo da fuori", desc: "Il colonnato e il cortile d'ingresso. Il museo è chiuso.", q: "British Museum, Great Russell Street, London", ll: [51.51931, -0.12671] },
        { ora: "09:15", nome: "Covent Garden", desc: "La piazza con le decorazioni natalizie, vuota e silenziosa al mattino.", q: "Covent Garden Piazza, London", ll: [51.51201, -0.12181] },
        { ora: "09:40", nome: "Trafalgar Square", desc: "Albero di Natale norvegese e colonna di Nelson, con la National Gallery sullo sfondo.", q: "Trafalgar Square", ll: [51.50806, -0.12801] },
        { ora: "10:00", nome: "Whitehall e Horse Guards", desc: "Si scende lungo Whitehall: Downing Street dal cancello, le guardie a cavallo di Horse Guards.", q: "Horse Guards Parade, London", ll: [51.50466, -0.12826] },
        { ora: "10:30", nome: "Westminster Abbey, messa cantata di Natale", desc: "Si ascoltano i cori. Servizio gratuito, di solito con prenotazione: da verificare sul sito dell'Abbey. La visita turistica il 25 di solito è chiusa. Arrivare verso le 10:10.", q: "Westminster Abbey", ll: [51.4994, -0.12739], costo: "gratis" },
        { ora: "11:45", nome: "Big Ben e Parliament Square", desc: "Le statue di Churchill e Mandela in Parliament Square e il Palazzo di Westminster dal ponte.", q: "Big Ben", ll: [51.5007, -0.12457] },
        { ora: "12:30", nome: "St James's Park", desc: "Il lago con i pellicani e la vista su Horse Guards: una sosta con la merenda.", q: "St James's Park, London", ll: [51.50313, -0.13317] },
        { ora: "13:00", nome: "Buckingham Palace", desc: "Il Victoria Memorial e i cancelli. Il cambio della guardia non c'è tutti i giorni, da verificare.", q: "Buckingham Palace", ll: [51.50083, -0.143] },
        { ora: "13:45", nome: "Fortnum & Mason, vetrine", desc: "Le vetrine natalizie di Piccadilly, negozio chiuso il 25.", q: "Fortnum & Mason, 181 Piccadilly, London", ll: [51.50819, -0.13814] },
        { ora: "14:15", nome: "Burlington Arcade e Royal Academy", desc: "Facoltativa: la galleria coperta ottocentesca e il cortile della Royal Academy.", q: "Burlington Arcade, London", ll: [51.50901, -0.1402] },
        { ora: "14:40", nome: "New Bond Street", desc: "Vetrine e luci, negozi chiusi il 25.", q: "New Bond Street, London", ll: [51.50996, -0.14194] },
        { ora: "15:10", nome: "Regent Street e Carnaby Street", desc: "Gli angeli di luce di Regent Street e le luminarie di Carnaby.", q: "Carnaby Street, London", ll: [51.51301, -0.13867] },
        { ora: "15:45", nome: "Piccadilly Circus", desc: "Gli schermi luminosi e la fontana di Eros.", q: "Piccadilly Circus", ll: [51.51014, -0.13394] },
        { ora: "16:00", nome: "Pranzo tardivo a Chinatown", desc: "Golden Phoenix è citato tra i locali aperti a Natale. Da verificare. A metà mattina serve uno spuntino.", q: "Golden Phoenix Chinatown London", ll: [51.51174, -0.13076] },
        { ora: "17:00", nome: "Goodwin's Court", desc: "Facoltativa: il vicolo ottocentesco con le lanterne a gas, vicino a St Martin's Lane.", q: "Goodwins Court, London", ll: [51.51095, -0.12633] },
        { ora: "17:30", nome: "Rientro a piedi", desc: "Circa 3 km fino all'alloggio, passando da Holborn. Un taxi se Ludovica è stanca.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true }
      ],
      pub: null,
      nota: "Circa 14 km a piedi con la bambina: con il taxi all'andata scendono a circa 9. Le tappe facoltative si possono togliere. Pub quasi tutti chiusi. Spesa da fare il 24."
    },
    {
      iso: "2026-12-26", breve: "26 sab", data: "Sabato 26 dicembre", titolo: "Boxing Day: Harrods, Kensington Gardens, Notting Hill e Sky Garden", mezzo: "transit",
      pianoB: "Harrods è tutto al coperto e ha ristoranti dentro: con la pioggia fermati lì e salta Kensington Gardens e Notting Hill. Lo Sky Garden alle 17 è al chiuso.",
      tappe: [
        { ora: "09:00", nome: "Binario 9¾", desc: "Foto gratuita a King's Cross, a due passi dall'alloggio.", q: "Platform 9 3/4 King's Cross", ll: [51.53219, -0.12391], costo: "gratis" },
        { ora: "09:45", nome: "Piccadilly line per Knightsbridge", desc: "Da King's Cross circa 20 minuti. Il 26 la metro ha orario ridotto.", q: "Knightsbridge Station, London", ll: [51.5015, -0.1605], mezzo: "transit" },
        { ora: "10:15", nome: "Harrods", desc: "Knightsbridge. Orari del Boxing Day da verificare (negli anni scorsi aperto dalle 10 o dalle 11), saldi e code.", q: "Harrods, 87-135 Brompton Road, London SW1X 7XL", ll: [51.49921, -0.16299] },
        { ora: "12:30", nome: "Pranzo a Harrods o a Knightsbridge", desc: "Dentro Harrods ci sono molti ristoranti. Locali aperti il 26 da verificare.", q: "Brompton Road, London", ll: [51.4995, -0.1625] },
        { ora: "13:30", nome: "Royal Albert Hall e Albert Memorial", desc: "Attraverso Hyde Park (1,5 km) fino ai due monumenti vittoriani di Kensington Gore.", q: "Royal Albert Hall, London", ll: [51.50101, -0.17741] },
        { ora: "14:15", nome: "Kensington Gardens e Kensington Palace", desc: "Il Round Pond, la statua di Peter Pan e il palazzo di Kensington da fuori.", q: "Kensington Palace, London", ll: [51.50509, -0.18763] },
        { ora: "15:00", nome: "Notting Hill: case colorate e Portobello Road", desc: "Chepstow Villas e le vie con le case pastello, poi Portobello Road. Il mercato il 26 è chiuso, da verificare: si vede la via senza bancarelle.", q: "Portobello Road, London", ll: [51.51634, -0.20532] },
        { ora: "16:15", nome: "Central line per Bank e Sky Garden", desc: "Da Notting Hill Gate a Bank circa 20 minuti, poi 5 minuti a piedi. Linee ridotte il 26, da verificare.", q: "Notting Hill Gate Station, London", ll: [51.50913, -0.1961], mezzo: "transit" },
        { ora: "17:00", nome: "Sky Garden", desc: "20 Fenchurch Street. Ingresso gratuito con biglietto da prenotare in anticipo (vedi i promemoria). Arrivare 15 minuti prima.", q: "Sky Garden, 20 Fenchurch Street, London", ll: [51.51127, -0.08354], costo: "gratis con prenotazione" },
        { ora: "18:30", nome: "Metro da Monument a King's Cross", desc: "Circle o Hammersmith & City line dalla fermata vicina, circa 20 minuti.", q: "Monument Station, London", ll: [51.51048, -0.08628], mezzo: "transit" },
        { ora: "19:00", nome: "Cena", desc: "Cena libera vicino all'alloggio: qui entra un pub prima di cena, se Ludovica è sveglia e il locale ammette i bambini.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true }
      ],
      pub: { nome: "The Scottish Stores", dove: "King's Cross", q: "The Scottish Stores King's Cross", ll: [51.53108, -0.12082], alt: "Con la bambina: The Parcel Yard." },
      nota: "Metro ridotta e Elizabeth line ferma. Lo Sky Garden è qui, di sera, perché il 24 si torna a casa a cambiarsi. Il Balloon Museum è stato tolto: troppo lontano."
    },
    {
      iso: "2026-12-27", breve: "27 dom", data: "Domenica 27 dicembre", titolo: "Natural History Museum, Sunday roast e ritorno", mezzo: "transit",
      pianoB: "Il Natural History Museum è al coperto e il Science Museum è accanto (orari del 27 da verificare). Il pranzo a Marylebone è al chiuso.",
      tappe: [
        { ora: "09:15", nome: "Check-out e deposito bagagli", desc: "", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true },
        { ora: "09:45", nome: "Piccadilly line per South Kensington", desc: "Da King's Cross circa 20 minuti, poi il sottopassaggio fino ai musei.", q: "South Kensington Station, London", ll: [51.49412, -0.17358], mezzo: "transit" },
        { ora: "10:15", nome: "Natural History Museum", desc: "Aperto il 27, dopo la chiusura del 24-26. Ingresso gratuito, prenotare lo slot se richiesto, da verificare. Il dinosauro e la sala delle balene.", q: "Natural History Museum, Cromwell Road, London SW7 5BD", ll: [51.49651, -0.176], costo: "gratis" },
        { ora: "12:15", nome: "Exhibition Road: Science Museum e V&A da fuori", desc: "Facoltativa: i due musei sono a pochi passi. Il Science Museum è aperto il 27, orari da verificare.", q: "Science Museum, Exhibition Road, London", ll: [51.49776, -0.17433] },
        { ora: "12:45", nome: "Circle line per Baker Street", desc: "Da South Kensington circa 20 minuti.", q: "Baker Street Station, London", ll: [51.52262, -0.15695], mezzo: "transit" },
        { ora: "13:15", nome: "Sunday roast al The Coach Makers Arms", desc: "88 Marylebone Lane. Alternativa: The Volunteer su Baker Street.", q: "The Coach Makers Arms, 88 Marylebone Lane, London", ll: [51.51717, -0.15063] },
        { ora: "14:30", nome: "Marylebone High Street e statua di Sherlock Holmes", desc: "Facoltativa: la via dei negozi di Marylebone e, a Baker Street, la statua e la facciata del 221B.", q: "Sherlock Holmes statue Baker Street", ll: [51.5225, -0.15659] },
        { ora: "15:30", nome: "Ritiro bagagli", desc: "Da Baker Street con la Metropolitan o Hammersmith & City line fino a King's Cross.", q: "King's Cross Station", ll: [51.53049, -0.12166], casa: true },
        { ora: "16:30", nome: "Treno da St Pancras per Luton", desc: "Il ritorno parte da Luton, non da Stansted.", q: "St Pancras International", ll: [51.53272, -0.127] },
        { ora: "20:55", nome: "Volo Ryanair FR 761", desc: "Luton → Venezia, arrivo 00:05 del 28/12. Carta d'imbarco solo sull'app.", durata: 190 }
      ],
      pub: null,
      nota: "Nessun pub la sera. Il Natural History Museum è aperto solo dal 27: per questo sta qui."
    }
  ],
  promemoria: [
    { id: "mappa", t: "Scaricare la mappa offline con il Wi-Fi", d: "Sono circa 39 MB (Altro, Viaggio, Mappa). Serve farlo prima di partire: a Londra potresti non avere dati.", data: "2026-12-20", etichetta: "prima di partire" },
    { id: "eta", t: "Richiedere l'ETA per tutti e 5", d: "Costo da verificare su gov.uk/eta (le fonti dicono £16 o £20 a persona). La data è indicativa: la risposta può richiedere alcuni giorni lavorativi.", data: "2026-12-15", etichetta: "entro il 15 dic" },
    { id: "wizz", t: "Chiedere a Wizz Air il rimborso del vecchio volo", d: "È stato spostato al 21/12 e non lo usate più. Le opzioni sono nella mail di Wizz Air." },
    { id: "skygarden", t: "Prenotare lo Sky Garden (26/12 alle 17:00)", d: "Ingresso gratuito, biglietti rilasciati circa 3 settimane prima, di solito il lunedì mattina. Per il 26 controlla su skygarden.london dal 7 dicembre. Un tavolo al ristorante vale come ingresso.", data: "2026-12-07", etichetta: "dal 7 dic" },
    { id: "stpaul", t: "Controllare se St Paul's è aperta alla visita il 24" },
    { id: "abbey", t: "Prenotare la messa cantata di Natale a Westminster Abbey (25/12, 10:30)", d: "Verificare sul sito dell'Abbey se serve la prenotazione." },
    { id: "harrods", t: "Controllare gli orari di Harrods del 26", data: "2026-12-20", etichetta: "entro il 20 dic" },
    { id: "nhm", t: "Natural History Museum (27/12): prenotare lo slot gratuito se richiesto" },
    { id: "roast", t: "Prenotare il Sunday roast (27/12)" },
    { id: "idalia", ll: [51.49731, -0.21072], t: "Correggere il nome della prenotazione da Idalia", d: "Risulta registrato con un refuso.", data: "2026-12-20", etichetta: "entro il 20 dic" },
    { id: "jacuzzi", t: "Cancellare l'avviso SevenRooms di Jacuzzi", d: "Non è una prenotazione." },
    { id: "spesa", t: "Fare la spesa il 24 per il giorno di Natale", data: "2026-12-24", etichetta: "il 24 dic" }
  ],
  daVerificare: [
    "Orari di chiusura della metro la vigilia e servizio del 26 (TfL li pubblica a fine novembre)",
    "Quali pub sono aperti il 25",
    "Borough Market e Leadenhall Market il 24: probabile chiusura verso le 15",
    "St Paul's il 24 e messa del 25 a Westminster Abbey: visita e prenotazione",
    "Harrods e Harry Potter Shop il 26: orari. Portobello Market il 26: chiuso",
    "Dishoom il 23 chiude alle 23, con l'arrivo da Stansted è stretto",
    "Pub e cocktail bar: la regola sui minori è scritta in ogni scheda delle Idee, spesso non ufficiale: telefonare prima",
    "Stansted Express: prezzo attuale e tariffa per la bambina",
    "Bagaglio a mano sul volo Ryanair di andata: misure consentite, la mail non le indica",
    "Stime dei taxi",
    "Regole sui bambini nei pub: molti non li accettano dopo le 19-21"
  ],
  /* indirizzi da mostrare al tassista: stessa grafia di Google Maps, nessun dato personale */
  mostra: [
    { id: "casa", ll: [51.53312, -0.11943], nome: "Alloggio", righe: ["77 Caledonian Road", "Islington", "London N1 9BT"] },
    { id: "idalia", nome: "Idalia, cena del 24", righe: ["Pillar Hall", "5 Olympia Way", "London W14 0EY"] },
    { id: "kx", ll: [51.53049, -0.12166], nome: "King's Cross", righe: ["King's Cross Station", "London"] },
    { id: "ltn", nome: "Aeroporto di Luton", righe: ["London Luton Airport", "Departures"] },
    { id: "stn", nome: "Aeroporto di Stansted", righe: ["London Stansted Airport", "Departures"] }
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
