package com.dkoniaris.filtracam;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Τοπικός HTTP server: εξυπηρετεί τα assets της εφαρμογής + MJPEG stream κάμερας. */
public class HttpServer {
    private final Context ctx;
    private ServerSocket socket;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private volatile CameraStreamer cam;
    private volatile boolean running = true;

    public HttpServer(Context c) {
        this.ctx = c;
    }

    public void setCamera(CameraStreamer c) { this.cam = c; }

    public void start() {
        try {
            socket = new ServerSocket(8765, 16, InetAddress.getByName("127.0.0.1"));
            pool.submit(() -> {
                while (running) {
                    try {
                        Socket s = socket.accept();
                        pool.submit(() -> handle(s));
                    } catch (Exception e) { break; }
                }
            });
        } catch (Exception e) {
            LogE("server start", e);
        }
    }

    private void handle(Socket s) {
        try {
            s.setSoTimeout(20000);
            java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(s.getInputStream()));
            String line = in.readLine();
            if (line == null) { s.close(); return; }
            String[] parts = line.split(" ");
            String path = parts.length > 1 ? parts[1] : "/";
            while (true) { String h = in.readLine(); if (h == null || h.isEmpty()) break; }
            if (path.startsWith("/stream.mjpeg")) { serveMjpeg(s); return; }
            if (path.contains("..")) { s.close(); return; }
            serveFile(s, path);
        } catch (Exception e) {
            try { s.close(); } catch (Exception e2) {}
        }
    }

    private void serveFile(Socket s, String path) throws IOException {
        if (path.equals("/")) path = "/index.html";
        String name = path.startsWith("/") ? path.substring(1) : path;
        AssetManager am = ctx.getAssets();
        InputStream is = null;
        try { is = am.open("www/" + name); } catch (IOException e) {
            try { is = am.open(name); } catch (IOException e2) { is = null; }
        }
        if (is == null) { send(s, 404, "text/plain", "not found".getBytes()); return; }
        byte[] data = readAll(is);
        send(s, 200, mimeFor(name), data);
    }

    private void serveMjpeg(Socket s) throws IOException {
        OutputStream out = s.getOutputStream();
        out.write(("HTTP/1.1 200 OK\r\n" +
            "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n" +
            "Cache-Control: no-cache\r\nConnection: close\r\n\r\n").getBytes());
        out.flush();
        long last = 0;
        while (running) {
            CameraStreamer c = cam;
            byte[] f = c != null ? c.getLatest() : null;
            if (f != null) {
                long now = System.currentTimeMillis();
                if (now - last >= 40) {
                    last = now;
                    StringBuilder b = new StringBuilder();
                    b.append("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ")
                     .append(f.length).append("\r\n\r\n");
                    out.write(b.toString().getBytes());
                    out.write(f);
                    out.write("\r\n".getBytes());
                    out.flush();
                }
            }
            try { Thread.sleep(10); } catch (InterruptedException e) { break; }
        }
        try { s.close(); } catch (Exception e) {}
    }

    private static byte[] readAll(InputStream is) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) > 0) bos.write(buf, 0, n);
        is.close();
        return bos.toByteArray();
    }

    private static String mimeFor(String name) {
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private static void send(Socket s, int code, String mime, byte[] body) throws IOException {
        OutputStream out = s.getOutputStream();
        String head = "HTTP/1.1 " + code + (code == 200 ? " OK" : " Not Found") +
            "\r\nContent-Type: " + mime + "\r\nContent-Length: " + body.length +
            "\r\nConnection: close\r\n\r\n";
        out.write(head.getBytes());
        out.write(body);
        out.flush();
        s.close();
    }

    public void stop() {
        running = false;
        try { socket.close(); } catch (Exception e) {}
        pool.shutdownNow();
    }

    private static void LogE(String m, Exception e) {
        android.util.Log.e("FTL", m, e);
    }
}
