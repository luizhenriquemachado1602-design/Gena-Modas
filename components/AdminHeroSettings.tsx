'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Image as ImageIcon, CheckCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      exportHeroCompress(event, resolve, reject);
    };
    reader.onerror = (error) => reject(error);
  });
};

const exportHeroCompress = (event: ProgressEvent<FileReader>, resolve: (value: string) => void, reject: (reason?: any) => void) => {
  const img = new window.Image();
  img.src = event.target?.result as string;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    // For hero banner, allow higher res like 1920x1080
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    
    // We increase quality a bit since it's a hero image
    const base64String = canvas.toDataURL('image/webp', 0.85);
    resolve(base64String);
  };
  img.onerror = (error) => reject(error);
};


export default function AdminHeroSettings() {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHero = async () => {
      const docRef = doc(db, 'settings', 'hero');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().imageUrl) {
        setHeroImage(docSnap.data().imageUrl);
        setPreview(docSnap.data().imageUrl);
      }
    };
    fetchHero();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 8 * 1024 * 1024) {
        setMessage('Imagem muito grande. Tamanho máximo é 8MB.');
        return;
      }
      
      if (!file.type.match(/image\/(jpeg|png|webp)/)) {
        setMessage('Formato inválido. Use JPG, PNG ou WEBP.');
        return;
      }

      setPreview(URL.createObjectURL(file));
      setIsSubmitting(true);
      setMessage('Otimizando imagem...');

      try {
        const base64String = await compressImageToBase64(file);
        
        // Verifica tamanho excedente ~1MB
        if (base64String.length > 1048487) {
          setMessage('A imagem otimizada é muito grande para salvar direto. Tente uma foto mais leve.');
          setIsSubmitting(false);
          return;
        }

        const docRef = doc(db, 'settings', 'hero');
        await setDoc(docRef, { imageUrl: base64String }, { merge: true });
        
        setHeroImage(base64String);
        setMessage('Imagem de Destaque atualizada!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        console.error('Erro ao salvar hero:', err);
        setMessage('Erro ao salvar a imagem.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'settings', 'hero');
      await updateDoc(docRef, { imageUrl: null });
      setHeroImage(null);
      setPreview(null);
      setMessage('Imagem removida com sucesso!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao remover hero:', err);
      setMessage('Erro ao remover a imagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-bold text-ocean font-serif mb-2">Imagem de Destaque (Capa)</h2>
      <p className="text-sm text-gray-500 mb-6">Esta imagem aparecerá no topo do site. Proporção recomendada: 16:9 (Paisagem) ou formato Retangular. Pode ser até 8MB.</p>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-ocean/10 text-ocean flex items-center gap-2">
          {message === 'Otimizando imagem...' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="mb-4">
        {preview ? (
          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 group">
            <Image src={preview} alt="Hero Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
               <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="bg-white text-ocean px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-transform"
               >
                 Trocar Imagem
               </button>
               <button 
                onClick={handleRemove}
                disabled={isSubmitting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:scale-105 transition-transform flex items-center gap-2"
               >
                 <Trash2 className="w-4 h-4" /> Excluir
               </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full aspect-video md:aspect-[21/9] border-2 border-gray-300 border-dashed rounded-lg hover:border-peach transition-colors cursor-pointer bg-gray-50"
          >
             <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
             <span className="text-ocean font-medium">Clique para escolher uma imagem</span>
             <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP até 8MB</span>
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
