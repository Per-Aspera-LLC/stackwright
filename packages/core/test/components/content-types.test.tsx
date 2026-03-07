import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FeatureList } from '../../src/components/base/FeatureList';
import { TestimonialGrid } from '../../src/components/base/TestimonialGrid';
import { Faq } from '../../src/components/base/Faq';
import { PricingTable } from '../../src/components/base/PricingTable';
import { ContactFormStub } from '../../src/components/base/ContactFormStub';
import { Alert } from '../../src/components/base/Alert';
import { MainContentGrid } from '../../src/components/base/MainContentGrid';

describe('FeatureList', () => {
  it('renders heading and feature items', () => {
    render(
      <FeatureList
        label="features"
        heading={{ text: 'Our Features', textSize: 'h3' }}
        items={[
          { heading: 'Fast', description: 'Lightning fast performance' },
          { heading: 'Secure', description: 'Enterprise-grade security' },
        ]}
      />
    );
    expect(screen.getByText('Our Features')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('Lightning fast performance')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
  });

  it('renders without heading', () => {
    render(
      <FeatureList label="features" items={[{ heading: 'Simple', description: 'Easy to use' }]} />
    );
    expect(screen.getByText('Simple')).toBeInTheDocument();
  });
});

describe('TestimonialGrid', () => {
  it('renders testimonial items with quotes and names', () => {
    render(
      <TestimonialGrid
        label="testimonials"
        heading={{ text: 'What People Say', textSize: 'h3' }}
        items={[
          { quote: 'Great product!', name: 'Alice', role: 'CEO', company: 'Acme' },
          { quote: 'Love it!', name: 'Bob' },
        ]}
      />
    );
    expect(screen.getByText('What People Say')).toBeInTheDocument();
    expect(screen.getByText(/Great product!/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('CEO, Acme')).toBeInTheDocument();
    expect(screen.getByText(/Love it!/)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders without role and company', () => {
    render(<TestimonialGrid label="testimonials" items={[{ quote: 'Nice!', name: 'Charlie' }]} />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });
});

describe('Faq', () => {
  it('renders FAQ items as details/summary elements', () => {
    render(
      <Faq
        label="faq"
        heading={{ text: 'FAQ', textSize: 'h3' }}
        items={[
          { question: 'What is this?', answer: 'A framework.' },
          { question: 'Is it free?', answer: 'Yes, open source.' },
        ]}
      />
    );
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('What is this?')).toBeInTheDocument();
    expect(screen.getByText('A framework.')).toBeInTheDocument();
    expect(screen.getByText('Is it free?')).toBeInTheDocument();
  });
});

describe('PricingTable', () => {
  it('renders pricing plans with features and CTAs', () => {
    render(
      <PricingTable
        label="pricing"
        heading={{ text: 'Pricing', textSize: 'h3' }}
        plans={[
          {
            name: 'Free',
            price: '$0/mo',
            features: ['1 user', 'Basic support'],
            cta_text: 'Get Started',
            cta_href: '/signup',
          },
          {
            name: 'Pro',
            price: '$29/mo',
            description: 'For growing teams',
            features: ['10 users', 'Priority support'],
            highlighted: true,
            cta_text: 'Upgrade',
            cta_href: '/upgrade',
          },
        ]}
      />
    );
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$0/mo')).toBeInTheDocument();
    expect(screen.getByText('1 user')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('$29/mo')).toBeInTheDocument();
    expect(screen.getByText('For growing teams')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument(); // default badge
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('renders custom badge text when provided', () => {
    render(
      <PricingTable
        label="pricing"
        plans={[
          {
            name: 'Enterprise',
            price: 'Custom',
            features: ['Unlimited'],
            highlighted: true,
            badge_text: 'Best Value',
            cta_text: 'Contact Sales',
            cta_href: '/contact',
          },
        ]}
      />
    );
    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });
});

describe('ContactFormStub', () => {
  it('renders contact information with mailto link', () => {
    render(
      <ContactFormStub
        label="contact"
        heading={{ text: 'Get in Touch', textSize: 'h3' }}
        description="We would love to hear from you."
        email="hello@example.com"
        phone="+1-555-0100"
        address="123 Main St, City"
      />
    );
    expect(screen.getByText('Get in Touch')).toBeInTheDocument();
    expect(screen.getByText('We would love to hear from you.')).toBeInTheDocument();
    expect(screen.getByText('hello@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0100')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, City')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument(); // default button
  });

  it('renders custom button text', () => {
    render(<ContactFormStub label="contact" email="test@example.com" button_text="Send Email" />);
    expect(screen.getByText('Send Email')).toBeInTheDocument();
  });

  it('includes email subject in mailto link', () => {
    render(
      <ContactFormStub
        label="contact"
        email="test@example.com"
        email_subject="Hello from website"
      />
    );
    const link = screen.getByText('test@example.com').closest('a');
    expect(link?.getAttribute('href')).toBe(
      'mailto:test@example.com?subject=Hello%20from%20website'
    );
  });
});

describe('Alert', () => {
  it('renders alert with title and body', () => {
    render(
      <Alert
        label="alert-info"
        variant="info"
        title="Did you know?"
        body="Stackwright compiles YAML to React."
      />
    );
    expect(screen.getByText('Did you know?')).toBeInTheDocument();
    expect(screen.getByText('Stackwright compiles YAML to React.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders alert without title', () => {
    render(<Alert label="alert-warning" variant="warning" body="This action cannot be undone." />);
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders danger variant', () => {
    render(
      <Alert label="alert-danger" variant="danger" title="Error" body="Something went wrong." />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });
});

describe('FeatureList responsive', () => {
  it('uses auto-fill grid for responsive columns', () => {
    const { container } = render(
      <FeatureList label="features" items={[{ heading: 'A', description: 'B' }]} />
    );
    const gridDiv = Array.from(container.querySelectorAll('div')).find((el) =>
      (el as HTMLElement).style.gridTemplateColumns?.includes('auto-fill')
    );
    expect(gridDiv).toBeTruthy();
  });
});

describe('TestimonialGrid responsive', () => {
  it('uses auto-fill grid for responsive columns', () => {
    const { container } = render(
      <TestimonialGrid label="testimonials" items={[{ quote: 'Great!', name: 'Alice' }]} />
    );
    const gridDiv = Array.from(container.querySelectorAll('div')).find((el) =>
      (el as HTMLElement).style.gridTemplateColumns?.includes('auto-fill')
    );
    expect(gridDiv).toBeTruthy();
  });
});

describe('MainContentGrid', () => {
  it('renders heading and text content', () => {
    render(
      <MainContentGrid
        label="hero"
        heading={{ text: 'Welcome', textSize: 'h2' }}
        textBlocks={[{ text: 'Hello world' }]}
      />
    );
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('uses flex-wrap for responsive stacking', () => {
    const { container } = render(
      <MainContentGrid label="hero" heading={{ text: 'Hello', textSize: 'h2' }} />
    );
    const flexDiv = Array.from(container.querySelectorAll('div')).find(
      (el) => (el as HTMLElement).style.flexWrap === 'wrap'
    );
    expect(flexDiv).toBeTruthy();
  });
});
