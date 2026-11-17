package com.photoaistudio.app09;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Color;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle savedInstanceState) {
  registerPlugin(PhotoAiNativePlugin.class);
  super.onCreate(savedInstanceState);
  Window w=getWindow();
  w.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
  w.setStatusBarColor(Color.rgb(7,13,32));
  w.setNavigationBarColor(Color.rgb(7,13,32));
  if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.R && w.getInsetsController()!=null){
   w.getInsetsController().setSystemBarsAppearance(0,android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
  }else{
   View d=w.getDecorView();int f=d.getSystemUiVisibility();f&=~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
   if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.O)f&=~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
   d.setSystemUiVisibility(f);
  }
 }
}
