import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDownLeft, ArrowUpRight, History, Settings, WalletMinimal } from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import Typography from '@/constants/typography';

type VisibleTabName = 'index' | 'send' | 'receive' | 'history' | 'settings';

const IS_ANDROID = Platform.OS === 'android';
const NAV_BAR_BACKGROUND = '#031B3D';
const ANDROID_RECOMMENDED_BOTTOM_OFFSET = 14;
const IOS_BOTTOM_OFFSET = 16;

type IconComponent = React.ComponentType<{
  color?: string;
  size?: string | number;
  strokeWidth?: number;
}>;

interface TabMeta {
  label: string;
  icon: IconComponent;
  compactWidth: number;
  expandedWidth: number;
  iconSize: number;
}

interface TabButtonProps {
  label: string;
  Icon: IconComponent;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  itemStyle?: StyleProp<ViewStyle>;
  meta: TabMeta;
}

const TAB_META: Record<VisibleTabName, TabMeta> = IS_ANDROID
  ? {
      index: {
        label: 'Wallet',
        icon: WalletMinimal,
        compactWidth: 46,
        expandedWidth: 104,
        iconSize: 20,
      },
      send: {
        label: 'Send',
        icon: ArrowUpRight,
        compactWidth: 46,
        expandedWidth: 98,
        iconSize: 19,
      },
      receive: {
        label: 'Receive',
        icon: ArrowDownLeft,
        compactWidth: 46,
        expandedWidth: 106,
        iconSize: 19,
      },
      history: {
        label: 'History',
        icon: History,
        compactWidth: 46,
        expandedWidth: 104,
        iconSize: 19,
      },
      settings: {
        label: 'Settings',
        icon: Settings,
        compactWidth: 46,
        expandedWidth: 108,
        iconSize: 19,
      },
    }
  : {
      index: {
        label: 'Wallet',
        icon: WalletMinimal,
        compactWidth: 50,
        expandedWidth: 118,
        iconSize: 21,
      },
      send: {
        label: 'Send',
        icon: ArrowUpRight,
        compactWidth: 50,
        expandedWidth: 108,
        iconSize: 20,
      },
      receive: {
        label: 'Receive',
        icon: ArrowDownLeft,
        compactWidth: 50,
        expandedWidth: 116,
        iconSize: 20,
      },
      history: {
        label: 'History',
        icon: History,
        compactWidth: 50,
        expandedWidth: 114,
        iconSize: 20,
      },
      settings: {
        label: 'Settings',
        icon: Settings,
        compactWidth: 50,
        expandedWidth: 118,
        iconSize: 20,
      },
    };

function isVisibleTabName(name: string): name is VisibleTabName {
  return Object.prototype.hasOwnProperty.call(TAB_META, name);
}

function getFocusedTabName(name: string | undefined): VisibleTabName | null {
  if (name === 'wallet') {
    return 'index';
  }

  return name && isVisibleTabName(name) ? name : null;
}

