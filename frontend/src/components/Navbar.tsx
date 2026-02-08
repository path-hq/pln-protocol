'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Menu, X, Wallet, ArrowLeftRight, Home, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/borrow', label: 'Borrow', icon: ArrowLeftRight },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#222222] bg-[#000000]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/logos/path-icon.png" 
              alt="PATH" 
              className="h-8 w-8 rounded-lg"
            />
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
                      ? 'bg-[#111111] text-[#00FFB8]'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Wallet Button - Custom styled */}
          <div className="hidden md:block">
            <button
              onClick={handleConnect}
              className="bg-[#00FFB8] text-black font-medium text-sm rounded-full px-4 py-1.5 hover:bg-[#00E6A5] transition-colors"
            >
              {connected && publicKey ? formatAddress(publicKey.toBase58()) : 'Connect'}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden rounded-lg p-2 text-[#888888] hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#222222] bg-[#000000]">
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
                      ? 'bg-[#111111] text-[#00FFB8]'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2">
              <button
                onClick={handleConnect}
                className="w-full bg-[#00FFB8] text-black font-medium text-sm rounded-full px-4 py-2 hover:bg-[#00E6A5] transition-colors"
              >
                {connected && publicKey ? formatAddress(publicKey.toBase58()) : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
