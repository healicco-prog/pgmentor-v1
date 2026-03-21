import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users, Search, Share2, Trophy, ChevronDown, ChevronRight,
  Award, UserPlus, CreditCard, RefreshCw, TrendingUp, Star
} from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Partner {
  user_id: string;
  full_name: string;
  email: string;
  referral_code: string;
  profession: string;
  created_at: string;
  total_referred: number;
  total_subscribed: number;
}

interface ReferralDetail {
  id: string;
  referred_user_id: string;
  referred_user_name: string;
  referred_user_email: string;
  status: string;
  subscription_plan: string;
  created_at: string;
  subscribed_at: string;
}

interface Summary {
  total_partners: number;
  total_referred: number;
  total_subscribed: number;
  total_rewards_granted: number;
}

export const AffiliatePartnerPanel: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_partners: 0, total_referred: 0, total_subscribed: 0, total_rewards_granted: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [partnerReferrals, setPartnerReferrals] = useState<Record<string, ReferralDetail[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partnersRes, summaryRes] = await Promise.all([
        fetch('/api/admin/referral/all-partners'),
        fetch('/api/admin/referral/summary')
      ]);
      const partnersData = await partnersRes.json();
      const summaryData = await summaryRes.json();
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setFilteredPartners(Array.isArray(partnersData) ? partnersData : []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch affiliate data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPartners(partners);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredPartners(partners.filter(p =>
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.referral_code?.toLowerCase().includes(q)
    ));
  }, [searchQuery, partners]);

  const togglePartnerDetails = async (userId: string) => {
    if (expandedPartner === userId) {
      setExpandedPartner(null);
      return;
    }
    setExpandedPartner(userId);
    if (!partnerReferrals[userId]) {
      try {
        const res = await fetch(`/api/admin/referral/user/${userId}`);
        const data = await res.json();
        setPartnerReferrals(prev => ({ ...prev, [userId]: Array.isArray(data) ? data : [] }));
      } catch (err) {
        console.error('Failed to fetch partner referrals:', err);
      }
    }
  };

  const statCards = [
    { label: 'Total Partners', value: summary.total_partners, icon: <Users size={22} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Referred', value: summary.total_referred, icon: <UserPlus size={22} />, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Paid Subscribers', value: summary.total_subscribed, icon: <CreditCard size={22} />, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Rewards Granted', value: summary.total_rewards_granted, icon: <Award size={22} />, color: '#f59e0b', bg: '#fffbeb' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Affiliate Partners</h1>
          <p className="text-[14px] text-slate-500 mt-1">Track referral performance and manage affiliate rewards.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all shadow-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-[32px] font-black text-slate-900 leading-tight">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or referral code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span className="ml-3 text-slate-500 font-medium">Loading affiliate data...</span>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Share2 size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">No Affiliate Partners Yet</h3>
            <p className="text-sm text-slate-400 mt-1">Partners will appear here when users start sharing their referral links.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_120px_120px_120px_100px] gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>#</span>
              <span>Partner</span>
              <span className="text-center">Referral Code</span>
              <span className="text-center">Users Joined</span>
              <span className="text-center">Subscribed</span>
              <span className="text-center">Conversion</span>
            </div>

            {/* Rows */}
            {filteredPartners.map((partner, idx) => {
              const isExpanded = expandedPartner === partner.user_id;
              const referrals = partnerReferrals[partner.user_id] || [];
              const conversionRate = partner.total_referred > 0 
                ? ((partner.total_subscribed / partner.total_referred) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={partner.user_id}>
                  <div
                    className={`grid grid-cols-[40px_1fr_120px_120px_120px_100px] gap-4 items-center px-6 py-4 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-blue-50 border-b border-blue-100' : 'hover:bg-slate-50 border-b border-slate-100'
                    }`}
                    onClick={() => togglePartnerDetails(partner.user_id)}
                  >
                    <span className="text-[13px] font-bold text-slate-400">{idx + 1}</span>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                        {partner.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[14px] text-slate-900 truncate">{partner.full_name || 'Unknown'}</div>
                        <div className="text-[12px] text-slate-400 truncate">{partner.email}</div>
                      </div>
                      {partner.total_subscribed >= 100 && (
                        <Star size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <div className="text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold tracking-wider">
                        {partner.referral_code}
                      </span>
                    </div>
                    <div className="text-center text-[16px] font-bold text-emerald-600">{partner.total_referred}</div>
                    <div className="text-center text-[16px] font-bold text-purple-600">{partner.total_subscribed}</div>
                    <div className="text-center flex items-center justify-center gap-1">
                      <span className="text-[14px] font-bold text-slate-700">{conversionRate}%</span>
                      {isExpanded ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="bg-blue-50/50 px-6 py-4 border-b border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-slate-600">
                        <TrendingUp size={14} /> Referred Users ({referrals.length})
                      </div>
                      {referrals.length === 0 ? (
                        <p className="text-[13px] text-slate-400 italic">No detailed referral data available yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {referrals.map(ref => (
                            <div key={ref.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[11px] font-bold">
                                  {ref.referred_user_name?.charAt(0)?.toUpperCase() || ref.referred_user_email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div className="text-[13px] font-bold text-slate-800">{ref.referred_user_name || 'Unknown'}</div>
                                  <div className="text-[11px] text-slate-400">{ref.referred_user_email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                  ref.status === 'subscribed' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {ref.status === 'subscribed' ? `Subscribed (${ref.subscription_plan})` : 'Signed Up'}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(ref.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Reward Tiers Info */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-amber-600" />
          <h3 className="font-bold text-amber-900 text-[15px]">Referral Reward Tiers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-amber-500" />
              <span className="font-bold text-slate-800 text-[14px]">100 Paid Subscribers</span>
            </div>
            <p className="text-[13px] text-slate-500">Referrer gets <strong className="text-emerald-600">FREE Premium for 1 Month</strong></p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              <span className="font-bold text-slate-800 text-[14px]">1,000 Paid Subscribers</span>
            </div>
            <p className="text-[13px] text-slate-500">Referrer gets <strong className="text-emerald-600">FREE Premium for 1 Year</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};
