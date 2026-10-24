# سندات — Expo (موبايل)

تطبيق الموبايل يتصل بنفس حساب الويب على `https://sanadat.site`. Free يظهر إعلان AdMob، Pro يخفيه.

## موجة 3 — QA ثم APK

1. **قائمة تحقق الجهاز:** [`WAVE3_DEVICE_QA_CHECKLIST.md`](./WAVE3_DEVICE_QA_CHECKLIST.md)  
2. **رفع الشعار:** الإعدادات → شعار الفواتير (مالك المساحة فقط).  
3. **Preview APK:** الأوامر في القائمة أو `npm run build:android` من هذا المجلد.

`npx expo run:android` يحتاج **Android Studio + SDK** على الجهاز. من غيرهم الأمر هيفشل (adb / ANDROID_HOME).

## تجربة سريعة (من غير Android SDK)

```bash
cd mobile
npx expo start --web
```

هيفتح المتصفح. تسجيل الدخول بنفس حساب الموقع. الإعلان على الويب placeholder.

## تشغيل على الموبايل

### أ) EAS — بناء APK في السحابة (من غير Android Studio)

```bash
cd mobile
npx eas-cli login
npx eas-cli build --profile preview --platform android
```

بعد ما يخلص، نزّل الـ APK على التليفون وثبّته.

### ب) محلي — Android Studio

1. ثبّت [Android Studio](https://developer.android.com/studio)
2. SDK Manager → Android SDK
3. أعد تشغيل PowerShell بعد ما `ANDROID_HOME` يبقى `C:\Users\IT\AppData\Local\Android\Sdk`
4. `npx expo run:android`

AdMob الحقيقي يظهر في أ و ب فقط، مش في Expo Go ولا المتصفح.
