import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { Search, Camera, Activity, Pill, Coffee, Thermometer, Droplet, Wind, X } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { doc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface Symptom {
  id: string;
  name: string;
  icon: any;
  remedies: {
    homemade: string[];
    medical: string[];
  };
}

const SYMPTOMS: Symptom[] = [
  {
    id: 'sick',
    name: 'Feeling Sick',
    icon: Activity,
    remedies: {
      homemade: [
        'Drink warm chicken soup',
        'Rest and stay hydrated',
        'Gargle with salt water',
      ],
      medical: [
        'Take over-the-counter pain relievers',
        'Use decongestants if needed',
        'Consider antiviral medication',
      ],
    },
  },
  {
    id: 'fatigue',
    name: 'Fatigue',
    icon: Coffee,
    remedies: {
      homemade: [
        'Get 7-9 hours of sleep',
        'Take short power naps',
        'Stay hydrated with water',
      ],
      medical: [
        'Consider vitamin B12 supplements',
        'Check iron levels',
        'Consult for potential sleep disorders',
      ],
    },
  },
  {
    id: 'hangover',
    name: 'Hangover',
    icon: Droplet,
    remedies: {
      homemade: [
        'Drink plenty of water',
        'Eat a balanced breakfast',
        'Try ginger tea for nausea',
      ],
      medical: [
        'Take electrolyte supplements',
        'Use pain relievers carefully',
        'Consider anti-nausea medication',
      ],
    },
  },
  {
    id: 'dizziness',
    name: 'Dizziness',
    icon: Wind,
    remedies: {
      homemade: [
        'Lie down in a quiet place',
        'Stay hydrated',
        'Try ginger tea',
      ],
      medical: [
        'Check blood pressure',
        'Consider motion sickness medication',
        'Get ears checked',
      ],
    },
  },
  {
    id: 'cold',
    name: 'Cold',
    icon: Thermometer,
    remedies: {
      homemade: [
        'Drink hot herbal tea',
        'Use honey and lemon',
        'Try steam inhalation',
      ],
      medical: [
        'Use nasal decongestants',
        'Take vitamin C supplements',
        'Consider zinc lozenges',
      ],
    },
  },
];

const MetricCard = ({ title, value, progress, color }: { title: string; value: string; progress: number; color: string }) => (
  <Animated.View entering={FadeInUp.delay(300)} style={styles.metricCard}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  </Animated.View>
);

export default function HomeScreen() {
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [showRemedies, setShowRemedies] = useState(false);
  const [remedyType, setRemedyType] = useState<'homemade' | 'medical'>('homemade');

  const handleSymptomSelect = (symptom: Symptom) => {
    if (selectedSymptom?.id === symptom.id) {
      setSelectedSymptom(null);
      setShowRemedies(false);
    } else {
      setSelectedSymptom(symptom);
      setShowRemedies(true);
    }
  };

  const handleUnselectSymptom = () => {
    setSelectedSymptom(null);
    setShowRemedies(false);
  };

  const saveHealthCheck = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !selectedSymptom) return;

      const healthCheckRef = doc(collection(db, 'users', userId, 'healthChecks'));
      await setDoc(healthCheckRef, {
        symptom: selectedSymptom.id,
        remedyType,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error saving health check:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown} style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.subGreeting}>How are you feeling today?</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150)} style={styles.symptomsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.symptomsScroll}>
          {SYMPTOMS.map((symptom) => {
            const Icon = symptom.icon;
            const isSelected = selectedSymptom?.id === symptom.id;
            return (
              <TouchableOpacity
                key={symptom.id}
                style={[styles.symptomCard, isSelected && styles.symptomCardSelected]}
                onPress={() => handleSymptomSelect(symptom)}>
                <Icon
                  size={24}
                  color={isSelected ? '#fff' : '#64748b'}
                />
                <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                  {symptom.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {showRemedies && selectedSymptom && (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.remediesContainer}>
          <View style={styles.remedyHeader}>
            <Text style={styles.remedyTitle}>Recommended Remedies</Text>
            <TouchableOpacity
              style={styles.unselectButton}
              onPress={handleUnselectSymptom}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.remedyTypeContainer}>
            <TouchableOpacity
              style={[styles.remedyTypeButton, remedyType === 'homemade' && styles.remedyTypeButtonActive]}
              onPress={() => setRemedyType('homemade')}>
              <Text style={[styles.remedyTypeText, remedyType === 'homemade' && styles.remedyTypeTextActive]}>
                Home Remedies
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.remedyTypeButton, remedyType === 'medical' && styles.remedyTypeButtonActive]}
              onPress={() => setRemedyType('medical')}>
              <Text style={[styles.remedyTypeText, remedyType === 'medical' && styles.remedyTypeTextActive]}>
                Medical Suggestions
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.remedyList}>
            {selectedSymptom.remedies[remedyType].map((remedy, index) => (
              <View key={index} style={styles.remedyItem}>
                <Pill size={20} color="#34d399" />
                <Text style={styles.remedyText}>{remedy}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveHealthCheck}>
            <Text style={styles.saveButtonText}>Save to Health Log</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search foods or scan barcode"
            style={styles.searchInput}
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => router.push('/(app)/scan')}>
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <MetricCard title="Daily Nutrition" value="75%" progress={75} color="#34d399" />
        <MetricCard title="Macro Tracking" value="60%" progress={60} color="#3b82f6" />
        <MetricCard title="Activity Level" value="85%" progress={85} color="#8b5cf6" />
      </View>

      <Animated.View entering={FadeInUp.delay(450)} style={styles.insightsContainer}>
        <LinearGradient
          colors={['#34d399', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.insightsGradient}>
          <Text style={styles.insightsTitle}>AI Insights</Text>
          <Text style={styles.insightsText}>
            Based on your recent meals, consider adding more protein to your breakfast. This can help maintain steady energy levels throughout the day.
          </Text>
        </LinearGradient>
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
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  symptomsContainer: {
    marginBottom: 20,
  },
  symptomsScroll: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: 'row',
  },
  symptomCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minWidth: 100,
  },
  symptomCardSelected: {
    backgroundColor: '#34d399',
  },
  symptomText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    textAlign: 'center',
  },
  symptomTextSelected: {
    color: '#fff',
  },
  remediesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  remedyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remedyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  unselectButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  remedyTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  remedyTypeButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  remedyTypeButtonActive: {
    backgroundColor: '#34d399',
  },
  remedyTypeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  remedyTypeTextActive: {
    color: '#fff',
  },
  remedyList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  remedyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  remedyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  scanButton: {
    backgroundColor: '#34d399',
    borderRadius: 8,
    padding: 8,
  },
  metricsContainer: {
    padding: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  insightsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  insightsGradient: {
    borderRadius: 16,
    padding: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    lineHeight: 20,
  },
});