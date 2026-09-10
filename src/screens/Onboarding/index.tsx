// import React, { useState } from 'react';
// import { View,Text, Image, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RootStackParamList } from '../../models/types';


// const slides = [
//   {
//     index: 1,
//     title: 'Choose Product',
//     text: 'A product is the item offered for sale. A product can be a service or an item. It can be physical or in virtual or cyber form',

//     backgroundColor: 'white',
//   },
//   {
//     index: 2,
//     title: 'Make Payment',
//     text: 'Payment is the transfer of money services in exchange product or Payments typically made terms agreed ',
//     image: require('../../../assets/images/c.png'),
//     backgroundColor: 'white',
//   },
//   {
//     index: 3,
//     title: 'Get Your Order',
//     text: 'Business or commerce an order is a stated intention either spoken to engage in a commercial transaction specific products ',
//     image: require('../../../assets/images/a.png'),
//     backgroundColor: 'white',
//   },
// ];
// interface IntroSlidesProps {
//   onFinishIntro: () => Promise<void>;
// }
// const BasicExample: React.FC<IntroSlidesProps> = ({ onFinishIntro }) => {
//   const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
//   const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

//   const handleNext = () => {
//     if (currentSlideIndex === slides.length - 1) {
//       navigation.navigate('Login'); // Navigate to Login on the last slide
//       onFinishIntro()
//     } else {
//       setCurrentSlideIndex(currentSlideIndex + 1); // Move to the next slide
//     }
//   };

//   const handleSkip = () => {
//     navigation.navigate('Login'); // Skip to the Login page
//   };

//   const currentSlide = slides[currentSlideIndex];

//   return (
//     <View style={{ flex: 1, backgroundColor: currentSlide.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
//       <Image source={currentSlide.image} style={{ width: 300, height: 450 }} />
//       {/* <Image  style={{ width: 300, height: 300, marginBottom: 20 }} /> */}
//       <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{currentSlide.title}</Text>
//       <Text style={{ textAlign: 'center', marginVertical: 10, width: 350 }}>{currentSlide.text}</Text>

//       <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}>
//         <TouchableOpacity style={{
//           width: 218,
//           height: 40,
//           borderRadius: 133,
//           backgroundColor: '#151515'
//         }}
          
//           onPress={handleNext}
//         >
//           <Text style={{textAlign: 'center',paddingTop: 10,color: '#FFFFFF'}}>{currentSlideIndex === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../models/types';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    index: 1,
    title: 'Choose Product',
    text: 'A product is the item offered for sale. A product can be a service or an item. It can be physical or in virtual or cyber form',
    image: require('../../../assets/images/a.png'),
    backgroundColor: 'white',
  },
  {
    index: 2,
    title: 'Make Payment',
    text: 'Payment is the transfer of money services in exchange product or Payments typically made terms agreed',
    image: require('../../../assets/images/c.png'),
    backgroundColor: 'white',
  },
  {
    index: 3,
    title: 'Get Your Order',
    text: 'Business or commerce an order is a stated intention either spoken to engage in a commercial transaction specific products',
    image: require('../../../assets/images/a.png'),
    backgroundColor: 'white',
  },
];

interface IntroSlidesProps {
  onFinishIntro: () => Promise<void>;
}

const BasicExample: React.FC<IntroSlidesProps> = ({ onFinishIntro }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality
  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, []);

  const startAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % slides.length;
      setCurrentSlideIndex(nextIndex);
      scrollToSlide(nextIndex);
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  };

  const scrollToSlide = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: index,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    stopAutoScroll();
    if (currentSlideIndex === slides.length - 1) {
      onFinishIntro();
    } else {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      scrollToSlide(nextIndex);
      startAutoScroll();
    }
  };

  const handleSkip = () => {
    stopAutoScroll();
    onFinishIntro();
  };

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentSlideIndex && index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
      stopAutoScroll();
      startAutoScroll();
    }
  };

  const handleScrollBeginDrag = () => {
    stopAutoScroll();
  };

  const handleScrollEndDrag = () => {
    startAutoScroll();
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slideContainer, { backgroundColor: item.backgroundColor }]}>
        {/* Image - Centered */}
        <View style={styles.imageContainer}>
          <Image 
            source={item.image} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {item.text}
        </Text>

        {/* Slide indicators */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                { backgroundColor: index === currentSlideIndex ? '#151515' : '#ccc' },
              ]}
            />
          ))}
        </View>

        {/* Buttons - Centered */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentSlideIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Slides - FlatList for swipe support */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.index.toString()}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        bounces={false}
        initialScrollIndex={0}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
};

export default BasicExample;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slideContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 300,
  },
  image: {
    width: width * 30,
    height: height * 0.80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  nextButton: {
    width: 218,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  skipButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});