import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Clock, FileText, CheckCircle, 
  UploadCloud, Search, CheckSquare, Settings,
  ChevronDown, ChevronUp, MessageCircle, Sparkles
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState('1-50');
  const [service, setService] = useState('Ai Report');
  const [faqOpen, setFaqOpen] = useState(null);

  const pricingMap = {
    '1-50': 149,
    '51-100': 199,
    '101-150': 249,
    '151-200': 349,
    '201-250': 399,
    '251-300': 449
  };

  const faqs = [
    { q: "How quickly will I receive the report?", a: "Most reports are generated and delivered within 30 minutes of successful submission." },
    { q: "Will my document be stored in any repository?", a: "No! We have a strict zero-repository policy. Your document is processed securely in-memory and deleted immediately after the report is generated." },
    { q: "Which file formats are supported?", a: "We currently support PDF, DOC, DOCX, and TXT files up to 50MB." },
    { q: "Do you provide plagiarism reduction support?", a: "Yes, our advanced AI Humanizer can automatically rewrite plagiarized and AI-detected content to ensure 100% originality while maintaining academic tone." }
  ];

  const handleStartCheck = () => {
    navigate('/app');
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#0a0f1c]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.scrollTo(0,0)}
          >
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
              OriginalInk
            </span>
          </motion.div>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartCheck}
            className="bg-white text-indigo-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            Start Check
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 relative">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/30 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/30 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="space-y-8"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 text-pink-400" />
              No repository submission to protect originality
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">
              Get Your Plagiarism Report in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">30 Mins</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
              Upload your file and receive a complete similarity analysis designed for students, researchers, and professionals. Built for speed, privacy, and easy decision-making.
            </motion.p>
            
            <motion.ul variants={fadeUp} className="space-y-4 text-slate-300 font-medium">
              {[
                "Fast report delivery in 30 minutes",
                "One-time fee, no login complexity",
                "AI Detection & Reduction features included"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-1 rounded-full">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  {item}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Upload Form Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
            className="bg-[#111827]/80 backdrop-blur-2xl border border-white/10 p-8 lg:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <h3 className="text-2xl font-bold mb-6 text-white">Upload Your Document</h3>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Choose Service*</label>
                <div className="relative">
                  <select 
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full appearance-none bg-[#1f2937]/80 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  >
                    <option>Plagiarism & AI Report</option>
                    <option>AI Content Reduction</option>
                    <option>Citation Verification</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Upload File*</label>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartCheck}
                  className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-8 text-center cursor-pointer transition-all"
                >
                  <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Click to upload your document</p>
                  <p className="text-slate-400 text-sm mt-1 font-medium">PDF, DOC, DOCX supported (Max 50MB)</p>
                </motion.div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Email ID*</label>
                <input 
                  type="email" 
                  placeholder="Receive report on this email"
                  className="w-full bg-[#1f2937]/80 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-500"
                />
              </div>

              <div className="pt-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartCheck}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all text-lg tracking-wide"
                >
                  Submit Document
                </motion.button>
                <p className="text-center text-slate-500 text-xs mt-4 font-medium">
                  By submitting, I have read the Privacy Policy and agree to the terms.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#05080f] relative overflow-hidden">
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight">Why Plagiarism Check?</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Even accidental plagiarism can affect grades, publication acceptance, and reputation. A reliable report helps you revise confidently before final submission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "100% Confidential", desc: "Your document is handled securely in-memory and deleted immediately after delivery. No repository submission." },
              { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", title: "Fast Delivery", desc: "Most reports are generated and shared quickly within 30 minutes, perfect for urgent last-minute submissions." },
              { icon: Search, color: "text-purple-400", bg: "bg-purple-500/10", title: "Detailed Analysis", desc: "Get highlighted similarity sources, AI content percentages, and actionable AI-powered improvement insights." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white/[0.03] backdrop-blur-sm p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section id="how-it-works" className="py-24 bg-[#0a0f1c] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight">Easiest 4-Step Process</h2>
            <p className="text-slate-400 text-lg font-medium">Fast, straightforward, and designed to save your time.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
            
            {[
              { num: '01', title: 'Upload Document', desc: 'Share your file in PDF, DOC, or DOCX format using the quick upload form.' },
              { num: '02', title: 'We Run the Check', desc: 'Your file is scanned securely without saving it in repository databases.' },
              { num: '03', title: 'Get Detailed Report', desc: 'Receive highlighted similarity sources and clean actionable insights.' },
              { num: '04', title: 'Submit with Confidence', desc: 'Use the AI Reducer to revise where needed and submit original work.' }
            ].map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative group pt-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#0a0f1c] border-2 border-indigo-500/30 flex items-center justify-center text-2xl font-black text-indigo-400 mb-6 relative z-10 group-hover:border-indigo-400 group-hover:bg-indigo-500/10 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  {step.num}
                </div>
                <h4 className="text-xl font-bold mb-3 text-white tracking-tight">{step.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Calculator Section */}
      <section id="pricing" className="py-24 bg-[#05080f] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 text-white tracking-tight">Transparent Pricing</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
              Instantly estimate your plagiarism checking cost with complete pricing transparency, secure processing, and no hidden charges.
            </p>
            <ul className="space-y-5 text-slate-300 font-semibold">
              {[
                "AI-powered plagiarism detection",
                "100% secure document handling",
                "Fast report generation"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-16 flex gap-12">
              <div>
                <p className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">25K+</p>
                <p className="text-slate-400 text-sm font-semibold mt-2 tracking-wide uppercase">Reports Generated</p>
              </div>
              <div>
                <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">99%</p>
                <p className="text-slate-400 text-sm font-semibold mt-2 tracking-wide uppercase">Confidential</p>
              </div>
            </div>
          </div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Settings className="w-6 h-6 text-indigo-400 animate-spin-slow" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Pricing Estimator</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-3">Select Service</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-[#1f2937]/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all font-medium">
                    <option>Plagiarism & AI Report</option>
                    <option>AI Reduction Suite</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-3">Page Range</label>
                <div className="relative">
                  <select 
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="w-full appearance-none bg-[#1f2937]/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500 transition-all font-medium"
                  >
                    {Object.keys(pricingMap).map(range => (
                      <option key={range} value={range}>{range} Pages</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-sm mb-2 font-semibold uppercase tracking-wider">Estimated Cost</p>
                  <motion.p 
                    key={pages}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-black text-white"
                  >
                    ₹{pricingMap[pages]}.00
                  </motion.p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartCheck}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] tracking-wide"
                >
                  Start Check
                </motion.button>
              </div>
              <p className="text-slate-500 text-xs text-center font-medium">
                Final pricing depends on selected service type and total document pages analyzed.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#0a0f1c]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-white tracking-tight">Got Questions?</h2>
            <p className="text-slate-400 text-lg font-medium">Clear answers to common concerns around report delivery, confidentiality, and support.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx} 
                className={`border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all ${faqOpen === idx ? 'bg-white/[0.05] border-white/20' : 'bg-[#111827]/50 hover:bg-white/[0.03]'}`}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="p-6 flex justify-between items-center">
                  <h4 className="font-bold text-lg text-white">{faq.q}</h4>
                  {faqOpen === idx ? <ChevronUp className="w-5 h-5 text-indigo-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />}
                </div>
                <AnimatePresence>
                  {faqOpen === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-slate-400 font-medium"
                    >
                      <div className="pt-2 border-t border-white/5">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#03050a] border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-bold text-white tracking-tight">OriginalInk</span>
          </div>
          <p className="text-slate-500 text-sm font-medium text-center md:text-left">
            © 2026 OriginalInk. All rights reserved. | Built for Academic Excellence
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        href="https://wa.me/1234567890" 
        target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 bg-emerald-500 text-white p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center z-50 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-white text-emerald-950 font-bold text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
          Chat on WhatsApp
        </span>
      </motion.a>

    </div>
  );
};

export default LandingPage;
