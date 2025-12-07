-- Add notes field to providers for internal admin commentary
alter table providers
  add column if not exists notes text;


