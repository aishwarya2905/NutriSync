import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Leaf, Scale, Heart } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface NutritionData {
  product_name: string;
  categories: string;
  ingredients_text: string;
  nutrition_grade_fr: string;
  energy_100g: number;
  proteins_100g: number;
  carbohydrates_100g: number;
  fat_100g: number;
  fiber_100g: number;
  sodium_100g: number;
  [key: string]: any;
}

export default function AnalysisScreen() {
  const params = useLocalSearchParams();
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (params.data) {
          setData(JSON.parse(params.data as string));
        } else if (params.barcode) {
          const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ barcode: '0009800600106' }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch product data');
          }
          
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Analyzing product...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'No data available'}</Text>
      </View>
    );
  }

  const nutritionScore = data.nutrition_grade_fr?.toLowerCase() || 'e';
  const scoreColors: { [key: string]: readonly [string, string] } = {
    a: ['#34d399', '#10b981'],
    b: ['#60a5fa', '#3b82f6'],
    c: ['#fbbf24', '#f59e0b'],
    d: ['#fb923c', '#f97316'],
    e: ['#f87171', '#ef4444'],
  };
  

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={scoreColors[nutritionScore] || scoreColors.e}
        style={styles.header}
      >
        <Text style={styles.productName}>{data.product_name}</Text>
        {data.categories && (
          <Text style={styles.category}>{data.categories}</Text>
        )}
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Nutrition Score</Text>
          <Text style={styles.score}>{nutritionScore.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
        <Text style={styles.sectionTitle}>Key Nutrients</Text>
        <View style={styles.nutrientsGrid}>
          <View style={styles.nutrientCard}>
            <Scale size={24} color="#3b82f6" />
            <Text style={styles.nutrientValue}>{data.energy_100g}kcal</Text>
            <Text style={styles.nutrientLabel}>Energy</Text>
          </View>
          <View style={styles.nutrientCard}>
            <Heart size={24} color="#ef4444" />
            <Text style={styles.nutrientValue}>{data.proteins_100g}g</Text>
            <Text style={styles.nutrientLabel}>Protein</Text>
          </View>
          <View style={styles.nutrientCard}>
            <Leaf size={24} color="#34d399" />
            <Text style={styles.nutrientValue}>{data.fiber_100g}g</Text>
            <Text style={styles.nutrientLabel}>Fiber</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.ingredients}>{data.ingredients_text}</Text>
      </Animated.View>

      {data.additives && (
        <Animated.View entering={FadeInUp.delay(600)} style={styles.section}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={20} color="#f97316" />
            <Text style={styles.warningTitle}>Additives Found</Text>
          </View>
          <Text style={styles.additives}>{data.additives}</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(800)} style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Detailed Nutrition</Text>
        <View style={styles.nutritionTable}>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Carbohydrates</Text>
            <Text style={styles.nutritionValue}>{data.carbohydrates_100g}g</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <Text style={styles.nutritionValue}>{data.fat_100g}g</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionLabel}>Sodium</Text>
            <Text style={styles.nutritionValue}>{data.sodium_100g}g</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.8,
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    opacity: 0.8,
    marginBottom: 8,
  },
  score: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  nutrientsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  nutrientCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  nutrientValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 8,
  },
  nutrientLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  ingredients: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    lineHeight: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#f97316',
  },
  additives: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    lineHeight: 24,
  },
  nutritionTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  nutritionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
  },
});