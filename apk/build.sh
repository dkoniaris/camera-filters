#!/bin/bash
# Build Φίλτρα Cam APK (aapt + javac + d8 + zipalign + apksigner)
set -e
cd "$(dirname "$0")"
export ANDROID_HOME=~/android-sdk
export BUILD_TOOLS=$ANDROID_HOME/build-tools/34.0.0
export PLATFORM=$ANDROID_HOME/platforms/android-28
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home)
export PATH="$JAVA_HOME/bin:$PATH"

rm -rf build
mkdir -p build/obj build/dex

echo "[1/6] aapt compile resources"
$BUILD_TOOLS/aapt package -f -M AndroidManifest.xml -I $PLATFORM/android.jar -S res -J build/obj -m

echo "[2/6] javac"
javac -source 8 -target 8 -cp $PLATFORM/android.jar -d build/obj \
  src/com/dkoniaris/filtracam/*.java build/obj/com/dkoniaris/filtracam/R.java

echo "[3/6] d8 dex"
$BUILD_TOOLS/d8 --lib $PLATFORM/android.jar --min-api 24 --output build/dex/ \
  build/obj/com/dkoniaris/filtracam/*.class

echo "[4/6] aapt package + assets"
$BUILD_TOOLS/aapt package -f -M AndroidManifest.xml -I $PLATFORM/android.jar -S res \
  -A assets -F build/app-unsigned.apk
cd build/dex && zip -q ../app-unsigned.apk classes.dex && cd ..

echo "[5/6] zipalign"
$BUILD_TOOLS/zipalign -p -f 4 app-unsigned.apk app-aligned.apk

echo "[6/6] sign"
if [ ! -f keystore.jks ]; then
  keytool -genkey -v -keystore keystore.jks -alias app -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass filtracam123 -keypass filtracam123 \
    -dname "CN=FiltraCam, O=dkoniaris, C=GR" -noprompt
fi
$BUILD_TOOLS/apksigner sign --ks keystore.jks --ks-pass pass:filtracam123 \
  --key-pass pass:filtracam123 --ks-key-alias app --out FiltraCam.apk app-aligned.apk

echo "DONE: $(pwd)/FiltraCam.apk"
ls -la FiltraCam.apk
