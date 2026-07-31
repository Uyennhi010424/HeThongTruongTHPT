import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ParentScores() {
  const [selectedTerm, setSelectedTerm] = useState('Học kỳ 1');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setExpandedSubject(expandedSubject === subject ? null : subject);
  };

  const scores = [
    { subject: 'Toán Học', oral: [8, 9], test15m: [7, 8.5], test45m: [8], midterm: 8.5, final: 9.0, average: 8.6 },
    { subject: 'Ngữ Văn', oral: [7], test15m: [8], test45m: [7.5], midterm: 7.5, final: 8.0, average: 7.7 },
  ];

  return (
    <View style={styles.container}>
      {/* Filter */}
      <View style={styles.header}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['Học kỳ 1', 'Học kỳ 2', 'Cả năm'].map((term) => (
            <TouchableOpacity
              key={term}
              style={[styles.filterChip, selectedTerm === term && styles.filterChipActive]}
              onPress={() => setSelectedTerm(term)}
            >
              <Text style={[styles.filterText, selectedTerm === term && styles.filterTextActive]}>{term}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {scores.map((item, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleSubject(item.subject)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.subjectName}>{item.subject}</Text>
                <Text style={styles.averageScore}>TBM: {item.average}</Text>
              </View>
              <Ionicons
                name={expandedSubject === item.subject ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#64748b"
              />
            </TouchableOpacity>

            {expandedSubject === item.subject && (
              <View style={styles.expandedContent}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Miệng:</Text>
                  <Text style={styles.scoreValues}>{item.oral.join(', ')}</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>15 Phút:</Text>
                  <Text style={styles.scoreValues}>{item.test15m.join(', ')}</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>45 Phút / 1 Tiết:</Text>
                  <Text style={styles.scoreValues}>{item.test45m.join(', ')}</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Giữa kỳ:</Text>
                  <Text style={styles.scoreValues}>{item.midterm}</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Cuối kỳ:</Text>
                  <Text style={styles.scoreValues}>{item.final}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  averageScore: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 4,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#fafaf9',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  scoreValues: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
