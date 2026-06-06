/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'athlete' | 'active';

export type BMIClassification = 
  | 'Severe Underweight' 
  | 'Moderate Underweight' 
  | 'Mild Underweight' 
  | 'Healthy' 
  | 'Healthy Weight'
  | 'Overweight' 
  | 'Obesity I' 
  | 'Obesity II' 
  | 'Obesity III'
  | 'Obesity Class I'
  | 'Obesity Class II'
  | 'Obesity Class III';

export interface UserProfile {
  fullName?: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
  bmiScore?: number;
  bmiCategory?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  macros: {
    carbs: number;   // in g
    protein: number; // in g
    fat: number;     // in g
  };
  image: string;     // URL or placeholder from unsplash based on skill guidelines
  description: string;
  baseRecommendation: 'Can Eat' | 'Occasional' | 'Avoid';
  servingSize: string;
  burnMetrics: {
    walking: number; // minutes
    running: number; // minutes
    cardio: number;  // minutes
  };
}

export interface PersonalizedAdvice {
  verdict: 'Can Eat' | 'Occasional' | 'Limit / Avoid';
  colorClass: string; // Tailwind bg-colour
  textColorClass: string;
  badgeColorClass: string;
  warningText: string;
  intakeGuidance: string;
  suggestedWorkout: string;
  workoutDuration: number;
  workoutIcon: string;
}
