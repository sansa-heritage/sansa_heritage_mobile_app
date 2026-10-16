import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base shimmer block — soft pulsing grey box.
 */
export const SkeletonBlock: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E8E8E8',
          opacity,
        },
        style,
      ]}
    />
  );
};

/* ================= DASHBOARD SKELETONS ================= */

export const BannerSkeleton: React.FC<{ width: number }> = ({ width }) => {
  const bannerWidth = width - 30;
  const bannerHeight = Math.round(bannerWidth * (9 / 16));
  return (
    <View style={styles.bannerWrapper}>
      <SkeletonBlock width={bannerWidth} height={bannerHeight} borderRadius={12} />
    </View>
  );
};

export const CategoryPillsSkeleton: React.FC = () => (
  <View style={styles.pillsRow}>
    {[70, 65, 60, 80, 55].map((w, i) => (
      <SkeletonBlock
        key={i}
        width={w}
        height={28}
        borderRadius={10}
        style={{ marginRight: 5 }}
      />
    ))}
  </View>
);

export const FeatureBadgesSkeleton: React.FC = () => (
  <View style={styles.featuresRow}>
    {[1, 2, 3].map(i => (
      <View key={i} style={styles.featureSkeletonItem}>
        <SkeletonBlock width={22} height={22} borderRadius={11} />
        <View style={{ marginLeft: 6, flex: 1 }}>
          <SkeletonBlock width="80%" height={8} borderRadius={4} />
          <SkeletonBlock
            width="60%"
            height={6}
            borderRadius={3}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
    ))}
  </View>
);

export const SectionHeaderSkeleton: React.FC = () => (
  <View style={styles.sectionHeaderRow}>
    <SkeletonBlock width={100} height={14} borderRadius={4} />
    <SkeletonBlock width={50} height={14} borderRadius={4} />
  </View>
);

/* ================= PRODUCT GRID SKELETONS ================= */

export const ProductCardSkeleton: React.FC<{
  width: number;
  imageHeight?: number;
}> = ({ width, imageHeight }) => (
  <View style={[styles.productCardSkeleton, { width }]}>
    <SkeletonBlock
      width="100%"
      height={imageHeight ?? width}
      borderRadius={0}
    />
    <View style={styles.productInfoSkeleton}>
      <SkeletonBlock width="90%" height={12} borderRadius={4} />
      <SkeletonBlock
        width="60%"
        height={12}
        borderRadius={4}
        style={{ marginTop: 6 }}
      />
      <SkeletonBlock
        width="45%"
        height={14}
        borderRadius={4}
        style={{ marginTop: 10 }}
      />
    </View>
  </View>
);

export const ProductGridSkeleton: React.FC<{
  width: number;
  count?: number;
  imageHeight?: number;
  horizontalPadding?: number;
  gap?: number;
}> = ({
  width,
  count = 4,
  imageHeight,
  horizontalPadding = 15,
  gap = 12,
}) => {
  const cardWidth = (width - horizontalPadding * 2 - gap) / 2;
  const rows = Math.ceil(count / 2);
  return (
    <View style={{ paddingHorizontal: horizontalPadding }}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.gridRow}>
          <ProductCardSkeleton width={cardWidth} imageHeight={imageHeight} />
          <ProductCardSkeleton width={cardWidth} imageHeight={imageHeight} />
        </View>
      ))}
    </View>
  );
};

export const DashboardSkeleton: React.FC<{ width: number }> = ({ width }) => (
  <View style={styles.dashboardSkeletonWrap}>
    <BannerSkeleton width={width} />
    <CategoryPillsSkeleton />
    <FeatureBadgesSkeleton />
    <SectionHeaderSkeleton />
    <ProductGridSkeleton width={width} count={4} horizontalPadding={0} />
    <SectionHeaderSkeleton />
    <ProductGridSkeleton width={width} count={4} horizontalPadding={0} />
  </View>
);

export const ScreenGridSkeleton: React.FC<{
  width: number;
  count?: number;
  imageHeight?: number;
  horizontalPadding?: number;
  showSearchBar?: boolean;
}> = ({
  width,
  count = 6,
  imageHeight,
  horizontalPadding = 16,
  showSearchBar = true,
}) => (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    {showSearchBar && (
      <View style={styles.searchBarSkeleton}>
        <SkeletonBlock width="100%" height={42} borderRadius={10} />
      </View>
    )}
    <ProductGridSkeleton
      width={width}
      count={count}
      imageHeight={imageHeight}
      horizontalPadding={horizontalPadding}
    />
  </View>
);

