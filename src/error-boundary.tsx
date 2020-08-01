import { ErrorInfo, PureComponent } from "react";

interface ErrorBoundaryProps {
  onError: (error: Error, errorInfo: ErrorInfo) => void;
}
interface State {
  error: Error | null;
}
export class ErrorBoundary extends PureComponent<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo);
    this.setState({ error });
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  render() {
    return this.state.error ? "" : this.props.children;
  }
}
