import React, { useEffect, useMemo, useState } from 'react';
import { dbSatisfacao, ReviewItem } from '../services/dbService';

const Satisfacao: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setReviews(await dbSatisfacao.getAll());
      setLoading(false);
    };
    load();
  }, []);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((acc, item) => acc + item.stars, 0) / reviews.length;
  }, [reviews]);

  const starsBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((item) => item.stars === star).length
    }));
  }, [reviews]);

  if (loading) return <p>Carregando satisfação...</p>;

  return (
    <section>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Satisfação</h2>
      {!reviews.length ? (
        <p>Nenhuma avaliação disponível no momento.</p>
      ) : (
        <>
          <p className="text-lg font-bold mb-4">Média geral: {average.toFixed(1)} / 5</p>
          <div className="space-y-2 mb-6">
            {starsBreakdown.map((item) => (
              <div key={item.star} className="flex items-center gap-3">
                <span className="w-16 text-sm">{item.star} estrelas</span>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full flex-1 overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${reviews.length ? (item.count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <p className="text-sm font-bold">{review.author} • {review.stars}★</p>
                <p className="text-sm text-slate-500">{review.comment || 'Sem comentário.'}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Satisfacao;
