import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subcategory {
  id: string;
  name: string;
  description: string;
  skills: string[];
  category_id: string;
}

interface UseSubcategoriesOptions {
  categoryName?: string;
  pageSize?: number;
}

interface UseSubcategoriesReturn {
  subcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSubcategories = (options: UseSubcategoriesOptions = {}): UseSubcategoriesReturn => {
  const { categoryName, pageSize = 10 } = options;
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchSubcategories = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('subcategories')
        .select(`
          id,
          name,
          description,
          skills,
          category_id,
          categories!inner(name)
        `)
        .order('name', { ascending: true })
        .limit(pageSize);

      // Filter by category if specified
      if (categoryName) {
        query = query.eq('categories.name', categoryName);
      }

      // Apply cursor for pagination
      if (cursor && !reset) {
        query = query.gt('name', cursor);
      }

      console.log('Fetching subcategories:', { categoryName, cursor, reset });

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      console.log('Fetched subcategories:', data?.length || 0, 'items');

      const formattedData: Subcategory[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        skills: Array.isArray(item.skills) ? item.skills : [],
        category_id: item.category_id
      }));

      if (reset) {
        setSubcategories(formattedData);
      } else {
        setSubcategories(prev => [...prev, ...formattedData]);
      }

      // Update cursor and hasMore
      if (formattedData.length > 0) {
        setCursor(formattedData[formattedData.length - 1].name);
        setHasMore(formattedData.length === pageSize);
      } else {
        setHasMore(false);
      }

    } catch (err: any) {
      console.error('Error fetching subcategories:', err);
      setError(err.message || 'Failed to fetch subcategories');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchSubcategories(false);
  };

  const refresh = async () => {
    setCursor(null);
    setHasMore(true);
    await fetchSubcategories(true);
  };

  useEffect(() => {
    if (categoryName) {
      refresh();
    }
  }, [categoryName]); // Refresh when category changes

  return {
    subcategories,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

// Hook specifically for getting skills by category
export const useSkillsByCategory = (categoryName: string) => {
  const { subcategories, loading, error } = useSubcategories({ categoryName: categoryName || undefined });

  const skillsBySubcategory = subcategories.reduce((acc, subcategory) => {
    acc[subcategory.name] = subcategory.skills;
    return acc;
  }, {} as Record<string, string[]>);

  const allSkills = subcategories.flatMap(sub => sub.skills);

  // Return empty data if no category selected or if there's an error
  if (!categoryName) {
    return {
      skillsBySubcategory: {},
      allSkills: [],
      subcategories: [],
      loading: false,
      error: null
    };
  }

  return {
    skillsBySubcategory,
    allSkills,
    subcategories,
    loading,
    error
  };
};
