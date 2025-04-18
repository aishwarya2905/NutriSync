import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';

interface UnitInputProps {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  metric: string;
  imperial: string;
  useImperial: boolean;
  onToggleUnit: () => void;
  step?: number;
}

export default function UnitInput({
  value,
  onChangeText,
  label,
  metric,
  imperial,
  useImperial,
  onToggleUnit,
  step = 1
}: UnitInputProps) {
  const unit = useImperial ? imperial : metric;
  const numValue = parseFloat(value) || 0;

  const increment = () => {
    onChangeText((numValue + step).toString());
  };

  const decrement = () => {
    if (numValue > step) {
      onChangeText((numValue - step).toString());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity onPress={onToggleUnit}>
          <Text style={styles.unitToggle}>Switch to {useImperial ? metric : imperial}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <View style={styles.unitControls}>
          <Text style={styles.unit}>{unit}</Text>
          <View style={styles.arrows}>
            <TouchableOpacity onPress={increment} style={styles.arrow}>
              <ChevronUp size={20} color="#34d399" />
            </TouchableOpacity>
            <TouchableOpacity onPress={decrement} style={styles.arrow}>
              <ChevronDown size={20} color="#34d399" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  unitToggle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#34d399',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  unitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  unit: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginRight: 8,
  },
  arrows: {
    justifyContent: 'center',
  },
  arrow: {
    padding: 4,
  },
});