const AnimatedTabButton = memo(function AnimatedTabButton({
  label,
  Icon,
  isFocused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
  itemStyle,
  meta,
}: TabButtonProps) {
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      damping: 18,
      mass: 0.9,
      stiffness: 220,
    }).start();
  }, [isFocused, progress]);

  const shellWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [meta.compactWidth, meta.expandedWidth],
  });

  const shellScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, meta.expandedWidth - meta.compactWidth - 10],
  });

  const labelOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const labelMarginLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const activePillOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const iconColor = isFocused ? '#0D5CF2' : '#F4F8FF';
  const labelColor = '#0D5CF2';

  const handlePress = useCallback(() => {
    console.log('🧭 Tab pressed:', label);
    void Haptics.selectionAsync();
    onPress();
  }, [label, onPress]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onLongPress={onLongPress}
      onPress={handlePress}
      style={[styles.hitArea, itemStyle]}
      testID={testID}
    >
      <Animated.View style={[styles.buttonShell, { width: shellWidth, transform: [{ scale: shellScale }] }]}>
        <Animated.View pointerEvents="none" style={[styles.activePill, { opacity: activePillOpacity }]}> 
          <LinearGradient
            colors={['rgba(255,255,255,1)', 'rgba(248,251,255,0.98)', 'rgba(239,245,255,0.96)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.86)', 'rgba(255,255,255,0)']}
            end={{ x: 0.9, y: 1 }}
            start={{ x: 0.15, y: 0 }}
            style={styles.activeGloss}
          />
        </Animated.View>

        <View style={styles.buttonContent}>
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}> 
            <Icon color={iconColor} size={meta.iconSize} strokeWidth={2.2} />
          </Animated.View>

          <Animated.View style={[styles.labelWrap, { width: labelWidth, opacity: labelOpacity, marginLeft: labelMarginLeft }]}> 
            <Animated.Text numberOfLines={1} style={[styles.label, { color: labelColor }]}>
              {label}
            </Animated.Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const FloatingTabBar = memo(function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const visibleRoutes = useMemo(() => state.routes.filter((route) => isVisibleTabName(route.name)), [state.routes]);

  const currentRouteName = state.routes[state.index]?.name;
  const effectiveFocusedTab = useMemo<VisibleTabName | null>(() => getFocusedTabName(currentRouteName), [currentRouteName]);
  const bottomPadding = IS_ANDROID
    ? Math.max(insets.bottom, ANDROID_RECOMMENDED_BOTTOM_OFFSET)
    : IOS_BOTTOM_OFFSET;

  console.log('📐 FloatingTabBar bottom padding:', {
    bottomPadding,
    insetsBottom: insets.bottom,
    platform: Platform.OS,
  });

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: bottomPadding }]}> 
      <View style={styles.shadowWrap}>
        <LinearGradient
          colors={[NAV_BAR_BACKGROUND, NAV_BAR_BACKGROUND, NAV_BAR_BACKGROUND]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.barShell}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']}
            end={{ x: 0.95, y: 0.9 }}
            start={{ x: 0.08, y: 0.02 }}
            style={styles.outerGloss}
          />
          <View style={styles.row}>
            {visibleRoutes.map((route) => {
              const routeName = route.name as VisibleTabName;
              const meta = TAB_META[routeName];
              const descriptor = descriptors[route.key];
              const options = descriptor?.options;
              const isFocused = effectiveFocusedTab === routeName;
              const isActuallyFocused = currentRouteName === route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isActuallyFocused && !event.defaultPrevented) {
                  console.log('🔀 Navigating to tab:', route.name);
                  navigation.navigate(route.name as never);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              return (
                <AnimatedTabButton
                  key={route.key}
                  Icon={meta.icon}
                  accessibilityLabel={options?.tabBarAccessibilityLabel}
                  isFocused={isFocused}
                  itemStyle={options?.tabBarItemStyle}
                  label={meta.label}
                  meta={meta}
                  onLongPress={onLongPress}
                  onPress={onPress}
                  testID={options?.tabBarButtonTestID}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  host: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: IS_ANDROID ? 6 : 8,
  },
  shadowWrap: {
    borderRadius: IS_ANDROID ? 30 : 36,
    shadowColor: '#02152E',
    shadowOffset: {
      width: 0,
      height: IS_ANDROID ? 10 : 14,
    },
    shadowOpacity: 0.24,
    shadowRadius: IS_ANDROID ? 20 : 26,
    elevation: IS_ANDROID ? 14 : 18,
  },
  barShell: {
    minHeight: IS_ANDROID ? 76 : 86,
    borderRadius: IS_ANDROID ? 30 : 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: IS_ANDROID ? 10 : 12,
    paddingVertical: IS_ANDROID ? 10 : 12,
  },
  outerGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: IS_ANDROID ? 4 : 6,
  },
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShell: {
    height: IS_ANDROID ? 52 : 58,
    borderRadius: IS_ANDROID ? 26 : 29,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: IS_ANDROID ? 26 : 29,
    shadowColor: '#021B58',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  activeGloss: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: IS_ANDROID ? 26 : 29,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IS_ANDROID ? 12 : 14,
  },
  iconWrap: {
    width: IS_ANDROID ? 24 : 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    overflow: 'hidden',
  },
  label: {
    ...Typography.bodySemibold,
    lineHeight: IS_ANDROID ? 18 : 20,
  },
});

export default FloatingTabBar;
