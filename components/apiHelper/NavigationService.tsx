import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "../models/types";

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function getCurrentRoute() {
  return navigationRef.getCurrentRoute();
}
