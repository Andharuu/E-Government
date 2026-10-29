import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FontAwesome } from './ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-[#001D39] text-slate-800 dark:text-[#BDD8E9]">
          <div className="max-w-lg w-full bg-white dark:bg-[#171F2F] border border-slate-200 dark:border-[#243048] rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto mb-5 text-rose-500">
              <FontAwesome name="triangle-exclamation" className="text-2xl" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Terjadi Kesalahan Aplikasi
            </h1>
            <p className="text-sm text-slate-600 dark:text-[#6EA2B3] mb-6 leading-relaxed">
              GovConnect mendeteksi anomali pada komponen antarmuka. Silakan coba segarkan halaman untuk melanjutkan.
            </p>

            {this.state.error && (
              <div className="mb-6 text-left p-3.5 rounded-xl bg-slate-100 dark:bg-[#101828] border border-slate-200 dark:border-[#243048] text-xs font-mono text-rose-600 dark:text-rose-400 max-h-36 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 dark:bg-[#0A4174] hover:bg-blue-700 dark:hover:bg-[#001D39] text-white transition-colors cursor-pointer shadow-sm"
              >
                <FontAwesome name="rotate-right" className="text-xs" />
                <span>Muat Ulang Halaman</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-[#243048] hover:bg-slate-200 dark:hover:bg-[#2e3e5d] text-slate-700 dark:text-white transition-colors cursor-pointer border border-slate-300 dark:border-transparent"
              >
                <FontAwesome name="house" className="text-xs" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
