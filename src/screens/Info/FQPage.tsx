import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FAQScreen = () => {
  const faqs = [
    { question: 'How can I track my order?', answer: 'You can track your order using the tracking link sent to your email after purchase.' },
    { question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards, UPI, and net banking.' },
    { question: 'Can I cancel my order?', answer: 'Yes, you can cancel your order within 24 hours of placing it.' },
    { question: 'How do I return a product?', answer: 'Visit the Returns & Refund section or contact customer support.' },
  ];

  const [expandedIndex, setExpandedIndex] = React.useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Frequently Asked Questions</Text>
      {faqs.map((faq, index) => (
        <TouchableOpacity key={index} onPress={() => toggleExpand(index)} style={styles.faqItem}>
          <View style={styles.questionRow}>
            <Text style={styles.question}>{faq.question}</Text>
            <Ionicons name={expandedIndex === index ? 'chevron-up' : 'chevron-down'} size={20} color="#000" />
          </View>
          {expandedIndex === index && <Text style={styles.answer}>{faq.answer}</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  faqItem: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 15 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 16, fontWeight: '600', color: '#000' },
  answer: { marginTop: 10, fontSize: 14, color: '#555', lineHeight: 20 },
});

export default FAQScreen;
