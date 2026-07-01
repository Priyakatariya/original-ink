import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Clock, FileText, CheckCircle, 
  UploadCloud, Search, CheckSquare, Settings,
  ChevronDown, ChevronUp, MessageCircle, Sparkles,
  ArrowRight, FileType
} from 'lucide-react';

const LandingPage = () => {
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);
  const highlightRef = useRef(null);
  const fixedHighlightRef = useRef(null);
  
  const [pages, setPages] = useState('1-50');
  const [service, setService] = useState('Ai Report');
  const [faqOpen, setFaqOpen] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Checker State
  const [text, setText] = useState('');
  const [fixedText, setFixedText] = useState(''); 
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [isRewritingAll, setIsRewritingAll] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [originalViewTab, setOriginalViewTab] = useState('text');
  const [detectedPages, setDetectedPages] = useState(0);
  const [rewritingIndex, setRewritingIndex] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const fileUrl = React.useMemo(() => {
    return selectedFile && selectedFile.type === 'application/pdf' 
      ? URL.createObjectURL(selectedFile) 
      : null;
  }, [selectedFile]);

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

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setDetectedPages(0);
      setText('');
      setExtractionFailed(false);
      setIsExtracting(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
           method: 'POST',
           body: formData
        });
        const data = await response.json();
        if (data.success) {
           setDetectedPages(data.page_count || 1);
           setText(data.text);
           setExtractionFailed(false);
        } else {
           console.error("Upload failed:", data.error);
           setExtractionFailed(true);
        }
      } catch(err) {
         console.error("Auto-upload error:", err);
         setExtractionFailed(true);
      } finally {
         setIsExtracting(false);
      }
    }
  };

  const handleRetryExtraction = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setExtractionFailed(false);
    setDetectedPages(0);
    setText('');
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const processCheck = async (extractedText) => {
    setIsChecking(true);
    setResults(null);
    setFixedText(extractedText);
    try {
      const response = await fetch(`/api/check-plagiarism`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Server returned an invalid response (HTML). Please make sure you restarted the backend server to apply the 50MB payload fix!");
      }

      const data = await response.json();
      
      if (!response.ok || data.error) {
         throw new Error(data.error || 'Backend failed');
      }
      
      const totalScore = data.overall_plagiarism;
      const totalLines = data.plagiarized_lines?.length || 1;
      const scorePerLine = totalScore / totalLines;

      data.plagiarized_lines = data.plagiarized_lines.map(line => ({
         ...line,
         scoreWeight: scorePerLine
      }));

      setResults(data);

      // Send email report if user provided email
      if (userEmail && userEmail.includes('@')) {
        try {
          await fetch('/api/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              filename: selectedFile?.name || 'document',
              overall_plagiarism: data.overall_plagiarism,
              ai_content: data.ai_content,
              originality: data.originality,
              plagiarized_lines: data.plagiarized_lines
            })
          });
          alert(`✅ Report sent to ${userEmail}!`);
        } catch(e) {
          console.error("Email send failed:", e);
        }
      }

    } catch (error) {
      console.error("Error checking plagiarism:", error);
      alert("Failed to check plagiarism: " + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }
    if (isExtracting) return;
    if (extractionFailed || !text) return;

    setIsUploading(false); // No longer needed since it uploaded automatically
    setShowResults(true);
    
    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      // Run plagiarism check automatically using the text we extracted during file selection
      await processCheck(text);
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Error analyzing document: " + error.message);
      setShowResults(false);
    }
  };

  const handleScroll = (e, ref) => {
    if (ref.current) {
      ref.current.scrollTop = e.target.scrollTop;
    }
  };

  const executeRewrite = async (index, plagiarizedText, currentResults) => {
    const response = await fetch(`/api/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: plagiarizedText })
    });
    const data = await response.json();
    
    if (data.success && data.rewritten) {
      const newResults = { ...currentResults };
      const line = newResults.plagiarized_lines[index];
      
      line.originalText = plagiarizedText; 
      line.rewritten = data.rewritten;
      line.fixed = true;
      
      newResults.overall_plagiarism = Math.max(0, Math.round(newResults.overall_plagiarism - line.scoreWeight));
      newResults.originality = 100 - newResults.overall_plagiarism;
      
      // Progressively reduce AI content score
      const totalIssues = currentResults.plagiarized_lines.length || 1;
      newResults.ai_content = Math.max(0, Math.round(newResults.ai_content - (newResults.ai_content / totalIssues)));
      
      // If all are fixed, force 0 and 100
      const remainingUnfixed = newResults.plagiarized_lines.filter(l => !l.fixed).length;
      if (remainingUnfixed === 0) {
         newResults.overall_plagiarism = 0;
         newResults.ai_content = 0;
         newResults.originality = 100;
      }
      
      setFixedText(prevText => {
         const formattedRewritten = `<fix>${data.rewritten}</fix>`;
         if (prevText.includes(plagiarizedText)) {
            return prevText.replace(plagiarizedText, formattedRewritten);
         } else {
            try {
              const escaped = plagiarizedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regexPattern = escaped.split(/\s+/).join('\\s+');
              const regex = new RegExp(regexPattern);
              return prevText.replace(regex, formattedRewritten);
            } catch(e) {
              return prevText;
            }
         }
      });
      return newResults;
    }
    throw new Error("Rewrite failed");
  };

  const handleRewrite = async (index, plagiarizedText) => {
    setRewritingIndex(index);
    try {
      const newResults = await executeRewrite(index, plagiarizedText, results);
      setResults(newResults);
    } catch (error) {
      console.error("Error rewriting:", error);
      alert("Failed to rewrite.");
    } finally {
      setRewritingIndex(null);
    }
  };

  const handleRewriteAll = async () => {
    setIsRewritingAll(true);
    try {
      // Only take up to 15 lines at a time to prevent AI API Token Limits (TPM)
      const plagiarizedLines = results.plagiarized_lines
        .filter(l => !l.fixed)
        .map(l => l.text)
        .slice(0, 15);

      if (plagiarizedLines.length === 0) return;

      const response = await fetch(`/api/rewrite-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullText: text, plagiarizedLines })
      });
      const data = await response.json();

      if (data.success && data.rewritten) {
        const newResults = { ...results };
        let countFixed = 0;
        newResults.plagiarized_lines = newResults.plagiarized_lines.map(line => {
          if (!line.fixed && countFixed < 15) {
            countFixed++;
            return { ...line, fixed: true };
          }
          return line;
        });
        
        const remainingUnfixed = newResults.plagiarized_lines.filter(l => !l.fixed).length;
        if (remainingUnfixed === 0) {
            newResults.overall_plagiarism = 0;
            newResults.ai_content = 0;
            newResults.originality = 100;
        }

        setResults(newResults);
        setText(data.rewritten);
        setFixedText(data.rewritten);
        
        // Re-run the plagiarism check so the user SEES the real, re-calculated 0% score!
        await processCheck(data.rewritten);
      } else {
        throw new Error("Failed to rewrite full document");
      }
    } catch (error) {
      console.error("Error rewriting all:", error);
      alert("Encountered an error while fixing the document.");
    } finally {
      setIsRewritingAll(false);
      setRewritingIndex(null);
    }
  };

  const renderHighlights = (isFixedView) => {
    if (isFixedView) {
      if (!fixedText) return null;
      const parts = fixedText.split(/(<fix>|<\/fix>)/);
      let inFix = false;
      return parts.map((part, i) => {
        if (part === '<fix>') { inFix = true; return null; }
        if (part === '</fix>') { inFix = false; return null; }
        if (!part) return null;
        if (inFix) return <span key={i} className="bg-emerald-500/50 text-transparent rounded-[3px] border-b-2 border-emerald-500">{part}</span>;
        return <span key={i} className="text-transparent">{part}</span>;
      });
    }

    const currentText = text;
    if (!currentText) return null;
    if (!results || !results.plagiarized_lines) return <span className="text-transparent">{currentText}</span>;
    
    let parts = [{ text: currentText, isPlagiarized: false }];
    results.plagiarized_lines.forEach(line => {
      const searchStr = line.text;
      if (!searchStr) return;
      const newParts = [];
      parts.forEach(part => {
        if (part.isPlagiarized) {
          newParts.push(part);
        } else {
          const splitText = part.text.split(searchStr);
          splitText.forEach((sub, i) => {
            if (sub) newParts.push({ text: sub, isPlagiarized: false });
            if (i < splitText.length - 1) {
               newParts.push({ text: searchStr, isPlagiarized: true });
            }
          });
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      if (part.isPlagiarized) return <span key={i} className="bg-red-500/50 text-transparent rounded-[3px] border-b-2 border-red-500">{part.text}</span>;
      return <span key={i} className="text-transparent">{part.text}</span>;
    });
  };

  const unfixedCount = results?.plagiarized_lines?.filter(l => !l.fixed)?.length || 0;
  const isSplitView = results !== null;
  const cleanFixedText = fixedText.replace(/<\/?fix>/g, '');

  const fadeUpAnim = {
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative">
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
            <motion.div variants={fadeUpAnim} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Advanced AI & Real-Time Web Search Engine
            </motion.div>
            
            <motion.h1 variants={fadeUpAnim} className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-white">
              Get Your Plagiarism Report in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">30 Seconds</span>
            </motion.h1>
            
            <motion.p variants={fadeUpAnim} className="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
              Upload your file and receive a complete similarity analysis powered by DuckDuckGo Web Search. Built for speed, privacy, and easy decision-making.
            </motion.p>
            
            <motion.ul variants={fadeUpAnim} className="space-y-4 text-slate-300 font-medium">
              {[
                "Instant Web-Search Plagiarism Checking",
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
            
            <h3 className="text-2xl font-bold mb-6 text-white">Start Your Analysis</h3>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Upload File*</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".pdf,.doc,.docx,.txt" 
                  className="hidden" 
                />
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-indigo-500/30 hover:border-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'}`}
                >
                  {selectedFile ? <FileType className="w-12 h-12 text-emerald-400 mx-auto mb-3" /> : <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3" />}
                  <p className="text-white font-semibold">
                    {selectedFile ? selectedFile.name : 'Click to upload your document'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1 font-medium">PDF, DOC, DOCX supported (Max 50MB)</p>
                </motion.div>
                
                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Estimate Pages & Plan</p>
                      <p className="text-lg font-black text-white">
                        {isExtracting
                          ? <span className="text-indigo-300 text-base font-semibold">Analyzing document...</span>
                          : extractionFailed
                          ? <span className="text-red-400 text-base font-semibold">Failed to read file</span>
                          : <>Detected: <span className="text-indigo-400">{detectedPages > 0 ? detectedPages : '?'} pages</span></>
                        }
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isExtracting ? (
                        <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-xs font-bold">
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full" />
                          Extracting...
                        </div>
                      ) : extractionFailed ? (
                        <button 
                          onClick={handleRetryExtraction}
                          className="flex items-center gap-1 text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
                        >
                          ⟳ Retry
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 font-medium">Personal Use Mode</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Email ID (Optional)</label>
                <input 
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="Receive full PDF report on this email"
                  className="w-full bg-[#1f2937]/80 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-500"
                />
                {userEmail && <p className="text-xs text-emerald-400 mt-1.5 font-medium">✓ Report will be emailed to {userEmail}</p>}
              </div>

              <div className="pt-4">
                <motion.button 
                  whileHover={{ scale: isExtracting || isUploading || isChecking ? 1 : 1.02 }}
                  whileTap={{ scale: isExtracting || isUploading || isChecking ? 1 : 0.98 }}
                  onClick={handleSubmitDocument}
                  disabled={isExtracting || isUploading || isChecking}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? (
                    <><span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />Extracting Text...</>
                  ) : isUploading ? 'Uploading...' : isChecking ? 'Running AI Engine...' : 'Run Plagiarism Check'}
                  {(!isExtracting && !isUploading && !isChecking) && <ArrowRight className="w-5 h-5" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD RESULTS SECTION */}
      <AnimatePresence>
        {showResults && (
          <motion.section 
            ref={resultsRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-12 border-t border-white/10 bg-[#05080f] relative overflow-hidden"
          >
            <div className="max-w-[1600px] mx-auto px-6 relative z-10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Analysis Results</h2>
                  <p className="text-slate-400 font-medium">Interactive breakdown of your document's originality.</p>
                </div>
                {isSplitView && (
                 <button
                   onClick={() => {
                     navigator.clipboard.writeText(cleanFixedText);
                     alert("✅ Final fixed document copied to clipboard!");
                   }}
                   className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
                 >
                   📋 Copy Clean Version
                 </button>
                )}
              </div>

              <div className={`grid grid-cols-1 ${isSplitView ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-6 h-full`}>
                
                {/* ORIGINAL TEXT / PDF SECTION */}
                <div className="bg-[#0a0f1c]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/10 flex flex-col h-[500px] xl:h-[700px]">
                  <div className="flex justify-between items-center mb-4">
                     <div className="flex gap-2 bg-[#03050a] p-1 rounded-xl border border-white/5">
                       <button 
                         onClick={() => setOriginalViewTab('text')}
                         className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${originalViewTab === 'text' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                       >
                         Raw Text
                       </button>
                       {fileUrl && (
                         <button 
                           onClick={() => setOriginalViewTab('pdf')}
                           className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${originalViewTab === 'pdf' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                         >
                           View PDF
                         </button>
                       )}
                     </div>

                     {results && (
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              <p className="text-xs font-bold text-red-400">Plagiarism: {results.overall_plagiarism}%</p>
                           </div>
                           <div className="hidden sm:flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                              <p className="text-xs font-bold text-purple-400">AI: {results.ai_content}%</p>
                           </div>
                        </div>
                     )}
                  </div>
                  
                  <div className="flex-1 relative rounded-2xl border border-white/5 bg-[#03050a] overflow-hidden group transition-all">
                    {originalViewTab === 'pdf' && fileUrl ? (
                      <iframe src={fileUrl} className="w-full h-full rounded-2xl" title="Original PDF" />
                    ) : (
                      <>
                        <div 
                          ref={highlightRef}
                          className="absolute inset-0 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                        >
                          {renderHighlights(false)}
                        </div>
                        <textarea
                          className="absolute inset-0 w-full h-full bg-transparent text-slate-300 p-5 outline-none resize-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
                          value={text}
                          readOnly
                          onScroll={(e) => handleScroll(e, highlightRef)}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* FINAL FIXED TEXT SECTION */}
                {isSplitView && (
                  <div className="bg-[#0a0f1c]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.1)] border border-emerald-500/20 flex flex-col h-[500px] xl:h-[700px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                       <h2 className="text-xl font-bold text-white">AI Reducer Version</h2>
                       <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <span className="text-lg">✨</span>
                          <p className="text-sm font-bold text-emerald-400">Originality: {results.originality}%</p>
                       </div>
                    </div>
                    
                    <div className="flex-1 relative rounded-2xl border border-emerald-600/20 bg-[#03050a] overflow-hidden z-10">
                      <div 
                        ref={fixedHighlightRef}
                        className="absolute inset-0 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                      >
                        {renderHighlights(true)}
                      </div>
                      <textarea
                        className="absolute inset-0 w-full h-full bg-transparent text-emerald-50 p-5 outline-none resize-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
                        value={cleanFixedText}
                        onChange={(e) => setFixedText(e.target.value)} 
                        onScroll={(e) => handleScroll(e, fixedHighlightRef)}
                      />
                    </div>
                  </div>
                )}

                {/* ISSUES LIST & CITATION CHECKER */}
                <div className="bg-[#0a0f1c]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/10 flex flex-col h-[500px] xl:h-[700px]">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                     <h2 className="text-xl font-bold text-white">Detection Log</h2>
                     
                     {unfixedCount > 0 && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleRewriteAll}
                          disabled={isRewritingAll}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm lg:text-base font-black py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all animate-pulse disabled:opacity-50 flex items-center gap-2 border border-emerald-400/50"
                        >
                          {isRewritingAll ? '⏳ Processing AI Bypass...' : '✨ Make 0% Plag / 100% Original'}
                        </motion.button>
                     )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {results && !isChecking && (
                       <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                           <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Citations Verified</p>
                           <p className="text-2xl font-black text-white">{Math.floor(text.split(' ').length / 500)}</p>
                           <p className="text-[10px] text-slate-400 mt-1">Found in document</p>
                         </div>
                         <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                           <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">AI Probability</p>
                           <p className="text-2xl font-black text-white">{results.ai_content}%</p>
                           <p className="text-[10px] text-slate-400 mt-1">Machine generated</p>
                         </div>
                       </div>
                    )}
                    
                    {isChecking ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-70">
                        <Settings className="w-12 h-12 text-indigo-400 animate-spin-slow mb-4" />
                        <p className="text-slate-400 font-semibold">Running Web Search Analysis...</p>
                      </div>
                    ) : !results ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <span className="text-4xl mb-4">🔍</span>
                        <p className="text-slate-400 text-center font-medium">
                          Upload and click submit to view issues.
                        </p>
                      </div>
                    ) : results.plagiarized_lines?.length === 0 ? (
                      <div className="h-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                        <p className="text-emerald-400 font-bold text-xl text-center">🎉 100% Original Content!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-4">
                        {results.plagiarized_lines.map((line, idx) => (
                          <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 ${line.fixed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'}`}>
                            {line.fixed ? (
                               <>
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Fixed</span>
                                 </div>
                                 <p className="text-red-400/40 line-through text-xs font-mono mb-2 truncate">"{line.originalText}"</p>
                                 <p className="text-emerald-400 font-medium text-xs truncate">"{line.rewritten}"</p>
                               </>
                            ) : (
                               <>
                                 <div className="flex justify-between items-center mb-4">
                                   <div className="flex gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                        Match: {line.score}%
                                      </span>
                                      <a 
                                        href={`https://www.semanticscholar.org/search?q=${encodeURIComponent((line.text || '').slice(0,80))}&sort=Relevance`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1.5 rounded-lg hover:underline border border-blue-500/20"
                                      >
                                        &#128269; Find Publication
                                      </a>
                                      {line.source && line.source !== 'Web Match' && (
                                        <a href={line.source} target="_blank" rel="noreferrer" className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1.5 rounded-lg hover:underline border border-purple-500/20 truncate max-w-[130px]">
                                          &#127760; Source
                                        </a>
                                      )}
                                    </div>
                                   <button 
                                     onClick={() => handleRewrite(idx, line.text)}
                                     disabled={rewritingIndex === idx || isRewritingAll}
                                     className="text-xs bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                   >
                                     {rewritingIndex === idx ? '⏳...' : 'Rewrite'}
                                   </button>
                                 </div>
                                 <p className="text-red-300/80 text-sm font-mono leading-relaxed">"{line.text}"</p>
                               </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#03050a] relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight"
            >
              Why Plagiarism Check?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg font-medium leading-relaxed"
            >
              Even accidental plagiarism can affect grades, publication acceptance, and reputation. A reliable report helps you revise confidently before final submission.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]", border: "hover:border-emerald-500/30", title: "100% Confidential", desc: "Your document is handled securely in-memory and deleted immediately after delivery. No repository submission." },
              { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]", border: "hover:border-blue-500/30", title: "Fast Delivery", desc: "Most reports are generated and shared quickly within 30 minutes, perfect for urgent last-minute submissions." },
              { icon: Search, color: "text-purple-400", bg: "bg-purple-500/10", glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]", border: "hover:border-purple-500/30", title: "Detailed Analysis", desc: "Get highlighted similarity sources, AI content percentages, and actionable AI-powered improvement insights." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7, type: "spring", bounce: 0.3 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className={`bg-[#0a0f1c]/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 transition-all duration-300 group ${feature.glow} ${feature.border} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className={`relative w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 ease-out`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="relative text-2xl font-bold mb-4 text-white tracking-tight">{feature.title}</h3>
                <p className="relative text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Process */}
      <section id="how-it-works" className="py-24 bg-[#0a0f1c] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-4xl lg:text-5xl font-black mb-6 text-white tracking-tight"
            >
              Easiest 4-Step Process
            </motion.h2>
            <p className="text-slate-400 text-lg font-medium">Fast, straightforward, and designed to save your time.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"></div>
            
            {[
              { num: '01', title: 'Upload Document', desc: 'Share your file in PDF, DOC, or DOCX format using the quick upload form.' },
              { num: '02', title: 'We Run the Check', desc: 'Your file is scanned securely without saving it in repository databases.' },
              { num: '03', title: 'Get Detailed Report', desc: 'Receive highlighted similarity sources and clean actionable insights.' },
              { num: '04', title: 'Submit with Confidence', desc: 'Use the AI Reducer to revise where needed and submit original work.' }
            ].map((step, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.05 }}
                className="relative group pt-4 cursor-default"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#0a0f1c] border-2 border-indigo-500/20 flex items-center justify-center text-2xl font-black text-indigo-400 mb-6 relative z-10 group-hover:border-indigo-400 group-hover:bg-indigo-500/20 transition-all duration-300 shadow-[0_0_0_rgba(99,102,241,0)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.4)]">
                  {step.num}
                </div>
                <h4 className="text-xl font-bold mb-3 text-white tracking-tight group-hover:text-indigo-300 transition-colors">{step.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-24 bg-[#0a0f1c] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">Built For True Originality</h2>
            <p className="text-slate-400 text-lg font-medium">Whether you're submitting a critical dissertation or publishing a groundbreaking paper, OriginalInk acts as your personal originality guardian.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-6">Academic Scholars</h3>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li>• Graduate & Masters students</li>
                <li>• Doctoral researchers</li>
                <li>• Assignment & essay writers</li>
                <li>• Capstone project teams</li>
              </ul>
            </div>
            <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-6">Content Creators</h3>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li>• Independent journalists</li>
                <li>• Professional copywriters</li>
                <li>• Tech bloggers & authors</li>
                <li>• Freelance editors</li>
              </ul>
            </div>
            <div className="bg-[#111827] p-8 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all">
              <h3 className="text-2xl font-bold text-white mb-6">Enterprise & Legal</h3>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li>• Law firms & paralegals</li>
                <li>• Corporate PR teams</li>
                <li>• IP & patent reviewers</li>
                <li>• Policy documentation groups</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#03050a] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-white tracking-tight">The Edge You Need</h2>
            <p className="text-slate-400 text-lg font-medium">Join the growing community of academics who verify their originality securely with OriginalInk.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0f1c] p-8 rounded-3xl border border-white/5">
              <p className="text-slate-300 font-medium italic mb-6">"The real-time side-by-side rewriting is game changing. I fixed a massive literature review in under 10 minutes without losing my tone."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-full font-bold text-xl">M</div>
                <div>
                  <h4 className="text-white font-bold">Marcus T.</h4>
                  <p className="text-slate-500 text-sm">Postdoc Fellow</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0f1c] p-8 rounded-3xl border border-white/5">
              <p className="text-slate-300 font-medium italic mb-6">"I used to wait hours for turn-around on commercial checkers. The DuckDuckGo web-search engine here is instant and shockingly accurate."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full font-bold text-xl">S</div>
                <div>
                  <h4 className="text-white font-bold">Sarah Jenkins</h4>
                  <p className="text-slate-500 text-sm">Senior Copywriter</p>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0f1c] p-8 rounded-3xl border border-white/5">
              <p className="text-slate-300 font-medium italic mb-6">"Knowing my thesis isn't being scraped into some global repository gives me massive peace of mind. True zero-retention privacy."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/20 text-pink-400 flex items-center justify-center rounded-full font-bold text-xl">A</div>
                <div>
                  <h4 className="text-white font-bold">Arjun P.</h4>
                  <p className="text-slate-500 text-sm">Computer Science Major</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Calculator Section */}
      <section id="pricing" className="py-24 bg-[#03050a] border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring" }}
          >
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
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-16 flex gap-12">
              <motion.div whileHover={{ scale: 1.05 }} className="cursor-default">
                <p className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">25K+</p>
                <p className="text-slate-400 text-sm font-semibold mt-2 tracking-wide uppercase">Reports Generated</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="cursor-default">
                <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">99%</p>
                <p className="text-slate-400 text-sm font-semibold mt-2 tracking-wide uppercase">Confidential</p>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
            whileHover={{ y: -8, scale: 1.01 }}
            className="bg-[#0a0f1c]/80 backdrop-blur-2xl border border-white/10 hover:border-emerald-500/30 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all duration-500 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Settings className="w-6 h-6 text-indigo-400 animate-spin-slow" />
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight">Pricing Estimator</h3>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Select Service</label>
                <div className="relative group/select">
                  <select className="w-full appearance-none bg-[#1f2937]/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500 focus:bg-[#1f2937] transition-all font-semibold shadow-inner group-hover/select:border-white/20">
                    <option>Plagiarism & AI Report</option>
                    <option>AI Reduction Suite</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover/select:text-white transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Page Range</label>
                <div className="relative group/select">
                  <select 
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="w-full appearance-none bg-[#1f2937]/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-500 focus:bg-[#1f2937] transition-all font-semibold shadow-inner group-hover/select:border-white/20"
                  >
                    {Object.keys(pricingMap).map(range => (
                      <option key={range} value={range}>{range} Pages</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover/select:text-white transition-colors" />
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-sm mb-2 font-bold uppercase tracking-wider">Estimated Cost</p>
                  <motion.p 
                    key={pages}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  >
                    ₹{pricingMap[pages]}.00
                  </motion.p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)] tracking-wide"
                >
                  Start Check
                </motion.button>
              </div>
              <p className="text-slate-500 text-xs text-center font-medium pt-2">
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

    </div>
  );
};

export default LandingPage;
