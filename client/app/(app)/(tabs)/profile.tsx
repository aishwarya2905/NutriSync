import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Apple, Bell, Heart, History, Scale, Settings as SettingsIcon, Camera, X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../../../hooks/userProfile';
import { formatHeight, formatWeight, calculateBMI, convertHeight, convertWeight } from '@/lib/utils/units';
import UnitInput from '@/components/UnitInput';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Low Carb',
  'Gluten Free',
  'Lactose Free',
  'Keto',
  'Paleo',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, error, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [useImperialHeight, setUseImperialHeight] = useState(false);
  const [useImperialWeight, setUseImperialWeight] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [newAllergy, setNewAllergy] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setEditedProfile(prev => {
          if (!prev) return prev; // null safety check
          return {
            ...prev,
            profileImage: result.assets[0].uri,
          };
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || editedProfile?.dateOfBirth;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (currentDate) {
      setEditedProfile(prev => {
        if (!prev) return prev;
        return { ...prev, dateOfBirth: currentDate };});
    }
  };

  const handleHeightChange = (value: string) => {
    const newHeight = useImperialHeight ? convertHeight.inToCm(parseFloat(value)) : value;
    setEditedProfile(prev => {
      if (!prev) return prev;
      return{ ...prev, height: newHeight };});
  };

  const handleWeightChange = (value: string) => {
    const newWeight = useImperialWeight ? convertWeight.lbToKg(parseFloat(value)) : value;
    setEditedProfile(prev => {
      if (!prev) return prev;
      return{ ...prev, weight: newWeight };});
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setEditedProfile(prev => {
      if (!prev) return prev;
      return{
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction],
    };});
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setEditedProfile(prev => {
        if (!prev) return prev;
        return{
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
      };});
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setEditedProfile(prev => {
      if (!prev) return prev;
      return{
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    };});
  };

  const handleSave = async () => {
    try {
      if (!editedProfile) return;
      await updateProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#E8F5E9', '#FFFFFF']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={isEditing ? pickImage : undefined}
          >
            <Image
              source={{ 
                uri: editedProfile?.profileImage || 
                     'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' 
              }}
              style={styles.profileImage}
            />
            {isEditing && (
              <View style={styles.editOverlay}>
                <Camera size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editedProfile?.nickname}
              onChangeText={(text) => setEditedProfile(prev => {
                if (!prev) return prev;
                return{ ...prev, nickname: text };})}
              placeholder="Your name"
            />
          ) : (
            <Text style={styles.name}>{profile?.nickname || 'User'}</Text>
          )}

          {isEditing ? (
            <TextInput
              style={styles.bioInput}
              value={editedProfile?.bio}
              onChangeText={(text) => setEditedProfile(prev => {
                if (!prev) return prev;
                return{ ...prev, bio: text };})}
              placeholder="Tell us about yourself"
              multiline
            />
          ) : (
            <Text style={styles.subtitle}>{profile?.bio || 'Health Enthusiast'}</Text>
          )}
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? (
              <Check size={20} color="#2196F3" />
            ) : (
              <SettingsIcon size={20} color="#2196F3" />
            )}
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        {isEditing ? (
          <>
            <UnitInput
              label="Height"
              value={useImperialHeight ? 
                convertHeight.cmToIn(parseFloat(editedProfile?.height || '0')).toString() : 
                editedProfile?.height || ''}
              onChangeText={handleHeightChange}
              metric="cm"
              imperial="in"
              useImperial={useImperialHeight}
              onToggleUnit={() => setUseImperialHeight(!useImperialHeight)}
              step={useImperialHeight ? 0.5 : 1}
            />
            <UnitInput
              label="Weight"
              value={useImperialWeight ? 
                convertWeight.kgToLb(parseFloat(editedProfile?.weight || '0')).toString() : 
                editedProfile?.weight || ''}
              onChangeText={handleWeightChange}
              metric="kg"
              imperial="lb"
              useImperial={useImperialWeight}
              onToggleUnit={() => setUseImperialWeight(!useImperialWeight)}
              step={useImperialWeight ? 0.5 : 1}
            />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {editedProfile?.dateOfBirth?.toLocaleDateString() || 'Select date of birth'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={editedProfile?.dateOfBirth || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
  <View style={styles.statCol}>
    <Scale size={24} color="#4CAF50" />
    <Text style={styles.statValue}>
      {formatWeight(profile?.weight || '0', useImperialWeight)}
    </Text>
    <Text style={styles.statLabel}>Weight</Text>
  </View>
  <View style={styles.statCol}>
    <Activity size={24} color="#2196F3" />
    <Text style={styles.statValue}>
      {formatHeight(profile?.height || '0', useImperialHeight)}
    </Text>
    <Text style={styles.statLabel}>Height</Text>
  </View>
  <View style={styles.statCol}>
    <Heart size={24} color="#F44336" />
    <Text style={styles.statValue}>
      {calculateBMI(profile?.weight || '0', profile?.height || '0')}
    </Text>
    <Text style={styles.statLabel}>BMI</Text>
  </View>
</View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        <View style={styles.preferencesContainer}>
          {DIETARY_RESTRICTIONS.map((restriction) => (
            <TouchableOpacity
              key={restriction}
              style={[
                styles.preferenceTag,
                editedProfile?.dietaryRestrictions?.includes(restriction) && styles.preferenceTagActive,
                !isEditing && styles.preferenceTagReadOnly,
              ]}
              onPress={isEditing ? () => toggleDietaryRestriction(restriction) : undefined}>
              <Text style={[
                styles.preferenceText,
                editedProfile?.dietaryRestrictions?.includes(restriction) && styles.preferenceTextActive,
              ]}>
                {restriction}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies & Restrictions</Text>
        {isEditing && (
          <View style={styles.allergyInput}>
            <TextInput
              style={styles.allergyTextInput}
              placeholder="Add allergy"
              value={newAllergy}
              onChangeText={setNewAllergy}
            />
            <TouchableOpacity style={styles.allergyAddButton} onPress={addAllergy}>
              <Text style={styles.allergyAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.allergyContainer}>
          {editedProfile?.allergies?.map((allergy, index) => (
            <View key={index} style={styles.allergyCard}>
              <Bell size={20} color="#D32F2F" />
              <Text style={styles.allergyText}>{allergy}</Text>
              {isEditing && (
                <TouchableOpacity
                  style={styles.allergyRemoveButton}
                  onPress={() => removeAllergy(index)}>
                  <X size={16} color="#D32F2F" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
  <Text style={styles.sectionTitle}>Medical Conditions</Text>
  {isEditing ? (
    editedProfile?.medicalConditions?.map((condition, index) => (
      <View key={index} style={{ marginBottom: 12 }}>
        <TextInput
          style={styles.bioInput}
          value={condition.condition}
          placeholder="Condition"
          onChangeText={(text) => {
            setEditedProfile(prev => {
              if (!prev) return prev;
              const newConditions = [...prev.medicalConditions];
              newConditions[index].condition = text;
              return { ...prev, medicalConditions: newConditions };
            });
          }}
        />
        <TextInput
          style={styles.bioInput}
          value={condition.medication}
          placeholder="Medication"
          onChangeText={(text) => {
            setEditedProfile(prev => {
              if (!prev) return prev;
              const newConditions = [...prev.medicalConditions];
              newConditions[index].medication = text;
              return { ...prev, medicalConditions: newConditions };
            });
          }}
        />
        <TextInput
          style={styles.bioInput}
          value={condition.duration}
          placeholder="Duration"
          onChangeText={(text) => {
            setEditedProfile(prev => {
              if (!prev) return prev;
              const newConditions = [...prev.medicalConditions];
              newConditions[index].duration = text;
              return { ...prev, medicalConditions: newConditions };
            });
          }}
        />
      </View>
    ))
  ) : (
    editedProfile?.medicalConditions?.map((condition, index) => (
      <View key={index} style={styles.allergyCard}>
        <Text style={styles.allergyText}>
          {condition.condition} - {condition.medication} ({condition.duration})
        </Text>
      </View>
    ))
  )}
  {isEditing && (
    <TouchableOpacity
      onPress={() => setEditedProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          medicalConditions: [
            ...prev.medicalConditions,
            { condition: '', medication: '', duration: '' }
          ]
        };
      })}
      style={styles.editButton}
    >
      <Text style={styles.editButtonText}>+ Add Condition</Text>
    </TouchableOpacity>
  )}
</View>



      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Apps</Text>
        <View style={styles.connectedAppsContainer}>
          <View style={styles.connectedApp}>
            <Apple size={24} color="#000" />
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Apple Health</Text>
              <Text style={styles.appStatus}>Connected</Text>
            </View>
          </View>
          <View style={styles.connectedApp}>
            <Activity size={24} color="#00B0B9" />
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Fitbit</Text>
              <Text style={styles.appStatus}>Connected</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.activityItem}>
              <History size={20} color="#666" />
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Scanned Nature Valley Granola</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
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
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34d399',
    padding: 8,
    borderRadius: 20,
  },
  nameInput: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  bioInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    width: '80%',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 8,
    color: '#2196F3',
    fontFamily: 'Inter-SemiBold',
  },
  statsContainer: {
    padding: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 4,
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
    marginBottom: 16,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceTag: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  preferenceTagActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  preferenceTagReadOnly: {
    opacity: 0.8,
  },
  preferenceText: {
    color: '#64748b',
    fontFamily: 'Inter-SemiBold',
  },
  preferenceTextActive: {
    color: '#fff',
  },
  allergyInput: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  allergyTextInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  allergyAddButton: {
    backgroundColor: '#34d399',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergyAddButtonText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  allergyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  allergyText: {
    color: '#D32F2F',
    fontFamily: 'Inter-SemiBold',
  },
  allergyRemoveButton: {
    padding: 4,
  },
  connectedAppsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  connectedApp: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  appInfo: {
    marginLeft: 12,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  appStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4CAF50',
  },
  activityList: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityInfo: {
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ef4444',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
});