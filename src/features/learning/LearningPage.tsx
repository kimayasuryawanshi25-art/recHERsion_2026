import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { LEARNING_CARDS } from '../../data/learning-content';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export function LearningPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Learn" description="Helpful information about tracking and communicating your health" />

      <div className="bg-plum-50 border border-plum-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-plum-700">
          These educational cards provide general information to help you get more from your health records. They are not personal medical advice. Consult your healthcare professional for guidance specific to your situation.
        </p>
      </div>

      <div className="space-y-4">
        {LEARNING_CARDS.map(card => (
          <div key={card.id} className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === card.id ? null : card.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-sand-50 transition-colors"
            >
              <span className="text-2xl">{card.emoji}</span>
              <h3 className="flex-1 font-semibold text-gray-800">{card.title}</h3>
              {expanded === card.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expanded === card.id && (
              <div className="px-5 pb-5 border-t border-sand-100 pt-4">
                <p className="text-sm text-gray-600 leading-relaxed">{card.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Source:</span>
                  {card.sourceUrl !== '#' ? (
                    <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-plum-600 hover:text-plum-700 flex items-center gap-1">
                      {card.source} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">{card.source}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
