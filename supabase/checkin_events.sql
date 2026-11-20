-- 마음자로 익명 체크인 신호 테이블
-- 체중·금액·쓸 곳 이름은 저장하지 않습니다. 익명 ID와 이벤트 종류, 주차, 실천 여부만 받습니다.
-- Supabase 대시보드 > SQL Editor에서 한 번 실행하세요.

create table if not exists public.checkin_events (
  id bigint generated always as identity primary key,
  anon_id uuid not null,
  event text not null check (event in ('start', 'checkin', 'pen', 'saving', 'graduate')),
  week int check (week between 0 and 520),
  action_status text check (action_status in ('done', 'partial', 'missed')),
  app_version text,
  created_at timestamptz not null default now()
);

create index if not exists checkin_events_anon_idx on public.checkin_events (anon_id, created_at);

alter table public.checkin_events enable row level security;

-- 앱(anon 키)은 쓰기만 가능, 읽기·수정·삭제 불가
drop policy if exists "anon insert only" on public.checkin_events;
create policy "anon insert only" on public.checkin_events
  for insert to anon
  with check (true);

-- ===== 분석용 쿼리 예시 (대시보드에서 service role로 실행) =====
-- 참가자별 체크인 수와 마지막 체크인 주차
-- select anon_id,
--        count(*) filter (where event = 'checkin') as checkins,
--        max(week) filter (where event = 'checkin') as last_week,
--        count(*) filter (where event = 'checkin' and action_status = 'done') as action_done,
--        bool_or(event = 'saving') as saved_real_money
-- from public.checkin_events
-- group by anon_id
-- order by checkins desc;

-- 4주·8주 유지율(시작한 사람 중 4회·8회 이상 체크인한 비율)
-- with s as (
--   select anon_id, count(*) filter (where event = 'checkin') as n
--   from public.checkin_events group by anon_id
--   having bool_or(event = 'start')
-- )
-- select count(*) as started,
--        round(100.0 * count(*) filter (where n >= 4) / nullif(count(*), 0), 1) as retained_4w_pct,
--        round(100.0 * count(*) filter (where n >= 8) / nullif(count(*), 0), 1) as retained_8w_pct
-- from s;
