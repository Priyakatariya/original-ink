import React, { useState, useRef } from 'react';

function App() {
  const [text, setText] = useState('');
  const [fixedText, setFixedText] = useState(''); 
  const [isChecking, setIsChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRewritingAll, setIsRewritingAll] = useState(false);
  const [results, setResults] = useState(null);
  const [rewritingIndex, setRewritingIndex] = useState(null);
  
  const fileInputRef = useRef(null);
  const highlightRef = useRef(null);
  const fixedHighlightRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleScroll = (e, ref) => {
    if (ref.current) {
      ref.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleClear = () => {
    setText('');
    setFixedText('');
    setResults(null);
    setRewritingIndex(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to extract text');
      }

      setText(data.text);
      setFixedText(data.text);
      setResults(null); 
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Error reading file: " + error.message);
    } finally {
      setIsUploading(false);
      event.target.value = null;
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!text) return;
    setIsChecking(true);
    setResults(null);
    setFixedText(text); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-plagiarism`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
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
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      alert("Failed to check plagiarism: " + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  // Keep single line rewrite for individual button clicks
  const executeRewrite = async (index, plagiarizedText, currentResults) => {
    const response = await fetch(`${API_BASE_URL}/api/rewrite`, {
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
      
      setFixedText(prevText => {
         // Wrap individual line fixes in <fix> tags so they render green in the new system!
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

  // FULL DOCUMENT REWRITE
  const handleRewriteAll = async () => {
    setIsRewritingAll(true);
    try {
      const plagiarizedLines = results.plagiarized_lines.filter(l => !l.fixed).map(l => l.text);
      if (plagiarizedLines.length === 0) return;

      const response = await fetch(`${API_BASE_URL}/api/rewrite-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullText: text, plagiarizedLines })
      });
      const data = await response.json();
      
      if (data.success && data.rewritten) {
        setFixedText(data.rewritten);
        
        const newResults = { ...results };
        newResults.plagiarized_lines = newResults.plagiarized_lines.map(line => ({
          ...line,
          fixed: true,
          rewritten: "Fixed in full document rewrite" 
        }));
        newResults.overall_plagiarism = 0;
        newResults.originality = 100;
        setResults(newResults);
      } else {
         throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error rewriting all:", error);
      alert("Failed to rewrite the document. Check backend logs.");
    } finally {
      setIsRewritingAll(false);
    }
  };

  const renderHighlights = (isFixedView) => {
    if (isFixedView) {
      if (!fixedText) return null;
      // The backend (or individual fix) returns text with <fix>...</fix> tags.
      // We split by these tags to render green highlights.
      const parts = fixedText.split(/(<fix>|<\/fix>)/);
      let inFix = false;
      return parts.map((part, i) => {
        if (part === '<fix>') {
          inFix = true;
          return null;
        }
        if (part === '</fix>') {
          inFix = false;
          return null;
        }
        if (!part) return null;
        
        if (inFix) {
          return <span key={i} className="bg-emerald-500/50 text-transparent rounded-[3px] border-b-2 border-emerald-500">{part}</span>;
        }
        return <span key={i} className="text-transparent">{part}</span>;
      });
    }

    // Original view logic (Red Highlights)
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
      if (part.isPlagiarized) {
         return <span key={i} className="bg-red-500/50 text-transparent rounded-[3px] border-b-2 border-red-500">{part.text}</span>;
      }
      return <span key={i} className="text-transparent">{part.text}</span>;
    });
  };

  const unfixedCount = results?.plagiarized_lines?.filter(l => !l.fixed)?.length || 0;
  const isSplitView = results !== null;
  
  // Strip tags for the clean view and copy
  const cleanFixedText = fixedText.replace(/<\/?fix>/g, '');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 lg:mb-8 text-center flex flex-col items-center">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 pb-2">
            OriginalInk
          </h1>
          <p className="text-slate-400 text-sm lg:text-lg px-4">AI-Powered Plagiarism Checker & Side-by-Side Editor</p>
        </header>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mb-6 lg:mb-8">
           <button 
             onClick={handleCheckPlagiarism}
             disabled={isChecking || !text}
             className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 lg:py-3 lg:px-8 rounded-xl shadow-lg transition-all text-sm lg:text-base"
           >
             {isChecking ? 'Scanning...' : 'Check Plagiarism'}
           </button>
           
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" className="hidden" />
           <button 
             onClick={() => fileInputRef.current.click()}
             disabled={isUploading}
             className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-6 lg:py-3 lg:px-8 rounded-xl transition-all disabled:opacity-50 border border-slate-600 text-sm lg:text-base"
           >
             {isUploading ? 'Extracting...' : 'Upload File'}
           </button>

           {text && (
             <button 
               onClick={handleClear}
               className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-2.5 px-6 lg:py-3 lg:px-8 rounded-xl transition-all border border-red-500/20 flex items-center gap-2 text-sm lg:text-base"
             >
               🗑️ Clear
             </button>
           )}

           {isSplitView && (
             <button
               onClick={() => {
                 navigator.clipboard.writeText(cleanFixedText);
                 alert("✅ Final fixed document copied to clipboard!");
               }}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 lg:py-3 lg:px-8 rounded-xl transition-all border border-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center gap-2 w-full sm:w-auto justify-center text-sm lg:text-base mt-2 sm:mt-0"
             >
               📋 Copy Final Text
             </button>
           )}
        </div>

        <div className={`grid grid-cols-1 ${isSplitView ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-4 lg:gap-6 h-full`}>
          
          {/* ORIGINAL TEXT SECTION */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col h-[400px] lg:h-full lg:min-h-[600px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
               <div>
                 <h2 className="text-lg lg:text-xl font-semibold text-white">Original Document</h2>
               </div>
               {results && (
                  <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                     <p className="text-xs lg:text-sm font-bold text-red-400">Plagiarism: {results.overall_plagiarism}%</p>
                  </div>
               )}
            </div>
            
            <div className="flex-1 relative rounded-xl lg:rounded-2xl border border-slate-600/50 bg-slate-900/80 overflow-hidden shadow-inner group transition-all">
              <div 
                ref={highlightRef}
                className="absolute inset-0 p-4 lg:p-5 font-mono text-xs lg:text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                aria-hidden="true"
              >
                {renderHighlights(false)}
              </div>
              
              <textarea
                className="absolute inset-0 w-full h-full bg-transparent text-slate-200 p-4 lg:p-5 outline-none resize-none font-mono text-xs lg:text-sm leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (!isSplitView) setFixedText(e.target.value);
                }}
                onScroll={(e) => handleScroll(e, highlightRef)}
                readOnly={isChecking || isSplitView} // Lock original when checking
              />
            </div>
          </div>

          {/* FINAL FIXED TEXT SECTION */}
          {isSplitView && (
            <div className="bg-slate-800/80 backdrop-blur-sm p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl border border-emerald-700/50 flex flex-col h-[400px] lg:h-full lg:min-h-[600px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 relative z-10 gap-2">
                 <div>
                   <h2 className="text-lg lg:text-xl font-semibold text-white">AI Fixed Version</h2>
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-sm lg:text-lg">✨</span>
                    <p className="text-xs lg:text-sm font-bold text-emerald-400">Originality: {results.originality}%</p>
                 </div>
              </div>
              
              <div className="flex-1 relative rounded-xl lg:rounded-2xl border border-emerald-600/30 bg-slate-900/80 overflow-hidden shadow-inner group transition-all z-10">
                <div 
                  ref={fixedHighlightRef}
                  className="absolute inset-0 p-4 lg:p-5 font-mono text-xs lg:text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                  aria-hidden="true"
                >
                  {renderHighlights(true)}
                </div>
                
                <textarea
                  className="absolute inset-0 w-full h-full bg-transparent text-emerald-50 p-4 lg:p-5 outline-none resize-none font-mono text-xs lg:text-sm leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
                  value={cleanFixedText}
                  onChange={(e) => setFixedText(e.target.value)} 
                  onScroll={(e) => handleScroll(e, fixedHighlightRef)}
                />
              </div>
            </div>
          )}

          {/* DETECTION & FIX LIST SECTION */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col h-[400px] lg:h-full lg:max-h-[700px]">
            <div className="flex justify-between items-center mb-4 lg:mb-6 border-b border-slate-700/50 pb-4">
               <div>
                  <h2 className="text-lg lg:text-xl font-semibold text-white">Detection List</h2>
               </div>
               
               {isSplitView && unfixedCount > 0 && (
                  <button 
                    onClick={handleRewriteAll}
                    disabled={isRewritingAll}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs lg:text-sm font-bold py-2 px-3 lg:px-4 rounded-lg shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRewritingAll ? 'Fixing Document...' : '✨ Fix All with AI'}
                  </button>
               )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {!results ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <span className="text-4xl mb-4">🔍</span>
                  <p className="text-slate-400 text-center text-sm px-4">
                    Run Plagiarism Check to see the issues list here.
                  </p>
                </div>
              ) : results.plagiarized_lines?.length === 0 ? (
                <div className="h-full flex items-center justify-center bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-emerald-400 font-bold text-center">🎉 100% Original Content!</p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {results.plagiarized_lines.map((line, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all duration-300 ${line.fixed ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-950/20 border-red-500/30 hover:border-red-500/50'}`}>
                      {line.fixed ? (
                         <>
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">Fixed</span>
                           </div>
                           <p className="text-red-400/40 line-through text-xs font-mono mb-2 truncate">"{line.originalText}"</p>
                           <p className="text-emerald-400 font-medium text-xs truncate">"{line.rewritten}"</p>
                         </>
                      ) : (
                         <>
                           <div className="flex justify-between items-center mb-3">
                             <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                               Match: {line.score}%
                             </span>
                             <button 
                               onClick={() => handleRewrite(idx, line.text)}
                               disabled={rewritingIndex === idx || isRewritingAll}
                               className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1 shadow-md disabled:opacity-50"
                             >
                               {rewritingIndex === idx ? '⏳...' : 'Fix'}
                             </button>
                           </div>
                           <p className="text-red-300/80 text-xs font-mono leading-relaxed line-clamp-3">"{line.text}"</p>
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
    </div>
  );
}

export default App;
