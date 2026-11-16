# Sondaggio collaborativo, Supabase

## Architettura
- Frontend: `sondaggio.js` (nessun framework), libreria `vendor/supabase.js` (supabase-js 2.45.4, salvata in locale).
- Database: `20261117_0001_schema.sql`, da eseguire una volta in SQL Editor. Tabelle: campaigns, participants, invites, proposals, votes, comments, proposal_history, admins. Vista `classifica`.
- Accesso: sessione anonima Supabase, poi la funzione `entra(codice, nome, invito)` crea il partecipante legato alla sessione. L'amministratore usa email e password, in una sessione separata, ed è elencato nella tabella `admins`.

## Sicurezza
- RLS attiva su tutte le tabelle. Nel frontend c'è solo la publishable key, mai la service_role.
- Fasi e scadenze sono calcolate dal server (`fase_effettiva`). Un voto per proposta e partecipante (chiave primaria). Un partecipante non può scrivere a nome di un altro.
- L'amministratore si aggiunge solo da SQL Editor: `insert into public.admins (user_id) select id from auth.users where email = '...';`
- Limiti noti: nessun limite di frequenza sull'ingresso con codice (codice di 10 caratteri esadecimali, non indovinabile a mano); le immagini sono solo link, non si caricano file.

## Configurazione da zero
1. Crea il progetto Supabase, attiva Authentication, Sign In, Allow anonymous sign-ins.
2. Esegui lo schema in SQL Editor.
3. Crea l'utente amministratore (Authentication, Users) e aggiungilo a `admins`.
4. Metti URL e publishable key in `sondaggio.js` (costanti in cima) e aggiungi l'host a `connect-src` in `index.html`.
5. Pubblica `app/` su GitHub Pages.

## Prove eseguite (34 su 34, con tre utenti anonimi)
Ingresso, nomi duplicati, estranei, proposte altrui, campi riservati, link non https, voto in fase sbagliata, voto duplicato, voto a nome altrui, classifica, commenti, chiusura automatica. Non provati: pannello amministratore, telefoni veri, tempo reale tra due dispositivi.

## Esportazione
Dal pannello Gestione, «Esporta per aggiornare l'itinerario»: un file JSON con classifica, selezioni, voti e commenti.
