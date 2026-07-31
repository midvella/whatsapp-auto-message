import os
import sys
import time
import json
import threading
import random
import webbrowser
import urllib.parse
import traceback
import uuid
from flask import Flask, render_template, request, jsonify

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager

os.system("cls||clear")

def kaynak_yolu(yol):
    try:
        taban_yol = sys._MEIPASS
    except Exception:
        taban_yol = os.path.abspath(".")
    return os.path.join(taban_yol, yol)

app = Flask(__name__, 
            template_folder=kaynak_yolu('templates'),
            static_folder=kaynak_yolu('static'))

VERI_DOSYASI = os.path.join(os.getcwd(), "data.json")

bot_durumu = {
    "is_running": False,
    "total": 0,
    "current": 0,
    "success": 0,
    "failed": 0,
    "current_target": "",
    "status_message": "Bekleniyor...",
    "driver_ready": False,
    "browser_type": "chrome",
    "logs": []
}

tarayici = None
whatsapp_sekmesi = None
panel_sekmesi = None

def hatayi_turkcelestir(hata):
    mesaj = str(hata).lower()
    if "no such window" in mesaj or "unable to locate window" in mesaj:
        return "Tarayıcı penceresi kapatılmış!"
    if "no such element" in mesaj:
        return "WhatsApp öğesi bulunamadı (Sayfa yüklenemedi mi?)"
    if "target closed" in mesaj:
        return "Tarayıcı bağlantısı koptu."
    if "timeout" in mesaj:
        return "İşlem zaman aşımına uğradı (İnternet yavaş olabilir)."
    if "disconnected" in mesaj:
        return "Tarayıcı ile olan bağlantı kesildi."
    if "dnsnotfound" in mesaj or "about:neterror" in mesaj or "can't connect" in mesaj:
        return "İnternet bağlantısı veya DNS hatası! (web.whatsapp.com'a bağlanılamadı)"
    
    ilk_satir = str(hata).split('\n')[0]
    if len(ilk_satir) > 60: 
        ilk_satir = ilk_satir[:57] + "..."
    return ilk_satir

def tarayiciyi_baslat(tur="chrome"):
    global tarayici, bot_durumu, whatsapp_sekmesi, panel_sekmesi
    
    if tarayici is not None:
        try: tarayici.quit()
        except: pass
        tarayici = None

    try:
        print(f"🔧 {tur.capitalize()} başlatılıyor...")
        bot_durumu["status_message"] = "Tarayıcı hazırlanıyor..."
        
        if tur == "chrome":
            ayarlar = ChromeOptions()
            ayarlar.add_argument(f"user-data-dir={os.path.join(os.getcwd(), 'chrome_profile')}")
            ayarlar.add_argument("--no-sandbox")
            ayarlar.add_argument("--disable-dev-shm-usage")
            ayarlar.add_argument("--remote-allow-origins=*") 
            ayarlar.add_argument("--disable-gpu")
            
            if os.path.exists("/snap/bin/chromium"):
                ayarlar.binary_location = "/snap/bin/chromium"
            elif os.path.exists("/usr/bin/google-chrome"):
                ayarlar.binary_location = "/usr/bin/google-chrome"

            try:
                tarayici = webdriver.Chrome(options=ayarlar)
            except Exception as e:
                print(f"Hata: {e}")
                servis = ChromeService(ChromeDriverManager().install())
                tarayici = webdriver.Chrome(service=servis, options=ayarlar)
            
        elif tur == "firefox":
            ayarlar = FirefoxOptions()
            ayarlar.add_argument("-profile")
            ayarlar.add_argument(os.path.join(os.getcwd(), 'firefox_profile'))
            servis = FirefoxService(GeckoDriverManager().install())
            tarayici = webdriver.Firefox(service=servis, options=ayarlar)
        
        tarayici.get("https://web.whatsapp.com")
        whatsapp_sekmesi = tarayici.current_window_handle
        
        tarayici.execute_script("window.open('http://localhost:5000', '_blank');")
        time.sleep(1)
        
        for sekme in tarayici.window_handles:
            if sekme != whatsapp_sekmesi:
                panel_sekmesi = sekme
                break
        
        tarayici.switch_to.window(panel_sekmesi)
        
        bot_durumu["driver_ready"] = True
        bot_durumu["status_message"] = "Hazır"
        print("✅ Sistem hazır.")
        
    except Exception as e:
        traceback.print_exc()
        bot_durumu["status_message"] = f"Hata: {str(e)}"
        bot_durumu["driver_ready"] = False

