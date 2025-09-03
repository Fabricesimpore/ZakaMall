import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileX } from 'lucide-react';

interface DocumentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface DocumentErrorBoundaryProps {
  children: React.ReactNode;
}

class DocumentErrorBoundary extends React.Component<DocumentErrorBoundaryProps, DocumentErrorBoundaryState> {
  constructor(props: DocumentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DocumentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Document Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-red-200 rounded-lg bg-red-50">
          <FileX className="h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Document Loading Error
          </h3>
          <p className="text-red-700 mb-4 text-sm max-w-md">
            Unable to display the document. This could be due to a network issue or the document might be corrupted.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={this.retry} 
              variant="outline" 
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="ghost" 
              size="sm"
              className="text-red-600 hover:bg-red-100"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DocumentErrorBoundary;