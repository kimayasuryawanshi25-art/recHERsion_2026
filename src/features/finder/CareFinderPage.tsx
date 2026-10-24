import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Search,
  AlertOctagon,
  MessageSquare,
  Building2,
  Clock,
  ArrowRight,
  Shield,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  VERIFIED_PROVIDERS,
  VERIFIED_HELPLINES,
  type CareProvider,
  type Helpline,
} from '@rechersion/shared';
import { api } from '../../lib/api';
import { getProfileSection } from '../../lib/db';

export function CareFinderPage() {
  const [activeTab, setActiveTab] = useState<'providers' | 'helplines'>('providers');
  const [providers, setProviders] = useState<CareProvider[]>(VERIFIED_PROVIDERS);
  const [helplines] = useState<Helpline[]>(VERIFIED_HELPLINES);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCost, setSelectedCost] = useState<string>('');
  const [genderAffirmingOnly, setGenderAffirmingOnly] = useState<boolean>(false);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Emergency contact from profile
  const [emergencyContact, setEmergencyContact] = useState<{ name?: string; phone?: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const basicsSec = await getProfileSection('basics');
        if (basicsSec && basicsSec.data) {
          setEmergencyContact({
            name: basicsSec.data.emergencyContactName,
            phone: basicsSec.data.emergencyContactPhone,
          });
        }
      } catch (err) {
        console.error('Failed to load emergency contact:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.finder.providers({
          type: selectedType || undefined,
          costModel: selectedCost || undefined,
          genderAffirming: genderAffirmingOnly ? true : undefined,
          accessibility: selectedAccessibility || undefined,
          search: searchQuery || undefined,
        });
        if (res && res.providers) {
          setProviders(res.providers);
        }
      } catch {
        // Local offline filter fallback
        let p = [...VERIFIED_PROVIDERS];
        if (selectedType) p = p.filter(item => item.type === selectedType);
        if (selectedCost) p = p.filter(item => item.costModel === selectedCost);
        if (genderAffirmingOnly) p = p.filter(item => item.genderAffirming);
        if (selectedAccessibility) p = p.filter(item => item.accessibility.includes(selectedAccessibility));
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          p = p.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.suburb.toLowerCase().includes(q) ||
            item.address.toLowerCase().includes(q)
          );
        }
        setProviders(p);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedType, selectedCost, genderAffirmingOnly, selectedAccessibility, searchQuery]);

  const alertMessage = useMemo(() => {
    const contactName = emergencyContact?.name || 'there';
    return `Hi ${contactName}, I am using my health organizer app and wanted to let you know I may need some support right now. Could you check in on me?`;
  }, [emergencyContact]);

  const handleSendAlert = () => {
    if (!emergencyContact?.phone) return;
    const cleanPhone = emergencyContact.phone.replace(/[^0-9+]/g, '');
    const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(alertMessage)}`;
    window.location.href = smsUri;
    setShowConfirmModal(false);
  };

  const getCostLabel = (cost: string) => {
    switch (cost) {
      case 'bulk_billing':
        return 'Public / Ayushman Bharat (No Gap)';
      case 'free_public':
        return 'Free Public Hospital / Casualty';
      case 'mixed_billing':
        return 'Standard Consultation Fee';
      case 'private':
        return 'Private Clinic Fee';
      default:
        return cost;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'hospital_ed':
        return 'Emergency / Casualty (24/7)';
      case 'urgent_care':
        return 'Urban Primary Health Centre (UPHC)';
      case 'womens_health_clinic':
        return 'Women’s Hospital & Maternity';
      case 'sexual_health_clinic':
        return 'Family Planning & Reproductive Health';
      case 'gp':
        return 'General Practice & Clinic';
      case 'maternity_service':
        return 'Maternity & Early Pregnancy Service';
      case 'pharmacy':
        return 'Community Pharmacy';
      default:
        return type;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Care Finder & Support Directory"
        description="Verified local care providers, urgent clinics, and Indian emergency crisis helplines (Demonstration Purpose)."
      />

      {/* Demo Purpose Notice Banner */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm flex items-start gap-3">
        <span className="text-base shrink-0">ℹ️</span>
        <div className="leading-relaxed">
          <span className="font-bold">Demonstration Purpose Notice: </span>
          The emergency numbers and healthcare clinics displayed below represent official Indian emergency services (National Emergency 112, Women in Distress Helpline 181, Tele-MANAS 14416) and public hospitals for demonstration and evaluation purposes during the hackathon. In an actual medical emergency, dial 112 immediately or visit your nearest emergency casualty department.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-sand-200/70 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('providers')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
            activeTab === 'providers'
              ? 'bg-white text-[#5B4B8A] shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Building2 className="inline-block mr-1.5 h-4 w-4" />
          Local Care Providers ({providers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('helplines')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
            activeTab === 'helplines'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Phone className="inline-block mr-1.5 h-4 w-4 text-rose-600" />
          Emergency & Helplines ({helplines.length})
        </button>
      </div>

      {activeTab === 'providers' ? (
        /* Providers View */
        <div className="space-y-6">
          {/* Filters Card */}
          <div className="rounded-3xl border border-sand-200 bg-white/80 p-5 shadow-sm backdrop-blur-md">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700">Search Clinic or Suburb</label>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="e.g. Women’s Hospital, Ashfield, Marrickville..."
                    className="w-full rounded-xl border border-sand-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-stone-700">Service Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
                >
                  <option value="">All Services</option>
                  <option value="hospital_ed">Emergency Department</option>
                  <option value="urgent_care">Medicare Urgent Care</option>
                  <option value="womens_health_clinic">Women’s Health Clinic</option>
                  <option value="sexual_health_clinic">Sexual Health Clinic</option>
                  <option value="gp">General Practice</option>
                </select>
              </div>

              {/* Cost Filter */}
              <div>
                <label className="block text-xs font-semibold text-stone-700">Billing Model</label>
                <select
                  value={selectedCost}
                  onChange={e => setSelectedCost(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-[#9B72CF] focus:outline-none"
                >
                  <option value="">Any Cost Model</option>
                  <option value="bulk_billing">Bulk-Billing (No Gap)</option>
                  <option value="free_public">Free Public Hospital</option>
                  <option value="mixed_billing">Mixed Billing</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 pt-3 border-t border-sand-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={genderAffirmingOnly}
                  onChange={e => setGenderAffirmingOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
                />
                <span>Gender-affirming care confirmed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={selectedAccessibility === 'wheelchair_accessible'}
                  onChange={e => setSelectedAccessibility(e.target.checked ? 'wheelchair_accessible' : '')}
                  className="h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
                />
                <span>Wheelchair accessible</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={selectedAccessibility === 'female_practitioner_available'}
                  onChange={e => setSelectedAccessibility(e.target.checked ? 'female_practitioner_available' : '')}
                  className="h-4 w-4 rounded border-sand-300 text-[#5B4B8A] focus:ring-[#9B72CF]"
                />
                <span>Female practitioner available</span>
              </label>

              {(selectedType || selectedCost || genderAffirmingOnly || selectedAccessibility || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('');
                    setSelectedCost('');
                    setGenderAffirmingOnly(false);
                    setSelectedAccessibility('');
                    setSearchQuery('');
                  }}
                  className="ml-auto text-[#5B4B8A] font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Providers List */}
          {loading ? (
            <div className="rounded-3xl border border-sand-200 bg-white/60 p-8 text-center text-xs text-stone-500">
              Searching verified clinic registry...
            </div>
          ) : providers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-sand-300 p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-stone-400" />
              <p className="mt-2 text-sm font-semibold text-stone-700">No clinics matched your filters.</p>
              <p className="mt-1 text-xs text-stone-500">Try broadening your search or clearing specific filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map(p => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-3xl border border-sand-200 bg-white/85 p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block rounded-lg bg-[#EDE7F6] px-2.5 py-1 text-[11px] font-bold text-[#5B4B8A]">
                        {getTypeLabel(p.type)}
                      </span>
                      <span className="inline-block rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                        {getCostLabel(p.costModel)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-stone-900">{p.name}</h3>

                    <div className="mt-2 space-y-1 text-xs text-stone-600">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{p.address}, {p.suburb} {p.state} {p.postcode}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span>{p.hours}</span>
                      </p>
                      <p className="flex items-center gap-1.5 font-medium text-stone-800">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[#5B4B8A]" />
                        <a href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline">
                          {p.phone}
                        </a>
                      </p>
                    </div>

                    {/* Accessibility tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.genderAffirming && (
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                          Gender-Affirming
                        </span>
                      )}
                      {p.accessibility.map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] text-stone-600 capitalize"
                        >
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-sand-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1 text-teal-700 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                      <span>Verified: {p.verifiedOn}</span>
                      <a
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-400 hover:text-stone-600 ml-1"
                        title="View official registry source"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <Link
                      to="/consultation"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4B8A] hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Prep visit notes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Emergency & Helplines View */
        <div className="space-y-6">
          {/* National Emergency Banner */}
          <div className="rounded-3xl border border-rose-300 bg-rose-50/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-rose-600 p-3 text-white shadow-md">
                  <AlertOctagon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-rose-950">National Emergency Services (India)</h3>
                    <span className="rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-900 uppercase">
                      Demo Purpose
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-rose-800 leading-relaxed max-w-xl">
                    For life-threatening emergencies, acute shortness of breath, severe uncontrolled bleeding, trauma, or women in distress, call 112 (National Emergency Helpline) or 181 across India (Demo Purpose).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition hover:bg-rose-800"
                >
                  <Phone className="h-4 w-4" />
                  Call 112 Now
                </a>
                <a
                  href="tel:181"
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-100 border border-rose-300 px-4 py-3 text-sm font-bold text-rose-900 transition hover:bg-rose-200"
                >
                  <Phone className="h-4 w-4 text-rose-700" />
                  Call 181 (Women Helpline)
                </a>
              </div>
            </div>
          </div>

          {/* Trusted Contact Quick-Alert */}
          <div className="rounded-3xl border border-sand-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-plum-100 p-3 text-[#5B4B8A]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Trusted Contact Quick-Alert</h3>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed max-w-xl">
                    Pre-drafts a discreet, non-alarmist message on your phone asking your trusted support person to check in with you.
                  </p>
                  {emergencyContact?.name ? (
                    <p className="mt-2 text-xs font-semibold text-[#5B4B8A]">
                      Saved Contact: {emergencyContact.name} ({emergencyContact.phone || 'No phone set'})
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-amber-700">
                      No emergency contact saved yet. You can add one anytime in{' '}
                      <Link to="/profile" className="font-bold underline">
                        About Me
                      </Link>.
                    </p>
                  )}
                </div>
              </div>

              {emergencyContact?.phone ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#5B4B8A] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/10 transition hover:bg-[#493B72] shrink-0"
                >
                  <MessageSquare className="h-4 w-4" />
                  Alert {emergencyContact.name || 'Contact'}
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-sand-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-sand-50 shrink-0"
                >
                  Set up in About Me
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Verified Crisis & Support Helplines */}
          <div>
            <h3 className="text-base font-bold text-stone-900 mb-3">Verified Specialized & Crisis Helplines</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {helplines.map(h => (
                <div
                  key={h.id}
                  className="flex flex-col justify-between rounded-3xl border border-sand-200 bg-white/85 p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg bg-sand-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 capitalize">
                        {h.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-medium text-stone-500">
                        {h.hours}
                      </span>
                    </div>

                    <h4 className="mt-2.5 text-base font-bold text-stone-900">{h.name}</h4>
                    <p className="mt-1 text-xs text-stone-600 leading-relaxed">{h.description}</p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sand-100 px-3.5 py-2 text-xs font-bold text-stone-900 hover:bg-sand-200 transition"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#5B4B8A]" />
                        {h.phone}
                      </a>

                      {h.chatUrl && (
                        <a
                          href={h.chatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-[#5B4B8A] hover:bg-violet-100 transition"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Online Chat
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sand-100 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1 text-teal-700 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                        Verified: {h.verifiedOn}
                      </span>
                      <a
                        href={h.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-0.5"
                      >
                        Source Registry <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Double Confirmation Modal for Trusted Contact Alert */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-2.5 text-[#5B4B8A]">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Confirm Message to {emergencyContact?.name || 'Contact'}
              </h3>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-stone-600">
              HerHealth Companion never sends messages automatically. Confirming below will open your device’s native SMS app with the following draft:
            </p>

            <div className="mt-3 rounded-2xl bg-sand-50 border border-sand-200 p-3.5 text-xs text-stone-800 italic">
              "{alertMessage}"
            </div>

            <p className="mt-3 text-[11px] text-stone-400">
              Target Phone: <strong>{emergencyContact?.phone}</strong>
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-sand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAlert}
                className="rounded-xl bg-[#5B4B8A] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#493B72]"
              >
                Open SMS App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
