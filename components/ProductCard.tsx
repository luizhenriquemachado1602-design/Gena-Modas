'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, updateDoc, increment, collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from './ProductList';
import { MessageCircle, Send } from 'lucide-react';

const EMOJIS = ['🔥', '😍', '✨', '🛍️', '👏', '🙌', '💖', '🔝', '🌟', '👑'];

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

export default function ProductCard({ product }: { product: Product }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('productId', '==', product.id),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    return () => unsubscribe();
  }, [product.id]);

  const handleReaction = async (emoji: string) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        [`reactions.${emoji}`]: increment(1)
      });
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const finalAuthor = authorName.trim() || 'Visitante';
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        productId: product.id,
        text: newComment.trim(),
        author: finalAuthor,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const whatsappMessage = encodeURIComponent(`Olá, gostei da peça ${product.name} de ${formatPrice(product.price)} e gostaria de saber a disponibilidade`);
  const whatsappUrl = `https://wa.me/5522998556724?text=${whatsappMessage}`;

  const imagesToShow = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : [product.imageUrl || 'https://picsum.photos/seed/fashion/400/500'];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col">
      <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
        {imagesToShow.length > 1 ? (
          <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {imagesToShow.map((imgUrl, idx) => (
              <div key={idx} className="relative min-w-full h-full snap-start">
                <Image 
                  src={imgUrl} 
                  alt={`${product.name} - Gena Modas Búzios${imagesToShow.length > 1 ? ` - Imagem ${idx + 1}` : ''}`}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        ) : (
          <Image 
            src={imagesToShow[0]} 
            alt={`${product.name} - Gena Modas Búzios`}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        {imagesToShow.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {imagesToShow.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-ocean leading-tight">{product.name}</h3>
          <span className="font-bold text-lg text-ocean whitespace-nowrap ml-2">{formatPrice(product.price)}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
        
        {/* Reactions */}
        <div className="py-3 border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {EMOJIS.map((emoji) => {
              const count = product.reactions?.[emoji] || 0;
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex flex-col items-center min-w-[40px] group"
                >
                  <span className="text-xl filter grayscale group-hover:grayscale-0 group-hover:scale-125 transition-all duration-300">
                    {emoji}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium mt-1">
                    {count > 0 ? count : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments Section */}
        <div className="py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3 text-ocean">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Comentários ({comments.length})</span>
          </div>
          
          <div className="space-y-3 mb-4 max-h-32 overflow-y-auto pr-2">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <span className="font-bold text-ocean mr-2">@{comment.author.toLowerCase().replace(/\s+/g, '')}</span>
                <span className="text-gray-600">{comment.text}</span>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 italic">Seja o primeiro a comentar!</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-peach transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicione um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-peach transition-colors"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !newComment.trim()}
                className="bg-ocean text-white p-2 rounded-lg hover:bg-ocean/90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* WhatsApp Button */}
      <button
        data-product-name={product.name}
        onClick={(e) => {
          e.preventDefault();
          // Log click directly in Firestore (as requested, replacing Supabase for consistency)
          addDoc(collection(db, 'cliques_vitrine'), {
            productId: product.id,
            modelo_peca: product.name,
            createdAt: serverTimestamp()
          }).catch(console.error); // We don't await so not to block user interaction

          // Open WhatsApp immediately
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }}
        className="block w-full bg-gold hover:bg-gold/90 text-white text-center font-bold py-4 transition-colors"
      >
        CONTATAR LOJISTA
      </button>
    </div>
  );
}
