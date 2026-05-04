import base64
import json
import requests
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

# ==========================isi API KEY==================================
OPENROUTER_API_KEY = ""
# ============================================================

# Model gratis dengan vision — otomatis pilih model gratis yang tersedia
# Jika satu gagal, ganti ke model berikutnya di daftar ini:
# - "openrouter/free"           → otomatis pilih model gratis (REKOMENDASI)
# - "google/gemma-4-31b-it:free"  → Gemma 4 31B gratis (support vision)
# - "google/gemma-4-26b-a4b-it:free" → Gemma 4 26B gratis (support vision)
MODEL = "openrouter/free"

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_image(image_bytes: bytes, mime_type: str, notes: str = "") -> dict:
    """Kirim gambar ke OpenRouter API dan kembalikan hasil analisis."""

    prompt = """Kamu adalah sistem pakar pertanian Indonesia yang berpengalaman dalam mendiagnosis hama dan penyakit tanaman.

Analisis gambar tanaman ini secara mendetail. Berikan respons HANYA dalam format JSON yang valid (tanpa markdown, tanpa backtick, tanpa penjelasan di luar JSON):

{
  "terdeteksi": true atau false,
  "nama_hama_penyakit": "nama hama atau penyakit dalam bahasa Indonesia",
  "nama_ilmiah": "nama ilmiah Latin jika tersedia, atau string kosong",
  "jenis": "hama" atau "penyakit jamur" atau "penyakit bakteri" atau "penyakit virus" atau "defisiensi nutrisi" atau "tidak terdeteksi",
  "tingkat_keparahan": "ringan" atau "sedang" atau "berat",
  "persentase_kerusakan": angka 0-100,
  "gejala_terlihat": ["gejala 1", "gejala 2", "gejala 3"],
  "deskripsi": "penjelasan detail tentang hama/penyakit ini dalam 2-3 kalimat",
  "pestisida_rekomendasi": "nama pestisida aktif atau produk yang direkomendasikan",
  "dosis": "dosis dan cara pencampuran yang tepat",
  "cara_aplikasi": "metode pengaplikasian pestisida",
  "frekuensi_aplikasi": "seberapa sering diaplikasikan",
  "langkah_penanganan": ["langkah 1", "langkah 2", "langkah 3", "langkah 4", "langkah 5"],
  "pencegahan": ["tip pencegahan 1", "tip pencegahan 2", "tip pencegahan 3"],
  "waktu_pemulihan": "estimasi waktu pemulihan tanaman"
}
"""
    if notes:
        prompt += f"\nInformasi tambahan dari petani: {notes}"

    prompt += "\n\nPENTING: Kembalikan hanya JSON valid. Tidak ada teks atau karakter lain di luar JSON."

    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    image_url = f"data:{mime_type};base64,{image_b64}"

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url}
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "temperature": 0.15,
        "max_tokens": 2000
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Sistem Pakar Hama Tanaman"
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        json=payload,
        headers=headers,
        timeout=60
    )

    if not response.ok:
        try:
            err = response.json().get('error', {})
            msg = err.get('message', f'HTTP {response.status_code}')
        except:
            msg = f'HTTP {response.status_code}'
        raise ValueError(msg)

    data       = response.json()
    raw_text   = data['choices'][0]['message']['content']
    clean_text = raw_text.replace('```json', '').replace('```', '').strip()
    return json.loads(clean_text)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "MASUKKAN_API_KEY_OPENROUTER_ANDA_DI_SINI":
        return jsonify({'error': 'API key belum diatur. Buka app.py dan isi variabel OPENROUTER_API_KEY.'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'Tidak ada gambar yang diunggah.'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Pilih file gambar terlebih dahulu.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.'}), 400

    notes = request.form.get('notes', '').strip()

    image_bytes = file.read()
    ext        = file.filename.rsplit('.', 1)[1].lower()
    mime_map   = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
    mime_type  = mime_map.get(ext, 'image/jpeg')

    try:
        result = analyze_image(image_bytes, mime_type, notes)
        return jsonify({'success': True, 'data': result})
    except json.JSONDecodeError:
        return jsonify({'error': 'Gagal memparse respons AI. Coba lagi.'}), 500
    except ValueError as e:
        return jsonify({'error': f'OpenRouter API error: {str(e)}'}), 400
    except requests.Timeout:
        return jsonify({'error': 'Request timeout. Coba lagi beberapa saat.'}), 504
    except Exception as e:
        return jsonify({'error': f'Terjadi kesalahan: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)