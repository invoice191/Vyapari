import React, { Component, ErrorInfo, ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Module: ${this.props.moduleName || 'Unknown'}`, error, errorInfo);
    
    // Log to audit_logs table with type client_error
    supabase.from('audit_logs').insert({
      action: 'client_error',
      module: this.props.moduleName || 'Unknown',
      metadata: {
        type: 'client_error',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      },
      severity: 'Error'
    }).then(({ error: logError }) => {
      if (logError) {
        console.error('[ErrorBoundary] Failed to log error to audit_logs:', logError);
      }
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="brutal-card bg-red-50 border-overdue p-10 text-center border-4 border-ink shadow-[8px_8px_0px_var(--color-ink)]">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-overdue font-black uppercase tracking-tighter mb-2">Module failed to load</h2>
          <p className="text-xs font-bold text-ink/60 uppercase tracking-widest mb-6">
            The module "{this.props.moduleName || 'System'}" encountered a critical error and has been suspended.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="brutal-btn !bg-neon !text-ink hover:!bg-neon/80"
          >
            Tap to retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