# JSON Database Helper Functions
def verileri_yukle():
    if not os.path.exists(VERI_DOSYASI):
        return {"contacts": [], "groups": [], "messages": [], "config": {"browser": "chrome"}}
    with open(VERI_DOSYASI, 'r', encoding='utf-8') as f:
        bilgi = json.load(f)
        if "config" not in bilgi:
            bilgi["config"] = {"browser": "chrome"}
        return bilgi

def verileri_kaydet(bilgi):
    with open(VERI_DOSYASI, 'w', encoding='utf-8') as f:
        json.dump(bilgi, f, ensure_ascii=False, indent=4)

@app.route('/')
def ana_sayfa():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def api_verileri_al():
    return jsonify(verileri_yukle())

@app.route('/api/config', methods=['POST'])
def api_ayarlari_kaydet():
    bilgi = verileri_yukle()
    yeni_ayar = request.json
    bilgi["config"].update(yeni_ayar)
    verileri_kaydet(bilgi)
    
    if "browser" in yeni_ayar:
        threading.Thread(target=tarayiciyi_baslat, args=(yeni_ayar["browser"],), daemon=True).start()
        
    return jsonify({"success": True})

@app.route('/api/contacts', methods=['POST'])
def kisi_ekle():
    bilgi = verileri_yukle()
    yeni_kisi = request.json
    yeni_kisi["phone"] = "".join(filter(str.isdigit, yeni_kisi.get("phone", "")))
    yeni_kisi["id"] = str(uuid.uuid4())[:8]
    bilgi["contacts"].append(yeni_kisi)
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/contacts/<id>', methods=['DELETE'])
def kisi_sil(id):
    bilgi = verileri_yukle()
    bilgi["contacts"] = [k for k in bilgi["contacts"] if k.get("id") != id]
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/contacts/<id>', methods=['PUT'])
def kisi_duzenle(id):
    bilgi = verileri_yukle()
    yeni_hal = request.json
    if "phone" in yeni_hal:
        yeni_hal["phone"] = "".join(filter(str.isdigit, yeni_hal["phone"]))
        
    for i, k in enumerate(bilgi["contacts"]):
        if k.get("id") == id:
            bilgi["contacts"][i].update(yeni_hal)
            break
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/contacts/clear', methods=['POST'])
def kisileri_temizle():
    bilgi = verileri_yukle()
    bilgi["contacts"] = []
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/groups', methods=['POST'])
def grup_ekle():
    bilgi = verileri_yukle()
    yeni_grup = request.json
    yeni_grup["id"] = str(int(time.time() * 1000))
    bilgi["groups"].append(yeni_grup)
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/groups/<id>', methods=['DELETE'])
def grup_sil(id):
    bilgi = verileri_yukle()
    bilgi["groups"] = [g for g in bilgi["groups"] if g.get("id") != id]
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/groups/<id>', methods=['PUT'])
def grup_duzenle(id):
    bilgi = verileri_yukle()
    yeni_hal = request.json
    for i, g in enumerate(bilgi["groups"]):
        if g.get("id") == id:
            bilgi["groups"][i].update(yeni_hal)
            break
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/groups/clear', methods=['POST'])
def gruplari_temizle():
    bilgi = verileri_yukle()
    bilgi["groups"] = []
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/messages', methods=['POST'])
def sablon_ekle():
    bilgi = verileri_yukle()
    yeni_sablon = request.json
    yeni_sablon["id"] = str(int(time.time() * 1000))
    bilgi["messages"].append(yeni_sablon)
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/messages/<id>', methods=['DELETE'])
def sablon_sil(id):
    bilgi = verileri_yukle()
    bilgi["messages"] = [m for m in bilgi["messages"] if m.get("id") != id]
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/messages/<id>', methods=['PUT'])
def sablon_duzenle(id):
    bilgi = verileri_yukle()
    yeni_hal = request.json
    for i, m in enumerate(bilgi["messages"]):
        if m.get("id") == id:
            bilgi["messages"][i].update(yeni_hal)
            break
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

