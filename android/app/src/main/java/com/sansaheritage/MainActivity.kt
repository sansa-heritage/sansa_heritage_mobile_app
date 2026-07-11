package com.sansaheritage

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {
  
  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.AppTheme) 
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "SansaHeritage"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
