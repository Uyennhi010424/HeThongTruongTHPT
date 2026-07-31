import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EduManager Mobile App</Text>
      <Text style={styles.subtitle}>Version SDK 54</Text>
      <Text style={styles.message}>Đã cấu hình thành công! Hãy bắt đầu viết UI.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0284c7', // Tailwind sky-600
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b', // Tailwind slate-500
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#334155', // Tailwind slate-700
  },
});
