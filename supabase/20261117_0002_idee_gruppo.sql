-- Idee condivise: ogni idea è un sondaggio dentro un unico gruppo permanente (modo 'continuo').
alter table public.campaigns add column if not exists modo text not null default 'fasi' check (modo in ('fasi', 'continuo'));
alter table public.campaigns add column if not exists nomi_ammessi text[];
alter table public.campaigns add column if not exists organizzatori text[] not null default '{}';
alter table public.proposals add column if not exists stato smallint not null default 0 check (stato in (0, 1, 2, 3)); -- in votazione, approvata, respinta, fatta
alter table public.votes drop constraint if exists votes_valore_check;
alter table public.votes add constraint votes_valore_check check (valore in (1, 0, -1)); -- sì, non so, no

create or replace function public.organizzatore(camp uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.participants p join public.campaigns c on c.id = p.campaign_id
    where p.id = public.mio_partecipante(camp) and c.id = camp and lower(p.nome) in (select lower(x) from unnest(c.organizzatori) x)) $$;
create or replace function public.gestisce(camp uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from public.campaigns where id = camp and creato_da = auth.uid()) or public.organizzatore(camp) $$;
create or replace function public.puo_proporre(camp uuid) returns boolean language sql stable security definer set search_path = public as $$
  select case when c.modo = 'continuo' then public.fase_effettiva(c.id) <> 3 else public.fase_effettiva(c.id) = 1 end from public.campaigns c where c.id = camp $$;
create or replace function public.puo_votare(prop uuid) returns boolean language sql stable security definer set search_path = public as $$
  select case when c.modo = 'continuo' then (public.fase_effettiva(c.id) <> 3 and p.stato = 0) else public.fase_effettiva(c.id) = 2 end
  from public.proposals p join public.campaigns c on c.id = p.campaign_id where p.id = prop $$;
create or replace function public.commenti_aperti(camp uuid) returns boolean language sql stable security definer set search_path = public as $$
  select case when c.modo = 'continuo' then public.fase_effettiva(c.id) <> 3
    else case public.fase_effettiva(c.id) when 1 then true when 2 then c.commenti_in_votazione else false end end from public.campaigns c where c.id = camp $$;
grant execute on function public.organizzatore(uuid), public.puo_proporre(uuid), public.puo_votare(uuid) to authenticated;

create or replace function public.entra(p_codice text, p_nome text, p_invito text default null) returns uuid language plpgsql security definer set search_path = public as $$
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
  if c.nomi_ammessi is not null then
    select x into n from unnest(c.nomi_ammessi) x where lower(x) = lower(n) limit 1;
    if n is null then raise exception 'Nome non ammesso in questo gruppo'; end if;
  end if;
  if c.richiede_invito then
    select * into inv from public.invites where codice = upper(btrim(coalesce(p_invito, ''))) and campaign_id = c.id and usato_da is null for update;
    if not found then raise exception 'Serve un codice di invito valido'; end if;
  end if;
  begin
    insert into public.participants (campaign_id, user_id, nome) values (c.id, auth.uid(), n) returning id into p;
  exception when unique_violation then raise exception 'Questo nome è già stato scelto da un altro telefono';
  end;
  if c.richiede_invito then update public.invites set usato_da = p where codice = inv.codice; end if;
  return p;
end $$;

create or replace function public.t_proposte_guardia() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and not public.gestisce(new.campaign_id) then
    if new.campaign_id <> old.campaign_id or new.participant_id <> old.participant_id or new.selezionato <> old.selezionato
       or new.zona <> old.zona or new.priorita is distinct from old.priorita or new.note_org <> old.note_org then
      raise exception 'Campo riservato a chi gestisce il sondaggio';
    end if;
  end if;
  return new;
end $$;

drop policy if exists proposte_inserimento on public.proposals;
drop policy if exists proposte_modifica_autore on public.proposals;
drop policy if exists proposte_elimina_autore on public.proposals;
create policy proposte_inserimento on public.proposals for insert to authenticated with check (participant_id = public.mio_partecipante(campaign_id) and public.puo_proporre(campaign_id));
create policy proposte_modifica_autore on public.proposals for update to authenticated using (participant_id = public.mio_partecipante(campaign_id) and public.puo_proporre(campaign_id)) with check (participant_id = public.mio_partecipante(campaign_id) and public.puo_proporre(campaign_id));
create policy proposte_elimina_autore on public.proposals for delete to authenticated using (participant_id = public.mio_partecipante(campaign_id) and public.puo_proporre(campaign_id));

drop policy if exists voti_inserimento on public.votes;
drop policy if exists voti_modifica on public.votes;
drop policy if exists voti_rimozione on public.votes;
create policy voti_inserimento on public.votes for insert to authenticated with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id)) and public.puo_votare(proposal_id));
create policy voti_modifica on public.votes for update to authenticated using (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id)) and public.puo_votare(proposal_id)) with check (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id)) and public.puo_votare(proposal_id));
create policy voti_rimozione on public.votes for delete to authenticated using (participant_id = public.mio_partecipante(public.camp_della_proposta(proposal_id)) and public.puo_votare(proposal_id));

-- il gruppo permanente delle idee (visibile a tutti, ma solo i quattro nomi possono entrare)
insert into public.campaigns (titolo, descrizione, codice, modo, nomi_ammessi, organizzatori, creato_da, pubblico)
select 'Idee del gruppo', 'Londra, Natale 2026', 'LONDRA2026', 'continuo', array['Francesco','Sara','Rosa','Giuliano'], array['Francesco'], id, true
from auth.users where email = '4everopeth25@gmail.com' and is_anonymous is not true
on conflict (codice) do nothing;
select codice, modo from public.campaigns where codice = 'LONDRA2026';
