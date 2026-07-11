package com.sansaheritage

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

// ✅ IMPORT FIREBASE PACKAGES
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            
            // ✅ ADD FIREBASE PACKAGES
            try {
                packages.add(ReactNativeFirebaseAppPackage())
                packages.add(ReactNativeFirebaseMessagingPackage())
                Log.d("MainApplication", "✅ Firebase packages added successfully")
            } catch (e: Exception) {
                Log.e("MainApplication", "❌ Failed to add Firebase packages: ${e.message}")
                e.printStackTrace()
            }
            
            return packages
          }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
