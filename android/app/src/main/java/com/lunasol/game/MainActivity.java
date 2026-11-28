
package com.lunasol.game;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.AtomicFile;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONObject;
import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/game/index.html";
    private static final String LIVE = "https://github.com/Alix1211/LUNA-SOL/releases/download/luna-sol-live/";
    private static final int IMPORT = 401, EXPORT = 402;
    private static final int SAVE_LIMIT = 4 * 1024 * 1024;
    private static final int ZIP_LIMIT = 80 * 1024 * 1024;
    private static final int UNPACK_LIMIT = 170 * 1024 * 1024;
    private WebView game;
    private File updates;
    private AtomicFile save;
    private volatile File active;
    private volatile boolean importing;
    private final java.util.concurrent.atomic.AtomicBoolean checking = new java.util.concurrent.atomic.AtomicBoolean();
    private long lastCheck;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        hideBars();
        updates = new File(getFilesDir(), "updates");
        save = new AtomicFile(new File(getFilesDir(), "lunasol-save.json"));
        String installed = getPreferences(0).getString("ready", "");
        if (installed.matches("[0-9a-f]{40}")) {
            File ready = new File(updates, installed);
            if (new File(ready, "index.html").isFile()) active = ready;
        }
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/game/", this::serveFile).build();
        game = new WebView(this);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.addJavascriptInterface(new LunaBridge(), "LunaBridge");
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                return !"https".equals(url.getScheme()) || !HOST.equals(url.getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse result = loader.shouldInterceptRequest(request.getUrl());
                return result != null ? result : new WebResourceResponse("text/plain", "UTF-8",
                    404, "Not found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });
        setContentView(game);
        game.loadUrl(HOME);
    }

    @Override protected void onResume() {
        super.onResume();
        hideBars();
        long now = android.os.SystemClock.elapsedRealtime();
        if ((lastCheck == 0 || now - lastCheck >= 60000) && checking.compareAndSet(false, true)) {
            lastCheck = now;
            new Thread(() -> {
                try { downloadUpdate(); } finally { checking.set(false); }
            }, "luna-game-update").start();
        }
    }
    private File stagedUpdate() {
        String version = getPreferences(0).getString("ready", "");
        if (!version.matches("[0-9a-f]{40}")) return null;
        File ready = new File(updates, version);
        return !ready.equals(active) && new File(ready, "index.html").isFile() ? ready : null;
    }
    @Override protected void onPause() {
        super.onPause();
        if (game != null) game.evaluateJavascript("try{persist()}catch(e){}", null);
    }
    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    private WebResourceResponse serveFile(String path) {
        if (path.isEmpty() || path.startsWith("/") || path.contains("..") || path.indexOf('\\') >= 0) return null;
        try {
            File version = active;
            InputStream in = version == null
                ? getAssets().open("web/" + path, AssetManager.ACCESS_STREAMING)
                : new FileInputStream(new File(version, path));
            String mime = path.endsWith(".js") ? "application/javascript"
                : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html"
                : path.endsWith(".webp") ? "image/webp" : path.endsWith(".png") ? "image/png"
                : path.endsWith(".mp3") ? "audio/mpeg" : "application/octet-stream";
            WebResourceResponse response = new WebResourceResponse(mime,
                mime.startsWith("image/") || mime.startsWith("audio/") ? null : "UTF-8", in);
            response.setResponseHeaders(Collections.singletonMap("Cache-Control", "no-store"));
            return response;
        } catch (IOException e) { return null; }
    }

    private static InputStream connect(String url) throws IOException {
        URLConnection request = new URL(url).openConnection();
        request.setUseCaches(false);
        request.setConnectTimeout(12000);
        request.setReadTimeout(15000);
        request.setRequestProperty("Cache-Control", "no-cache");
        return request.getInputStream();
    }
    private static long copy(InputStream input, OutputStream output, long maximum) throws IOException {
        byte[] buffer = new byte[32768];
        long size = 0;
        int n;
        while ((n = input.read(buffer)) != -1) {
            size += n;
            if (size > maximum) throw new IOException("File too large");
            output.write(buffer, 0, n);
        }
        return size;
    }
    private static String readText(InputStream input, int limit) throws IOException {
        try (InputStream in = input; ByteArrayOutputStream contents = new ByteArrayOutputStream()) {
            copy(in, contents, limit);
            return new String(contents.toByteArray(), StandardCharsets.UTF_8);
        }
    }
    private static void remove(File root) {
        File[] files = root.listFiles();
        if (files != null) for (File child : files) remove(child);
        root.delete();
    }
    private void downloadUpdate() {
        if (!updates.isDirectory() && !updates.mkdirs()) return;
        File archive = new File(updates, "download.zip");
        File pending = new File(updates, "pending");
        try {
            JSONObject manifest = new JSONObject(readText(connect(LIVE + "latest.json?t=" + System.currentTimeMillis()), 8192));
            if (manifest.getInt("format") != 1) return;
            String version = manifest.getString("version");
            String hash = manifest.getString("sha256");
            if (!version.matches("[0-9a-f]{40}") || !hash.matches("[0-9a-f]{64}")) return;
            if (version.equals(getPreferences(0).getString("ready", ""))) return;
            if (version.equals(readText(getAssets().open("web/app-version.txt"), 128).trim())) return;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream input = new java.security.DigestInputStream(connect(LIVE + "game-" + version + ".zip"), digest);
                 OutputStream output = new FileOutputStream(archive)) {
                copy(input, output, ZIP_LIMIT);
            }
            StringBuilder observed = new StringBuilder();
            for (byte octet : digest.digest()) observed.append(String.format(java.util.Locale.ROOT, "%02x", octet & 255));
            if (!hash.contentEquals(observed)) throw new IOException("Update checksum mismatch");
            remove(pending);
            if (!pending.mkdir()) throw new IOException("Could not stage update");
            long unpacked = 0;
            int entries = 0;
            String prefix = pending.getCanonicalPath() + File.separator;
            try (ZipInputStream zip = new ZipInputStream(new FileInputStream(archive))) {
                ZipEntry entry;
                while ((entry = zip.getNextEntry()) != null) {
                    File destination = new File(pending, entry.getName());
                    if (++entries > 1600 || !destination.getCanonicalPath().startsWith(prefix))
                        throw new IOException("Invalid update entry");
                    File dir = entry.isDirectory() ? destination : destination.getParentFile();
                    if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Could not create update directory");
                    if (!entry.isDirectory()) try (OutputStream output = new FileOutputStream(destination)) {
                        unpacked += copy(zip, output, UNPACK_LIMIT - unpacked);
                    }
                    zip.closeEntry();
                }
            }
            if (!new File(pending, "index.html").isFile() || !new File(pending, "js/game.js").isFile())
                throw new IOException("Incomplete update");
            File ready = new File(updates, version);
            if (ready.equals(active)) return;
            remove(ready);
            if (!pending.renameTo(ready)) throw new IOException("Could not activate update");
            getPreferences(0).edit().putString("ready", version).apply();
            File[] old = updates.listFiles();
            if (old != null) for (File file : old) {
                if (file.getName().matches("[0-9a-f]{40}") && !file.equals(ready) && !file.equals(active)) remove(file);
            }
        } catch (Exception e) {
            android.util.Log.w("LunaSol", "Update unavailable. Existing game retained.", e);
        } finally {
            archive.delete();
            remove(pending);
        }
    }

    private static boolean validSave(String json) {
        try {
            JSONObject state = new JSONObject(json);
            JSONObject pos = state.getJSONObject("pos");
            int e = pos.getInt("e"), s = pos.getInt("s");
            return state.getInt("v") == 1 && e >= 0 && e <= 90 && s >= 0
                && state.getJSONArray("board").length() == 36 && state.getJSONArray("store").length() == 8;
        } catch (Exception e) { return false; }
    }
    private synchronized String readSave() {
        try {
            String json = readText(save.openRead(), SAVE_LIMIT);
            return validSave(json) ? json : "";
        } catch (IOException e) { return ""; }
    }
    private synchronized boolean writeSave(String json) {
        if (json == null || json.length() > SAVE_LIMIT || !validSave(json)) return false;
        FileOutputStream stream = null;
        try {
            stream = save.startWrite();
            stream.write(json.getBytes(StandardCharsets.UTF_8));
            save.finishWrite(stream);
            return true;
        } catch (IOException e) {
            if (stream != null) save.failWrite(stream);
            return false;
        }
    }
    private void toast(String message) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show();
    }
    public final class LunaBridge {
        @JavascriptInterface public String load() {
            String value = readSave();
            importing = false;
            return value;
        }
        @JavascriptInterface public boolean save(String json) {
            return !importing && writeSave(json);
        }
        @JavascriptInterface public boolean hasUpdate() { return stagedUpdate() != null; }
        @JavascriptInterface public void applyUpdate() {
            runOnUiThread(() -> {
                File ready = stagedUpdate();
                if (ready == null) return;
                active = ready;
                game.loadUrl(HOME);
            });
        }
        @JavascriptInterface public void exportSave() {
            runOnUiThread(() -> {
                if (readSave().isEmpty()) { toast("내보낼 진행 기록이 없어요."); return; }
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "lunasol-save.json");
                startActivityForResult(intent, EXPORT);
            });
        }
        @JavascriptInterface public void importSave() {
            runOnUiThread(() -> new android.app.AlertDialog.Builder(MainActivity.this)
                .setMessage("저장 파일을 불러오면 현재 진행 기록이 바뀝니다.")
                .setNegativeButton("취소", null)
                .setPositiveButton("저장 파일 선택", (dialog, which) -> {
                    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("application/json");
                    startActivityForResult(intent, IMPORT);
                }).show());
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (result != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            if (request == EXPORT) {
                try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new IOException("No output stream");
                    out.write(readSave().getBytes(StandardCharsets.UTF_8));
                }
                toast("진행 기록을 내보냈어요.");
            } else if (request == IMPORT) {
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) throw new IOException("No input stream");
                    String json = readText(in, SAVE_LIMIT);
                    importing = true;
                    if (!writeSave(json)) {
                        importing = false;
                        toast("루나솔 저장 파일을 확인해 주세요.");
                        return;
                    }
                }
                game.loadUrl(HOME);
                toast("진행 기록을 불러왔어요.");
            }
        } catch (Exception e) {
            importing = false;
            toast("저장 파일을 처리하지 못했어요.");
        }
    }
}
