import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { PREVENTIVE_ITEMS } from '../../data/preventive-items';
import { ExternalLink, User, Info, ArrowRight } from 'lucide-react';
import { getProfileSection, getHealthItems } from '../../lib/db';

export function PreventivePage() {
  const [basics, setBasics] = useState<any>(null);
  const [familyHistory, setFamilyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, fam] = await Promise.all([
          getProfileSection('basics'),
          getHealthItems('family_history'),
        ]);
        setBasics(b?.data || null);
        setFamilyHistory(fam || []);
      } catch (err) {
        console.error('Failed to load profile for preventive page:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const birthYear = basics?.birthYear;
  const region = basics?.region || basics?.country;
  const currentYear = new Date().getFullYear();
  const approxAge = birthYear ? currentYear - birthYear : null;
  const isProfileIncomplete = !birthYear || !region;

  return (
    <div>
      <PageHeader title="Preventive Care" description="General guidance and record-keeping prompts" />

      {/* Required public guidance disclaimer banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>Sample public guidance from national programs and WHO:</strong> This information is a general reference and has not been clinically reviewed for your specific situation. It is not an individual risk assessment. Always discuss screening schedules and questions with a healthcare professional.
        </p>
      </div>

      {/* Profile connection prompt if age or region is missing */}
      {!loading && isProfileIncomplete && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-[#5B4B8A] shrink-0 mt-0.5" />
            <p className="text-sm text-[#493B72]">
              Screening guidelines vary by age and region. Add your details in <strong>About Me</strong> to see relevant guidance (or browse all public guidelines below).
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5B4B8A] text-white hover:bg-[#493B72] shrink-0 transition"
          >
            Open About Me
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!loading && !isProfileIncomplete && (
        <div className="bg-sand-100 border border-sand-300 rounded-xl p-3 mb-6 text-xs text-stone-700 flex items-center justify-between">
          <span>
            Showing context for: approx <strong>{approxAge} years old</strong> {region ? `• Region: ${region}` : ''}
          </span>
          <Link to="/profile" className="text-[#5B4B8A] font-semibold hover:underline">
            Edit profile
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {PREVENTIVE_ITEMS.map(item => {
          const isScreening = item.id === 'prev-1' || item.id === 'prev-2';
          const hasNoFamilyHistory = familyHistory.length === 0;

          return (
            <div key={item.id} className="bg-white border border-sand-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    {isScreening && hasNoFamilyHistory && (
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100"
                        title="Family history can inform screening conversations with your doctor"
                      >
                        <Info className="w-3 h-3 text-amber-600" />
                        History needed to personalize
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  {item.source && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
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
          );
        })}
      </div>
    </div>
  );
}
