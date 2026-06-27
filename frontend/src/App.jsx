import React, { useState, useRef } from 'react';

function App() {
  const [text, setText] = useState('');
  const [fixedText, setFixedText] = useState(''); // To track the new fixed version separately
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
    setFixedText(text); // Initialize fixed text as original text
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
      
      // Replace ONLY in the fixedText state, keeping original intact
      setFixedText(prevText => {
         if (prevText.includes(plagiarizedText)) {
            return prevText.replace(plagiarizedText, data.rewritten);
         }
         return prevText;
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
    let currentResults = { ...results };
    
    for (let i = 0; i < currentResults.plagiarized_lines.length; i++) {
      const line = currentResults.plagiarized_lines[i];
      if (!line.fixed) {
         setRewritingIndex(i); 
         try {
           currentResults = await executeRewrite(i, line.text, currentResults);
           setResults(currentResults);
         } catch (e) {
           console.error("Failed on line", i, e);
         }
      }
    }
    
    setRewritingIndex(null);
    setIsRewritingAll(false);
  };

  const renderHighlights = (isFixedView) => {
    const currentText = isFixedView ? fixedText : text;
    if (!currentText) return null;
    if (!results || !results.plagiarized_lines) return <span className="text-transparent">{currentText}</span>;
    
    let parts = [{ text: currentText, isPlagiarized: false, isFixed: false }];

    results.plagiarized_lines.forEach(line => {
      const searchStr = isFixedView ? (line.fixed ? line.rewritten : line.text) : line.text;
      if (!searchStr) return;

      const newParts = [];
      parts.forEach(part => {
        if (part.isPlagiarized || part.isFixed) {
          newParts.push(part);
        } else {
          const splitText = part.text.split(searchStr);
          splitText.forEach((sub, i) => {
            if (sub) newParts.push({ text: sub, isPlagiarized: false, isFixed: false });
            if (i < splitText.length - 1) {
              if (isFixedView && line.fixed) {
                 newParts.push({ text: searchStr, isFixed: true });
              } else {
                 newParts.push({ text: searchStr, isPlagiarized: true });
              }
            }
          });
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      let cssClass = 'text-transparent';
      if (part.isPlagiarized) cssClass = 'bg-red-500/50 text-transparent rounded-[3px] border-b-2 border-red-500';
      if (part.isFixed) cssClass = 'bg-emerald-500/50 text-transparent rounded-[3px] border-b-2 border-emerald-500';
      
      return (
        <span key={i} className={cssClass}>
          {part.text}
        </span>
      );
    });
  };

  const unfixedCount = results?.plagiarized_lines?.filter(l => !l.fixed)?.length || 0;
  const isSplitView = results !== null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 lg:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 text-center flex flex-col items-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2 drop-shadow-sm">
            OriginalInk
          </h1>
          <p className="text-slate-400 text-base lg:text-lg">AI-Powered Plagiarism Checker & Side-by-Side Editor</p>
        </header>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
           <button 
             onClick={handleCheckPlagiarism}
             disabled={isChecking || !text}
             className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
           >
             {isChecking ? 'Scanning...' : 'Check Plagiarism'}
           </button>
           
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" className="hidden" />
           <button 
             onClick={() => fileInputRef.current.click()}
             disabled={isUploading}
             className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-xl transition-all disabled:opacity-50 border border-slate-600"
           >
             {isUploading ? 'Extracting...' : 'Upload File'}
           </button>

           {isSplitView && (
             <button
               onClick={() => {
                 navigator.clipboard.writeText(fixedText);
                 alert("✅ Final fixed document copied to clipboard!");
               }}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-8 rounded-xl transition-all border border-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
             >
               📋 Copy Final Text
             </button>
           )}
        </div>

        <div className={`grid grid-cols-1 ${isSplitView ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-6 h-full`}>
          
          {/* ORIGINAL TEXT SECTION */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-5 lg:p-6 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col h-full min-h-[600px]">
            <div className="flex justify-between items-center mb-4">
               <div>
                 <h2 className="text-xl font-semibold text-white">Original Document</h2>
               </div>
               {results && (
                  <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                     <p className="text-sm font-bold text-red-400">Plagiarism: {results.overall_plagiarism}%</p>
                  </div>
               )}
            </div>
            
            <div className="flex-1 relative rounded-2xl border border-slate-600/50 bg-slate-900/80 overflow-hidden shadow-inner group transition-all">
              <div 
                ref={highlightRef}
                className="absolute inset-0 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                aria-hidden="true"
              >
                {renderHighlights(false)}
              </div>
              
              <textarea
                className="absolute inset-0 w-full h-full bg-transparent text-slate-200 p-5 outline-none resize-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
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

          {/* FINAL FIXED TEXT SECTION (Only shows when results exist) */}
          {isSplitView && (
            <div className="bg-slate-800/80 backdrop-blur-sm p-5 lg:p-6 rounded-3xl shadow-2xl border border-emerald-700/50 flex flex-col h-full min-h-[600px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex justify-between items-center mb-4 relative z-10">
                 <div>
                   <h2 className="text-xl font-semibold text-white">AI Fixed Version</h2>
                 </div>
                 <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-lg">✨</span>
                    <p className="text-sm font-bold text-emerald-400">Originality: {results.originality}%</p>
                 </div>
              </div>
              
              <div className="flex-1 relative rounded-2xl border border-emerald-600/30 bg-slate-900/80 overflow-hidden shadow-inner group transition-all z-10">
                <div 
                  ref={fixedHighlightRef}
                  className="absolute inset-0 p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words pointer-events-none"
                  aria-hidden="true"
                >
                  {renderHighlights(true)}
                </div>
                
                <textarea
                  className="absolute inset-0 w-full h-full bg-transparent text-emerald-50 p-5 outline-none resize-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
                  value={fixedText}
                  readOnly
                  onScroll={(e) => handleScroll(e, fixedHighlightRef)}
                />
              </div>
            </div>
          )}

          {/* DETECTION & FIX LIST SECTION */}
          <div className="bg-slate-800/80 backdrop-blur-sm p-5 lg:p-6 rounded-3xl shadow-2xl border border-slate-700/50 flex flex-col h-full max-h-[700px]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
               <div>
                  <h2 className="text-xl font-semibold text-white">Detection List</h2>
               </div>
               
               {isSplitView && unfixedCount > 0 && (
                  <button 
                    onClick={handleRewriteAll}
                    disabled={isRewritingAll}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRewritingAll ? 'Fixing All...' : '✨ Fix All with AI'}
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