@app.route('/api/messages/clear', methods=['POST'])
def sablonlari_temizle():
    bilgi = verileri_yukle()
    bilgi["messages"] = []
    verileri_kaydet(bilgi)
    return jsonify({"success": True})

# =============== ENGINE 3.0 - MERGED WINDOW & DIRECT NUMBERS ===============

def mesajlari_islemden_gecir(hedefler, sablon_adi="Varsayılan"):
    global bot_durumu, tarayici, whatsapp_sekmesi, panel_sekmesi
    
    if tarayici is None or whatsapp_sekmesi is None:
        print("Hata: WhatsApp bulunamadı.")
        return

    seciciler = {
        "arama_kutusu": '//div[@contenteditable="true"][@data-tab="3"]',
        "mesaj_kutusu": '//footer//div[@contenteditable="true"][@data-tab="10"]',
        "gonder_butonu": '//span[@data-icon="send"]/ancestor::button'
    }
    bekle = WebDriverWait(tarayici, 30)
    
    bot_durumu["is_running"] = True
    bot_durumu["total"] = len(hedefler)
    bot_durumu["current"] = 0
    bot_durumu["success"] = 0
    bot_durumu["failed"] = 0
    bot_durumu["logs"] = []

    for hedef in hedefler:
        bot_durumu["current"] += 1
        isim = hedef.get('name', 'Bilinmeyen')
        numara = hedef.get('phone', '')
        metin = hedef.get('message', '')
        tip = hedef.get('type', 'contact')
        
        bot_durumu["current_target"] = isim
        
        try:
            tarayici.switch_to.window(whatsapp_sekmesi)
            time.sleep(1) # Sekme geçişi sonrası stabilite için
            
            if tip == 'contact' and numara:
                kodlanmis_metin = urllib.parse.quote(metin)
                adres = f"https://web.whatsapp.com/send?phone={numara}&text={kodlanmis_metin}"
                
                basarili_yukleme = False
                for deneme in range(3):
                    try:
                        tarayici.get(adres)
                        basarili_yukleme = True
                        break
                    except Exception as e:
                        if deneme < 2:
                            print(f"⚠️ Sayfa yüklenemedi, tekrar deneniyor ({deneme + 1}/3)...")
                            time.sleep(3)
                        else:
                            raise e
                
                gonderme_secicileri = [
                    '//span[@data-icon="send"]/ancestor::button',
                    '//button[.//span[@data-icon="send"]]',
                    '//footer//button[@aria-label="Gönder"]',
                    '//footer//button[@aria-label="Send"]'
                ]
                
                gecersiz_numara_yolu = '//div[contains(text(), "geçersiz") or contains(text(), "invalid")]'
                
                buton = None
                baslangic = time.time()
                while time.time() - baslangic < 15:
                    for secici in gonderme_secicileri:
                        butonlar = tarayici.find_elements(By.XPATH, secici)
                        if butonlar and butonlar[0].is_enabled():
                            buton = butonlar[0]
                            break
                    if buton: break
                    
                    if tarayici.find_elements(By.XPATH, gecersiz_numara_yolu):
                        raise Exception("Geçersiz telefon numarası.")
                    
                    time.sleep(0.5)

                if buton:
                    tarayici.execute_script("arguments[0].click();", buton)
                    bot_durumu["logs"].append({
                        "time": time.strftime("%H:%M:%S"),
                        "target": isim,
                        "template": sablon_adi,
                        "status": "success",
                        "message": f"'{sablon_adi}' şablonu başarıyla gönderildi."
                    })
                else:
                    raise Exception("Gönder butonu bulunamadı.")

            else:
                if "send?phone" in tarayici.current_url or "api.whatsapp.com" in tarayici.current_url:
                    tarayici.get("https://web.whatsapp.com")
                    time.sleep(2)

                arama_secicileri = [
                    seciciler["arama_kutusu"],
                    '//div[@contenteditable="true"]',
                    '//p[contains(@class, "selectable-text copyable-text")]'
                ]
                
                kutu = None
                for secici in arama_secicileri:
                    try:
                        elemanlar = tarayici.find_elements(By.XPATH, secici)
                        if elemanlar:
                            kutu = elemanlar[0]
                            break
                    except: continue
                
                if not kutu:
                    kutu = bekle.until(EC.presence_of_element_located((By.XPATH, seciciler["arama_kutusu"])))
                
                kutu.click()
                kutu.send_keys(Keys.CONTROL + "a", Keys.BACKSPACE)
                time.sleep(0.5)
                kutu.send_keys(isim)
                time.sleep(3)
                
                sonuc_secicileri = [
                    f"//span[@title='{isim}']",
                    f"//span[contains(text(), '{isim}')]",
                    f"//div[.//span[@title='{isim}']]"
                ]
                
                hedef_secildi = None
                for secici in sonuc_secicileri:
                    try:
                        elemanlar = tarayici.find_elements(By.XPATH, secici)
                        if elemanlar:
                            hedef_secildi = elemanlar[0]
                            break
                    except: continue
                
                if hedef_secildi:
                    hedef_secildi.click()
                else:
                    raise Exception(f"Grup bulunamadı: {isim}")
                
                time.sleep(1)
                yazi_alani = bekle.until(EC.presence_of_element_located((By.XPATH, seciciler["mesaj_kutusu"])))
                tarayici.execute_script("arguments[0].focus();", yazi_alani)
                time.sleep(0.5)

                tarayici.execute_script("""
                    var el = arguments[0];
                    var text = arguments[1];
                    el.focus();
                    document.execCommand('insertText', false, text);
                """, yazi_alani, metin)
                
                time.sleep(0.8)
                yazi_alani.send_keys(Keys.ENTER)
                
                time.sleep(0.5)
                try:
                    g_butonlar = tarayici.find_elements(By.XPATH, seciciler["gonder_butonu"])
                    if g_butonlar: tarayici.execute_script("arguments[0].click();", g_butonlar[0])
                except: pass
                
                bot_durumu["logs"].append({
                    "time": time.strftime("%H:%M:%S"),
                    "target": isim,
                    "template": sablon_adi,
                    "status": "success",
                    "message": f"'{sablon_adi}' şablonu gruba gönderildi."
                })

            bot_durumu["success"] += 1
            bot_durumu["status_message"] = f"Başarılı: {isim}"

        except Exception as e:
            traceback.print_exc()
            bot_durumu["failed"] += 1
            bot_durumu["status_message"] = f"Hata: {isim}"
            
            hata_mesaji = hatayi_turkcelestir(e)
            bot_durumu["logs"].append({
                "time": time.strftime("%H:%M:%S"),
                "target": isim,
                "template": sablon_adi,
                "status": "error",
                "message": hata_mesaji
            })

        if bot_durumu["current"] < bot_durumu["total"]:
            time.sleep(random.uniform(2.0, 4.0))

    try: tarayici.switch_to.window(panel_sekmesi)
    except: pass
    
    bot_durumu["is_running"] = False
    bot_durumu["status_message"] = "Bitti!"

@app.route('/api/send', methods=['POST'])
def api_mesaj_gonder():
    global bot_durumu
    if bot_durumu["is_running"]: return jsonify({"success": False})
    gelen = request.json
    hedefler = gelen.get('targets', [])
    sablon_adi = gelen.get('template_name', 'Bilinmeyen')
    threading.Thread(target=mesajlari_islemden_gecir, args=(hedefler, sablon_adi), daemon=True).start()
    return jsonify({"success": True})

@app.route('/api/status', methods=['GET'])
def api_durum_bilgisi():
    return jsonify(bot_durumu)

if __name__ == '__main__':
    bilgi = verileri_yukle()
    ilk_tarayici = bilgi["config"].get("browser", "chrome")
    threading.Thread(target=tarayiciyi_baslat, args=(ilk_tarayici,), daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
