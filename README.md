<<<<<<< HEAD
# 🌿 Sistem Pakar Diagnosis Hama & Penyakit Tanaman
Aplikasi web berbasis **Flask + Google Gemini 2.0 Flash** untuk mendiagnosis hama dan penyakit tanaman dari foto.

---

## 📁 Struktur Folder

```
hama_app/
├── app.py                  # Flask backend (routing + Gemini API)
├── requirements.txt        # Dependensi Python
├── templates/
│   └── index.html          # Halaman utama
└── static/
    ├── css/
    │   └── style.css       # Stylesheet
    └── js/
        └── main.js         # Logic frontend (upload, fetch, render)
```

---

## 🚀 Cara Menjalankan

### 1. Clone / salin folder ini
```bash
cd hama_app
```

### 2. Buat virtual environment (direkomendasikan)
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### 3. Install dependensi
```bash
pip install -r requirements.txt
```

### 4. Jalankan aplikasi
```bash
python app.py
```

### 5. Buka browser
```
http://localhost:5000
```

---

## 🔑 Mendapatkan API Key Gratis

1. Buka https://aistudio.google.com/apikey
2. Login dengan akun Google
3. Klik **"Create API key"**
4. Salin key dan paste di kolom API Key pada aplikasi

---

## ✨ Fitur

- 📷 Upload foto tanaman (klik, drag & drop, atau kamera)
- 🔍 Identifikasi jenis hama/penyakit + nama ilmiah
- 📊 Tingkat keparahan dengan indikator visual (ringan/sedang/berat)
- 🧪 Rekomendasi pestisida, dosis, dan cara aplikasi
- 🛠️ Langkah penanganan step-by-step
- 🛡️ Tips pencegahan
- ⏱️ Estimasi waktu pemulihan

---

## 🛠️ Teknologi

| Komponen   | Teknologi                      |
|------------|-------------------------------|
| Backend    | Python + Flask                |
| AI Model   | Google Gemini 2.0 Flash (Vision) |
| Frontend   | HTML + CSS + Vanilla JS       |
| HTTP Client| requests                      |

---

## ⚠️ Catatan

- Rekomendasi bersifat informatif sebagai panduan awal
- Selalu konsultasikan dengan penyuluh pertanian setempat
- API Key Gemini gratis dengan kuota harian yang cukup untuk penggunaan normal
=======
# PLANTIFY
>>>>>>> 99a8ea896249dbb08f9660ae0d0e50cc53b9d596
