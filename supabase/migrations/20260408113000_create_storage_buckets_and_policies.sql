insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'images',
    'images',
    true,
    10485760,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/avif'
    ]
  ),
  (
    'documents',
    'documents',
    true,
    26214400,
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view images bucket objects" on storage.objects;
create policy "Public can view images bucket objects"
on storage.objects
for select
to public
using (bucket_id = 'images');

drop policy if exists "Authenticated can upload images bucket objects" on storage.objects;
create policy "Authenticated can upload images bucket objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'images');

drop policy if exists "Authenticated can update images bucket objects" on storage.objects;
create policy "Authenticated can update images bucket objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'images')
with check (bucket_id = 'images');

drop policy if exists "Authenticated can delete images bucket objects" on storage.objects;
create policy "Authenticated can delete images bucket objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'images');

drop policy if exists "Public can view documents bucket objects" on storage.objects;
create policy "Public can view documents bucket objects"
on storage.objects
for select
to public
using (bucket_id = 'documents');

drop policy if exists "Authenticated can upload documents bucket objects" on storage.objects;
create policy "Authenticated can upload documents bucket objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents');

drop policy if exists "Authenticated can update documents bucket objects" on storage.objects;
create policy "Authenticated can update documents bucket objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

drop policy if exists "Authenticated can delete documents bucket objects" on storage.objects;
create policy "Authenticated can delete documents bucket objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents');
