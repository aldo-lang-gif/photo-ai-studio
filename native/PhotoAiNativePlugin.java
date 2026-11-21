package com.photoaistudio.app09;

import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
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
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;

@CapacitorPlugin(name = "PhotoAiNative")
public class PhotoAiNativePlugin extends Plugin {
  private Bitmap readBitmap(PluginCall call) {
    String data = call.getString("imageBase64");
    if (data == null || data.isEmpty()) return null;
    byte[] bytes = Base64.decode(data, Base64.DEFAULT);
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
  }

  @PluginMethod
  public void saveToGallery(PluginCall call) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      call.reject("Il salvataggio diretto in Galleria richiede Android 10 o successivo.");
      return;
    }
    String encoded = call.getString("imageBase64");
    if (encoded == null || encoded.isEmpty()) {
      call.reject("Immagine da salvare mancante.");
      return;
    }
    String mimeType = call.getString("mimeType", "image/jpeg");
    if (!mimeType.equals("image/jpeg") && !mimeType.equals("image/png") && !mimeType.equals("image/webp")) {
      call.reject("Formato immagine non supportato.");
      return;
    }
    String fileName = call.getString("fileName", "PIXORA-" + System.currentTimeMillis() + ".jpg");
    fileName = fileName.replaceAll("[^A-Za-z0-9._-]", "_");
    byte[] imageBytes;
    try {
      imageBytes = Base64.decode(encoded, Base64.DEFAULT);
    } catch (IllegalArgumentException error) {
      call.reject("Dati immagine non validi.", error);
      return;
    }
    if (imageBytes.length == 0) {
      call.reject("Immagine vuota.");
      return;
    }

    Uri imageUri = null;
    try {
      ContentValues values = new ContentValues();
      values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
      values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
      values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/PIXORA AI");
      values.put(MediaStore.Images.Media.IS_PENDING, 1);

      imageUri = getContext().getContentResolver().insert(
        MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values
      );
      if (imageUri == null) throw new IllegalStateException("Android non ha creato il file nella Galleria.");

      try (OutputStream output = getContext().getContentResolver().openOutputStream(imageUri, "w")) {
        if (output == null) throw new IllegalStateException("Impossibile aprire il file di destinazione.");
        output.write(imageBytes);
        output.flush();
      }

      ContentValues published = new ContentValues();
      published.put(MediaStore.Images.Media.IS_PENDING, 0);
      getContext().getContentResolver().update(imageUri, published, null, null);

      JSObject result = new JSObject();
      result.put("saved", true);
      result.put("uri", imageUri.toString());
      result.put("fileName", fileName);
      call.resolve(result);
    } catch (Exception error) {
      if (imageUri != null) {
        try { getContext().getContentResolver().delete(imageUri, null, null); } catch (Exception ignored) {}
      }
      call.reject("Salvataggio nella Galleria non riuscito: " + error.getMessage(), error);
    }
  }

  @PluginMethod
  public void detectObjects(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    ObjectDetectorOptions options = new ObjectDetectorOptions.Builder()
      .setDetectorMode(ObjectDetectorOptions.SINGLE_IMAGE_MODE)
      .enableMultipleObjects().enableClassification().build();
    ObjectDetector detector = ObjectDetection.getClient(options);
    detector.process(InputImage.fromBitmap(bitmap, 0)).addOnSuccessListener(objects -> {
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
      JSObject out = new JSObject(); out.put("objects", result);
      call.resolve(out); detector.close(); bitmap.recycle();
    }).addOnFailureListener(error -> {
      detector.close(); bitmap.recycle(); call.reject("Rilevamento oggetti non riuscito", error);
    });
  }

  @PluginMethod
  public void detectPose(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    AccuratePoseDetectorOptions options = new AccuratePoseDetectorOptions.Builder()
      .setDetectorMode(AccuratePoseDetectorOptions.SINGLE_IMAGE_MODE).build();
    PoseDetector detector = PoseDetection.getClient(options);
    detector.process(InputImage.fromBitmap(bitmap, 0)).addOnSuccessListener(pose -> {
      JSArray points = new JSArray();
      for (com.google.mlkit.vision.pose.PoseLandmark point : pose.getAllPoseLandmarks()) {
        JSObject p = new JSObject();
        p.put("type", point.getLandmarkType());
        p.put("x", point.getPosition().x);
        p.put("y", point.getPosition().y);
        p.put("confidence", point.getInFrameLikelihood());
        points.put(p);
      }
      JSObject out = new JSObject();
      out.put("landmarks", points);
      out.put("found", pose.getAllPoseLandmarks().size() > 0);
      call.resolve(out); detector.close(); bitmap.recycle();
    }).addOnFailureListener(error -> {
      detector.close(); bitmap.recycle(); call.reject("Rilevamento posa non riuscito", error);
    });
  }

  @PluginMethod
  public void segmentPerson(PluginCall call) {
    Bitmap bitmap = readBitmap(call);
    if (bitmap == null) { call.reject("Immagine non valida"); return; }
    SelfieSegmenterOptions options = new SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE).enableRawSizeMask().build();
    Segmenter segmenter = Segmentation.getClient(options);
    segmenter.process(InputImage.fromBitmap(bitmap, 0)).addOnSuccessListener(mask -> {
      int width = mask.getWidth(), height = mask.getHeight();
      ByteBuffer buffer = mask.getBuffer(); buffer.rewind();
      Bitmap alpha = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
      int[] pixels = new int[width * height];
      for (int i = 0; i < pixels.length; i++) {
        int a = Math.max(0, Math.min(255, Math.round(buffer.getFloat() * 255f)));
        pixels[i] = Color.argb(a, 255, 255, 255);
      }
      alpha.setPixels(pixels, 0, width, 0, 0, width, height);
      ByteArrayOutputStream stream = new ByteArrayOutputStream();
      alpha.compress(Bitmap.CompressFormat.PNG, 100, stream);
      String encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP);
      JSObject out = new JSObject();
      out.put("width", width); out.put("height", height); out.put("maskBase64", encoded);
      call.resolve(out); segmenter.close(); bitmap.recycle(); alpha.recycle();
    }).addOnFailureListener(error -> {
      segmenter.close(); bitmap.recycle(); call.reject("Segmentazione non riuscita", error);
    });
  }
}
