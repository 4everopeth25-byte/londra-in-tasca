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
create or replace function public.t_notifica_idee() returns trigger
language plpgsql security definer set search_path = public, extensions as
$$
begin
  if tg_op = 'INSERT' or new.stato is distinct from old.stato then
    perform net.http_post(
      url := 'https://wecmatagiojrcaoimxvv.supabase.co/functions/v1/notifica',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-notifica-segreto', '__SEGRETO__'),
      body := jsonb_build_object('proposal_id', new.id, 'tipo', tg_op));
  end if;
  return new;
end $$;
revoke execute on function public.t_notifica_idee() from public, anon, authenticated;
drop trigger if exists proposte_notifica on public.proposals;
create trigger proposte_notifica after insert or update on public.proposals for each row execute function public.t_notifica_idee();
