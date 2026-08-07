import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function getCurrentRoute() {
  return navigationRef.current?.getCurrentRoute();
}
