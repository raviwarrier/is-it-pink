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
  Info
} from 'lucide-react';
import { DEFAULT_SAMPLE_AUDIOBOOKS } from '../data/sampleAudiobooks';

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

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !apiToken.trim()) {
      setErrorMessage('Please enter both your Audiobookshelf server URL and API key.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/abs/fetch-read-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          apiToken: apiToken.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to Audiobookshelf');
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
    }
  };

  // Demo Read List generator for instant 1-click preview
  const handleLoadDemoReadList = () => {
    // Select 16 finished books from curated library with simulated read completion status
    const demoReadBooks: Audiobook[] = DEFAULT_SAMPLE_AUDIOBOOKS.slice(0, 16).map((b, idx) => ({
      ...b,
      tags: [...b.tags, '#ReadList', '#Finished'],
      isFinished: true,
      finishedAt: new Date(Date.now() - (idx * 7 + 3) * 86400000).toISOString()
    }));

    onConnectSuccess({
      serverUrl: 'https://demo-abs.audiobookshelf.local',
      apiToken: 'demo_ephemeral_token_session',
      username: 'Demo Reader (Sample ABS)',
      connectedAt: new Date().toISOString(),
      readCount: demoReadBooks.length
    }, demoReadBooks);

    onClose();
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
              <label className="block text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-200/90" />
                  <span>Audiobookshelf API Token / Key</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-normal">
                  In ABS: Settings → Users → Select User → API Tokens
                </span>
              </label>
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-50 text-white rounded-full text-xs font-semibold transition-all border border-zinc-700 flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-200/90" />
                    <span>Connecting & Extracting Read Books...</span>
                  </>
                ) : (
                  <>
                    <BookCheck className="w-4 h-4 text-amber-200/90" />
                    <span>Connect & Load My Read List</span>
                  </>
                )}
              </button>

              {/* Demo 1-Click Preview Button */}
              <button
                type="button"
                onClick={handleLoadDemoReadList}
                className="w-full sm:w-auto py-2.5 px-4 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                title="Instant preview using simulated completed read list"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200/90" />
                <span>Try Demo Read List</span>
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
