-- Trigger che chiama la funzione Edge «notifica». Sostituire __SEGRETO__ con il valore «segreto» di _dati-mappe/vapid.json solo al momento dell'esecuzione (non salvarlo nel repository).
-- Prima va creata la funzione Edge «notifica» (funzioni/notifica/index.ts) con i secret NOTIFICA_SEGRETO, VAPID_PUBLICA, VAPID_PRIVATA.
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
