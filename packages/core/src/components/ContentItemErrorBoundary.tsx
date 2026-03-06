import React from 'react';

interface ContentItemErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ContentItemErrorBoundaryProps {
    contentType: string;
    label?: string;
    children: React.ReactNode;
}

export class ContentItemErrorBoundary extends React.Component<
    ContentItemErrorBoundaryProps,
    ContentItemErrorBoundaryState
> {
    state: ContentItemErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ContentItemErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(
            `[Stackwright] Error rendering content type "${this.props.contentType}":`,
            error,
            info,
        );
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: '16px',
                        margin: '8px 0',
                        border: '1px solid #d32f2f',
                        borderRadius: '4px',
                        backgroundColor: '#fce4ec',
                        color: '#b71c1c',
                    }}
                >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>
                        Error rendering &quot;{this.props.contentType}&quot;
                    </strong>
                    <pre
                        style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                        }}
                    >
                        {this.state.error?.message ?? 'Unknown error'}
                    </pre>
                </div>
            );
        }
        return (
            <div
                data-content-type={this.props.contentType}
                {...(this.props.label ? { 'data-label': this.props.label } : {})}
            >
                {this.props.children}
            </div>
        );
    }
}
