package com.dkoniaris.filtracam;

import android.content.Context;
import android.graphics.ImageFormat;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.view.Surface;

import java.nio.ByteBuffer;
import java.util.Collections;

/** Native κάμερα (Camera2) → JPEG καρέ σε buffer για το MJPEG server. */
public class CameraStreamer {
    private final Context ctx;
    private CameraManager mgr;
    private String cameraId;
    private CameraDevice device;
    private ImageReader reader;
    private HandlerThread thread;
    private Handler handler;
    private volatile byte[] latest = null;
    private final Object lock = new Object();
    private boolean front;

    public CameraStreamer(Context c, boolean front) {
        this.ctx = c;
        this.front = front;
    }

    public void open() {
        try {
            mgr = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
            thread = new HandlerThread("cam");
            thread.start();
            handler = new Handler(thread.getLooper());
            chooseCamera();
            reader = ImageReader.newInstance(640, 480, ImageFormat.JPEG, 4);
            reader.setOnImageAvailableListener(r -> {
                Image img = r.acquireLatestImage();
                if (img != null) {
                    try {
                        ByteBuffer b = img.getPlanes()[0].getBuffer();
                        byte[] data = new byte[b.remaining()];
                        b.get(data);
                        synchronized (lock) { latest = data; }
                    } catch (Exception e) { /* ignore */ }
                    img.close();
                }
            }, handler);
            mgr.openCamera(cameraId, new CameraDevice.StateCallback() {
                @Override public void onOpened(CameraDevice d) { device = d; startPreview(); }
                @Override public void onDisconnected(CameraDevice d) { d.close(); }
                @Override public void onError(CameraDevice d, int e) { d.close(); }
            }, handler);
        } catch (Exception e) {
            Log.e("FTL", "cam open", e);
        }
    }

    private void chooseCamera() {
        try {
            String[] ids = mgr.getCameraIdList();
            String fallback = ids.length > 0 ? ids[0] : null;
            for (String id : ids) {
                CameraCharacteristics ch = mgr.getCameraCharacteristics(id);
                Integer face = ch.get(CameraCharacteristics.LENS_FACING);
                if (front && face != null && face == CameraCharacteristics.LENS_FACING_FRONT) { cameraId = id; return; }
                if (!front && face != null && face == CameraCharacteristics.LENS_FACING_BACK) { cameraId = id; return; }
            }
            cameraId = fallback;
        } catch (Exception e) {
            Log.e("FTL", "choose", e);
        }
    }

    private void startPreview() {
        try {
            device.createCaptureSession(Collections.singletonList(reader.getSurface()),
                new CameraCaptureSession.StateCallback() {
                    @Override public void onConfigured(CameraCaptureSession s) {
                        try {
                            CaptureRequest.Builder b = device.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
                            b.addTarget(reader.getSurface());
                            b.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
                            s.setRepeatingRequest(b.build(), null, handler);
                        } catch (Exception e) { Log.e("FTL", "req", e); }
                    }
                    @Override public void onConfigureFailed(CameraCaptureSession s) { }
                }, handler);
        } catch (Exception e) {
            Log.e("FTL", "session", e);
        }
    }

    public void setFacing(boolean f) {
        if (f == front) return;
        front = f;
        close();
        open();
    }

    public byte[] getLatest() {
        synchronized (lock) { return latest; }
    }

    public void close() {
        try { if (device != null) device.close(); } catch (Exception e) {}
        try { if (reader != null) reader.close(); } catch (Exception e) {}
        try { if (thread != null) thread.quitSafely(); } catch (Exception e) {}
        device = null; reader = null; thread = null; handler = null;
        synchronized (lock) { latest = null; }
    }
}
