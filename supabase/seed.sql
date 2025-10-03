-- Seed example courses (adjust image_name extensions to match your files)
insert into public.course1 (title, description, image_name, tags)
values ('Course 1', 'Intro course with dog1', 'dog1.jpg', array['dogs','intro'])
on conflict do nothing;

insert into public.course2 (title, description, image_name, tags)
values ('Course 2', 'Second course with dog2', 'dog2.jpeg', array['dogs','advanced'])
on conflict do nothing;