/* ================= ORDER SKELETONS ================= */

export const OrderCardSkeleton: React.FC = () => (
  <View style={styles.orderCardSkeleton}>
    <View style={styles.orderHeaderRow}>
      <SkeletonBlock width={110} height={14} borderRadius={4} />
      <SkeletonBlock width={18} height={18} borderRadius={9} />
    </View>

    <SkeletonBlock
      width={170}
      height={11}
      borderRadius={4}
      style={{ marginTop: 6, marginBottom: 10 }}
    />

    <View style={styles.orderProductRow}>
      <SkeletonBlock width={64} height={64} borderRadius={8} />
      <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
        <SkeletonBlock width="90%" height={12} borderRadius={4} />
        <SkeletonBlock
          width="50%"
          height={11}
          borderRadius={4}
          style={{ marginTop: 6 }}
        />
        <SkeletonBlock
          width="40%"
          height={13}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  </View>
);

export const OrderListSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <View style={{ paddingHorizontal: 14 }}>
    {Array.from({ length: count }).map((_, i) => (
      <OrderCardSkeleton key={i} />
    ))}
  </View>
);

/* ================= NOTIFICATION SKELETONS ================= */

/**
 * Single notification row skeleton — mirrors NotificationScreen row:
 * icon circle → title + time (top row) → 2-line body → optional CTA.
 */
export const NotificationRowSkeleton: React.FC<{ showCTA?: boolean }> = ({
  showCTA = true,
}) => (
  <View style={styles.notificationRowSkeleton}>
    {/* Icon circle */}
    <SkeletonBlock width={48} height={48} borderRadius={24} />

    {/* Content */}
    <View style={styles.notificationContentSkeleton}>
      {/* Title row */}
      <View style={styles.notificationTitleRowSkeleton}>
        <SkeletonBlock width="65%" height={13} borderRadius={4} />
        <SkeletonBlock width={36} height={11} borderRadius={4} />
      </View>

      {/* Body lines */}
      <SkeletonBlock
        width="100%"
        height={11}
        borderRadius={4}
        style={{ marginTop: 6 }}
      />
      <SkeletonBlock
        width="80%"
        height={11}
        borderRadius={4}
        style={{ marginTop: 4 }}
      />

      {/* CTA line */}
      {showCTA && (
        <SkeletonBlock
          width={80}
          height={12}
          borderRadius={4}
          style={{ marginTop: 10 }}
        />
      )}
    </View>

    {/* Unread dot */}
    <SkeletonBlock
      width={8}
      height={8}
      borderRadius={4}
      style={{ marginLeft: 8, marginTop: 20 }}
    />
  </View>
);

/**
 * Notification list skeleton — `count` shimmering rows.
 * Optionally shows a "Mark all as read" placeholder row at the top.
 */
export const NotificationListSkeleton: React.FC<{
  count?: number;
  showMarkAll?: boolean;
  showTabs?: boolean;
}> = ({ count = 6, showMarkAll = true, showTabs = true }) => (
  <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
    {/* Mark all as read row */}
    {showMarkAll && (
      <View style={styles.notifMarkAllSkeleton}>
        <SkeletonBlock width={110} height={12} borderRadius={4} />
      </View>
    )}

    {/* Tabs row */}
    {showTabs && (
      <View style={styles.notifTabsSkeleton}>
        {[60, 70, 65, 70, 90].map((w, i) => (
          <SkeletonBlock
            key={i}
            width={w}
            height={32}
            borderRadius={20}
            style={{ marginRight: 8 }}
          />
        ))}
      </View>
    )}

    {/* Notification rows */}
    <View style={{ paddingHorizontal: 12, paddingTop: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationRowSkeleton key={i} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  bannerWrapper: { marginTop: 12, marginBottom: 12 },
  pillsRow: { flexDirection: 'row', marginTop: 6, marginBottom: 10 },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  featureSkeletonItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  productCardSkeleton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productInfoSkeleton: {
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dashboardSkeletonWrap: { paddingTop: 4 },
  searchBarSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // Order skeletons
  orderCardSkeleton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderProductRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  // Notification skeletons
  notifMarkAllSkeleton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#F8F9FA',
  },
  notifTabsSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#F8F9FA',
  },
  notificationRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEF0F3',
  },
  notificationContentSkeleton: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  notificationTitleRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
});