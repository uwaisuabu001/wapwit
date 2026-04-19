import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Camera, MapPin, ShoppingBag, Send, Menu, X, 
  Instagram, ChevronRight, Search, Filter, Plus, 
  CheckCircle2, AlertCircle, Loader2, Sparkles, Paintbrush, Scissors, Briefcase, Clock, Globe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, serverTimestamp, doc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';

// --- CONFIGURATIONS & DATA ---

const TURKISH_CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].sort();

const ISTANBUL_DISTRICTS = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"
].sort();

const HOME_TABS = ["all", "Nişantaşı", "Kadıköy", "Beşiktaş", "Beyoğlu", "Ankara", "İzmir", "Antalya", "Bodrum"];

const TRANSLATIONS = {
  en: {
    feed: "Feed",
    services: "Services",
    addFit: "Add Fit",
    shop: "Shop",
    heroTitle: "Turkey",
    heroSubtitle: "Street Style",
    all: "all",
    startTrend: "The feed is empty. Start the trend.",
    uploadFirst: "Upload First Fit",
    beyondLens: "Beyond The Lens.",
    agencyDesc: "Wapwit Agency helps global and local brands translate the soul of Istanbul into visual narratives. From street-casting to art direction, we bridge the gap between culture and commerce.",
    workWithUs: "Work with us",
    artDirection: "Art Direction",
    artDesc: "Full conceptualization for lookbooks, social campaigns, and brand storytelling with an Istanbul street edge.",
    styling: "Styling",
    stylingDesc: "Curation of authentic looks blending high fashion with Istanbul's unique micro-trends and thrift culture.",
    production: "Production",
    prodDesc: "Street-casting, location scouting in hidden urban gems, and high-end street style photography.",
    letsCreate: "Let's Create.",
    buildingAesthetic: "Building The Istanbul Aesthetic",
    partnerName: "Partner Name",
    emailSecure: "Email Secure",
    serviceStream: "Service Stream",
    vision: "The Vision",
    submitBrief: "Submit Brief",
    sending: "Transmitting...",
    sent: "Vision Shared",
    insider: "Wapwit Insider",
    insiderDesc: "The rhythm of the streets, every Monday.",
    join: "Join",
    comingSoon: "Wapwit Shop: Coming Soon",
    publishLook: "Publish New Look",
    imageLink: "Image Link",
    location: "Location",
    creator: "Creator",
    tags: "Tags",
    pushToFeed: "Push to Feed",
    theLook: "The Look",
    theStyle: "The Style",
    photographedBy: "Photographed by",
    visionBy: "Vision by",
    styleQuote: "Style is an evolution, not a destination. Fashion is written in the movement of the streets."
  },
  tr: {
    feed: "keşfet",
    services: "Hizmetler",
    addFit: "Kombin Ekle",
    shop: "Mağaza",
    heroTitle: "Türkiye",
    heroSubtitle: "Sokak Stili",
    all: "hepsi",
    startTrend: "henüz boş. Akımı sen başlat.",
    uploadFirst: "İlk Kombini Yükle",
    beyondLens: "Lensin Ötesinde.",
    agencyDesc: "Wapwit Agency, küresel ve yerel markaların İstanbul'un ruhunu görsel anlatılara dönüştürmesine yardımcı olur. Sokak dökümünden sanat yönetimine kadar, kültür ve ticaret arasındaki köprüyü kuruyoruz.",
    workWithUs: "Bizimle Çalışın",
    artDirection: "art Direction",
    artDesc: "Lookbook'lar, sosyal kampanyalar ve İstanbul sokak kenarı ile marka hikayesi anlatımı için tam kavramsallaştırma.",
    styling: "Stil Danışmanlığı",
    stylingDesc: "Yüksek modayı İstanbul'un benzersiz mikro trendleri ve vintage kültürüyle harmanlayan otantik görünümlerin kürasyonu.",
    production: "Prodüksiyon",
    prodDesc: "Sokak oyuncu seçimi, gizli kentsel mücevherlerde mekan keşfi ve üst düzey sokak stili fotoğrafçılığı.",
    letsCreate: "Birlikte Yaratalım.",
    buildingAesthetic: "İstanbul Estetiğini İnşa Ediyoruz",
    partnerName: "Marka Adı",
    emailSecure: "E-posta",
    serviceStream: "Hizmet Türü",
    vision: "Vizyonunuz",
    submitBrief: "Brief Gönder",
    sending: "İletiliyor...",
    sent: "Vizyon Paylaşıldı",
    insider: "Wapwit Insider",
    insiderDesc: "Sokakların ritmi her Pazartesi kapınızda.",
    join: "Katıl",
    comingSoon: "Wapwit Mağaza: Çok Yakında",
    publishLook: "Yeni Görünüm Yayınla",
    imageLink: "Görsel Linki",
    location: "Konum",
    creator: "Yaratıcı",
    tags: "Etiketler",
    pushToFeed: "Akışa Gönder",
    theLook: "Görünüm",
    theStyle: "Stil",
    photographedBy: "Fotoğraflayan",
    visionBy: "Vizyon",
    styleQuote: "Stil bir varış noktası değil, bir evrimdir. Moda, sokakların hareketinde yazılır."
  }
};

