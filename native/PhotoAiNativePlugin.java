package com.photoaistudio.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.objects.ObjectDetection;
import com.google.mlkit.vision.objects.ObjectDetector;
import com.google.mlkit.vision.objects.defaults.ObjectDetectorOptions;
import com.google.mlkit.vision.pose.PoseDetection;
import com.google.mlkit.vision.pose.PoseDetector;
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions;
import com.google.mlkit.vision.segmentation.Segmentation;
import com.google.mlkit.vision.segmentation.Segmenter;
import com.google.mlkit.vision.segmentation.SegmentationMask;
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.List;

@CapacitorPlugin(name = "PhotoAiNative")
public class PhotoAiNativePlugin extends Plugin {
  private Bitmap readBitmap(PluginCall call) {
    String data = call.getString("imageBase64");
    if (data == null || data.isEmpty()) return null;
    byte[] bytes = Base64.decode(data, Base64.DEFAULT);
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
  }

  @PluginMethod
  public void detectObjects(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    InputImage input = InputImage.fromBitmap(bitmap, 0);
    ObjectDetectorOptions options = new ObjectDetectorOptions.Builder()
      .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
      .enableMultipleObjects().enableClassification().build();
    ObjectDetector detector = ObjectDetection.getClient(options);
    detector.process(input).addOnSuccessListener(objects -> {
      JSArray result = new JSArray();
      for (com.google.mlkit.vision.objects.DetectedObject item : objects) {
        JSObject row = new JSObject();
        row.put("left", item.getBoundingBox().left);
        row.put("top", item.getBoundingBox().top);
        row.put("right", item.getBoundingBox().right);
        row.put("bottom", item.getBoundingBox().bottom);
        if (item.getLabels() != null && !item.getLabels().isEmpty()) {
          row.put("label", item.getLabels().get(0).getText());
          row.put("confidence", item.getLabels().get(0).getConfidence());
        } else row.put("label", "Oggetto rilevato");
        result.put(row);
      }
      JSObject out = new JSObject(); out.put("objects", result); call.resolve(out);
      detector.close(); bitmap.recycle();
    }).addOnFailureListener(error -> { detector.close(); bitmap.recycle(); call.reject("Rilevamento oggetti non riuscito", error); });
  }

  @PluginMethod
  public void detectPose(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    InputImage input = InputImage.fromBitmap(bitmap, 0);
    AccuratePoseDetectorOptions options = new AccuratePoseDetectorOptions.Builder()
      .setDetectorMode(AccuratePoseDetectorOptions.SINGLE_IMAGE_MODE).build();
    PoseDetector detector = PoseDetection.getClient(options);
    detector.process(input).addOnSuccessListener(pose -> {
      JSArray points = new JSArray();
      for (com.google.mlkit.vision.pose.PoseLandmark point : pose.getAllPoseLandmarks()) {
        JSObject p = new JSObject();
        p.put("type", point.getLandmarkType());
        p.put("x", point.getPosition().x);
        p.put("y", point.getPosition().y);
        p.put("confidence", point.getInFrameLikelihood());
        points.put(p);
      }
      JSObject out = new JSObject(); out.put("landmarks", points); out.put("found", pose.getAllPoseLandmarks().size() > 0);
      call.resolve(out); detector.close(); bitmap.recycle();
    }).addOnFailureListener(error -> { detector.close(); bitmap.recycle(); call.reject("Rilevamento posa non riuscito", error); });
  }

  @PluginMethod
  public void segmentPerson(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    InputImage input = InputImage.fromBitmap(bitmap, 0);
    SelfieSegmenterOptions options = new SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE).enableRawSizeMask().build();
    Segmenter segmenter = Segmentation.getClient(options);
    segmenter.process(input).addOnSuccessListener(mask -> {
      int width = mask.getWidth(), height = mask.getHeight();
      ByteBuffer buffer = mask.getBuffer(); buffer.rewind();
      Bitmap alpha = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
      int[] pixels = new int[width * height];
      for (int i = 0; i < pixels.length; i++) {
        int a = Math.max(0, Math.min(255, Math.round(buffer.getFloat() * 255f)));
        pixels[i] = Color.argb(a, 255, 255, 255);
      }
      alpha.setPixels(pixels, 0, width, 0, 0, width, height);
      ByteArrayOutputStream stream = new ByteArrayOutputStream(); alpha.compress(Bitmap.CompressFormat.PNG, 100, stream);
      String encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
      JSObject out = new JSObject(); out.put("width", width); out.put("height", height); out.put("maskBase64", encoded);
      call.resolve(out); segmenter.close(); bitmap.recycle(); alpha.recycle();
    }).addOnFailureListener(error -> { segmenter.close(); bitmap.recycle(); call.reject("Segmentazione non riuscita", error); });
  }
}
