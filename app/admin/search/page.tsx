'use client';

import { NaturalLanguageSearch } from '@/components/admin/NaturalLanguageSearch';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Search' },
        ]}
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Search</h1>
          <p className="text-gray-600 mt-1">Explore your data using natural language</p>
        </div>
      </div>

      <NaturalLanguageSearch />
    </div>
  );
}


