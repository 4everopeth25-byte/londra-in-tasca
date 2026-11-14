/* Dati pubblici del viaggio. Qui NON vanno codici di prenotazione né nominativi: stanno nel file riservato, importato dall'app. */
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
        { ora: "~22:00", nome: "Check-in alloggio", desc: "A pochi passi da King's Cross. L'indirizzo esatto non è ancora noto.", q: "King's Cross Station" },
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
        { ora: "22:30", nome: "Taxi di rientro", desc: "Ritorno verso King's Cross.", q: "King's Cross Station" }
      ],
      pub: { nome: "The Queen's Head", dove: "66 Acton Street", q: "The Queen's Head, 66 Acton Street, London", alt: "Con la bambina: sosta prima di cena al Churchill Arms di Kensington. Da verificare se ammette bambini." },
      nota: "Il pub si fa dopo la cena. Per il 25 conviene fare la spesa oggi."
    },
    {
      iso: "2026-12-25", breve: "25 ven", data: "Venerdì 25 dicembre", titolo: "Natale a piedi, anello di 10 km", mezzo: "walking",
      tappe: [
        { ora: "Via", nome: "King's Cross", desc: "Partenza a piedi: oggi non circolano metro, treni e bus TfL.", q: "King's Cross Station" },
        { ora: "", nome: "Russell Square e British Museum", desc: "Solo esterno.", q: "British Museum" },
        { ora: "", nome: "Covent Garden", desc: "Mercato e decorazioni.", q: "Covent Garden" },
        { ora: "", nome: "Trafalgar Square", desc: "", q: "Trafalgar Square" },
        { ora: "", nome: "Whitehall e Horse Guards", desc: "", q: "Horse Guards Parade" },
        { ora: "", nome: "Big Ben e Westminster Abbey", desc: "", q: "Big Ben" },
        { ora: "", nome: "St James's Park e Buckingham Palace", desc: "", q: "Buckingham Palace" },
        { ora: "Pranzo", nome: "Chinatown", desc: "Golden Phoenix è citato tra i locali aperti a Natale. Da verificare.", q: "Golden Phoenix Chinatown London" },
        { ora: "Rientro", nome: "Soho e Bloomsbury", desc: "Ritorno a piedi verso l'alloggio.", q: "King's Cross Station" }
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
        { ora: "09:15", nome: "Check-out e deposito bagagli", desc: "", q: "King's Cross Station" },
        { ora: "10:00", nome: "Mundo Pixar Experience", desc: "Fulton Road, Wembley Park HA9 0TF. Aperta dal 21/12 al 3/1 tranne Natale. Visita di 45-55 minuti.", costo: "circa £34 adulti, £22 bambini", q: "Fulton Road, Wembley Park HA9 0TF" },
        { ora: "12:30", nome: "Sunday roast al The Coach Makers Arms", desc: "88 Marylebone Lane. Alternativa: The Volunteer su Baker Street.", q: "The Coach Makers Arms, 88 Marylebone Lane, London" },
        { ora: "15:00", nome: "Ritiro bagagli", desc: "", q: "King's Cross Station" },
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
  info: [
    "Mezzi: metro e treni con carta contactless.",
    "Passeggino piccolo da viaggio: sì.",
    "Andata: bagaglio a mano 40x30x20 (Wizz Air).",
    "Ritorno: carta d'imbarco solo sull'app Ryanair."
  ]
};
