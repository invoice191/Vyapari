import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let details = null;

      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = "Database Permission Error";
            details = parsedError;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-ink flex items-center justify-center p-4 font-mono">
          <div className="max-w-2xl w-full bg-white border-4 border-ink p-8 shadow-[16px_16px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-4 mb-6 border-b-4 border-ink pb-4">
              <span className="text-4xl">⚠️</span>
              <h1 className="text-2xl font-black uppercase tracking-tighter">System_Exception_Detected</h1>
            </div>
            
            <div className="bg-red-50 border-2 border-red-500 p-4 mb-6">
              <p className="text-red-500 font-black uppercase text-sm mb-2">Error_Type: {errorMessage}</p>
              {details && (
                <div className="space-y-2 text-[10px] font-bold text-ink/60 uppercase tracking-widest">
                  <p>Operation: {details.operationType}</p>
                  <p>Path: {details.path}</p>
                  <p>User_ID: {details.authInfo.userId || "Not Authenticated"}</p>
                  <p>Message: {details.error}</p>
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-ink/60 uppercase tracking-widest leading-relaxed mb-8">
              The application encountered a critical error. This is often due to missing database permissions or a network interruption. 
              Please try refreshing the page or contacting the administrator.
            </p>

            <button 
              onClick={() => window.location.reload()}
              className="w-full brutal-btn bg-neon text-ink py-4 font-black uppercase tracking-widest"
            >
              Restart_System_Link
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
