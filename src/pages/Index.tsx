import { useState } from 'react';
import Layout from '@/components/Layout';
import HomePage from '@/components/HomePage';
import SearchPage from '@/components/SearchPage';
import ArticlePage from '@/components/ArticlePage';
import ExercisesPage from '@/components/ExercisesPage';
import CabinetPage from '@/components/CabinetPage';
import MediaUploadPage from '@/components/MediaUploadPage';

type Page = 'home' | 'search' | 'article' | 'exercises' | 'cabinet' | 'media';

export default function Index() {
  const [page, setPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<string | undefined>(undefined);

  const handleNav = (newPage: string, data?: string) => {
    setPage(newPage as Page);
    setPageData(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout page={page} onNav={handleNav}>
      {page === 'home' && <HomePage onNav={handleNav} />}
      {page === 'search' && <SearchPage initialQuery={pageData} onNav={handleNav} />}
      {page === 'article' && pageData && <ArticlePage phraseId={pageData} onNav={handleNav} />}
      {page === 'exercises' && <ExercisesPage onNav={handleNav} />}
      {page === 'cabinet' && <CabinetPage onNav={handleNav} />}
      {page === 'media' && <MediaUploadPage onNav={handleNav} />}
    </Layout>
  );
}