/** ErrorBoundary.tsx - React Error Boundary component */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Icon from './ui/Icon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
          <div className="max-w-md w-full bg-[var(--surface-1)] rounded-[var(--radius-xl)] border border-[var(--border)] p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-light)] rounded-full flex items-center justify-center">
              <Icon name="exclamation-triangle" size="lg" className="text-[var(--danger)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-1)] mb-2">Đã xảy ra lỗi</h2>
            <p className="text-[var(--text-2)] mb-6">
              {this.state.error?.message || 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 h-10 rounded-xl bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Về trang chủ
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 h-10 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors font-medium"
              >
                Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

