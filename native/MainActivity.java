package com.photoaistudio.app09;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(PhotoAiNativePlugin.class);
    super.onCreate(savedInstanceState);
  }
}
