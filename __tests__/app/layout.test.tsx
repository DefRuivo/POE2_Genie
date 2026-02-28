import React from 'react';
import RootLayout, { metadata } from '@/app/layout';

jest.mock('@/components/Providers', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="provider">{children}</div>,
}));

jest.mock('@/components/LayoutWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout-wrapper">{children}</div>,
}));

describe('app/layout', () => {
  it('exports expected metadata', () => {
    expect(metadata.title).toBe('POE2 Genie | Path of Exile Build Intelligence');
    expect(metadata.description).toBe('Your hideout build strategist for Party, Stash, and Checklist.');
  });

  it('builds html/body layout tree with provider and wrapper', () => {
    const tree = RootLayout({ children: <div id="child">Child</div> }) as React.ReactElement;

    expect(tree.type).toBe('html');
    expect(tree.props.lang).toBe('en');
    expect(tree.props.suppressHydrationWarning).toBe(true);

    const body = tree.props.children as React.ReactElement;
    expect(body.type).toBe('body');
    expect(String(body.props.className)).toContain('poe-shell');

    const provider = body.props.children as React.ReactElement;
    expect(typeof provider.type).toBe('function');

    const wrapper = provider.props.children as React.ReactElement;
    expect(typeof wrapper.type).toBe('function');

    const child = wrapper.props.children as React.ReactElement;
    expect(child.props.id).toBe('child');
    expect(child.props.children).toBe('Child');
  });
});
