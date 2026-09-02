/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#14171D] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl text-zinc-200 space-y-4 my-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {this.props.fallbackTitle || 'Display Recovery Mode'}
              </h3>
              <p className="text-xs text-zinc-400">
                A rendering issue was intercepted. You can safely return to the previous level or reset view.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 max-h-32 overflow-y-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
