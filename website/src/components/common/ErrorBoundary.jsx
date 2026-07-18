import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <span className="material-symbols-outlined text-[36px]">error</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Đã xảy ra lỗi</h1>
            <p className="mt-2 text-sm text-slate-500">
              {this.state.error?.message || "Ứng dụng gặp lỗi không mong muốn."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="btn-outline"
                onClick={this.handleReset}
              >
                Thử lại
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={this.handleReload}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
