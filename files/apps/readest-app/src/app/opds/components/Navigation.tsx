'use client';

// Paperback: this file replaces Readest's src/app/opds/components/Navigation.tsx (AGPL-3.0, see NOTICE.md).
// Same props and behaviour (history, search, catalog facets, add to My Catalogs); new look from the
// Discover design: round chips, a pill search field, and a plain close button. Readest's desktop
// window buttons are left out (Paperback is a phone app).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IoAdd } from 'react-icons/io5';
import { useTranslation } from '@/hooks/useTranslation';
import { debounce } from '@/utils/debounce';
import { closeOPDSBrowser } from '../utils/opdsClose';
import Dropdown from '@/components/Dropdown';
import Menu from '@/components/Menu';
import MenuItem from '@/components/MenuItem';
import { OPDSFeed } from '@/types/opds';
import { useDropdownContext } from '@/context/DropdownContext';
import {
  CaretLeftIcon,
  CaretRightIcon,
  CloseIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
} from '@/components/paperback/icons';
import clsx from 'clsx';

interface NavigationProps {
  searchTerm?: string;
  onBack?: () => void;
  onForward?: () => void;
  onGoStart: () => void;
  onSearch: (queryTerm: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  hasSearch: boolean;
  feed?: OPDSFeed;
  baseURL?: string;
  resolveURL?: (url: string, base: string) => string;
  onNavigate?: (url: string) => void;
  onAddCatalog?: () => void;
}

export function Navigation({
  searchTerm,
  onBack,
  onForward,
  onGoStart,
  onSearch,
  canGoBack,
  canGoForward,
  hasSearch = false,
  feed,
  baseURL,
  resolveURL,
  onNavigate,
  onAddCatalog,
}: NavigationProps) {
  const _ = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownContext = useDropdownContext();

  useEffect(() => {
    setSearchQuery(searchTerm || '');
  }, [searchTerm]);

  useEffect(() => {
    if (hasSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasSearch]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const handleMediaChange = (e: MediaQueryListEvent) => e.matches && dropdownContext?.closeAll();

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [dropdownContext]);

  const handleClose = useCallback(() => {
    closeOPDSBrowser(router, searchParams);
  }, [router, searchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateQueryParam = useCallback(
    debounce((value: string) => {
      if (value) {
        onSearch(value);
      }
    }, 1000),
    [onSearch],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    debouncedUpdateQueryParam(newQuery);
  };

  const hasFacets = feed?.facets && feed.facets.length > 0;
  // The design's placeholder has no trailing dots.
  const placeholder = _('Search in OPDS Catalog...').replace(/(\.{3}|…)$/, '');

  return (
    <header className='pb-nav'>
      {onBack && (
        <button
          className='pb-nav-btn'
          onClick={onBack}
          disabled={!canGoBack}
          aria-label={_('Back')}
          title={_('Back')}
        >
          <CaretLeftIcon size={20} strokeWidth={2} />
        </button>
      )}
      {onForward && (
        <button
          className='pb-nav-btn'
          onClick={onForward}
          disabled={!canGoForward}
          aria-label={_('Forward')}
          title={_('Forward')}
        >
          <CaretRightIcon size={20} strokeWidth={2} />
        </button>
      )}
      <button className='pb-nav-btn' onClick={onGoStart} aria-label={_('Home')} title={_('Home')}>
        <HomeIcon size={20} />
      </button>

      <div className='pb-nav-search'>
        <input
          type='text'
          ref={inputRef}
          value={searchQuery}
          placeholder={placeholder}
          disabled={!hasSearch}
          onChange={handleSearchChange}
          spellCheck='false'
          className={clsx(searchQuery && 'has-clear')}
        />
        {searchQuery && (
          <button
            type='button'
            className='pb-nav-clear'
            onClick={() => {
              setSearchQuery('');
              onGoStart();
            }}
            aria-label={_('Clear Search')}
          >
            <CloseIcon size={16} strokeWidth={2} />
          </button>
        )}
      </div>

      {hasFacets ? (
        <div className='lg:hidden flex items-center'>
          <Dropdown
            label={_('Options')}
            className='dropdown-bottom dropdown-end'
            buttonClassName='pb-nav-btn'
            toggleButton={<SettingsIcon size={20} />}
          >
            <Menu className='dropdown-content no-triangle border-base-300 bg-base-100 z-20 mt-1 min-w-[14rem] max-h-[70vh] overflow-y-auto rounded-lg border shadow-lg'>
              {onAddCatalog && (
                <MenuItem
                  label={_('Add to My Catalogs')}
                  Icon={IoAdd}
                  onClick={onAddCatalog}
                  transient
                />
              )}

              <div
                className={clsx('flex flex-col', onAddCatalog && 'mt-1 pt-1 border-t border-base-200')}
              >
                {feed?.facets?.map((facet, i) => (
                  <div key={i} className='mb-2 last:mb-0'>
                    {facet.metadata?.title && (
                      <div className='px-4 py-2 text-xs font-semibold opacity-50 uppercase tracking-wider'>
                        {facet.metadata.title}
                      </div>
                    )}
                    {facet.links.map((link, j) => {
                      const isActiveMapped = link.rel?.includes('self');
                      const href = resolveURL ? resolveURL(link.href || '', baseURL || '') : '';
                      const labelText = link.title || _('Untitled');
                      const countText = link.properties?.numberOfItems
                        ? ` (${link.properties.numberOfItems})`
                        : '';

                      return (
                        <MenuItem
                          key={j}
                          label={`${labelText}${countText}`}
                          toggled={isActiveMapped}
                          onClick={() => {
                            if (onNavigate && href) onNavigate(href);
                          }}
                          transient
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </Menu>
          </Dropdown>
        </div>
      ) : (
        onAddCatalog && (
          <button
            className='pb-nav-btn'
            title={_('Add to My Catalogs')}
            aria-label={_('Add to My Catalogs')}
            onClick={onAddCatalog}
          >
            <PlusIcon size={20} strokeWidth={2} />
          </button>
        )
      )}

      <button className='pb-nav-close' onClick={handleClose} aria-label={_('Close')} title={_('Close')}>
        <CloseIcon size={20} strokeWidth={2} />
      </button>
    </header>
  );
}
