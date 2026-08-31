package lat.timqu.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

// ModifiedMainActivityForSocialLoginPlugin es OBLIGATORIO para que
// @capgo/capacitor-social-login pueda recibir el resultado del login
// de Google en Android (usa Credential Manager por debajo).
public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    private static final int PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingWebViewPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Reemplazamos el WebChromeClient para poder interceptar
        // las peticiones de camara/microfono que hace getUserMedia()
        // dentro del WebView.
        this.bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    String[] resources = request.getResources();
                    boolean needsCamera = false;
                    boolean needsAudio = false;

                    for (String resource : resources) {
                        if (resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                            needsCamera = true;
                        }
                        if (resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            needsAudio = true;
                        }
                    }

                    boolean cameraGranted = !needsCamera ||
                            ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                                    == PackageManager.PERMISSION_GRANTED;
                    boolean audioGranted = !needsAudio ||
                            ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                                    == PackageManager.PERMISSION_GRANTED;

                    if (cameraGranted && audioGranted) {
                        // Ya tenemos los permisos de Android, concedemos directo al WebView.
                        request.grant(request.getResources());
                    } else {
                        // Nos falta permiso nativo: lo pedimos al usuario primero.
                        pendingWebViewPermissionRequest = request;

                        java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
                        if (needsCamera && !cameraGranted) {
                            permissionsToRequest.add(Manifest.permission.CAMERA);
                        }
                        if (needsAudio && !audioGranted) {
                            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO);
                        }

                        ActivityCompat.requestPermissions(
                                MainActivity.this,
                                permissionsToRequest.toArray(new String[0]),
                                PERMISSION_REQUEST_CODE
                        );
                    }
                });
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                pendingWebViewPermissionRequest = null;
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();

        // Fix: después de que una Activity externa (como el selector de
        // cuenta de Google) devuelve el control a la app, el WebView a veces
        // no se repinta solo. Forzamos un invalidate + requestLayout para
        // que la pantalla se actualice sin necesidad de que el usuario
        // reabra la app manualmente.
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().post(() -> {
                this.bridge.getWebView().invalidate();
                this.bridge.getWebView().requestLayout();
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE && pendingWebViewPermissionRequest != null) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                pendingWebViewPermissionRequest.grant(pendingWebViewPermissionRequest.getResources());
            } else {
                pendingWebViewPermissionRequest.deny();
            }
            pendingWebViewPermissionRequest = null;
        }
    }

    // ─── Requerido por @capgo/capacitor-social-login ───────────────────────
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    // Esta función nunca se llama, se deja vacía (requisito de la interfaz).
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
