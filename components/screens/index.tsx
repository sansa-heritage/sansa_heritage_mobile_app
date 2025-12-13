import React, { useState } from 'react';
import { View, Button, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../models/types';


const slides = [
  {
    index: 1,
    title: 'Choose Product',
    text: 'A product is the item offered for sale. A product can be a service or an item. It can be physical or in virtual or cyber form',

    backgroundColor: 'white',
  },
  {
    index: 2,
    title: 'Make Payment',
    text: 'Payment is the transfer of money services in exchange product or Payments typically made terms agreed ',
    image: require('../../assets/images/c.png'),
    backgroundColor: 'white',
  },
  {
    index: 3,
    title: 'Get Your Order',
    text: 'Business or commerce an order is a stated intention either spoken to engage in a commercial transaction specific products ',
    image: require('../../assets/images/a.png'),
    backgroundColor: 'white',
  },
];
interface IntroSlidesProps {
  onFinishIntro: () => Promise<void>;
}
const BasicExample: React.FC<IntroSlidesProps> = ({ onFinishIntro }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex === slides.length - 1) {
      navigation.navigate('Login'); // Navigate to Login on the last slide
      onFinishIntro()
    } else {
      setCurrentSlideIndex(currentSlideIndex + 1); // Move to the next slide
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login'); // Skip to the Login page
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <View style={{ flex: 1, backgroundColor: currentSlide.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={currentSlide.image} style={{ width: 300, height: 450 }} />
      {/* <Image  style={{ width: 300, height: 300, marginBottom: 20 }} /> */}
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{currentSlide.title}</Text>
      <Text style={{ textAlign: 'center', marginVertical: 10, width: 350 }}>{currentSlide.text}</Text>

      <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}>
        <TouchableOpacity style={{
          width: 218,
          height: 40,
          borderRadius: 133,
          backgroundColor: '#151515'
        }}
          
          onPress={handleNext}
        >
          <Text style={{textAlign: 'center',paddingTop: 10,color: '#FFFFFF'}}>{currentSlideIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BasicExample;
