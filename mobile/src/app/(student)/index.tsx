import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { HeaderSection } from '../../components/dashboard/HeaderSection';
import { QuickFunctions } from '../../components/dashboard/QuickFunctions';
import { NextClassCard } from '../../components/dashboard/NextClassCard';
import { useDashboardStore } from '../../store/useDashboardStore';

export default function StudentDashboard() {
  const { data, isLoading, isRefreshing, error, fetchData, refreshData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(() => {
    refreshData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#143872" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSection student={data?.student || null} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false} 
        bounces={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#143872']} />
        }
      >
        <QuickFunctions data={data} />
        <NextClassCard 
          timetable={data?.timetable || []} 
          studentClass={data?.student?.lop?.tenLop} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: '#143872',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },
});
