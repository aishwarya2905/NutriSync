// import { StatusBar } from 'expo-status-bar';
// import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
// import * as ImagePicker from 'expo-image-picker';
// import { useState, useRef } from 'react';
// import {
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Image,
//   Alert,
// } from 'react-native';

// export default function ScanScreen() {
//   const [facing, setFacing] = useState<CameraType>('back');
//   const [permission, requestPermission] = useCameraPermissions();
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   if (!permission) return <View />;
//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.message}>We need your permission to show the camera</Text>
//         <TouchableOpacity style={styles.button} onPress={requestPermission}>
//           <Text style={styles.text}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const toggleCameraFacing = () => {
//     setFacing(current => (current === 'back' ? 'front' : 'back'));
//   };

//   const pickImageFromGallery = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       base64: true,
//       allowsEditing: true,
//       quality: 0.8,
//     });

//     if (!result.canceled && result.assets.length > 0) {
//       const uri = result.assets[0].uri;
//       const base64 = result.assets[0].base64;
//       setSelectedImage(uri);
//       if (base64) await submitImage(base64);
//     }
//   };

//   const submitImage = async (base64: string) => {
//     try {
//       const res = await fetch('http://YOUR_FASTAPI_SERVER/analyze', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ image: base64 }),
//       });

//       const result = await res.json();
//       Alert.alert('API Response', JSON.stringify(result));
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Error', 'Could not reach the server');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <CameraView style={styles.camera} facing={facing}>
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
//             <Text style={styles.text}>Flip Camera</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={pickImageFromGallery}>
//             <Text style={styles.text}>Upload from Gallery</Text>
//           </TouchableOpacity>
//         </View>
//       </CameraView>

//       {selectedImage && (
//         <Image source={{ uri: selectedImage }} style={styles.previewImage} />
//       )}

//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   message: {
//     textAlign: 'center',
//     padding: 20,
//     fontSize: 16,
//   },
//   camera: {
//     flex: 1,
//   },
//   buttonContainer: {
//     position: 'absolute',
//     bottom: 40,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-evenly',
//     paddingHorizontal: 20,
//   },
//   button: {
//     backgroundColor: '#00000088',
//     padding: 12,
//     borderRadius: 8,
//   },
//   text: {
//     fontSize: 16,
//     color: 'white',
//   },
//   previewImage: {
//     width: '100%',
//     height: 200,
//     resizeMode: 'contain',
//   },
// });
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import { Camera as CameraIcon, X, Upload, ChevronRight, ScanLine, Home } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { doc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

interface ScanResult {
  type: string;
  data: string;
  timestamp: number;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResults, setScannedResults] = useState<ScanResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    try {
      setIsScanning(false);
      setLoading(true);

      const result = { type, data, timestamp: Date.now() };
      setScannedResults(prev => [result, ...prev]);

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: "0009800600106" }),
      });

      if (!response.ok) throw new Error('Failed to analyze barcode');
      const analysisData = await response.json();

      const userId = auth.currentUser?.uid;
      if (userId) {
        const scanRef = doc(collection(db, 'users', userId, 'scans'));
        await setDoc(scanRef, {
          ...result,
          analysis: analysisData,
          createdAt: new Date(),
        });
      }

      router.push({ pathname: 'analysis', params: { data: JSON.stringify(analysisData) } });
    } catch (error) {
      console.error('Error processing barcode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'scan.jpg',
      } as any);

      const response = await fetch('http://127.0.0.1:8000/detect-barcode', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to detect barcode');

      const { barcode } = await response.json();
      if (barcode) {
        handleBarCodeScanned({ type: 'EAN13', data: barcode });
      }
    } catch (error) {
      console.error('Error submitting image:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  return (
    <View style={styles.container}>
      {isScanning ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            onBarcodeScanned={handleBarCodeScanned}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
              style={styles.overlay}>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.replace('/(tabs)')}>
                  <Home size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setIsScanning(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.scanArea}>
                <View style={styles.scanFrame} />
              </View>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}>
                <CameraIcon size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scanText}>Align barcode within frame</Text>
            </LinearGradient>
          </CameraView>
        </Animated.View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Scan Product</Text>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => router.replace('/(tabs)')}>
                <Home size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Scan a barcode or upload an image to analyze nutritional information</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsScanning(true)}>
              <CameraIcon size={32} color="#fff" />
              <Text style={styles.actionButtonText}>Scan Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.uploadButton]}
              onPress={pickImage}>
              <Upload size={32} color="#fff" />
              <Text style={styles.actionButtonText}>Upload Image</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Text style={styles.sectionTitle}>Selected Image</Text>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Analyze Image</Text>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {scannedResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {scannedResults.map((result) => (
                <TouchableOpacity
                  key={result.timestamp}
                  style={styles.resultItem}
                  onPress={() => router.push({
                    pathname: '/(tabs)/analysis',
                    params: { barcode: result.data }
                  })}>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultType}>{result.type}</Text>
                    <Text style={styles.resultData}>{result.data}</Text>
                    <Text style={styles.resultTime}>
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Analyzing product...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  homeButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    lineHeight: 24,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#34d399',
    borderRadius: 12,
  },
  flipButton: {
    position: 'absolute',
    bottom: 40,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#34d399',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 10,
  },
  previewContainer: {
    padding: 20,
    paddingTop: 0,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#34d399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  resultsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  resultData: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});