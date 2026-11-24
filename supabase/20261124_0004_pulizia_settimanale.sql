-- Pulizia settimanale delle idee respinte, con copia di salvataggio. Le idee in votazione, approvate e fatte NON si toccano mai.
create table if not exists public.idee_archivio (
  id uuid primary key,
  campaign_id uuid not null,
  dati jsonb not null,
  voti jsonb not null default '[]',
  commenti jsonb not null default '[]',
  archiviata_il timestamptz not null default now()
);
alter table public.idee_archivio enable row level security;   -- nessuna policy: si legge solo dal pannello SQL

create or replace function public.pulisci_idee_respinte() returns integer
language plpgsql security definer set search_path = public as
$$
declare n integer;
begin
  insert into public.idee_archivio (id, campaign_id, dati, voti, commenti)
  select p.id, p.campaign_id, to_jsonb(p),
         coalesce((select jsonb_agg(to_jsonb(v)) from public.votes v where v.proposal_id = p.id), '[]'::jsonb),
         coalesce((select jsonb_agg(to_jsonb(c)) from public.comments c where c.proposal_id = p.id), '[]'::jsonb)
  from public.proposals p where p.stato = 2
  on conflict (id) do nothing;
  delete from public.proposals where stato = 2;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.pulisci_idee_respinte() from public, anon, authenticated;

-- ogni martedì alle 03:00 (ora UTC), a partire da oggi
create extension if not exists pg_cron with schema extensions;
select cron.schedule('pulisci-idee-respinte', '0 3 * * 2', $$select public.pulisci_idee_respinte()$$);
