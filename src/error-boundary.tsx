import React, { ErrorInfo, PureComponent } from "react";

const Wrap = ({ children }: { children: unknown }) => {
  return <>{children}</>;
};

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
  }
  componentDidUpdate(
    prevProps: ErrorBoundaryProps &
      Readonly<{
        children?: React.ReactNode;
      }>,
    _prevState: any
  ) {
    if (this.props.children !== prevProps.children) {
      this.setState({ error: null });
    }
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  render() {
    return this.state.error ? "" : <Wrap>{this.props.children}</Wrap>;
  }
}
