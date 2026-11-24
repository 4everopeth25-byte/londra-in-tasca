-- ESEGUITO il 24/11/2026: tabella delle iscrizioni push e permessi (nessun segreto).
-- Notifiche push: gli iscritti (un telefono = una riga) ricevono un avviso quando c'è un'idea nuova o cambia lo stato di un'idea.
-- Il segreto condiviso con la funzione «notifica» va sostituito al posto di __SEGRETO__ solo quando si esegue lo script (non va salvato nel repository).
create table if not exists public.push_subscriptions (
  endpoint text primary key check (endpoint ~ '^https://'),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy push_miei on public.push_subscriptions for all to authenticated
  using (participant_id = public.mio_partecipante(campaign_id)) with check (participant_id = public.mio_partecipante(campaign_id));
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create extension if not exists pg_net with schema extensions;
