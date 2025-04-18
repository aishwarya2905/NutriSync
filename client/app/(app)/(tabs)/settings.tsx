import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Bell, Shield, Smartphone, User, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [allergyAlerts, setAllergyAlerts] = useState(true);
  const [medicationAlerts, setMedicationAlerts] = useState(true);
  const [nutritionAlerts, setNutritionAlerts] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <User size={24} color="#2196F3" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Edit Profile</Text>
            <Text style={styles.settingDescription}>Update your personal information</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Alert Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts & Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Bell size={24} color="#4CAF50" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Enable or disable all notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#81C784' }}
            thumbColor={notifications ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <AlertTriangle size={24} color="#F44336" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Allergy Alerts</Text>
            <Text style={styles.settingDescription}>High priority alerts for allergens</Text>
          </View>
          <Switch
            value={allergyAlerts}
            onValueChange={setAllergyAlerts}
            trackColor={{ false: '#767577', true: '#EF9A9A' }}
            thumbColor={allergyAlerts ? '#F44336' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Shield size={24} color="#FF9800" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Medication Alerts</Text>
            <Text style={styles.settingDescription}>Warnings for medication interactions</Text>
          </View>
          <Switch
            value={medicationAlerts}
            onValueChange={setMedicationAlerts}
            trackColor={{ false: '#767577', true: '#FFB74D' }}
            thumbColor={medicationAlerts ? '#FF9800' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Bell size={24} color="#2196F3" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Nutrition Alerts</Text>
            <Text style={styles.settingDescription}>Daily nutrition recommendations</Text>
          </View>
          <Switch
            value={nutritionAlerts}
            onValueChange={setNutritionAlerts}
            trackColor={{ false: '#767577', true: '#90CAF9' }}
            thumbColor={nutritionAlerts ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Connected Devices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Devices</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Smartphone size={24} color="#9C27B0" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Manage Devices</Text>
            <Text style={styles.settingDescription}>Configure connected health devices</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Warning Cards */}
      <View style={styles.warningSection}>
        <View style={styles.warningCard}>
          <AlertTriangle size={24} color="#D32F2F" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Allergy Alert Settings</Text>
            <Text style={styles.warningText}>
              Keep your allergy information up to date for accurate alerts when scanning products
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.dangerButton} 
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text style={styles.dangerButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#1B5E20',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 2,
  },
  warningSection: {
    padding: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#D32F2F',
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 4,
  },
  dangerButton: {
    margin: 20,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});