import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock useBreakpoints before importing Carousel
const mockBreakpoints = {
    isXs: false, isSm: false, isMd: false, isLg: false, isXl: false,
    isSmUp: false, isMdUp: false, isLgUp: false, isXlUp: false,
    isSmDown: false, isMdDown: false, isLgDown: false,
    breakpoints: {},
};

vi.mock('../../src/hooks/useBreakpoints', () => ({
    useBreakpoints: () => mockBreakpoints,
}));

vi.mock('../../src/hooks/useSafeTheme', () => ({
    useSafeTheme: () => ({
        colors: {
            primary: '#1976d2',
            accent: '#ff9800',
            text: '#333333',
            background: '#ffffff',
        },
        typography: {},
        spacing: {},
    }),
}));

vi.mock('../../src/components/media/Media', () => ({
    Media: ({ label }: { label: string }) => <div data-testid={`media-${label}`}>Media</div>,
}));

import { Carousel } from '../../src/components/narrative/Carousel/Carousel';

const makeItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
        title: `Item ${i + 1}`,
        text: `Description ${i + 1}`,
        media: { type: 'image' as const, src: `/img/${i + 1}.png`, alt: `Image ${i + 1}` },
    }));

describe('Carousel', () => {
    beforeEach(() => {
        // Default to desktop (lgUp) — shows 4 items
        Object.assign(mockBreakpoints, {
            isXs: false, isSm: false, isMd: false, isLg: true, isXl: false,
            isSmUp: true, isMdUp: true, isLgUp: true, isXlUp: false,
            isSmDown: false, isMdDown: false, isLgDown: false,
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders carousel items with titles and text', () => {
        render(
            <Carousel
                label="test-carousel"
                heading="Test Carousel"
                items={makeItems(3)}
            />
        );
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Description 1')).toBeInTheDocument();
    });

    it('hides navigation buttons when items fit in view', () => {
        render(
            <Carousel
                label="test-carousel"
                heading="Test Carousel"
                items={makeItems(3)}
            />
        );
        expect(screen.queryByLabelText('Previous')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Next')).not.toBeInTheDocument();
    });

    it('shows navigation buttons when items exceed visible slots', () => {
        render(
            <Carousel
                label="test-carousel"
                heading="Test Carousel"
                items={makeItems(6)}
            />
        );
        expect(screen.getByLabelText('Previous')).toBeInTheDocument();
        expect(screen.getByLabelText('Next')).toBeInTheDocument();
    });

    it('navigates forward on next button click', () => {
        render(
            <Carousel
                label="test-carousel"
                heading="Test Carousel"
                items={makeItems(6)}
            />
        );
        expect(screen.getByText('Item 1')).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Next'));
        act(() => { vi.advanceTimersByTime(200); });

        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 5')).toBeInTheDocument();
    });

    it('navigates backward on previous button click', () => {
        render(
            <Carousel
                label="test-carousel"
                heading="Test Carousel"
                items={makeItems(6)}
            />
        );

        fireEvent.click(screen.getByLabelText('Previous'));
        act(() => { vi.advanceTimersByTime(200); });

        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Item 6')).toBeInTheDocument();
    });

    describe('keyboard navigation', () => {
        it('navigates forward on ArrowRight key', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test Carousel"
                    items={makeItems(6)}
                />
            );
            const container = screen.getByRole('region');
            fireEvent.keyDown(container, { key: 'ArrowRight' });
            act(() => { vi.advanceTimersByTime(200); });

            expect(screen.getByText('Item 2')).toBeInTheDocument();
            expect(screen.getByText('Item 5')).toBeInTheDocument();
        });

        it('navigates backward on ArrowLeft key', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test Carousel"
                    items={makeItems(6)}
                />
            );
            const container = screen.getByRole('region');
            fireEvent.keyDown(container, { key: 'ArrowLeft' });
            act(() => { vi.advanceTimersByTime(200); });

            expect(screen.getByText('Item 3')).toBeInTheDocument();
            expect(screen.getByText('Item 6')).toBeInTheDocument();
        });

        it('ignores arrow keys when all items are visible', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test Carousel"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            fireEvent.keyDown(container, { key: 'ArrowRight' });
            act(() => { vi.advanceTimersByTime(200); });

            expect(screen.getByText('Item 1')).toBeInTheDocument();
            expect(screen.getByText('Item 2')).toBeInTheDocument();
            expect(screen.getByText('Item 3')).toBeInTheDocument();
        });
    });

    describe('ARIA attributes', () => {
        it('has role="region" and aria-roledescription="carousel"', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="My Carousel"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container).toHaveAttribute('aria-roledescription', 'carousel');
        });

        it('uses heading as aria-label', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Featured Items"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container).toHaveAttribute('aria-label', 'Featured Items');
        });

        it('sets aria-live="polite" when autoPlay is off', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container).toHaveAttribute('aria-live', 'polite');
        });

        it('sets aria-live="off" when autoPlay is on', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    autoPlay={true}
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container).toHaveAttribute('aria-live', 'off');
        });

        it('wraps each item with role="group" and aria-roledescription="slide"', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(3)}
                />
            );
            const slides = screen.getAllByRole('group');
            expect(slides).toHaveLength(3);
            slides.forEach(slide => {
                expect(slide).toHaveAttribute('aria-roledescription', 'slide');
            });
        });

        it('labels each slide with position info', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(3)}
                />
            );
            expect(screen.getByLabelText('Slide 1 of 3')).toBeInTheDocument();
            expect(screen.getByLabelText('Slide 2 of 3')).toBeInTheDocument();
            expect(screen.getByLabelText('Slide 3 of 3')).toBeInTheDocument();
        });
    });

    describe('focus management', () => {
        it('is focusable via tabIndex', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container).toHaveAttribute('tabIndex', '0');
        });

        it('shows focus indicator on focus', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(3)}
                />
            );
            const container = screen.getByRole('region');
            expect(container.style.outline).toBe('none');

            fireEvent.focus(container);
            expect(container.style.outline).toBe('2px solid currentColor');

            fireEvent.blur(container);
            expect(container.style.outline).toBe('none');
        });
    });

    describe('responsive behavior', () => {
        it('shows 1 item on extra small screens', () => {
            Object.assign(mockBreakpoints, {
                isXs: true, isSm: false, isMd: false, isLg: false, isXl: false,
                isSmUp: false, isMdUp: false, isLgUp: false, isXlUp: false,
            });
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(4)}
                />
            );
            const slides = screen.getAllByRole('group');
            expect(slides).toHaveLength(1);
        });

        it('shows 2 items on small screens', () => {
            Object.assign(mockBreakpoints, {
                isXs: false, isSm: true, isMd: false, isLg: false, isXl: false,
                isSmUp: true, isMdUp: false, isLgUp: false, isXlUp: false,
            });
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    items={makeItems(4)}
                />
            );
            const slides = screen.getAllByRole('group');
            expect(slides).toHaveLength(2);
        });
    });

    describe('auto-play', () => {
        it('auto-advances when autoPlay is enabled', () => {
            render(
                <Carousel
                    label="test-carousel"
                    heading="Test"
                    autoPlay={true}
                    autoPlaySpeed={1000}
                    items={makeItems(6)}
                />
            );
            expect(screen.getByText('Item 1')).toBeInTheDocument();

            act(() => { vi.advanceTimersByTime(1200); });

            expect(screen.getByText('Item 2')).toBeInTheDocument();
            expect(screen.getByText('Item 5')).toBeInTheDocument();
        });
    });
});
