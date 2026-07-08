import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { hospitalAPI, inventoryAPI, requestAPI, donorAPI, mockService } from '../../services/api';
import { MapView } from '../../components/MapView';
import { 
  Heart, Search, Hospital, ShieldAlert, Award, 
  MapPin, CheckCircle, ChevronRight, Phone, Mail, HelpCircle 
} from 'lucide-react';

interface LandingPagesProps {
  tab: string;
  setCurrentTab: (tab: string) => void;
}

export const LandingPages: React.FC<LandingPagesProps> = ({ tab, setCurrentTab }) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Shared state
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search tab state
  const [searchBg, setSearchBg] = useState('O-');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  // Donor tab state
  const [donorBg, setDonorBg] = useState('O-');
  const [donorAddress, setDonorAddress] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorLat, setDonorLat] = useState(47.6);
  const [donorLng, setDonorLng] = useState(-122.3);

  // FAQs state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchHospitals();
    fetchFaqs();
  }, []);

  const fetchHospitals = async () => {
    try {
      const data = await hospitalAPI.list();
      setHospitals(data);
    } catch (e) {
      showToast("Failed to fetch hospitals.", "error");
    }
  };

  const fetchFaqs = () => {
    // Standard questions list
    setFaqs([
      { q: "How can I register as a blood donor?", a: "Create a standard account on the portal, click the 'Become a Donor' navigation tab, enter your location and phone details, and register. During emergencies, our coordination agents alert compatible donors in proximity." },
      { q: "What is LifeLink AI?", a: "LifeLink AI is an intelligent Agentic AI blood bank coordination and routing platform connecting hospitals. It coordinates multi-agent systems to automatically locate, verify, score, split, and reserve blood packages during critical patient shortages." },
      { q: "Who is permitted to edit stock logs?", a: "Only verified Hospital Blood Bank Admins can update, add, or clear expired blood units for their own specific hospital bank. Public users have read-only views." },
      { q: "How does the AI allocation split workflow operate?", a: "When a request is submitted, the coordinator agent launches search loops. If the closest hospital cannot fulfill the entire order, the AI splits the allocation list, pulling partial stock from multiple neighboring banks and sending immediate alerts to those admins." }
    ]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const allInventory = await inventoryAPI.list();
      const results = allInventory.filter(
        (item: any) => item.bloodGroup === searchBg && item.status === 'AVAILABLE'
      );
      setSearchResults(results);
      setSearched(true);
    } catch (err) {
      showToast("Search failed. Server connection error.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDonorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in to register as a donor.", "warning");
      setCurrentTab('login');
      return;
    }
    setLoading(true);
    try {
      const donorPayload = {
        bloodGroup: donorBg,
        address: donorAddress,
        latitude: donorLat + (Math.random() - 0.5) * 0.05, // slightly jitter coordinates for security/privacy
        longitude: donorLng + (Math.random() - 0.5) * 0.05,
        contactNumber: donorPhone,
        isAvailable: true
      };
      await donorAPI.register(donorPayload);
      showToast("Successfully registered as a compatible LifeLink Donor!", "success", "Donor Portal");
      setDonorAddress('');
      setDonorPhone('');
    } catch (err) {
      showToast("Donor registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Compile Map Points dynamically
  const mapPoints: Array<{ id: number; name: string; latitude: number; longitude: number; type: 'hospital' | 'donor' | 'requesting'; details?: string }> = hospitals.map(h => ({
    id: h.id,
    name: h.name,
    latitude: h.latitude,
    longitude: h.longitude,
    type: 'hospital',
    details: `${h.address} | Tel: ${h.contactNumber}`
  }));

  // Add backup mock donors if present in search view
  const mockDonors = mockService.donors.list();
  mockDonors.forEach((d: any) => {
    mapPoints.push({
      id: d.id + 100, // separate namespace
      name: `Donor: ${d.name} (${d.bloodGroup})`,
      latitude: d.latitude,
      longitude: d.longitude,
      type: 'donor' as const,
      details: `Contact: ${d.contactNumber}`
    });
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. HOME TAB */}
      {tab === 'home' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Banner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-br from-red-500/10 via-slate-500/5 to-transparent dark:from-red-950/20 rounded-3xl p-8 border border-red-500/10 shadow-lg">
            <div className="lg:col-span-7 text-left space-y-4">
              <span className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-red-500 font-extrabold text-xs tracking-wider px-3.5 py-1.5 rounded-full uppercase inline-flex items-center gap-1.5">
                <ShieldAlert size={12} />
                Emergency Operations Desk
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                Every Drop <span className="text-red-500">Saves a Life</span>
              </h1>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Connect hospital blood banks into a single responsive network. LifeLink AI utilizes a multi-agent coordination architecture to locate stock and optimize logistics during life-saving emergencies.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setCurrentTab('search')}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <Search size={14} />
                  Locate Blood Units
                </button>
                <button
                  onClick={() => setCurrentTab('donor')}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all duration-300"
                >
                  Become a Donor
                </button>
              </div>
            </div>

            {/* Mockup Quote box & UI Graphics from user prompt image */}
            <div className="lg:col-span-5 relative flex flex-col items-center">
              <div className="absolute -z-10 w-48 h-48 bg-red-500/25 blur-[64px] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <div className="glass-card max-w-sm border border-white/20 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 text-red-500 p-2.5 rounded-xl">
                    <Heart size={20} fill="currentColor" className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm dark:text-slate-200">LifeLink AI Coordination</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Coordinator Engine</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 italic font-semibold leading-relaxed text-left">
                  "We make a living by what we get, but we make a life by what we give."
                </p>
                <div className="border-t border-slate-200/50 dark:border-slate-800/40 pt-2 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  <span>– Winston Churchill</span>
                  <Award size={14} className="text-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card text-left space-y-2">
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] tracking-wider uppercase">Connected Hospitals</h4>
              <p className="text-3xl font-extrabold dark:text-white">{hospitals.length || 5}</p>
              <p className="text-xs text-slate-400 font-medium">Active network locations</p>
            </div>
            <div className="glass-card text-left space-y-2">
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] tracking-wider uppercase">Network Stock</h4>
              <p className="text-3xl font-extrabold text-red-500">75+ Units</p>
              <p className="text-xs text-slate-400 font-medium">Unexpired available units</p>
            </div>
            <div className="glass-card text-left space-y-2">
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] tracking-wider uppercase">Emergency Responders</h4>
              <p className="text-3xl font-extrabold text-emerald-500">11 AI Agents</p>
              <p className="text-xs text-slate-400 font-medium">Active routing agents</p>
            </div>
          </div>

          {/* Interactive Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <MapView points={mapPoints} />
            </div>
            <div className="lg:col-span-4 glass-card text-left flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-500" />
                  Network Guidelines
                </h3>
                <ul className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>Emergency blood requests are restricted to medical professionals only.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>Hospitals must verify inventory logs daily to keep coordinates accurate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>Public donors are alerted via SMS/Email during critical matching shortages.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/10 flex items-center gap-3 mt-4">
                <Phone className="text-red-500 animate-bounce" size={18} />
                <div>
                  <h4 className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Emergency Response Helpline</h4>
                  <p className="font-extrabold text-sm dark:text-slate-200">1-800-LIFELINK</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCH TAB */}
      {tab === 'search' && (
        <div className="glass-card text-left max-w-4xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-black text-2xl tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Search className="text-red-500" />
              Search Blood Availability
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Check real-time network stock availability of blood groups across all member hospitals.</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Select Blood Group</label>
              <select
                value={searchBg}
                onChange={(e) => setSearchBg(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="sm:self-end px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Searching..." : "Search Stock"}
            </button>
          </form>

          {searched && (
            <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
              <h3 className="font-bold text-sm dark:text-slate-200">Matching Inventory Segments</h3>
              {searchResults.length === 0 ? (
                <div className="p-8 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl text-center border border-slate-200/20">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">No available matching units found in the network. Emergency coordination requires backup donors.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                      <tr>
                        <th className="p-4">Hospital Name</th>
                        <th className="p-4">Available Units</th>
                        <th className="p-4">Expiry Date</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                      {searchResults.map((item, idx) => {
                        const h = hospitals.find(hp => hp.id === item.hospitalId);
                        return (
                          <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20">
                            <td className="p-4 font-bold">{h?.name || `Hospital ID ${item.hospitalId}`}</td>
                            <td className="p-4 text-red-500">{item.availableUnits} units</td>
                            <td className="p-4 font-medium">{item.expiryDate}</td>
                            <td className="p-4">
                              <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                Available
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. HOSPITALS TAB */}
      {tab === 'hospitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn text-left">
          <div className="lg:col-span-5 space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <h2 className="font-black text-2xl tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Hospital className="text-red-500" />
              Network Hospitals
            </h2>
            <p className="text-xs text-slate-400 font-semibold">List of registered active hospitals connected to the LifeLink AI agent coordinator.</p>
            
            <div className="flex flex-col gap-4">
              {hospitals.map(h => (
                <div key={h.id} className="glass-card hover:border-red-500/30 p-4 border border-slate-200/20 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-xs dark:text-slate-200">{h.name}</h3>
                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                      {h.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                    <MapPin size={12} className="text-red-500" />
                    {h.address}
                  </p>
                  <div className="border-t border-slate-200/40 dark:border-slate-800/30 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><Phone size={10} />{h.contactNumber}</span>
                    <span className="flex items-center gap-1"><Mail size={10} />{h.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7">
            <MapView points={mapPoints} />
          </div>
        </div>
      )}

      {/* 4. DONOR TAB */}
      {tab === 'donor' && (
        <div className="glass-card text-left max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div>
            <h2 className="font-black text-2xl tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <Heart className="text-red-500" fill="currentColor" />
              Register as a LifeLink Donor
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Provide your details to be registered as an emergency donor. You will only be contacted when compatible blood type stocks run critical.</p>
          </div>

          <form onSubmit={handleDonorRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Blood Group</label>
                <select
                  value={donorBg}
                  onChange={(e) => setDonorBg(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="206-555-0100"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Address / Location</label>
              <input
                type="text"
                required
                placeholder="Enter city or district location details"
                value={donorAddress}
                onChange={(e) => setDonorAddress(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Latitude (Jitter Map Coords)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={donorLat}
                  onChange={(e) => setDonorLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">Longitude (Jitter Map Coords)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={donorLng}
                  onChange={(e) => setDonorLng(parseFloat(e.target.value))}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-semibold dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Submit Donor Registration"}
            </button>
          </form>
        </div>
      )}

      {/* 5. FAQ TAB */}
      {tab === 'faq' && (
        <div className="max-w-3xl mx-auto space-y-6 text-left animate-fadeIn">
          <div>
            <h2 className="font-black text-2xl tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <HelpCircle className="text-red-500" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Get answers regarding user roles, AI agents, emergency reserve limits, and stock updates.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const active = expandedFaq === idx;
              return (
                <div key={idx} className="glass-card p-4 border border-slate-200/10">
                  <button
                    onClick={() => setExpandedFaq(active ? null : idx)}
                    className="w-full flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-200"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight size={14} className={`transform transition-transform duration-300 ${active ? 'rotate-90 text-red-500' : 'text-slate-400'}`} />
                  </button>
                  {active && (
                    <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 mt-2.5 pt-2.5 border-t border-slate-200/30 dark:border-slate-800/30">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
