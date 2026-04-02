'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PackagePlus, LogOut, Loader2, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';

const ADMIN_EMAIL = 'luizhenriquemachado1602@gmail.com';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
    if (user && user.email === ADMIN_EMAIL) {
      setLoadingProducts(true);
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
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
      return () => unsubscribe();
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setCurrentImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCurrentImageUrl(product.imageUrl);
    setImagePreview(product.imageUrl);
    setImageFile(null);
    setMessage({ text: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      
      // Tenta deletar a imagem do Storage se for uma URL do Firebase
      if (productToDelete.imageUrl.includes('firebasestorage')) {
        try {
          const imageRef = ref(storage, productToDelete.imageUrl);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.error("Erro ao deletar imagem do storage:", storageError);
          // Não impede a exclusão do documento se a imagem falhar
        }
      }
      
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

    if (!editingId && !imageFile && !currentImageUrl) {
      setMessage({ text: 'Selecione uma imagem para o produto.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      let finalImageUrl = currentImageUrl;

      // Se houver um novo arquivo de imagem, faz o upload
      if (imageFile) {
        try {
          const fileName = `products/${Date.now()}_${imageFile.name}`;
          const storageRef = ref(storage, fileName);
          const snapshot = await uploadBytes(storageRef, imageFile);
          finalImageUrl = await getDownloadURL(snapshot.ref);
        } catch (uploadError) {
          console.error("Erro no upload:", uploadError);
          setMessage({ text: 'Erro ao fazer upload da imagem. Verifique se o Firebase Storage está ativado.', type: 'error' });
          setIsSubmitting(false);
          return;
        }
      }

      if (editingId) {
        // Atualizar produto existente
        await updateDoc(doc(db, 'products', editingId), {
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          imageUrl: finalImageUrl
        });
        setMessage({ text: 'Produto atualizado com sucesso!', type: 'success' });
      } else {
        // Criar novo produto
        await addDoc(collection(db, 'products'), {
          name: name.trim(),
          description: description.trim(),
          price: parseFloat(price),
          imageUrl: finalImageUrl,
          reactions: {}
        });
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

  if (user.email !== ADMIN_EMAIL) {
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Imagem da Galeria</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-peach transition-colors relative overflow-hidden group">
                  {imagePreview ? (
                    <div className="absolute inset-0 w-full h-full">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-ocean text-white px-3 py-1 rounded-lg text-sm font-medium">Trocar Imagem</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-ocean hover:text-peach focus-within:outline-none">
                          <span>Fazer upload de um arquivo</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP até 5MB</p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required={!editingId && !currentImageUrl}
                  />
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
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-ocean truncate">{product.name}</h3>
                      <p className="text-gold font-bold text-sm mb-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                      </p>
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
