import { PageHeader } from '../../components/ui/PageHeader';
import { PREVENTIVE_ITEMS } from '../../data/preventive-items';
import { ExternalLink } from 'lucide-react';

export function PreventivePage() {
  return (
    <div>
      <PageHeader title="Preventive Care" description="General guidance and record-keeping prompts" />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> The screening information below is sourced from public health guidelines where indicated. It is general information and may not apply to your specific situation. Always discuss screening schedules with your healthcare professional.
        </p>
      </div>

      <div className="space-y-4">
        {PREVENTIVE_ITEMS.map(item => (
          <div key={item.id} className="bg-white border border-sand-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                {item.source && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Source:</span>
                    {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-plum-600 hover:text-plum-700 flex items-center gap-1">
                        {item.source} <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">{item.source}</span>
                    )}
                    {item.jurisdiction && <span className="text-xs bg-sand-100 px-2 py-0.5 rounded-full text-gray-500">{item.jurisdiction}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
