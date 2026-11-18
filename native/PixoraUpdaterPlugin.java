package com.photoaistudio.app09;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PixoraUpdater")
public class PixoraUpdaterPlugin extends Plugin {
  private long downloadId = -1;
  private BroadcastReceiver receiver;

  @PluginMethod
  public void downloadAndInstall(PluginCall call) {
    String url = call.getString("url");
    String fileName = call.getString("fileName", "PIXORA-AI-update.apk");
    if (url == null || !url.startsWith("https://")) {
      call.reject("Indirizzo APK non valido."); return;
    }
    if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
      Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
        Uri.parse("package:" + getContext().getPackageName()));
      settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(settings);
      call.reject("Consenti a PIXORA AI di installare app da questa origine, poi premi di nuovo Scarica.");
      return;
    }
    try {
      DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
      DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
      request.setTitle("Aggiornamento PIXORA AI");
      request.setDescription("Download della nuova versione");
      request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
      request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, fileName);
      downloadId = dm.enqueue(request);
      registerReceiver();
      call.resolve();
    } catch (Exception e) {
      call.reject("Impossibile avviare il download dell'aggiornamento.", e);
    }
  }

  private void registerReceiver() {
    if (receiver != null) return;
    receiver = new BroadcastReceiver() {
      @Override public void onReceive(Context context, Intent intent) {
        if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())
            && intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -2) == downloadId) {
          DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
          DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
          try (Cursor cursor = dm.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) return;
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status != DownloadManager.STATUS_SUCCESSFUL) return;
          }
          Uri downloaded = dm.getUriForDownloadedFile(downloadId);
          if (downloaded != null) launchInstaller(downloaded);
        }
      }
    };
    IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
    if (Build.VERSION.SDK_INT >= 33) getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
    else getContext().registerReceiver(receiver, filter);
  }

  private void launchInstaller(Uri uri) {
    Intent install = new Intent(Intent.ACTION_VIEW);
    install.setDataAndType(uri, "application/vnd.android.package-archive");
    install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
    getContext().startActivity(install);
  }
}
