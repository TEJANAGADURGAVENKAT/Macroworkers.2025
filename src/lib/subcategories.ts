import { supabase } from '@/integrations/supabase/client';

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  skills: string[];
  category_id: string;
  category_name?: string;
}

export interface FetchSubcategoriesOptions {
  categoryName?: string;
  limit?: number;
  cursor?: string;
  orderBy?: 'name' | 'created_at';
  ascending?: boolean;
}

export interface FetchSubcategoriesResult {
  data: Subcategory[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Fetch subcategories with cursor-based pagination
 * @param options - Filtering and pagination options
 * @returns Promise with subcategories data and pagination info
 */
export async function fetchSubcategories(options: FetchSubcategoriesOptions = {}): Promise<FetchSubcategoriesResult> {
  const {
    categoryName,
    limit = 20,
    cursor,
    orderBy = 'name',
    ascending = true
  } = options;

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
      .order(orderBy, { ascending })
      .limit(limit);

    // Filter by category if specified
    if (categoryName) {
      query = query.eq('categories.name', categoryName);
    }

    // Apply cursor for pagination
    if (cursor) {
      if (ascending) {
        query = query.gt(orderBy, cursor);
      } else {
        query = query.lt(orderBy, cursor);
      }
    }

    console.log('Fetching subcategories with options:', options);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    console.log('Fetched subcategories:', data?.length || 0, 'items');

    const formattedData: Subcategory[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      skills: Array.isArray(item.skills) ? item.skills : [],
      category_id: item.category_id,
      category_name: (item.categories as any)?.name
    }));

    // Determine next cursor and hasMore
    const nextCursor = formattedData.length > 0 ? formattedData[formattedData.length - 1][orderBy] : null;
    const hasMore = formattedData.length === limit;

    return {
      data: formattedData,
      nextCursor,
      hasMore,
      totalCount: count || undefined
    };

  } catch (error: any) {
    console.error('Error fetching subcategories:', error);
    throw new Error(error.message || 'Failed to fetch subcategories');
  }
}

/**
 * Get all subcategories for a specific category (without pagination)
 * @param categoryName - The category name to filter by
 * @returns Promise with all subcategories for the category
 */
export async function getSubcategoriesByCategory(categoryName: string): Promise<Subcategory[]> {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        id,
        name,
        description,
        skills,
        category_id,
        categories!inner(name)
      `)
      .eq('categories.name', categoryName)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      skills: Array.isArray(item.skills) ? item.skills : [],
      category_id: item.category_id,
      category_name: (item.categories as any)?.name
    }));

  } catch (error: any) {
    console.error('Error fetching subcategories by category:', error);
    throw new Error(error.message || 'Failed to fetch subcategories');
  }
}

/**
 * Get skills organized by subcategory for a specific category
 * @param categoryName - The category name to get skills for
 * @returns Promise with skills organized by subcategory
 */
export async function getSkillsByCategory(categoryName: string): Promise<Record<string, string[]>> {
  try {
    const subcategories = await getSubcategoriesByCategory(categoryName);
    
    const skillsBySubcategory: Record<string, string[]> = {};
    
    subcategories.forEach(subcategory => {
      skillsBySubcategory[subcategory.name] = subcategory.skills;
    });

    return skillsBySubcategory;

  } catch (error: any) {
    console.error('Error getting skills by category:', error);
    return {};
  }
}

/**
 * Get all available categories
 * @returns Promise with all categories
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, icon, color')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];

  } catch (error: any) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message || 'Failed to fetch categories');
  }
}
