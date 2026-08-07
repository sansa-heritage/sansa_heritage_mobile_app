import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

// Generic container
export const ContentContainer = ({ navigation, title, children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </View>
  );
};

// Privacy Policy Screen
export const PrivacyPolicyScreen = ({ navigation }) => {
  const [showFull, setShowFull] = useState(false);

  return (

    <ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
      <ContentContainer navigation={navigation} title="Privacy Policy – Sansa Heritage Hub">
        <Text style={styles.title}>Privacy Policy – Sansa Heritage Hub</Text>
        <Text style={styles.paragraph}>Effective Date: [Insert Date]</Text>

        <Text style={styles.subheading}>🔹 Privacy in a Nutshell</Text>
        <Text style={styles.subheading}>What We Collect</Text>
        <Text style={styles.paragraph}>
          Personal info: Name, email, phone, shipping & payment details{"\n"}
          Non-personal info: Device type, app usage, cookies
        </Text>

        <Text style={styles.subheading}>Why We Collect It</Text>
        <Text style={styles.paragraph}>
          • Process and deliver your orders{"\n"}
          • Send updates, offers, and customer support messages{"\n"}
          • Improve and personalize your app experience{"\n"}
          • Ensure secure payments and prevent fraud
        </Text>

        <Text style={styles.subheading}>Who We Share It With</Text>
        <Text style={styles.paragraph}>
          • Delivery partners for order fulfillment{"\n"}
          • Payment gateways for secure transactions{"\n"}
          • Service providers or analytics tools to improve the app{"\n"}
          ✅ We do not sell your data
        </Text>

        <Text style={styles.subheading}>Your Rights</Text>
        <Text style={styles.paragraph}>
          • View or update your personal info{"\n"}
          • Request deletion of your account/data{"\n"}
          • Opt out of promotional messages
        </Text>

        <Text style={styles.subheading}>Data Security</Text>
        <Text style={styles.paragraph}>
          We use encryption, secure servers, and restricted access
        </Text>

        <Text style={styles.subheading}>Cookies & Tracking</Text>
        <Text style={styles.paragraph}>
          Used only to enhance your experience and analyze app performance
        </Text>

        <Text style={styles.subheading}>Children’s Privacy</Text>
        <Text style={styles.paragraph}>
          Not intended for children under 18. We do not knowingly collect information from minors.
        </Text>

        <Text style={styles.subheading}>Questions or Concerns</Text>
        <Text style={styles.paragraph}>Email: [your email]</Text>

        <TouchableOpacity onPress={() => setShowFull(!showFull)} style={styles.linkButton}>
          <Text style={styles.linkText}>{showFull ? 'Hide Full Policy' : 'Read Full Policy'}</Text>
        </TouchableOpacity>

        {showFull && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.subheading}>🔹 Full Privacy Policy</Text>
            <Text style={styles.paragraph}>
              1. Applicability & Acceptance – By accessing or using our app, you agree to this Privacy
              Policy. If you do not agree, please do not use the app.
            </Text>
            <Text style={styles.paragraph}>
              2. Information We Collect – Personal Information (Name, email, phone, shipping address,
              payment details), Sensitive Information (passwords, payment credentials), Non-Personal
              Information (device info, app usage, cookies).
            </Text>
            <Text style={styles.paragraph}>
              3. How We Use Your Information – Order processing, support, personalization, fraud
              prevention.
            </Text>
            <Text style={styles.paragraph}>
              4. Information Sharing & Disclosure – Delivery partners, payment gateways, analytics,
              mergers/transfers. ✅ We do not sell personal data.
            </Text>
            <Text style={styles.paragraph}>
              5. Data Security – Industry-standard security including encryption, secure servers,
              restricted access.
            </Text>
            <Text style={styles.paragraph}>
              6. User Rights & Control – Access/update info, request deletion, opt out of marketing.
            </Text>
            <Text style={styles.paragraph}>
              7. Cookies & Tracking Technologies – Used to enhance user experience and analyze app
              performance.
            </Text>
            <Text style={styles.paragraph}>
              8. Third-Party Services – Governed by their respective privacy policies.
            </Text>
            <Text style={styles.paragraph}>
              9. Children’s Privacy – Not for children under 18; we do not knowingly collect info from
              minors.
            </Text>
            <Text style={styles.paragraph}>
              10. Changes – Policy updates will be posted in the app. Continued use indicates
              acceptance.
            </Text>
          </View>
        )}
      </ContentContainer>
    </ScrollView>
  );
};

// About Us Screen
export const AboutUsScreen = ({ navigation }) => (
  <ContentContainer navigation={navigation} title="About Us – Sansa Heritage Hub">
    <Text style={styles.title}>About Us – Sansa Heritage Hub</Text>
    <Text style={styles.paragraph}>Where Tradition Meets Style ✨</Text>
    <Text style={styles.paragraph}>
      At Sansa Heritage Hub, we design fashion that feels as good as it looks. Our handloom
      collections are crafted by skilled artisans, blending timeless tradition with modern
      design—so you enjoy comfort, quality, and elegance every day.
    </Text>
    <Text style={styles.paragraph}>
      From daily wear to office gatherings or life’s grand celebrations, our creations are made to
      fit every moment beautifully.
    </Text>
    <Text style={styles.paragraph}>
      For us, you’re more than a customer—you’re family. Each piece carries stories of culture and
      craftsmanship, while giving you the comfort you deserve.
    </Text>
    <Text style={styles.paragraph}>
      With every choice you make, you empower artisans, uplift communities, and help preserve a rich
      heritage. Our mission is to bring village crafts to the modern market—creating fashion that’s
      sustainable, stylish, and meaningful.
    </Text>
    <Text style={styles.paragraph}>✨ Fashion that feels good, looks good, and does good.</Text>
  </ContentContainer>
);

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  backButton: { padding: 8 },
  backText: { color: '#007AFF' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subheading: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 20, color: '#333', marginBottom: 8 },
  linkButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  linkText: { color: '#007AFF', fontWeight: '600' },
});
