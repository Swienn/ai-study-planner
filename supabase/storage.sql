-- AI Study Planner — Storage Bucket + RLS
-- Run this in: Supabase Dashboard → SQL Editor → New query

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,                    -- 10 MB hard limit
  array['application/pdf']     -- only PDFs allowed at bucket level
)
on conflict (id) do nothing;

-- Users can upload only into their own folder: {user_id}/*
create policy "Users can upload their own PDFs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read only their own files
create policy "Users can read their own PDFs"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own files
create policy "Users can delete their own PDFs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
