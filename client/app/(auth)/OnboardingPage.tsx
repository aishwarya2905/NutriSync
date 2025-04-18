import React from 'react';
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Check, Plus, X, ChevronLeft, Camera, Upload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import UnitInput from '@/components/UnitInput';
import { convertHeight, convertWeight } from '@/lib/utils/units';
import * as ImagePicker from 'expo-image-picker';
import * as yup from 'yup';

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Low Carb',
  'Gluten Free',
  'Lactose Free',
  'Keto',
  'Paleo',
];

const CONNECTED_APPS = [
  { id: 'apple_health', name: 'Apple Health', icon: '🍎' },
  { id: 'google_fit', name: 'Google Fit', icon: '🏃' },
  { id: 'fitbit', name: 'Fitbit', icon: '⌚' },
  { id: 'myfitnesspal', name: 'MyFitnessPal', icon: '📱' },
];

interface UserProfile {
  nickname: string;
  bio: string;
  dateOfBirth: Date;
  weight: string;
  height: string;
  dietaryRestrictions: string[];
  hasMedicalConditions: boolean;
  medicalConditions: Array<{
    condition: string;
    medication: string;
    duration: string;
  }>;
  substanceUse: {
    alcohol: boolean;
    smoking: boolean;
    other: string;
  };
  allergies: string[];
  connectedApps: string[];
  profileImage?: string;
}

