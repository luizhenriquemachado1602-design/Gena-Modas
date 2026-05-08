'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PackagePlus, LogOut, Loader2, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';

const ADMIN_EMAILS = ['luizhenriquemachado1602@gmail.com', 'genaina0011111@gmail.com'];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string; // Mantido para compatibilidade passada
  imageUrls?: string[];
  isPromo?: boolean;
  oldPrice?: number;
  clickCount?: number;
}

// Função para otimizar a imagem e converter para Base64
const compressImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080;
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
        
        // Converte direto para Base64 (Data URL) com qualidade 80% WebP
        const base64String = canvas.toDataURL('image/webp', 0.8);
        resolve(base64String);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Products list state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isPromo, setIsPromo] = useState(false);
  const [oldPrice, setOldPrice] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
      setLoadingProducts(true);
      const q = query(collection(db, 'products'));
      const unsubscribeProds = onSnapshot(q, (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prods);
        setLoadingProducts(false);
      }, (error) => {
        console.error("Erro ao buscar produtos:", error);
        setLoadingProducts(false);
      });

      // Get clicks count
      const qClicks = query(collection(db, 'cliques_vitrine'));
      const unsubscribeClicks = onSnapshot(qClicks, (snapshot) => {
        const clickCounts: Record<string, number> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.productId) {
             clickCounts[data.productId] = (clickCounts[data.productId] || 0) + 1;
          }
        });
        
        setProducts(prevProducts => prevProducts.map(p => ({
          ...p,
          clickCount: clickCounts[p.id] || 0
        })));
      }, (error) => {
        console.error("Erro ao buscar cliques:", error);
      });

      return () => {
        unsubscribeProds();
        unsubscribeClicks();
      };
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Limit to 3 files max combined with current uploaded images? 
      // Actually, just limit the overall input files up to 3 for now.
      if (files.length > 3) {
        setMessage({ text: 'Por favor, selecione no máximo 3 imagens.', type: 'error' });
        return;
      }

      const validFiles: File[] = [];
      const previews: string[] = [];

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setMessage({ text: `A imagem ${file.name} é muito grande. Tamanho máximo é 5MB.`, type: 'error' });
          return;
        }
        
        if (!file.type.match(/image\/(jpeg|png|webp)/)) {
          setMessage({ text: `O arquivo ${file.name} tem formato inválido. Use JPG, PNG ou WEBP.`, type: 'error' });
          return;
        }

        validFiles.push(file);
        previews.push(URL.createObjectURL(file));
      }

      setMessage({ text: '', type: '' });
      setImageFiles(validFiles);
      setImagePreviews(previews);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setIsPromo(false);
    setOldPrice('');
    setImageFiles([]);
    setCurrentImageUrls([]);
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setIsPromo(product.isPromo || false);
    setOldPrice(product.oldPrice ? product.oldPrice.toString() : '');
    
    // Suporte a legado (imageUrl) e novo modelo (imageUrls)
    const urls = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
    
    setCurrentImageUrls(urls);
    setImagePreviews(urls);
    setImageFiles([]);
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      
      setMessage({ text: 'Produto excluído com sucesso!', type: 'success' });
      if (editingId === productToDelete.id) resetForm();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      setMessage({ text: 'Erro ao excluir produto.', type: 'error' });
    } finally {
      setProductToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price) {
      setMessage({ text: 'Preencha todos os campos obrigatórios.', type: 'error' });
      return;
    }

    if (isPromo && !oldPrice) {
      setMessage({ text: 'Preencha o preço antigo para produtos em promoção.', type: 'error' });
      return;
    }

    if (!editingId && imageFiles.length === 0 && currentImageUrls.length === 0) {
      setMessage({ text: 'Selecione pelo menos uma imagem para o produto.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      let finalImageUrls = [...currentImageUrls];

      // Se houver novos arquivos de imagem, converte para Base64
      if (imageFiles.length > 0) {
        try {
          setMessage({ text: 'Otimizando imagens...', type: 'success' });
          finalImageUrls = [];
          
          for (const file of imageFiles) {
            const base64String = await compressImageToBase64(file);
            
            // Verifica se o tamanho da string Base64 não excede ~1MB (limite por campo, vamos usar array então o total também tem limite mas por imagem é mais seguro)
            if (base64String.length > 1048487) {
              setMessage({ text: `A imagem ${file.name} otimizada ainda é muito grande. Tente uma foto mais leve.`, type: 'error' });
              setIsSubmitting(false);
              return;
            }
            finalImageUrls.push(base64String);
          }
        } catch (uploadError: any) {
          console.error("Erro ao processar imagem:", uploadError);
          setMessage({ text: 'Erro ao processar as imagens.', type: 'error' });
          setIsSubmitting(false);
          return;
        }
      }

      const productData: any = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        imageUrls: finalImageUrls,
        isPromo: isPromo
      };

      // Se existir ao menos uma imagem, salva a primeira no campo antigo por compatibilidade
      if (finalImageUrls.length > 0) {
        productData.imageUrl = finalImageUrls[0];
      }

      if (isPromo && oldPrice) {
        productData.oldPrice = parseFloat(oldPrice);
      }

      if (editingId) {
        // Atualizar produto existente
        await updateDoc(doc(db, 'products', editingId), productData);
        setMessage({ text: 'Produto atualizado com sucesso!', type: 'success' });
      } else {
        // Criar novo produto
        productData.reactions = {};
        await addDoc(collection(db, 'products'), productData);
        setMessage({ text: 'Produto adicionado com sucesso!', type: 'success' });
      }
      
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      setMessage({ text: 'Erro ao salvar produto. Verifique suas permissões.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center border border-gray-100">
          <h1 className="text-2xl font-bold text-ocean font-serif mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 mb-8">Faça login para acessar o painel de administração da Gena Modas.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-ocean hover:bg-ocean/90 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-offwhite px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center border border-gray-100">
          <h1 className="text-2xl font-bold text-red-600 font-serif mb-2">Acesso Negado</h1>
          <p className="text-gray-500 mb-8">O e-mail <strong>{user.email}</strong> não tem permissão de administrador.</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Sair e tentar outra conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite pt-20 pb-12">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário (Esquerda) */}
        <div className="lg:col-span-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-ocean font-serif">Painel Admin</h1>
              <p className="text-gray-500">Gerencie sua vitrine</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors lg:hidden"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {editingId ? <Edit className="w-6 h-6 text-peach" /> : <PackagePlus className="w-6 h-6 text-gold" />}
                <h2 className="text-xl font-bold text-ocean">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h2>
              </div>
              {editingId && (
                <button onClick={resetForm} className="text-sm text-gray-500 hover:text-ocean flex items-center gap-1">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              )}
            </div>

            {message.text && (
              <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Peça</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vestido Longo Floral"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre o tecido, caimento, etc."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 149.90"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent"
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="isPromo"
                  checked={isPromo}
                  onChange={(e) => setIsPromo(e.target.checked)}
                  className="w-5 h-5 text-ocean rounded border-gray-300 focus:ring-ocean"
                />
                <label htmlFor="isPromo" className="text-sm font-bold text-gray-700 cursor-pointer">
                  Destacar como Promoção Especial
                </label>
              </div>

              {isPromo && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Preço Antigo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="Ex: 199.90"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-peach focus:border-transparent"
                    required={isPromo}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Imagens da Galeria (Máx 3)</label>
                <div className="mt-1 flex flex-col gap-4">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-peach transition-colors relative group">
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-ocean hover:text-peach focus-within:outline-none">
                          <span>Selecionar Imagens</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP até 5MB</p>
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      multiple={true}
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={!editingId && currentImageUrls.length === 0}
                    />
                  </div>

                  {/* Previews das Imagens */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                          <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold/90 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingId ? 'Salvar Alterações' : 'Adicionar à Vitrine'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Produtos (Direita) */}
        <div className="lg:col-span-7">
          <div className="flex justify-between items-center mb-6 hidden lg:flex">
            <h2 className="text-xl font-bold text-ocean font-serif">Produtos Cadastrados ({products.length})</h2>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-ocean" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
              Nenhum produto cadastrado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${editingId === product.id ? 'border-peach ring-2 ring-peach/20' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex gap-4">
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image src={(product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : (product.imageUrl || 'https://picsum.photos/400')} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-ocean truncate">{product.name}</h3>
                      <p className="text-gold font-bold text-sm mb-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <div className="text-xs text-gray-500 mb-2 flex items-center justify-between w-full pr-2">
                          {product.isPromo && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase self-start">
                              Promo
                            </span>
                          )}
                          <span className="flex items-center gap-1" title="Acessos via WhatsApp no botão 'Comprar'">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">
                               Cliques: {product.clickCount || 0}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-ocean py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Edit className="w-3 h-3" /> Editar
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-ocean font-serif mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Tem certeza que deseja excluir <strong>{productToDelete.name}</strong>? Esta ação não pode ser desfeita e a imagem será removida do servidor.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setProductToDelete(null)} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
