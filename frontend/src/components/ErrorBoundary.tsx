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
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-canvas text-ink">
          <div className="w-full max-w-[440px] card p-7 text-center">
            <div className="w-10 h-10 rounded-md bg-danger-soft border border-danger-line flex items-center justify-center mx-auto mb-4 text-danger">
              <FontAwesome name="triangle-exclamation" className="text-[15px]" />
            </div>

            <h1 className="text-[17px] font-semibold text-ink">Terjadi kesalahan aplikasi</h1>
            <p className="text-[12.5px] text-ink-2 mt-1.5 mb-5 leading-relaxed">
              GovConnect mendeteksi anomali pada komponen antarmuka. Segarkan halaman untuk
              melanjutkan.
            </p>

            {this.state.error && (
              <div className="mb-5 text-left p-3 rounded-md bg-surface-3 border border-line text-[11px] mono text-danger max-h-32 overflow-y-auto break-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button type="button" onClick={this.handleReload} className="btn btn-primary w-full sm:w-auto">
                <FontAwesome name="rotate-right" className="text-[11px]" />
                Muat ulang halaman
              </button>
              <button type="button" onClick={this.handleGoHome} className="btn btn-secondary w-full sm:w-auto">
                <FontAwesome name="grid" className="text-[11px]" />
                Ke beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
