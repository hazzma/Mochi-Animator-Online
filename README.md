# 🤖 Mochi Animator Online

**Mochi Animator Online** adalah pixel art & animation editor berbasis web yang dirancang khusus untuk membuat ekspresi wajah robot atau UI pada layar OLED 128x64. Tool ini memungkinkan workflow yang sangat cepat dari desain hingga implementasi pada mikrokontroler (ESP32/Arduino).

![OLED Preview](https://img.shields.io/badge/Output-OLED_128x64-green?style=for-the-badge)
![Framework](https://img.shields.io/badge/Built_with-React_19-blue?style=for-the-badge)

## 🚀 Fitur Utama

### 1. 🎨 Professional Pixel Editor
- **Multi-Layer System**: Pisahkan mata, mulut, dan alis ke dalam layer-layer terpisah untuk animasi yang lebih fleksibel.
- **Advanced Shapes**: Dukungan pembuatan Kotak (Rectangle), Lingkaran (Ellipse), dan Kotak dengan Radius (Rounded Rect).
- **Pro Shortcuts**: Workflow cepat dengan shortcut keyboard (P: Pencil, V: Move, E: Eraser, R: Rect, dsb).

### 2. ✨ KineMaster-Style Tweening (Animation Engine)
- **Auto-Keyframing**: Cukup geser objek di timeline, sistem akan otomatis membuat "Pin Point" (keyframe).
- **Linear Interpolation**: Sistem otomatis menghitung pergerakan objek di antara dua keyframe, menghemat waktu gambar manual.
- **Onion Skinning**: Lihat bayangan frame sebelumnya/sesudahnya untuk akurasi animasi.

### 3. 🛠️ Workspace Fleksibel
- **IDE-like Layout**: Panel Canvas, Timeline, dan Layers dapat diubah ukurannya (resizable) sesuai kenyamanan.
- **Mini OLED Preview**: Lihat hasil akhir secara real-time pada simulasi layar OLED fisik di pojok workspace.

### 4. 💾 Export & Integration
- **C/C++ Header Export**: Menghasilkan file `.h` yang kompatibel dengan library `Adafruit_SSD1306` atau `U8g2`.
- **ESP32/Arduino Ready**: Data pixel dan koordinat animasi sudah teroptimasi untuk memori mikrokontroler yang terbatas.

## ⌨️ Shortcut Keyboard

| Key | Action |
|---|---|
| `V` / `Ctrl + S` | **Move Tool** (Geser Layer/Set Keyframe) |
| `P` / `B` | **Pencil** (Gambar Pixel) |
| `E` | **Eraser** (Hapus Pixel) |
| `Ctrl + Z / Y` | Undo / Redo |
| `Ctrl + ↑ / ↓` | Zoom In / Out |
| `Hold Shift` | Mengunci rasio bentuk (jadi lingkaran sempurna/kotak sama sisi) |

## 🛠️ Instalasi & Pengembangan

Jika Anda ingin menjalankan project ini secara lokal:

```bash
# Clone repository
git clone https://github.com/hansentommy/Mochi-Animator-Online.git

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

---
*Dibuat dengan ❤️ untuk komunitas Robotika Indonesia oleh Antigravity.*
