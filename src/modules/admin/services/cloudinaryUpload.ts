export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary não configurado corretamente. Defina VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET no .env e reinicie o servidor.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json() as { secure_url?: string; public_id?: string; error?: { message?: string } };

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Falha ao enviar imagem para o Cloudinary.');
  }

  if (!payload.secure_url || !payload.public_id) {
    throw new Error('Resposta inválida do Cloudinary.');
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id
  };
}
