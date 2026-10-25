package site.sanadat.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            // Keep window content strictly within system windows (not underneath status/navigation bars)
            WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (controller != null) {
                // Ensure dark icons on light status and navigation bars
                controller.setAppearanceLightStatusBars(true);
                controller.setAppearanceLightNavigationBars(true);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            // Guarantee all session cookies are flushed from RAM to disk immediately
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {
        }
    }
}
