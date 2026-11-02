import React, { useState } from 'react';
import { api } from '../../services/api';
import { Feedback } from '../../types';
import { IconStar, IconCheckCircle } from '../common/Icons';

interface FeedbackFormProps {
  protocol: string;
  existingFeedback?: Feedback | null;
  onFeedbackSubmitted?: (feedback: Feedback) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  protocol,
  existingFeedback,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 5);
  const [comment, setComment] = useState<string>(existingFeedback?.comment || '');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(Boolean(existingFeedback));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.submitFeedback(protocol, rating, comment);
      setSuccess(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-200 flex flex-col gap-2 font-sans">
        <div className="flex items-center gap-2">
          <IconCheckCircle size={18} className="text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Avaliação Registrada
          </h4>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <IconStar
              key={star}
              size={16}
              className={star <= rating ? 'text-amber-400' : 'text-slate-600'}
            />
          ))}
        </div>
        {comment && (
          <p className="text-xs text-emerald-100 bg-emerald-900/20 p-2.5 rounded border border-emerald-800/40 italic">
            "{comment}"
          </p>
        )}
        <p className="text-[11px] text-emerald-300/80">
          Obrigado por ajudar a aprimorar os serviços municipais de zeladoria e ouvidoria!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Avaliar Atendimento (RF015)
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">1 a 5 estrelas</span>
      </div>

      <p className="text-xs text-slate-400">
        Como você avalia a resolução da sua ocorrência pela equipe técnica da Prefeitura?
      </p>

      {/* Seleção de Estrelas */}
      <div className="flex items-center gap-2 my-1">
        {[1, 2, 3, 4, 5].map(star => {
          const currentStarRating = hoverRating !== null ? hoverRating : rating;
          const isFilled = star <= currentStarRating;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 rounded hover:scale-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={`Nota ${star} de 5`}
            >
              <IconStar
                size={22}
                className={isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
              />
            </button>
          );
        })}
        <span className="text-xs font-bold text-amber-400 font-mono ml-2">
          {rating}/5
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="feedback-comment" className="text-xs text-slate-400">
          Comentário ou sugestão (opcional)
        </label>
        <textarea
          id="feedback-comment"
          rows={2}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Conte detalhes sobre o que achou da agilidade ou qualidade do reparo..."
          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-civic-500 transition resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-end px-4 py-1.5 rounded-lg bg-civic-700 hover:bg-civic-600 disabled:opacity-50 text-white text-xs font-semibold transition shadow-xs"
      >
        {loading ? 'Enviando...' : 'Enviar Avaliação'}
      </button>
    </form>
  );
};
