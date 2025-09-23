import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubcategories, useSkillsByCategory } from '@/hooks/useSubcategories';
import { Loader2, Database, ArrowRight } from 'lucide-react';

const SubcategoryDemo = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Fetch subcategories for the selected category
  const { subcategories, loading, error, hasMore, loadMore } = useSubcategories({
    categoryName: selectedCategory,
    pageSize: 5
  });

  // Get skills organized by subcategory
  const { skillsBySubcategory, allSkills, loading: skillsLoading } = useSkillsByCategory(selectedCategory);

  const categories = ['IT', 'Digital Marketing', 'Blockchain/AI'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dynamic Subcategory Fetching Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This demo shows how subcategories are fetched dynamically from the database with cursor-based pagination.
            Select a category to see its subcategories and skills.
          </p>
        </div>

        {/* Category Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Select Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label>Choose a category to fetch its subcategories:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedCategory && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Subcategories List */}
            <Card>
              <CardHeader>
                <CardTitle>Subcategories for {selectedCategory}</CardTitle>
                <p className="text-sm text-gray-600">
                  Fetched with cursor-based pagination (5 per page)
                </p>
              </CardHeader>
              <CardContent>
                {loading && subcategories.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading subcategories...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-center py-8">
                    Error: {error}
                  </div>
                ) : subcategories.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No subcategories found for {selectedCategory}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subcategories.map((subcategory, index) => (
                      <div key={subcategory.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {index + 1}. {subcategory.name}
                          </h3>
                          <Badge variant="outline">
                            {subcategory.skills.length} skills
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {subcategory.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {subcategory.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {subcategory.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{subcategory.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button 
                          onClick={loadMore} 
                          disabled={loading}
                          variant="outline"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills by Subcategory */}
            <Card>
              <CardHeader>
                <CardTitle>Skills by Subcategory</CardTitle>
                <p className="text-sm text-gray-600">
                  All skills organized by subcategory
                </p>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading skills...</span>
                  </div>
                ) : Object.keys(skillsBySubcategory).length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No skills found for {selectedCategory}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(skillsBySubcategory).map(([subcategory, skills]) => (
                      <div key={subcategory}>
                        <h4 className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">
                          {subcategory}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {skills.map((skill, index) => (
                            <div key={skill} className="flex items-center space-x-2 p-2 bg-white rounded border">
                              <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                              <span className="text-sm">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Total Skills: {allSkills.length}</span>
                        <span>Subcategories: {Object.keys(skillsBySubcategory).length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedCategory && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">Select a category above to see its subcategories</p>
                <p className="text-sm">
                  This demo will fetch subcategories dynamically from the database with cursor-based pagination
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubcategoryDemo;
