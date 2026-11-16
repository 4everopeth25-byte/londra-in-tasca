-- Londra in tasca, Sondaggio collaborativo: schema, funzioni, RLS e realtime.
-- Si esegue una sola volta, in Supabase: SQL Editor, New query, incolla, Run.
-- Ogni sondaggio ("campaign") è indipendente: il modulo non è legato a Londra 2026.

create extension if not exists pgcrypto;

-- ---------- tabelle ----------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  titolo text not null check (char_length(titolo) between 3 and 120),
  descrizione text not null default '' check (char_length(descrizione) <= 1000),
  codice text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  fase smallint not null default 1 check (fase in (1, 2, 3)),
  votazione_inizio timestamptz,           -- passaggio automatico alla fase 2
  chiusura timestamptz,                   -- passaggio automatico alla fase 3
  commenti_in_votazione boolean not null default true,
  richiede_invito boolean not null default false,
  creato_da uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 30),
  revocato boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);
create unique index participants_nome_uq on public.participants (campaign_id, lower(nome));

create table public.invites (
  codice text primary key default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  etichetta text not null default '',
  usato_da uuid references public.participants(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  titolo text not null check (char_length(titolo) between 2 and 120),
  categoria text not null default 'altro' check (categoria in
    ('attrazioni','musei','esperienze','ristoranti','locali','shopping','parchi','altro')),
  descrizione text not null default '' check (char_length(descrizione) <= 1000),
  indirizzo text not null default '' check (char_length(indirizzo) <= 200),
  maps_url text not null default '' check (char_length(maps_url) <= 500 and (maps_url = '' or maps_url ~* '^https://')),
  sito_url text not null default '' check (char_length(sito_url) <= 500 and (sito_url = '' or sito_url ~* '^https://')),
  immagine_url text not null default '' check (char_length(immagine_url) <= 500 and (immagine_url = '' or immagine_url ~* '^https://')),
  -- campi riservati all'amministratore (selezione per l'itinerario, non toccano la classifica)
  selezionato boolean not null default false,
  giorno smallint check (giorno between 1 and 31),
  zona text not null default '' check (char_length(zona) <= 60),
  priorita smallint,
  note_org text not null default '' check (char_length(note_org) <= 500),
  titolo_norm text generated always as (lower(regexp_replace(titolo, '\s+', ' ', 'g'))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index proposals_duplicato_uq on public.proposals (campaign_id, titolo_norm);
create index proposals_campaign_idx on public.proposals (campaign_id);

create table public.votes (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  valore smallint not null check (valore in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (proposal_id, participant_id)         -- un solo voto per proposta e partecipante
);
create index votes_participant_idx on public.votes (participant_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  testo text not null check (char_length(testo) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_proposal_idx on public.comments (proposal_id, created_at);

create table public.proposal_history (
  id bigint generated always as identity primary key,
  proposal_id uuid not null,
  campaign_id uuid not null,
  azione text not null,
  autore uuid default auth.uid(),
  dati jsonb,
  created_at timestamptz not null default now()
);

-- ---------- funzioni di appoggio (security definer: evitano la ricorsione delle policy) ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create or replace function public.mio_partecipante(camp uuid) returns uuid
language sql stable security definer set search_path = public as
$$ select id from public.participants where campaign_id = camp and user_id = auth.uid() and not revocato $$;

-- fase effettiva: la fase manuale, avanzata dalle scadenze controllate dal server (non dal browser)
create or replace function public.fase_effettiva(camp uuid) returns smallint
language sql stable security definer set search_path = public as
$$ select case
     when c.fase = 3 then 3
     when c.chiusura is not null and c.chiusura <= now() then 3
     when c.fase = 1 and c.votazione_inizio is not null and c.votazione_inizio <= now() then 2
     else c.fase end::smallint
   from public.campaigns c where c.id = camp $$;

create or replace function public.camp_della_proposta(prop uuid) returns uuid
language sql stable security definer set search_path = public as
$$ select campaign_id from public.proposals where id = prop $$;

-- ingresso con il codice del sondaggio e un nome: crea il partecipante legato alla sessione anonima
create or replace function public.entra(p_codice text, p_nome text, p_invito text default null) returns uuid
language plpgsql security definer set search_path = public as
$$
declare c public.campaigns; p uuid; n text := btrim(p_nome); inv public.invites;
begin
  if auth.uid() is null then raise exception 'Sessione non valida'; end if;
  select * into c from public.campaigns where codice = upper(btrim(p_codice));
  if not found then raise exception 'Codice del sondaggio non trovato'; end if;
  select id into p from public.participants where campaign_id = c.id and user_id = auth.uid();
  if found then
    if exists (select 1 from public.participants where id = p and revocato) then raise exception 'Accesso revocato'; end if;
    return p;
  end if;
  if char_length(n) < 2 or char_length(n) > 30 then raise exception 'Il nome deve avere da 2 a 30 caratteri'; end if;
  if c.richiede_invito then
    select * into inv from public.invites where codice = upper(btrim(coalesce(p_invito, ''))) and campaign_id = c.id and usato_da is null for update;
    if not found then raise exception 'Serve un codice di invito valido'; end if;
  end if;
  begin
    insert into public.participants (campaign_id, user_id, nome) values (c.id, auth.uid(), n) returning id into p;
  exception when unique_violation then raise exception 'Questo nome è già usato nel sondaggio';
  end;
  if c.richiede_invito then update public.invites set usato_da = p where codice = inv.codice; end if;
  return p;
end $$;

-- titolo del sondaggio dal codice (per la schermata di ingresso), senza esporre altro
create or replace function public.sondaggio_da_codice(p_codice text) returns table (titolo text, richiede_invito boolean)
language sql stable security definer set search_path = public as
$$ select titolo, richiede_invito from public.campaigns where codice = upper(btrim(p_codice)) $$;

-- ---------- trigger ----------
create or replace function public.t_proposte_guardia() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and not public.is_admin() then
    if new.campaign_id <> old.campaign_id or new.participant_id <> old.participant_id
       or new.selezionato <> old.selezionato or new.giorno is distinct from old.giorno or new.zona <> old.zona
       or new.priorita is distinct from old.priorita or new.note_org <> old.note_org then
      raise exception 'Campo riservato all''amministratore';
    end if;
  end if;
  return new;
end $$;
create trigger proposte_guardia before update on public.proposals for each row execute function public.t_proposte_guardia();

create or replace function public.t_aggiorna_ts() returns trigger language plpgsql as
$$ begin new.updated_at := now(); return new; end $$;
create trigger voti_ts before update on public.votes for each row execute function public.t_aggiorna_ts();
create trigger commenti_ts before update on public.comments for each row execute function public.t_aggiorna_ts();

create or replace function public.t_storico() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  if tg_op = 'DELETE' then
    insert into public.proposal_history (proposal_id, campaign_id, azione, dati) values (old.id, old.campaign_id, 'eliminata', to_jsonb(old));
    return old;
  end if;
  insert into public.proposal_history (proposal_id, campaign_id, azione, dati) values (new.id, new.campaign_id, 'modificata', to_jsonb(old));
  return new;
end $$;
create trigger proposte_storico after update or delete on public.proposals for each row execute function public.t_storico();

-- ---------- classifica calcolata dal database ----------
create or replace view public.classifica with (security_invoker = true) as
select p.id as proposal_id, p.campaign_id, p.titolo, p.categoria, pa.nome as proponente,
       coalesce(sum((v.valore = 1)::int), 0)::int as positivi,
       coalesce(sum((v.valore = -1)::int), 0)::int as negativi,
       count(v.proposal_id)::int as totale,
       (coalesce(sum((v.valore = 1)::int), 0) - coalesce(sum((v.valore = -1)::int), 0))::int as punteggio,
       rank() over (partition by p.campaign_id order by
         (coalesce(sum((v.valore = 1)::int), 0) - coalesce(sum((v.valore = -1)::int), 0)) desc,
         coalesce(sum((v.valore = 1)::int), 0) desc, count(v.proposal_id) desc)::int as posizione
from public.proposals p
join public.participants pa on pa.id = p.participant_id
left join public.votes v on v.proposal_id = p.id
group by p.id, pa.nome;

-- ---------- sicurezza a livello di riga ----------
alter table public.admins enable row level security;
alter table public.campaigns enable row level security;
alter table public.participants enable row level security;
alter table public.invites enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.proposal_history enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon;
grant usage on schema public to authenticated;
grant select on public.campaigns, public.participants, public.proposals, public.votes, public.comments, public.classifica to authenticated;
grant insert, update, delete on public.campaigns, public.proposals, public.votes, public.comments to authenticated;
grant update, delete on public.participants to authenticated;
grant select, insert, delete on public.invites to authenticated;
grant select on public.proposal_history to authenticated;
grant execute on function public.is_admin(), public.mio_partecipante(uuid), public.fase_effettiva(uuid),
  public.camp_della_proposta(uuid), public.entra(text, text, text), public.sondaggio_da_codice(text) to authenticated;
-- gli utenti anonimi di Supabase usano il ruolo authenticated: i permessi veri sono nelle policy qui sotto.

-- admins: nessuna policy per gli utenti, la tabella si modifica solo dal pannello SQL
create policy campagne_lettura on public.campaigns for select to authenticated
  using (public.is_admin() or public.mio_partecipante(id) is not null);
create policy campagne_admin_scrittura on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy partecipanti_lettura on public.participants for select to authenticated
  using (public.is_admin() or public.mio_partecipante(campaign_id) is not null);
create policy partecipanti_admin on public.participants for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy partecipanti_admin_del on public.participants for delete to authenticated
  using (public.is_admin());

create policy inviti_admin on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy proposte_lettura on public.proposals for select to authenticated
  using (public.is_admin() or public.mio_partecipante(campaign_id) is not null);
create policy proposte_inserimento on public.proposals for insert to authenticated
  with check (participant_id = public.mio_partecipante(campaign_id) and public.fase_effettiva(campaign_id) = 1);
create policy proposte_modifica_autore on public.proposals for update to authenticated
  using (participant_id = public.mio_partecipante(campaign_id) and public.fase_effettiva(campaign_id) = 1)
  with check (participant_id = public.mio_partecipante(campaign_id) and public.fase_effettiva(campaign_id) = 1);
create policy proposte_admin on public.proposals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy proposte_elimina_autore on public.proposals for delete to authenticated
  using (participant_id = public.mio_partecipante(campaign_id) and public.fase_effettiva(campaign_id) = 1);

create policy voti_lettura on public.votes for select to authenticated
  using (public.is_admin() or public.mio_partecipante(public.camp_della_proposta(proposal_id)) is not null);
create policy voti_inserimento on public.votes for insert to authenticated
  with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
              and public.fase_effettiva(public.camp_della_proposta(proposal_id)) = 2);
create policy voti_modifica on public.votes for update to authenticated
  using (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
         and public.fase_effettiva(public.camp_della_proposta(proposal_id)) = 2)
  with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
              and public.fase_effettiva(public.camp_della_proposta(proposal_id)) = 2);
create policy voti_rimozione on public.votes for delete to authenticated
  using (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
         and public.fase_effettiva(public.camp_della_proposta(proposal_id)) = 2);

create or replace function public.commenti_aperti(camp uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select case public.fase_effettiva(camp) when 1 then true
     when 2 then (select commenti_in_votazione from public.campaigns where id = camp) else false end $$;
grant execute on function public.commenti_aperti(uuid) to authenticated;

create policy commenti_lettura on public.comments for select to authenticated
  using (public.is_admin() or public.mio_partecipante(public.camp_della_proposta(proposal_id)) is not null);
create policy commenti_inserimento on public.comments for insert to authenticated
  with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
              and public.commenti_aperti(public.camp_della_proposta(proposal_id)));
create policy commenti_modifica on public.comments for update to authenticated
  using (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
         and public.commenti_aperti(public.camp_della_proposta(proposal_id)))
  with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
              and public.commenti_aperti(public.camp_della_proposta(proposal_id)));
create policy commenti_elimina on public.comments for delete to authenticated
  using (public.is_admin() or (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id))
         and public.commenti_aperti(public.camp_della_proposta(proposal_id))));

create policy storico_admin on public.proposal_history for select to authenticated using (public.is_admin());

-- ---------- tempo reale ----------
alter publication supabase_realtime add table public.campaigns, public.participants, public.proposals, public.votes, public.comments;

-- ---------- amministratore ----------
-- Dopo aver creato l'utente con email e password (Authentication, Users), esegui UNA volta, con la tua email:
--   insert into public.admins (user_id) select id from auth.users where email = 'LA-TUA-EMAIL';
