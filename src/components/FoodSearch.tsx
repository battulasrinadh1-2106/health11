/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, AlertCircle, Apple, Flame, ChevronRight } from 'lucide-react';
import { FoodItem, BMIClassification } from '../types';
import { FOODS_DATABASE, getPersonalizedFoodIntelligence } from '../data/foods';
import FoodIntelCard from './FoodIntelCard';
import HealthMateMascot from './HealthMateMascot';
// Removed Companion3D import to specialize on professional bio-analysis panels

interface FoodSearchProps {
  bmiClassification: BMIClassification;
  userAge: number;
  activityLevel: 'sedentary' | 'moderate' | 'active';
  userGender?: 'male' | 'female' | 'other';
}

// Static synonym and regional food dictionaries for natural search expansion
const SYNONYMS_MAP: Record<string, string[]> = {
  keera: ['spinach', 'keera', 'keerai', 'greens', 'broccoli', 'palak', 'salad'],
  keerai: ['spinach', 'keera', 'keerai', 'greens', 'broccoli', 'palak', 'salad'],
  spinach: ['greens', 'keerai', 'palak', 'spinach', 'broccoli', 'salad'],
  tomato: ['tomato', 'gravy', 'rasam', 'soup', 'curry'],
  egg: ['egg', 'eggs', 'omelette', 'protein', 'boiled'],
  eggs: ['egg', 'eggs', 'omelette', 'protein', 'boiled'],
  milk: ['milk', 'dairy', 'shake', 'yogurt', 'cream', 'badam'],
  dairy: ['milk', 'yogurt', 'paneer', 'cheese'],
  rice: ['rice', 'biryani', 'masiyal', 'grain'],
  fruit: ['apple', 'banana', 'avocado', 'fruits', 'berry'],
  fruits: ['apple', 'banana', 'avocado', 'fruits', 'berry'],
  drink: ['tea', 'coffee', 'milk', 'soda', 'shake', 'juice', 'beverage'],
  drinks: ['tea', 'coffee', 'milk', 'soda', 'shake', 'juice', 'beverage'],
  veg: ['vegetable', 'veg', 'spinach', 'broccoli', 'paneer', 'salad'],
  veggies: ['vegetable', 'veg', 'spinach', 'broccoli', 'paneer', 'salad'],
  vegetables: ['vegetable', 'veg', 'spinach', 'broccoli', 'paneer', 'salad']
};

// Low-overhead Levenshtein distance calculator for intelligent phonetic/spelling approximation
function getLevenshteinDistance(s1: string, s2: string): number {
  if (s1.length < s2.length) {
    return getLevenshteinDistance(s2, s1);
  }
  if (s2.length === 0) {
    return s1.length;
  }
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] === s2[j] ? 0 : 1);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

