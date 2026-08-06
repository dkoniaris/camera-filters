package com.dkoniaris.filtracam;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView web;
    private CameraStreamer cam;
    private HttpServer server;
    private boolean pendingFront = true;
    private boolean lastFront = true;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
        web.setDownloadListener((url, ua, mime, disc, len) -> {
            try {
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                String name = (disc != null && !disc.isEmpty()) ? disc : "filtra-" + System.currentTimeMillis() + ".bin";
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                dm.enqueue(r);
            } catch (Exception e) { Log.e("FTL", "dl", e); }
        });
        web.addJavascriptInterface(new Bridge(), "FiltraNative");
        setContentView(web);
        web.setBackgroundColor(0xFF0b0b12);
        web.loadUrl("http://127.0.0.1:8765/index.html");
    }

    private class Bridge {
        @JavascriptInterface
        public boolean isNative() { return true; }

        @JavascriptInterface
        public void startCamera(final boolean front) {
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingFront = front;
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, 1);
                } else {
                    startCam(front);
                }
            });
        }

        @JavascriptInterface
        public void setFacing(final boolean front) {
            runOnUiThread(() -> { if (cam != null) cam.setFacing(front); });
        }

        @JavascriptInterface
        public void stopCamera() {
            runOnUiThread(() -> { if (cam != null) { cam.close(); cam = null; } });
        }

        @JavascriptInterface
        public void savePhoto(final String dataUrl, final String name) {
            runOnUiThread(() -> saveMedia(dataUrl, name, "image/png", "Pictures"));
        }

        @JavascriptInterface
        public void saveVideo(final String dataUrl, final String name) {
            runOnUiThread(() -> saveMedia(dataUrl, name, "video/webm", "Movies"));
        }
    }

    private void saveMedia(String dataUrl, String name, String mime, String dir) {
        try {
            String b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            String fname = name + (mime.startsWith("image") ? ".png" : ".webm");
            Uri uri;
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.MediaColumns.DISPLAY_NAME, fname);
                cv.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                cv.put("relative_path", dir + "/FiltraCam");
                uri = getContentResolver().insert(
                    mime.startsWith("image") ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                                             : MediaStore.Video.Media.EXTERNAL_CONTENT_URI, cv);
            } else {
                java.io.File f = new java.io.File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "FiltraCam");
                f.mkdirs();
                java.io.File out = new java.io.File(f, fname);
                java.io.FileOutputStream fos = new java.io.FileOutputStream(out);
                fos.write(bytes); fos.close();
                MediaScannerConnection.scanFile(this, new String[]{out.getAbsolutePath()}, null, null);
                return;
            }
            OutputStream os = getContentResolver().openOutputStream(uri);
            os.write(bytes); os.close();
        } catch (Exception e) { Log.e("FTL", "saveMedia", e); }
    }

    private void startCam(boolean front) {
        if (server == null) {
            server = new HttpServer(this);
            server.start();
        }
        if (cam != null) cam.close();
        cam = new CameraStreamer(this, front);
        server.setCamera(cam);
        cam.open();
        lastFront = front;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        super.onRequestPermissionsResult(code, perms, results);
        if (code == 1) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
                startCam(pendingFront);
            } else {
                web.post(() -> web.evaluateJavascript(
                    "window.__nativeDenied && window.__nativeDenied()", v -> {}));
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (cam != null) cam.close();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // αν γύρισε από background, ξανα-ανοίγουμε την κάμερα
        if (server != null && cam == null && !isFinishing()) {
            cam = new CameraStreamer(this, lastFront);
            server.setCamera(cam);
            cam.open();
        }
    }

    @Override
    protected void onDestroy() {
        if (cam != null) cam.close();
        if (server != null) server.stop();
        super.onDestroy();
    }
}