const validationSchema = yup.object().shape({
  nickname: yup.string().required('Nickname is required'),
  dateOfBirth: yup.date().required('Date of birth is required').max(new Date(), 'Date cannot be in the future'),
  height: yup.string().required('Height is required'),
  weight: yup.string().required('Weight is required'),
  dietaryRestrictions: yup.array().of(yup.string()),
  allergies: yup.array().of(yup.string()),
  profileImage: yup.string().optional(),
});

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useImperialHeight, setUseImperialHeight] = useState(false);
  const [useImperialWeight, setUseImperialWeight] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [profile, setProfile] = useState<UserProfile>({
    nickname: '',
    bio: '',
    dateOfBirth: new Date(2000, 0, 1),
    weight: '',
    height: '',
    dietaryRestrictions: [],
    hasMedicalConditions: false,
    medicalConditions: [],
    substanceUse: {
      alcohol: false,
      smoking: false,
      other: '',
    },
    allergies: [],
    connectedApps: [],
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState({
    condition: '',
    medication: '',
    duration: '',
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || profile.dateOfBirth;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (currentDate) {
      setProfile(prev => ({
        ...prev,
        dateOfBirth: currentDate,
      }));
    }
  };

  const handleHeightChange = (value: string) => {
    const newHeight = useImperialHeight ? convertHeight.inToCm(parseFloat(value)) : value;
    setProfile(prev => ({
      ...prev,
      height: newHeight,
    }));
  };

  const handleWeightChange = (value: string) => {
    const newWeight = useImperialWeight ? convertWeight.lbToKg(parseFloat(value)) : value;
    setProfile(prev => ({
      ...prev,
      weight: newWeight,
    }));
  };

  const addMedicalCondition = () => {
    if (newCondition.condition) {
      setProfile(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, { ...newCondition }],
      }));
      setNewCondition({ condition: '', medication: '', duration: '' });
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      }));
      setNewAllergy('');
    }
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setProfile(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    }));
  };

  const toggleConnectedApp = (appId: string) => {
    setProfile(prev => ({
      ...prev,
      connectedApps: prev.connectedApps.includes(appId)
        ? prev.connectedApps.filter(id => id !== appId)
        : [...prev.connectedApps, appId],
    }));
  };

  const validateStep = async () => {
    try {
      const fieldsToValidate: Partial<UserProfile> = {};
      
      switch (step) {
        case 1:
          fieldsToValidate.nickname = profile.nickname;
          fieldsToValidate.profileImage = profile.profileImage;
          break;
        case 2:
          fieldsToValidate.dateOfBirth = profile.dateOfBirth;
          fieldsToValidate.height = profile.height;
          fieldsToValidate.weight = profile.weight;
          break;
      }

      await validationSchema.validate(fieldsToValidate, { abortEarly: false });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: { [key: string]: string } = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleNext = async () => {
    if (await validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await setDoc(doc(db, 'users', userId), {
        ...profile,
        createdAt: new Date(),
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error saving profile:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepDescription}>Let's get to know you better</Text>
            
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {profile.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
              ) : (
                <>
                  <Upload size={32} color="#64748b" />
                  <Text style={styles.uploadText}>Upload Profile Picture</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Nickname"
              value={profile.nickname}
              onChangeText={(value) => setProfile(prev => ({ ...prev, nickname: value }))}
            />
            
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself..."
              value={profile.bio}
              onChangeText={(value) => setProfile(prev => ({ ...prev, bio: value }))}
              multiline
              numberOfLines={4}
            />
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Body Metrics</Text>
            <Text style={styles.stepDescription}>Help us personalize your experience</Text>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {profile.dateOfBirth.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={profile.dateOfBirth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <UnitInput
              label="Height"
              value={useImperialHeight ? convertHeight.cmToIn(parseFloat(profile.height)).toString() : profile.height}
              onChangeText={handleHeightChange}
              metric="cm"
              imperial="in"
              useImperial={useImperialHeight}
              onToggleUnit={() => setUseImperialHeight(!useImperialHeight)}
              step={useImperialHeight ? 0.5 : 1}
            />
            
            <UnitInput
              label="Weight"
              value={useImperialWeight ? convertWeight.kgToLb(parseFloat(profile.weight)).toString() : profile.weight}
              onChangeText={handleWeightChange}
              metric="kg"
              imperial="lb"
              useImperial={useImperialWeight}
              onToggleUnit={() => setUseImperialWeight(!useImperialWeight)}
              step={useImperialWeight ? 0.5 : 1}
            />
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Dietary Preferences</Text>
            <Text style={styles.stepDescription}>Select all that apply</Text>
            
            <View style={styles.restrictionsGrid}>
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <TouchableOpacity
                  key={restriction}
                  style={[
                    styles.restrictionItem,
                    profile.dietaryRestrictions.includes(restriction) && styles.restrictionSelected,
                  ]}
                  onPress={() => toggleDietaryRestriction(restriction)}>
                  <Text style={[
                    styles.restrictionText,
                    profile.dietaryRestrictions.includes(restriction) && styles.restrictionTextSelected,
                  ]}>
                    {restriction}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Medical Information</Text>
            <Text style={styles.stepDescription}>Your health matters</Text>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Do you have any medical conditions?</Text>
              <TouchableOpacity
                style={[styles.toggle, profile.hasMedicalConditions && styles.toggleActive]}
                onPress={() => setProfile(prev => ({ ...prev, hasMedicalConditions: !prev.hasMedicalConditions }))}>
                <View style={[styles.toggleHandle, profile.hasMedicalConditions && styles.toggleHandleActive]} />
              </TouchableOpacity>
            </View>

            {profile.hasMedicalConditions && (
              <View style={styles.conditionsContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Condition"
                  value={newCondition.condition}
                  onChangeText={(value) => setNewCondition(prev => ({ ...prev, condition: value }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Medication (optional)"
                  value={newCondition.medication}
                  onChangeText={(value) => setNewCondition(prev => ({ ...prev, medication: value }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Duration (e.g., 2 years)"
                  value={newCondition.duration}
                  onChangeText={(value) => setNewCondition(prev => ({ ...prev, duration: value }))}
                />
                <TouchableOpacity style={styles.addButton} onPress={addMedicalCondition}>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Add Condition</Text>
                </TouchableOpacity>

                {profile.medicalConditions.map((condition, index) => (
                  <View key={index} style={styles.conditionCard}>
                    <Text style={styles.conditionName}>{condition.condition}</Text>
                    {condition.medication && (
                      <Text style={styles.conditionDetail}>Medication: {condition.medication}</Text>
                    )}
                    {condition.duration && (
                      <Text style={styles.conditionDetail}>Duration: {condition.duration}</Text>
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setProfile(prev => ({
                        ...prev,
                        medicalConditions: prev.medicalConditions.filter((_, i) => i !== index),
                      }))}>
                      <X size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Substance Use</Text>
            <Text style={styles.stepDescription}>This information helps us provide better recommendations</Text>

            <View style={styles.substanceContainer}>
              <TouchableOpacity
                style={[styles.substanceButton, profile.substanceUse.alcohol && styles.substanceActive]}
                onPress={() => setProfile(prev => ({
                  ...prev,
                  substanceUse: { ...prev.substanceUse, alcohol: !prev.substanceUse.alcohol },
                }))}>
                <Text style={[styles.substanceText, profile.substanceUse.alcohol && styles.substanceTextActive]}>
                  Alcohol
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.substanceButton, profile.substanceUse.smoking && styles.substanceActive]}
                onPress={() => setProfile(prev => ({
                  ...prev,
                  substanceUse: { ...prev.substanceUse, smoking: !prev.substanceUse.smoking },
                }))}>
                <Text style={[styles.substanceText, profile.substanceUse.smoking && styles.substanceTextActive]}>
                  Smoking
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.substanceInput]}
              placeholder="Other substances (optional)"
              value={profile.substanceUse.other}
              onChangeText={(value) => setProfile(prev => ({
                ...prev,
                substanceUse: { ...prev.substanceUse, other: value },
              }))}
            />
          </Animated.View>
        );

      case 6:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Allergies & Restrictions</Text>
            <Text style={styles.stepDescription}>Help us keep you safe</Text>

            <View style={styles.allergyInput}>
              <TextInput
                style={[styles.input, styles.allergyTextInput]}
                placeholder="Add allergy"
                value={newAllergy}
                onChangeText={setNewAllergy}
              />
              <TouchableOpacity style={styles.allergyAddButton} onPress={addAllergy}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.allergiesList}>
              {profile.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyItem}>
                  <Text style={styles.allergyText}>{allergy}</Text>
                  <TouchableOpacity
                    onPress={() => setProfile(prev => ({
                      ...prev,
                      allergies: prev.allergies.filter((_, i) => i !== index),
                    }))}>
                    <X size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        );

      case 7:
        return (
          <Animated.View entering={FadeInDown} style={styles.step}>
            <Text style={styles.stepTitle}>Connected Apps</Text>
            <Text style={styles.stepDescription}>Sync your health data</Text>

            {CONNECTED_APPS.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.appItem, profile.connectedApps.includes(app.id) && styles.appItemActive]}
                onPress={() => toggleConnectedApp(app.id)}>
                <View style={styles.appInfo}>
                  <Text style={styles.appEmoji}>{app.icon}</Text>
                  <Text style={styles.appName}>{app.name}</Text>
                </View>
                {profile.connectedApps.includes(app.id) && (
                  <Check size={20} color="#34d399" />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i + 1 === step && styles.progressDotActive,
              i + 1 < step && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <Animated.View entering={FadeInUp} style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={20} color="#64748b" />
        </TouchableOpacity>

        {step < 7 ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleComplete}>
            <Text style={styles.buttonText}>Complete</Text>
            <Check size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  progressDotActive: {
    backgroundColor: '#34d399',
    transform: [{ scale: 1.5 }],
  },
  progressDotCompleted: {
    backgroundColor: '#34d399',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  step: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 24,
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    textAlign: 'center',
  },
  restrictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restrictionItem: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  restrictionSelected: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  restrictionText: {
    color: '#64748b',
    fontFamily: 'Inter-Regular',
  },
  restrictionTextSelected: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34d399',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  conditionsContainer: {
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#34d399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  conditionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  conditionName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  conditionDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  removeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  substanceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  substanceButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  substanceActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  substanceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  substanceTextActive: {
    color: '#fff',
  },
  substanceInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  allergyInput: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  allergyTextInput: {
    flex: 1,
    marginBottom: 0,
  },
  allergyAddButton: {
    backgroundColor: '#34d399',
    width: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergiesList: {
    maxHeight: 200,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  allergyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  appItemActive: {
    borderColor: '#34d399',
    borderWidth: 1,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
  },
  backButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  button: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#34d399',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
});