export default function FoodSearch({ bmiClassification, userAge, activityLevel, userGender }: FoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [unhealthyCount, setUnhealthyCount] = useState<number>(0);

  // Compute reactive 3D companion advice parameters on food selections
  const foodAdvice = useMemo(() => {
    if (!selectedFood) return null;
    return getPersonalizedFoodIntelligence(selectedFood, bmiClassification, userAge, activityLevel, userGender);
  }, [selectedFood, bmiClassification, userAge, activityLevel, userGender]);

  // Determine Aura's emotion based on selection type and unhealthy count guidelines
  const companionMood = useMemo(() => {
    if (!selectedFood) return 'calm';

    const lowercaseName = selectedFood.name.toLowerCase();
    const isHealthyKeyword = lowercaseName.includes('apple') || lowercaseName.includes('banana') || lowercaseName.includes('veg') || lowercaseName.includes('sprout');
    const isModerateKeyword = lowercaseName.includes('pizza') || lowercaseName.includes('ice cream');

    // Repeated unhealthy choices -> Think Again
    if (unhealthyCount >= 2 && (selectedFood.baseRecommendation === 'Avoid' || selectedFood.calories > 350)) {
      return 'think_again';
    }

    if (selectedFood.baseRecommendation === 'Can Eat' || isHealthyKeyword) {
      return 'great_choice';
    }

    if (selectedFood.baseRecommendation === 'Occasional' || isModerateKeyword) {
      return 'enjoy_moderate';
    }

    if (selectedFood.baseRecommendation === 'Avoid') {
      return 'eat_less';
    }

    return 'thinking';
  }, [selectedFood, unhealthyCount]);

  const companionCustomText = useMemo(() => {
    if (!selectedFood) {
      return selectedCategory === 'Curated' ? "These are recommended for you." : "Search any food and I'll help.";
    }
    if (companionMood === 'think_again') {
      return `Let's choose lighter options. I'm here to help you stay on track!`;
    }
    if (companionMood === 'great_choice') {
      return `Great choice! "${selectedFood.name}" is recommended for you.`;
    }
    if (companionMood === 'enjoy_moderate') {
      return `You can enjoy "${selectedFood.name}" in moderation. Balance is everything!`;
    }
    if (companionMood === 'eat_less') {
      return `Let's minimize foods like "${selectedFood.name}". We can try healthier swaps!`;
    }
    return `Let's understand the nutrition of "${selectedFood.name}".`;
  }, [selectedFood, companionMood, selectedCategory]);

  // Synchronize dynamic search actions with our global persistent 3D companion
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('aura-buddy', {
      detail: {
        mood: selectedFood ? companionMood : 'calm',
        text: companionCustomText
      }
    }));
  }, [selectedFood, companionMood, companionCustomText]);

  // Live API-backed food states
  const [apiFoods, setApiFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch from our multi-user live backend food-search endpoint (powered by Gemini API)
  const triggerApiSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setApiFoods([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch('/api/food-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: trimmed })
      });
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setApiFoods(result.data);
      } else {
        setApiFoods([]);
      }
    } catch (err: any) {
      console.warn("API food search failed. Falling back to local static lookup database gracefully.", err);
      setApiError(err.message || 'Connection failure');
      setApiFoods([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search trigger for high-frequency typing performance
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setApiFoods([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerApiSearch(searchQuery);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Derive static categories list from BOTH local database and live loaded items
  const categories = useMemo(() => {
    const allItems = [...FOODS_DATABASE, ...apiFoods];
    const list = new Set(allItems.map(f => f.category));
    return ['All', ...Array.from(list)];
  }, [apiFoods]);

  // COMBINE AND ENHANCE SEARCH TO OPERATE COMPLETELY INSTANTLY (LOCALLY-FIRST)
  const filteredFoods = useMemo(() => {
    let result = FOODS_DATABASE;

    if (selectedCategory !== 'All') {
      result = result.filter(f => f.category === selectedCategory);
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();

      // Check for macro queries
      if (query === 'protein' || query === 'high protein' || query === 'high-protein') {
        const localMatched = result.filter(f => f.macros.protein >= 12);
        const apiMatched = apiFoods.filter(f => f.macros.protein >= 12 && !localMatched.some(l => l.id === f.id));
        return [...localMatched, ...apiMatched];
      }
      if (query === 'low fat' || query === 'low-fat') {
        const localMatched = result.filter(f => f.macros.fat <= 3);
        const apiMatched = apiFoods.filter(f => f.macros.fat <= 3 && !localMatched.some(l => l.id === f.id));
        return [...localMatched, ...apiMatched];
      }
      if (query === 'low carb' || query === 'low-carb' || query === 'keto') {
        const localMatched = result.filter(f => f.macros.carbs <= 10);
        const apiMatched = apiFoods.filter(f => f.macros.carbs <= 10 && !localMatched.some(l => l.id === f.id));
        return [...localMatched, ...apiMatched];
      }
      if (query === 'high carb' || query === 'high-carb') {
        const localMatched = result.filter(f => f.macros.carbs >= 40);
        const apiMatched = apiFoods.filter(f => f.macros.carbs >= 40 && !localMatched.some(l => l.id === f.id));
        return [...localMatched, ...apiMatched];
      }
      if (query === 'fiber' || query === 'high fiber' || query === 'soluble fiber') {
        return result.filter(f => f.description.toLowerCase().includes('fiber') || f.description.toLowerCase().includes('beta-glucan'));
      }

      // Default string match (COMPUTES 100% INSTANTLY LOCALLY)
      const localMatched = result.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.category.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
      );

      // Weave in any API search matching items on top without duplicating keys
      const apiMatched = apiFoods.filter(f => 
        (f.name.toLowerCase().includes(query) || f.description.toLowerCase().includes(query)) &&
        !localMatched.some(l => l.id === f.id)
      );

      return [...localMatched, ...apiMatched];
    }

    return result;
  }, [searchQuery, selectedCategory, apiFoods]);

  // Compute fuzzy match recommendations when the active search yields 0 items
  const spellingSuggestions = useMemo(() => {
    if (filteredFoods.length > 0 || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    
    const candidates = FOODS_DATABASE.map(food => {
      let score = 0;
      const foodName = food.name.toLowerCase();
      
      if (foodName.includes(query) || query.includes(foodName)) {
        score += 8;
      }
      
      const queryLetters = new Set(query.split(''));
      let matchedLetters = 0;
      for (const char of foodName) {
        if (queryLetters.has(char)) matchedLetters++;
      }
      score += (matchedLetters / Math.max(1, query.length)) * 4;
      
      // Calculate Levenshtein distance on starts
      const distance = getLevenshteinDistance(query.slice(0, 10), foodName.slice(0, 10));
      score -= distance * 1.5;

      return { food, score };
    });

    return candidates
      .filter(c => c.score > -10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.food);
  }, [filteredFoods.length, searchQuery]);

  // Dynamic filtered search output statistics (Realism metadata helper)
  const filterStats = useMemo(() => {
    if (filteredFoods.length === 0) return null;
    const totalCalories = filteredFoods.reduce((acc, f) => acc + f.calories, 0);
    const avgCalories = Math.round(totalCalories / filteredFoods.length);
    const avgProtein = parseFloat((filteredFoods.reduce((acc, f) => acc + f.macros.protein, 0) / filteredFoods.length).toFixed(1));
    return {
      avgCalories,
      avgProtein,
      count: filteredFoods.length,
    };
  }, [filteredFoods]);

  // COMBUTE HIGHLY INTELLIGENT SEGMENTED RESULTS (EXACT MATCH, RELATED, SIMILAR, ALTERNATIVE)
  const searchGroups = useMemo(() => {
    if (searchQuery.trim().length === 0) return null;
    const query = searchQuery.toLowerCase().trim();

    // Combine local catalog + live-fetched items
    const allCandidates = [...FOODS_DATABASE];
    apiFoods.forEach(af => {
      if (!allCandidates.some(c => c.id === af.id)) {
        allCandidates.push(af);
      }
    });

    // Expand search query with synonym matches
    const queryWords = query.split(/\s+/);
    const expandedTerms = new Set<string>([query]);
    queryWords.forEach(w => {
      expandedTerms.add(w);
      if (SYNONYMS_MAP[w]) {
        SYNONYMS_MAP[w].forEach(syn => expandedTerms.add(syn));
      }
    });

    const isMatch = (food: FoodItem, target: Set<string>) => {
      const name = food.name.toLowerCase();
      const desc = food.description.toLowerCase();
      const id = food.id.toLowerCase();
      const cat = food.category.toLowerCase();

      for (const t of target) {
        if (name.includes(t) || id.includes(t) || desc.includes(t) || cat.includes(t)) {
          return true;
        }
      }
      return false;
    };

    // 1. Exact matches: strict matching of name/ID, or direct synonym expansions
    const exactMatches = allCandidates.filter(food => {
      const name = food.name.toLowerCase();
      const id = food.id.toLowerCase();

      if (name.includes(query) || id.includes(query)) return true;

      // Handle specific regionals
      if (query === 'keera' || query === 'keerai') {
        return id.includes('keera') || name.includes('keera') || id.includes('spinach') || name.includes('spinach');
      }
      if (query === 'egg' || query === 'eggs') {
        return id.includes('egg') || name.includes('egg') || id.includes('omelette') || name.includes('omelette');
      }
      if (query === 'tomato') {
        return id.includes('tomato') || name.includes('tomato');
      }
      if (query === 'milk') {
        return id.includes('milk') || name.includes('milk') || id.includes('dairy') || name.includes('dairy') || id.includes('shake') || name.includes('shake');
      }

      return false;
    });

    const exactIds = new Set(exactMatches.map(e => e.id));

    // 2. Related foods: items containing matching tags or related categories (excluding exact)
    const relatedMatches = allCandidates.filter(food => {
      if (exactIds.has(food.id)) return false;
      return isMatch(food, expandedTerms);
    });
    const relatedIds = new Set(relatedMatches.map(r => r.id));

    // 3. Similar foods: foods in the same general categorization for diet alignment
    const activeCategories = new Set<string>();
    exactMatches.forEach(e => activeCategories.add(e.category));
    relatedMatches.forEach(r => activeCategories.add(r.category));
    if (activeCategories.size === 0) {
      activeCategories.add('Healthy');
      activeCategories.add('Indian Foods');
    }

    const similarMatches = allCandidates.filter(food => {
      if (exactIds.has(food.id) || relatedIds.has(food.id)) return false;
      return activeCategories.has(food.category);
    });
    const similarIds = new Set(similarMatches.map(s => s.id));

    // 4. Alternative healthy choices: whole greens, unprocessed fruits/nutrients recommended as 'Can Eat'
    const healthyAlternatives = allCandidates.filter(food => {
      if (exactIds.has(food.id) || relatedIds.has(food.id) || similarIds.has(food.id)) return false;
      return food.baseRecommendation === 'Can Eat';
    });

    return {
      exact: exactMatches.slice(0, 4),
      related: relatedMatches.slice(0, 4),
      similar: similarMatches.slice(0, 3),
      alternatives: healthyAlternatives.slice(0, 4)
    };
  }, [searchQuery, apiFoods]);

  const renderFoodButton = (food: FoodItem) => {
    const isCurrentlySelected = selectedFood?.id === food.id;
    let badgeColor = 'bg-yellow-500/10 text-yellow-500';
    if (food.baseRecommendation === 'Can Eat') {
      badgeColor = 'bg-emerald-500/10 text-emerald-400';
    } else if (food.baseRecommendation === 'Avoid') {
      badgeColor = 'bg-red-500/10 text-red-500';
    }

    return (
      <button
        id={`food-result-item-${food.id}`}
        key={food.id}
        onClick={() => handleSelectFood(food)}
        className={`w-full text-left p-3.5 flex items-center justify-between transition-all cursor-pointer focus:outline-none ${
          isCurrentlySelected 
            ? 'bg-slate-900/85 border-l-2 border-emerald-500 pl-2.5' 
            : 'hover:bg-slate-900/30'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800">
            <img
              src={food.image}
              alt={food.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs md:text-sm font-semibold text-slate-200 tracking-tight flex items-center gap-1.5 truncate">
              {food.name}
              {isCurrentlySelected && <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </h4>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                {food.calories} kCal
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-800 shrink-0" />
              <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">
                P: {food.macros.protein}g • F: {food.macros.fat}g • C: {food.macros.carbs}g
              </span>
            </div>
          </div>
        </div>

        <span className={`text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-md font-bold shrink-0 text-center ml-2 ${badgeColor}`}>
          {food.baseRecommendation === 'Can Eat' ? 'EAT' : food.baseRecommendation === 'Occasional' ? 'LIMIT' : 'AVOID'}
        </span>
      </button>
    );
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const isUnhealthy = food.baseRecommendation === 'Avoid' || food.calories > 350;
    if (isUnhealthy) {
      setUnhealthyCount(prev => prev + 1);
    } else if (food.baseRecommendation === 'Can Eat') {
      setUnhealthyCount(prev => Math.max(0, prev - 1));
    }
    // Smooth scrolling to details card
    setTimeout(() => {
      document.getElementById('food-intel-card-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Profile-Adaptive popular suggestion directives (highly personalized depending on user's active BMI classification)
  const POPULAR_SUGGESTIONS = useMemo(() => {
    if (bmiClassification.startsWith('Obesity') || bmiClassification === 'Overweight') {
      return [
        { label: 'Organic Green Tea', id: 'green_tea' },
        { label: 'Low-Fat Greek Yogurt', id: 'greek_yogurt' },
        { label: 'Garlic Steamed Broccoli', id: 'broccoli' },
        { label: 'Yellow Dal Tadka', id: 'dal_tadka' },
        { label: 'Pan-Seared Salmon', id: 'salmon' },
        { label: 'Superfood Quinoa Bowl', id: 'quinoa_bowl' }
      ];
    } else if (bmiClassification.includes('Underweight')) {
      return [
        { label: 'Fresh Creamy Avocado', id: 'creamy_avocado' },
        { label: 'Classic Cheeseburger', id: 'burger' },
        { label: 'Spiced Paneer Tikka', id: 'paneer_tikka' },
        { label: 'Premium Whey Shake', id: 'whey_protein' },
        { label: 'Chicken Biryani', id: 'chicken_biryani' },
        { label: 'Boiled Eggs', id: 'boiled_eggs' }
      ];
    } else {
      return [
        { label: 'Steamed Idli', id: 'idli' },
        { label: 'Dynamic Oats Oatmeal', id: 'oatmeal' },
        { label: 'Fresh Creamy Avocado', id: 'creamy_avocado' },
        { label: 'Boiled Eggs', id: 'boiled_eggs' },
        { label: 'Delicate Palak Paneer', id: 'palak_paneer' },
        { label: 'Plain Masala Dosa', id: 'dosa' }
      ];
    }
  }, [bmiClassification]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-800/80 p-5 md:p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs font-bold font-mono tracking-wider text-emerald-400 uppercase mb-2">
          <Sparkles className="w-4 h-4" />
          Intel search & dynamic spell assistance
        </div>
        <h3 id="search-title" className="font-display text-xl font-bold text-slate-100">
          Analyze Food Intelligence
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-normal max-w-lg mb-4">
          Type foods or try macro filters like <span className="text-emerald-400 font-mono font-semibold">"high protein"</span>, <span className="text-emerald-400 font-mono font-semibold">"low fat"</span>, or <span className="text-emerald-400 font-mono font-semibold">"keto"</span> to analyze live parameters parsed for your profile. 
        </p>

        {/* Search Input field */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="food-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search noodles, avocado, eggs, shake, high protein..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans transition-all focus:ring-1 focus:ring-emerald-500/20"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-slate-300 px-1 text-xs font-mono font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Profile-Tailored Suggestions */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            DIRECTIVES TAILORED FOR YOUR {bmiClassification.toUpperCase()} PROFILE:
          </div>
          <div id="tailored-suggestion-container" className="flex flex-wrap gap-2">
            {POPULAR_SUGGESTIONS.map((s) => {
              const item = FOODS_DATABASE.find(f => f.id === s.id);
              return (
                <button
                  id={`suggest-${s.id}`}
                  key={s.id}
                  onClick={() => item && handleSelectFood(item)}
                  className="px-3 py-1.5 rounded-full border border-slate-800/80 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Apple className="w-3 h-3 text-emerald-500/80" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Search results on left, Food Intelligence card on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Results & Category Filters (occupies 5 columns on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Category Filter Pills & Insights counter */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {categories.map((cat) => (
                <button
                  id={`cat-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1.5 px-3 rounded-full text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-semibold'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Smart stats display for food search realism */}
            {filterStats && (
              <div className="space-y-2">
                <div id="search-statistics-bar" className="flex items-center justify-between text-[10px] font-mono font-semibold bg-slate-900/20 border border-slate-900 rounded-xl px-3 py-1 text-slate-400">
                  <span>{filterStats.count} items matches found</span>
                  <span className="text-emerald-400/90">Avg: {filterStats.avgCalories} kCal • P: {filterStats.avgProtein}g</span>
                </div>
                
                {/* Visual Recommendation Banner */}
                <div className="p-2.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-405 text-xs font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-sans text-slate-300">
                    🌱 "I found some recommendations for you."
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-slate-950 px-2 py-0.5 rounded-md">
                    Curated
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* List items holding foods */}
          <div className="bg-slate-905 border border-slate-850 rounded-3xl overflow-hidden max-h-[460px] overflow-y-auto pr-1">
            {isLoading ? (
              <div id="searching-loader-indicator" className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-4 bg-slate-900/5">
                <div className="relative w-8 h-8">
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-slate-800/40 animate-pulse" />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-emerald-400/90 tracking-widest uppercase animate-pulse">Analyzing Nutrition Profile...</p>
                  <p className="text-[9px] text-slate-500 font-medium font-sans">Analyzing food suitability & biochemical markers against biometrics...</p>
                </div>
              </div>
            ) : filteredFoods.length > 0 ? (
              <div id="food-results-list" className="divide-y divide-slate-900">
                {searchQuery.trim().length > 0 && searchGroups ? (
                  <div className="space-y-4 p-2 bg-slate-950/20">
                    {/* 1. Exact Matches */}
                    {searchGroups.exact.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono font-extrabold text-emerald-400 uppercase tracking-wider px-1.5 pt-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          🎯 Exact Match
                        </div>
                        <div className="bg-slate-900/65 rounded-2xl overflow-hidden border border-slate-800/80 divide-y divide-slate-900 shadow-lg">
                          {searchGroups.exact.map((food) => renderFoodButton(food))}
                        </div>
                      </div>
                    )}

                    {/* 2. Related Foods */}
                    {searchGroups.related.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono font-extrabold text-teal-400 uppercase tracking-wider px-1.5 pt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          🌿 Related Foods
                        </div>
                        <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-800/50 divide-y divide-slate-900/60">
                          {searchGroups.related.map((food) => renderFoodButton(food))}
                        </div>
                      </div>
                    )}

                    {/* 3. Similar Foods */}
                    {searchGroups.similar.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono font-extrabold text-amber-500/80 uppercase tracking-wider px-1.5 pt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          🥗 Similar Foods
                        </div>
                        <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-805 divide-y divide-slate-900/60">
                          {searchGroups.similar.map((food) => renderFoodButton(food))}
                        </div>
                      </div>
                    )}

                    {/* 4. Alternative Healthy Choices */}
                    {searchGroups.alternatives.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono font-extrabold text-sky-400 uppercase tracking-wider px-1.5 pt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          ✨ Alternative Healthy Choices
                        </div>
                        <div className="bg-slate-900/45 rounded-2xl overflow-hidden border border-slate-800/40 divide-y divide-slate-900/50">
                          {searchGroups.alternatives.map((food) => renderFoodButton(food))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredFoods.map((food) => renderFoodButton(food))
                )}
              </div>
            ) : (
              <div id="empty-search-state" className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3 bg-slate-900/5">
                <AlertCircle className="w-7 h-7 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-400">No exact parameters located.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Try another keyword or search term.</p>
                </div>

                {/* Spell Assistance Heuristic rendering */}
                {spellingSuggestions.length > 0 && (
                  <div id="spellchecker-suggestions-panel" className="mt-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-900 w-full text-left space-y-2">
                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Did you mean?</p>
                    <div className="flex flex-col gap-1.5">
                      {spellingSuggestions.map(food => (
                        <button
                          id={`spellcheck-suggest-${food.id}`}
                          key={food.id}
                          onClick={() => {
                            setSearchQuery(food.name);
                            handleSelectFood(food);
                          }}
                          className="flex items-center justify-between text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-slate-900/60 p-1.5 rounded-xl transition-colors w-full text-left cursor-pointer"
                        >
                          <span>{food.name}</span>
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{food.category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  id="reset-search-btn"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="text-emerald-500 hover:text-emerald-400 underline font-mono text-[10px] mt-2 cursor-pointer"
                >
                  Reset all query filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: The details card anchor (occupies 7 columns on desktop) */}
        <div id="food-intel-card-anchor" className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedFood ? (
              <motion.div 
                key={selectedFood.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Premium Health Assistant Assessment banner */}
                <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-[20px] flex items-center gap-4 relative overflow-hidden backdrop-blur-md text-left">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.01] to-transparent pointer-events-none" />
                  <div className="shrink-0 flex items-center justify-center">
                    <HealthMateMascot 
                      size="lg" 
                      expression={
                        companionMood === 'think_again' || companionMood === 'eat_less'
                          ? 'concerned'
                          : companionMood === 'great_choice'
                            ? 'excited'
                            : companionMood === 'enjoy_moderate' 
                              ? 'calm'
                              : 'thoughtful'
                      } 
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-[9px] font-mono tracking-widest text-[#10b981] font-extrabold uppercase block">HEALTHMATE ASSESSMENT</span>
                    <p className="text-xs text-slate-250 font-sans leading-relaxed mt-1 text-slate-200 animate-fade-in">
                      "{companionCustomText}"
                    </p>
                  </div>
                </div>

                <FoodIntelCard
                  food={selectedFood as FoodItem}
                  bmiClassification={bmiClassification}
                  userAge={userAge}
                  activityLevel={activityLevel}
                  userGender={userGender}
                  onClose={() => setSelectedFood(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Highlight active dynamic suitabilities bar */}
                <div className="bg-slate-900/30 border border-dashed border-slate-800/80 p-5 rounded-[20px] flex gap-3.5 items-center">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 border border-slate-850">
                    <Apple className="w-5.5 h-5.5 text-slate-500 animate-pulse" />
                  </div>
                  <div className="flex-1 text-left space-y-0.5">
                    <span className="text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase block">Dietary Suitability Index</span>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed flex items-center gap-2">
                       Select or search for any item to calculate biochemical compatibility indicators and healthy recommendations.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-800/80 p-8 text-center bg-slate-900/10 flex flex-col items-center justify-center">
                  <div className="mb-2 flex items-center justify-center">
                    <HealthMateMascot size="xl" expression="happy" />
                  </div>
                  <h4 className="font-display font-semibold text-slate-300 text-sm mt-1">HealthMate Food Intelligence</h4>
                  <p className="text-sm font-semibold text-emerald-400 mt-1.5 font-sans">
                     "Search any food and I'll help you make smarter choices."
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed font-sans">
                     I'm here to analyze your food choices! Tap any of the curated foods on the left or type search queries to test nutritional suitability against your blood pressure, BMI, and calorie levels.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
