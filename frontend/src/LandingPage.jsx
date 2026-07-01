import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Clock, FileText, CheckCircle, 
  UploadCloud, Search, CheckSquare, Settings,
  ChevronDown, ChevronUp, MessageCircle
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              OriginalInk
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <button 
            onClick={handleStartCheck}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            Start Check
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              No repository submission to protect originality
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
              Get Your Plagiarism Report in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">30 Mins</span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              Upload your file and receive a complete similarity analysis designed for students, researchers, and professionals. Built for speed, privacy, and easy decision-making.
            </p>
            
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> Fast report delivery in 30 minutes</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> One-time fee, no login complexity</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-emerald-500" /> AI Detection & Reduction features included</li>
            </ul>
          </div>

          {/* Upload Form Card */}
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl relative group">
            <div className="absolute inset-0 rounded-3xl border border-blue-500/30 group-hover:border-blue-500/60 transition-colors pointer-events-none"></div>
            <h3 className="text-2xl font-bold mb-6">Upload Your Document</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Choose Service*</label>
                <select 
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 transition-colors"
                >
                  <option>Plagiarism & AI Report</option>
                  <option>AI Content Reduction</option>
                  <option>Citation Verification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Upload File*</label>
                <div 
                  onClick={handleStartCheck}
                  className="border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/50 rounded-xl p-8 text-center cursor-pointer transition-all group-hover:bg-slate-900"
                >
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                  <p className="text-slate-300 font-medium">Click to upload your document</p>
                  <p className="text-slate-500 text-sm mt-1">PDF, DOC, DOCX supported (Max 50MB)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email ID*</label>
                <input 
                  type="email" 
                  placeholder="Receive report on this email"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleStartCheck}
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg"
                >
                  Submit Document
                </button>
                <p className="text-center text-slate-500 text-xs mt-4">
                  By submitting, I have read the Privacy Policy and agree to the terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Why Plagiarism Check?</h2>
            <p className="text-slate-400 text-lg">
              Even accidental plagiarism can affect grades, publication acceptance, and reputation. A reliable report helps you revise confidently before final submission.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-slate-500 transition-colors">
              <ShieldCheck className="w-12 h-12 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">100% Confidential</h3>
              <p className="text-slate-400 leading-relaxed">Your document is handled securely in-memory and deleted immediately after delivery. No repository submission.</p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-slate-500 transition-colors">
              <Clock className="w-12 h-12 text-emerald-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Fast Delivery</h3>
              <p className="text-slate-400 leading-relaxed">Most reports are generated and shared quickly within 30 minutes, perfect for urgent last-minute submissions.</p>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-slate-500 transition-colors">
              <Search className="w-12 h-12 text-purple-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Detailed Analysis</h3>
              <p className="text-slate-400 leading-relaxed">Get highlighted similarity sources, AI content percentages, and actionable AI-powered improvement insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section id="how-it-works" className="py-24 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Easiest 4-Step Process</h2>
            <p className="text-slate-400">Fast, straightforward, and designed to save your time.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Upload Document', desc: 'Share your file in PDF, DOC, or DOCX format using the quick upload form.' },
              { num: '02', title: 'We Run the Check', desc: 'Your file is scanned securely without saving it in repository databases.' },
              { num: '03', title: 'Get Detailed Report', desc: 'Receive highlighted similarity sources and clean actionable insights.' },
              { num: '04', title: 'Submit with Confidence', desc: 'Use the AI Reducer to revise where needed and submit original work with peace of mind.' }
            ].map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="text-6xl font-black text-slate-800 mb-4 group-hover:text-blue-500/20 transition-colors">{step.num}</div>
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Calculator Section */}
      <section id="pricing" className="py-24 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Transparent Pricing</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Instantly estimate your plagiarism checking cost with complete pricing transparency, secure processing, and no hidden charges.
            </p>
            <ul className="space-y-4 text-slate-300 font-medium">
              <li className="flex items-center gap-3"><CheckSquare className="w-6 h-6 text-emerald-500" /> AI-powered plagiarism detection</li>
              <li className="flex items-center gap-3"><CheckSquare className="w-6 h-6 text-emerald-500" /> 100% secure document handling</li>
              <li className="flex items-center gap-3"><CheckSquare className="w-6 h-6 text-emerald-500" /> Fast report generation</li>
            </ul>
            <div className="mt-12 flex gap-8">
              <div>
                <p className="text-4xl font-black text-white">25K+</p>
                <p className="text-slate-400 text-sm font-medium mt-1">Reports Generated</p>
              </div>
              <div>
                <p className="text-4xl font-black text-emerald-400">99%</p>
                <p className="text-slate-400 text-sm font-medium mt-1">Confidential & Secure</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-6 h-6 text-blue-400" />
              <h3 className="text-2xl font-bold">Pricing Estimator</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Service</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none">
                  <option>Plagiarism & AI Report</option>
                  <option>AI Reduction Suite</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Page Range</label>
                <select 
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500"
                >
                  {Object.keys(pricingMap).map(range => (
                    <option key={range} value={range}>{range} Pages</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 border-t border-slate-700 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Estimated Cost</p>
                  <p className="text-4xl font-black text-white">₹{pricingMap[pages]}.00</p>
                </div>
                <button 
                  onClick={handleStartCheck}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  Start Check
                </button>
              </div>
              <p className="text-slate-500 text-xs text-center">
                Final pricing depends on selected service type and total document pages analyzed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-800/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Got Questions? We Have Answers</h2>
            <p className="text-slate-400">Clear answers to common concerns around report delivery, confidentiality, and support.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-slate-600"
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="p-6 flex justify-between items-center">
                  <h4 className="font-semibold text-lg">{faq.q}</h4>
                  {faqOpen === idx ? <ChevronUp className="w-5 h-5 text-blue-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
                {faqOpen === idx && (
                  <div className="px-6 pb-6 text-slate-400 border-t border-slate-700 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold">OriginalInk</span>
          </div>
          <p className="text-slate-500 text-sm text-center md:text-left">
            © 2026 OriginalInk. All rights reserved. | Built for Academic Excellence
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-white text-sm">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/1234567890" 
        target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center z-50 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-full mr-4 bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat on WhatsApp
        </span>
      </a>

    </div>
  );
};

export default LandingPage;
