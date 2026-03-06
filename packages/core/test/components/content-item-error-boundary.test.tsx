import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentItemErrorBoundary } from '../../src/components/ContentItemErrorBoundary';

const ThrowingComponent = () => {
    throw new Error('Render explosion');
};

const GoodComponent = () => <div data-testid="good">OK</div>;

describe('ContentItemErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ContentItemErrorBoundary contentType="main">
                <GoodComponent />
            </ContentItemErrorBoundary>,
        );
        expect(screen.getByTestId('good')).toBeInTheDocument();
    });

    it('catches render error and shows inline error message', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ContentItemErrorBoundary contentType="carousel">
                <ThrowingComponent />
            </ContentItemErrorBoundary>,
        );
        expect(screen.getByText(/Error rendering "carousel"/)).toBeInTheDocument();
        expect(screen.getByText('Render explosion')).toBeInTheDocument();
        errorSpy.mockRestore();
    });

    it('does not crash the parent — sibling items still render', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <>
                <ContentItemErrorBoundary contentType="bad">
                    <ThrowingComponent />
                </ContentItemErrorBoundary>
                <div data-testid="sibling">Still here</div>
            </>,
        );
        expect(screen.getByText('Still here')).toBeInTheDocument();
        expect(screen.getByText(/Error rendering "bad"/)).toBeInTheDocument();
        errorSpy.mockRestore();
    });
});