// --- FIREBASE INITIALIZATION ---

const firebaseConfig = {
  apiKey: "AIzaSyB8_l47sZV-cjI7LlO3HjOpezaIeBz4Yzc",
  authDomain: "wapwit-bd382.firebaseapp.com",
  projectId: "wapwit-bd382",
  storageBucket: "wapwit-bd382.firebasestorage.app",
  messagingSenderId: "389516403411",
  appId: "1:389516403411:web:fb7905cfc9762c8cd42a26",
  measurementId: "G-5TPZBV8HY8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Rule 1: CRITICAL - Sanitized appId to prevent path errors
const appId = 'wapwit-app';

export default function App() {
  const [lang, setLang] = useState('tr');
  const t = useMemo(() => TRANSLATIONS[lang], [lang]);
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [currentView, setCurrentView] = useState('feed'); 
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  const formRef = useRef(null);
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState('idle');
  const [inquiryStatus, setInquiryStatus] = useState('idle');
  
  const [newPost, setNewPost] = useState({
    location: 'Nişantaşı', category: 'Casual', img: '', author: '', tags: '',
    items: [{ name: '', brand: '', price: '' }]
  });

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  const triggerComingSoon = () => {
    setShowComingSoon(true);
    setIsMenuOpen(false); 
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  // Rule 3: Auth implementation
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth initialization failed", err.message);
        // Fallback placeholder user to prevent app crash if provider not enabled
        setUser({ uid: 'guest-preview' });
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    const postsCol = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
    const unsubscribe = onSnapshot(query(postsCol), (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Firestore Error", err));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !user) return;
    setSubStatus('loading');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'subscribers'), {
        email, timestamp: serverTimestamp()
      });
      setSubStatus('success');
      setEmail('');
      setTimeout(() => setSubStatus('idle'), 3000);
    } catch (err) { setSubStatus('error'); }
  };

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!user) return;
    setInquiryStatus('loading');
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'brand_inquiries'), {
        ...data, timestamp: serverTimestamp()
      });
      setInquiryStatus('success');
      e.target.reset();
      setTimeout(() => setInquiryStatus('idle'), 4000);
    } catch (err) { setInquiryStatus('error'); }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const postToSave = { 
        ...newPost, 
        tags: String(newPost.tags).split(',').map(tag => tag.trim()), 
        timestamp: serverTimestamp() 
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), postToSave);
      setShowAdmin(false);
      setNewPost({ location: 'Nişantaşı', category: 'Casual', img: '', author: '', tags: '', items: [{ name: '', brand: '', price: '' }] });
    } catch (err) { console.error(err); }
  };

  const filteredPosts = useMemo(() => {
    return activeTab === 'all' 
      ? posts 
      : posts.filter(post => String(post.location || '').toLowerCase() === activeTab.toLowerCase());
  }, [posts, activeTab]);

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-yellow-400 selection:text-black antialiased">
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .noir-grad { background: linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,1) 100%); }
        .hero-title { font-size: clamp(3rem, 15vw, 10rem); line-height: 0.8; }
      `}</style>

      {/* LANGUAGE TOGGLE */}
      <div className="fixed bottom-6 right-6 z-[150] bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-full flex gap-1 shadow-2xl">
        <button onClick={() => setLang('tr')} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'tr' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>tr</button>
        <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>eng</button>
      </div>

      {showComingSoon && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className="bg-white text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Clock size={18} className="text-neutral-500" />
            <span className="font-bold uppercase tracking-widest text-[10px]">{t.comingSoon}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('feed')}>
            <div className="bg-white text-black p-1 rounded-sm"><Camera size={20} /></div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">Wapwit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
            <button onClick={() => setCurrentView('feed')} className={`transition-colors ${currentView === 'feed' ? 'text-white border-b-2 border-white pb-1' : 'text-neutral-500 hover:text-white'}`}>{t.feed}</button>
            <button onClick={() => setCurrentView('services')} className={`transition-colors ${currentView === 'services' ? 'text-white border-b-2 border-white pb-1' : 'text-neutral-500 hover:text-white'}`}>{t.services}</button>
            <button onClick={() => setShowAdmin(!showAdmin)} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors"><Plus size={16} /> {t.addFit}</button>
            <button onClick={triggerComingSoon} className="bg-white text-black px-6 py-2 rounded-full hover:bg-neutral-200 transition-all shadow-lg active:scale-95">{t.shop}</button>
          </div>
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'feed' ? (
        <>
          <header className="pt-40 pb-20 px-4 bg-neutral-950 text-center text-white">
            <h1 className="hero-title font-black mb-8 tracking-tighter uppercase italic">
              {String(t.heroTitle)} <br /> {String(t.heroSubtitle)}
            </h1>
            <div className="flex flex-wrap justify-center gap-3 mt-16">
              {HOME_TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white border-white text-black shadow-xl' : 'bg-transparent border-white/10 text-neutral-500 hover:text-white hover:border-white'}`}>
                  {tab === 'all' ? t.all : String(tab)}
                </button>
              ))}
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-20">
            {posts.length === 0 ? (
              <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.02]">
                <p className="text-neutral-600 italic mb-8 uppercase tracking-[0.3em] text-[10px] font-black">{t.startTrend}</p>
                <button onClick={() => setShowAdmin(true)} className="bg-white text-black px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest">{t.uploadFirst}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="group relative bg-neutral-900 overflow-hidden rounded-[3rem] cursor-pointer shadow-2xl" onClick={() => setSelectedImage(post)}>
                    <div className="aspect-[3/4] overflow-hidden">
                      <img src={String(post.img)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" alt="Street Style" />
                    </div>
                    <div className="absolute inset-0 noir-grad opacity-0 group-hover:opacity-100 transition-all duration-500 p-10 flex flex-col justify-end text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{String(post.location || '')}</span>
                      </div>
                      <p className="text-2xl font-black uppercase tracking-tighter italic text-white">{String(post.author || '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        /* Services View */
        <div className="pt-24 min-h-screen bg-neutral-950">
          <section className="max-w-7xl mx-auto px-4 py-24">
            <div className="flex flex-col md:flex-row gap-24 items-center">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-7xl md:text-[9rem] font-black uppercase tracking-tighter mb-10 leading-[0.8] text-white italic">{t.beyondLens}</h1>
                <p className="text-xl text-neutral-500 font-light leading-relaxed mb-12 max-w-xl">{t.agencyDesc}</p>
                <button onClick={scrollToForm} className="bg-white text-black px-14 py-6 rounded-full font-black uppercase text-[10px] tracking-[0.3em] hover:bg-neutral-200 transition-all shadow-2xl">{t.workWithUs}</button>
              </div>
              <div className="md:w-1/2 grid grid-cols-2 gap-8">
                <div className="aspect-[3/4] bg-neutral-900 rounded-[3rem] overflow-hidden mt-20 shadow-2xl border border-white/5">
                  <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
                <div className="aspect-[3/4] bg-neutral-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                  <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-neutral-900/50 py-40 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-20">
              {[
                { title: t.artDirection, desc: t.artDesc, icon: Sparkles },
                { title: t.styling, desc: t.stylingDesc, icon: Scissors },
                { title: t.production, desc: t.prodDesc, icon: Camera }
              ].map((service, idx) => (
                <div key={idx} className="group p-2 text-left">
                  <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mb-10 group-hover:bg-yellow-400 transition-colors">
                    <service.icon size={28} />
                  </div>
                  <h3 className="text-3xl font-black uppercase mb-6 tracking-tighter italic text-white">{service.title}</h3>
                  <p className="text-neutral-500 leading-relaxed text-lg font-light">{service.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section ref={formRef} className="max-w-5xl mx-auto px-4 py-40 text-center text-white">
            <h2 className="text-7xl md:text-8xl font-black uppercase mb-4 tracking-tighter italic leading-none">{t.letsCreate}</h2>
            <p className="text-neutral-600 mb-20 uppercase tracking-[0.4em] text-[10px] font-black">{t.buildingAesthetic}</p>
            <form onSubmit={handleInquiry} className="space-y-10 text-left bg-neutral-900 p-12 md:p-24 rounded-[4rem] border border-white/5 shadow-2xl">
              <div className="grid md:grid-cols-2 gap-10">
                <input required name="brand" type="text" placeholder={t.partnerName} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white transition-colors text-lg" />
                <input required name="email" type="email" placeholder={t.emailSecure} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white transition-colors text-lg" />
              </div>
              <textarea name="message" rows="5" placeholder={t.vision} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white transition-colors text-lg"></textarea>
              <button disabled={inquiryStatus === 'loading'} className="w-full bg-white text-black py-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-neutral-200 transition-all disabled:opacity-50">
                {inquiryStatus === 'loading' ? t.sending : inquiryStatus === 'success' ? t.sent : t.submitBrief}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Admin Post Modal */}
      {showAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-neutral-900 w-full max-w-xl rounded-[2rem] p-10 max-h-[90vh] overflow-y-auto border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase italic text-white">{t.publishLook}</h2>
              <button onClick={() => setShowAdmin(false)} className="bg-white/10 p-2 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddPost} className="space-y-6">
              <input required type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white" value={newPost.img} onChange={e => setNewPost({...newPost, img: e.target.value})} placeholder={t.imageLink} />
              <div className="grid grid-cols-2 gap-6">
                <select className="w-full p-5 bg-neutral-800 border border-white/10 rounded-2xl text-white outline-none" value={newPost.location} onChange={e => setNewPost({...newPost, location: e.target.value})}>
                  <optgroup label="Style Hubs">{HOME_TABS.filter(x => x !== 'all').map(tab => <option key={tab} className="bg-neutral-900">{tab}</option>)}</optgroup>
                  <optgroup label="Districts">{ISTANBUL_DISTRICTS.map(d => <option key={d} className="bg-neutral-900">{d}</option>)}</optgroup>
                  <optgroup label="Cities">{TURKISH_CITIES.map(city => <option key={city} className="bg-neutral-900">{city}</option>)}</optgroup>
                </select>
                <input required type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white" value={newPost.author} onChange={e => setNewPost({...newPost, author: e.target.value})} placeholder={t.creator} />
              </div>
              <input type="text" className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white" value={newPost.tags} onChange={e => setNewPost({...newPost, tags: e.target.value})} placeholder={t.tags} />
              <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm">{t.pushToFeed}</button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-neutral-900 py-40 px-4 border-t border-white/5 text-center">
        <h2 className="text-6xl font-black uppercase mb-6 italic text-white">{t.insider}</h2>
        <p className="text-neutral-500 mb-12 uppercase tracking-[0.2em] text-[10px] font-black">{t.insiderDesc}</p>
        <form onSubmit={handleSubscribe} className="relative max-w-md mx-auto group">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="EMAIL / E-POSTA" className="w-full px-10 py-6 bg-white/5 border border-white/10 rounded-full text-white" />
          <button className="absolute right-2 top-2 bottom-2 bg-white text-black px-10 rounded-full font-black text-[10px] uppercase active:scale-95 transition-transform">{subStatus === 'loading' ? <Loader2 className="animate-spin" /> : t.join}</button>
        </form>
        <div className="mt-32 flex flex-col items-center gap-10">
          <Instagram size={24} className="text-neutral-700 hover:text-white cursor-pointer transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-800 italic">Wapwit Digital © 2024</span>
        </div>
      </footer>

      {/* DETAIL MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-16">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelectedImage(null)} />
          <div className="relative bg-neutral-950 w-full max-w-7xl rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl h-full md:h-[90vh] border border-white/5 animate-in fade-in zoom-in duration-300">
             <button onClick={() => setSelectedImage(null)} className="absolute top-10 right-10 z-20 bg-white text-black p-4 rounded-full hover:scale-110 transition-transform shadow-xl"><X size={24} /></button>
             <div className="md:w-3/5 h-1/2 md:h-full bg-neutral-900">
                <img src={String(selectedImage.img)} className="w-full h-full object-cover opacity-90" alt="Look" />
             </div>
             <div className="md:w-2/5 p-12 md:p-24 flex flex-col justify-between overflow-y-auto bg-neutral-950 text-left">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-neutral-700" />
                    <span className="text-[10px] font-black uppercase text-neutral-700 tracking-[0.4em]">{String(selectedImage.location || '')}</span>
                  </div>
                  <h3 className="text-7xl font-black uppercase tracking-tighter leading-none mb-16 italic text-white">{t.theLook}</h3>
                  <div className="space-y-10 text-white">
                    {(Array.isArray(selectedImage.items) ? selectedImage.items : [{name: "Street Selection", brand: "Authentic Wear"}]).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center pb-6 border-b border-white/5">
                        <div>
                          <p className="font-black uppercase text-sm tracking-widest text-white mb-1">{String(item?.name || "Street Pick")}</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">{String(item?.brand || "Authentic")}</p>
                        </div>
                        <button onClick={triggerComingSoon} className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white transition-colors">{t.shop}</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-20 pt-10 border-t border-white/10 text-white">
                  <p className="text-lg italic text-neutral-600 leading-relaxed mb-12 font-light">"{t.styleQuote}"</p>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-black text-sm font-black italic shadow-lg">WP</div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-700 tracking-[0.3em] mb-1 italic">{t.visionBy}</p>
                      <p className="text-xl font-black uppercase tracking-tighter">{String(selectedImage.author || '')}</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
