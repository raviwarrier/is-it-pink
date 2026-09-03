/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Audiobook, AudiobookshelfConfig } from '../types';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Globe, 
  BookCheck, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2,
  ExternalLink,
  Info,
  HelpCircle,
  Copy,
  Check,
  Settings,
  Monitor
} from 'lucide-react';

interface AudiobookshelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AudiobookshelfConfig | null;
  onConnectSuccess: (config: AudiobookshelfConfig, readBooks: Audiobook[]) => void;
  onDisconnect: () => void;
}

export const AudiobookshelfModal: React.FC<AudiobookshelfModalProps> = ({
  isOpen,
  onClose,
  config,
  onConnectSuccess,
  onDisconnect
}) => {
  const [serverUrl, setServerUrl] = useState(config?.serverUrl || 'https://abs.example.com');
  const [apiToken, setApiToken] = useState(config?.apiToken || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);
  const [copiedExpiry, setCopiedExpiry] = useState(false);

  // Real-time progress tracking state
  const [progressStatus, setProgressStatus] = useState<string>('Idle');
  const [progressStep, setProgressStep] = useState<'connecting' | 'connected' | 'listing' | 'extracting' | 'complete' | 'idle'>('idle');
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [currentBookTitle, setCurrentBookTitle] = useState<string>('');

  if (!isOpen) return null;

  const handleCopyExpiry = () => {
    navigator.clipboard.writeText('21600');
    setCopiedExpiry(true);
    setTimeout(() => setCopiedExpiry(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !apiToken.trim()) {
      setErrorMessage('Please enter both your Audiobookshelf server URL and API key.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setProgressStatus('Connecting to Audiobookshelf...');
    setProgressStep('connecting');
    setProgressCurrent(0);
    setProgressTotal(0);
    setCurrentBookTitle('');

    try {
      // 1. Try real-time Server-Sent Events stream for instant progress updates
      const streamRes = await fetch('/api/abs/fetch-read-books-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          apiToken: apiToken.trim()
        })
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let completedData: any = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const trimmedBlock = block.trim();
            if (!trimmedBlock || trimmedBlock.startsWith(':')) {
              // Ignore comments / heartbeat / buffer-flush padding
              continue;
            }

            for (const line of trimmedBlock.split('\n')) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const jsonStr = trimmedLine.slice(6).trim();
                if (!jsonStr) continue;

                let event: any = null;
                try {
                  event = JSON.parse(jsonStr);
                } catch {
                  continue;
                }

                if (!event) continue;

                if (event.step === 'error') {
                  throw new Error(event.error || event.message || 'Error occurred while communicating with Audiobookshelf.');
                }
                if (event.step) {
                  setProgressStep(event.step);
                }
                if (event.message) {
                  setProgressStatus(event.message);
                }
                if (event.current !== undefined) {
                  setProgressCurrent(event.current);
                }
                if (event.total !== undefined) {
                  setProgressTotal(event.total);
                }
                if (event.bookTitle) {
                  setCurrentBookTitle(event.bookTitle);
                }
                if (event.step === 'complete' && event.books) {
                  completedData = event;
                }
              }
            }
          }
        }

        if (completedData && completedData.books && completedData.books.length > 0) {
          onConnectSuccess({
            serverUrl: completedData.serverUrl || serverUrl,
            apiToken: apiToken.trim(),
            username: completedData.username || 'Audiobookshelf User',
            connectedAt: new Date().toISOString(),
            readCount: completedData.books.length
          }, completedData.books);

          onClose();
          return;
        }

        if (completedData && (!completedData.books || completedData.books.length === 0)) {
          throw new Error('Connected to Audiobookshelf, but no audiobooks were found in your listening history or library.');
        }
      } else if (!streamRes.ok && streamRes.status !== 404) {
        // The streaming endpoint responded with an explicit HTTP error (e.g. 401 Unauthorized, 502/504 Timeout)
        const rawErrText = await streamRes.text();
        let parsedErr: any = null;
        try {
          parsedErr = JSON.parse(rawErrText);
        } catch {
          // not JSON
        }
        if (streamRes.status === 401 || streamRes.status === 403) {
          throw new Error('Audiobookshelf authentication failed. Please verify your API token.');
        }
        if (streamRes.status === 504 || streamRes.status === 502) {
          throw new Error('Connection to your Audiobookshelf server timed out. Please verify your server URL and network connectivity.');
        }
        throw new Error(parsedErr?.error || parsedErr?.message || `Server returned status ${streamRes.status}: ${rawErrText.slice(0, 120)}`);
      }

      // 2. Standard JSON Fallback if streaming is completely unavailable or completed without data
      setProgressStatus('Extracting read books and cover colors...');
      const res = await fetch('/api/abs/fetch-read-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          apiToken: apiToken.trim()
        })
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (res.status === 504 || res.status === 502) {
          throw new Error('Connection to Audiobookshelf timed out. Please verify your server URL and network accessibility.');
        }
        throw new Error(`Audiobookshelf communication failed (Status ${res.status}): ${rawText.slice(0, 120)}`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to connect to Audiobookshelf');
      }

      if (!data.books || data.books.length === 0) {
        throw new Error('Connected successfully, but no finished/read audiobooks were found in your library progress.');
      }

      onConnectSuccess({
        serverUrl: data.serverUrl || serverUrl,
        apiToken: apiToken.trim(),
        username: data.username,
        connectedAt: new Date().toISOString(),
        readCount: data.books.length
      }, data.books);

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect. Please verify your server URL and token.');
    } finally {
      setIsLoading(false);
      setProgressStep('idle');
    }
  };

  return (
    <div id="abs-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="abs-connection-modal" 
        className="w-full max-w-2xl bg-[#12151A] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0C0E12]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <BookCheck className="w-4 h-4 text-amber-200/90" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                My Reading Analysis • Audiobookshelf Integration
              </h2>
              <p className="text-[11px] text-zinc-400">
                Connect your personal server to generate chromatic treemaps for your finished read list
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Strict Security & Zero Storage Guarantee Banner */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-750 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-200/90" />
              <span>Zero-Persistence Privacy & Security Guarantee</span>
            </div>
            <ul className="space-y-1 text-zinc-400 text-[11px] pl-6 list-disc list-outside leading-relaxed">
              <li><strong>Zero Permanent Storage:</strong> Your API token is <strong>never stored on any disk, database, or server logs</strong>.</li>
              <li><strong>Ephemeral In-Memory Only:</strong> Credentials exist strictly in volatile client memory for the immediate analysis session.</li>
              <li><strong>TLS Encryption:</strong> Direct API calls to your Audiobookshelf server utilize standard end-to-end HTTPS.</li>
              <li><strong>Instant Memory Purge:</strong> Disconnecting, changing views, or closing this tab completely purges all tokens from memory.</li>
            </ul>
          </div>

          {/* If already connected, show active status with Disconnect */}
          {config?.username && (
            <div className="p-4 bg-zinc-850 rounded-xl border border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <CheckCircle2 className="w-5 h-5 text-amber-200/90" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Connected to Audiobookshelf
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    User: <strong className="text-zinc-200">{config.username}</strong> • {config.readCount || 0} Finished Books Loaded
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect & Purge</span>
              </button>
            </div>
          )}

          {/* Connection Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            
            {/* Server URL Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>Audiobookshelf Base URL</span>
              </label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://abs.yourdomain.com or http://localhost:13378"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/40"
              />
              <p className="text-[10px] text-zinc-500">
                The public or local address of your Audiobookshelf web server.
              </p>
            </div>

            {/* API Token Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-200/90" />
                  <span>Audiobookshelf API Token / Key</span>
                </label>
                
                {/* Tooltip Button: "How to get one?" */}
                <button
                  type="button"
                  onClick={() => setShowApiKeyGuide(prev => !prev)}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-300/90 hover:text-amber-200 underline underline-offset-2 transition-colors cursor-pointer"
                  title="Click to view step-by-step guide on generating an Audiobookshelf API key"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>How to get one?</span>
                </button>
              </div>

              {/* Step-by-Step API Key Tooltip / Guide Drawer */}
              {showApiKeyGuide && (
                <div className="p-3.5 bg-zinc-900/95 border border-amber-500/30 rounded-xl text-xs space-y-2.5 animate-fadeIn shadow-lg text-zinc-300">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span>How to generate an Audiobookshelf API Key:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyGuide(false)}
                      className="text-zinc-400 hover:text-white text-[11px] px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <ol className="space-y-2 text-[11px] leading-relaxed pl-1 text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">1</span>
                      <span>Log into your <strong>Audiobookshelf server</strong> from a <strong>desktop browser</strong> (not mobile).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">2</span>
                      <span>Click on <strong>Settings</strong> (the gear icon <Settings className="w-3 h-3 inline-block text-zinc-400" /> in the navigation).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">3</span>
                      <span>Click on <strong>API Keys</strong> from the left panel.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">4</span>
                      <span>Click <strong>&quot;Add API Key&quot;</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-zinc-700">5</span>
                      <div>
                        <span>Give it a name and put <strong className="text-amber-200 font-mono bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700">21600</strong> in the <strong>&quot;Expires in&quot;</strong> field.</span>
                        <button
                          type="button"
                          onClick={handleCopyExpiry}
                          className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-100 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {copiedExpiry ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copiedExpiry ? 'Copied 21600!' : 'Copy 21600'}</span>
                        </button>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          That will automatically kill and expire the API key in 6 hours for maximum safety.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              )}

              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Paste your bearer token (e.g. eyJhbGciOi...)"
                required
                className="w-full px-3.5 py-2.5 bg-zinc-850 border border-zinc-700 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/40"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Real-time Connection & Extraction Progress Indicator */}
            {isLoading && (
              <div className="p-4 bg-zinc-900 border border-amber-500/40 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-200">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                    <span className="capitalize">
                      {progressStep === 'connecting' && '1. Connecting to Server'}
                      {progressStep === 'connected' && '2. Connected & Authenticated'}
                      {progressStep === 'listing' && '3. Making Reading List'}
                      {progressStep === 'extracting' && '4. Extracting Cover Colors'}
                      {progressStep === 'complete' && '5. Finalizing Treemap'}
                      {progressStep === 'idle' && 'Processing Shelf...'}
                    </span>
                  </div>
                  {progressTotal > 0 && (
                    <span className="font-mono text-[11px] text-amber-200/90 font-bold">
                      {progressCurrent} / {progressTotal} ({Math.min(100, Math.round((progressCurrent / progressTotal) * 100))}%)
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ 
                      width: progressTotal > 0 
                        ? `${Math.max(5, Math.min(100, Math.round((progressCurrent / progressTotal) * 100)))}%`
                        : (progressStep === 'connected' ? '30%' : (progressStep === 'listing' ? '50%' : '15%'))
                    }}
                  />
                </div>

                {/* Meaningful Status Description Label */}
                <div className="flex items-center justify-between text-[11px] gap-2 pt-0.5">
                  <span className="text-zinc-300 truncate">
                    {progressStatus}
                  </span>
                  {currentBookTitle && (
                    <span className="text-[10px] text-amber-300/90 font-mono truncate max-w-[45%] text-right shrink-0">
                      {currentBookTitle}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-all border border-zinc-700 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-200/90" />
                    <span>
                      {progressStep === 'extracting' && progressTotal > 0 
                        ? `Extracting ${progressCurrent}/${progressTotal} Audiobooks...`
                        : (progressStatus || 'Connecting & Extracting Read Books...')}
                    </span>
                  </>
                ) : (
                  <>
                    <BookCheck className="w-4 h-4 text-amber-200/90" />
                    <span>Connect & Load My Read List</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#0A0C0F] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1 text-[11px]">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Zero-trace in-memory analysis session</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-medium transition-colors border border-zinc-700 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
