'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Menu, X, Wallet, TrendingUp, ArrowLeftRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { connected } = useWallet();

  const navLinks = [
    { href: '/', label: 'Overview', icon: TrendingUp },
    { href: '/lend', label: 'Lend', icon: Wallet },
    { href: '/borrow', label: 'Borrow', icon: ArrowLeftRight },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1f1f24] bg-[#09090b]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e]">
              <TrendingUp className="h-5 w-5 text-black" />
            </div>
            <span className="text-lg font-semibold text-white">PATH</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-[#0f0f12] text-[#22c55e]'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <WalletMultiButton className="!bg-[#22c55e] !text-black !font-medium !rounded-lg !px-4 !py-2 hover:!bg-[#16a34a] transition-colors" />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-lg p-2 text-[#71717a] hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1f1f24] bg-[#09090b]">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-[#0f0f12] text-[#22c55e]'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <WalletMultiButton className="!w-full !bg-[#22c55e] !text-black !font-medium !rounded-lg !px-4 !py-2 hover:!bg-[#16a34a] transition-colors" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
