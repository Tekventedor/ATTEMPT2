const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://kuaqgkzdprnrddqdervl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YXFna3pkcHJucmRkcWRlcnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzgyNTEsImV4cCI6MjA3NTAxNDI1MX0.uwnaa4BvWXwtIF1ReD1Ui6VD7KZMwUrX_1OBbNPig_8'
);

async function uploadImages() {
  const images = ['dog1.jpg', 'dog2.jpeg'];

  for (const image of images) {
    const filePath = path.join(__dirname, 'public', 'images', image);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(image, fileBuffer, {
        contentType: image.endsWith('.jpg') ? 'image/jpeg' : 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${image}:`, error.message);
    } else {
      console.log(`✓ Uploaded ${image}`);
    }
  }
}

uploadImages();
