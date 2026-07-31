<h1 align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="60" alt="WhatsApp Logo"><br>
  WhatsApp Oto Mesaj (WhatsApp Auto Message)
</h1>

<div align="center">
  <strong>🔥 Selenium & Flask tabanlı, modern web arayüzüne sahip WhatsApp otomatik mesajlaşma uygulamsı. 🔥</strong>
</div>

<br>

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-WebFramework-lightgrey.svg?style=for-the-badge&logo=flask&logoColor=black" alt="Flask">
  <img src="https://img.shields.io/badge/Selenium-Automation-43B02A.svg?style=for-the-badge&logo=selenium&logoColor=white" alt="Selenium">
  <img src="https://img.shields.io/badge/License-MIT-success.svg?style=for-the-badge" alt="License">
</div>

<br>

## 🚀 Proje Hakkında

Bu proje, **Selenium** ve **Flask** kullanarak WhatsApp Web üzerinden otomatik mesaj gönderimi sağlayan, modern ve kullanıcı dostu bir Python otomasyon aracıdır. Hem bireysel kişilere (numara tabanlı) hem de mevcut WhatsApp gruplarına toplu ve tekil mesaj gönderimini tek bir sekmeden sorunsuz bir şekilde yönetmenizi sağlar.

> **💡 Hedef Kitle:** Hatırlatmalar, bildirimler, işletme duyuruları veya düzenli tekrarlayan mesaj işlemleri için zaman kazanmak isteyen herkes.

---

## ✨ Öne Çıkan Özellikler

*   🎯 **Kapsamlı Otomasyon:** Kişilere ve gruplara otomatik mesaj gönderimi.
*   💻 **Modern Web Arayüzü:** Flask tabanlı, tamamen tarayıcı üzerinden kontrol edilebilen şık ve duyarlı (responsive) kontrol paneli.
*   👤 **Profil ve Tarayıcı Yönetimi:** Chrome ve Firefox tarayıcı profillerini kaydederek her seferinde tekrar tekrar QR kod okutma zahmetinden tamamen kurtulun.
*   🛡️ **Akıllı Hata Yönetimi:** İnternet kesintisi, DNS hataları ve geçersiz numaralar gibi problemlerde **otomatik tekrar deneme (retry)** ve akıllı bekleme algoritmaları.
*   📊 **Canlı Takip ve Loglama:** Gönderim esnasında başarılı, hatalı işlemleri web paneli üzerinden saniyesi saniyesine anlık olarak izleyebilme.
*   📝 **Hızlı Şablonlar:** Sık kullandığınız mesaj metinlerini sistemde şablon olarak kaydedip dilediğiniz zaman tek tıkla gönderme yeteneği.

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler

*   **Python:** `3.10` veya daha üstü bir sürüm.
*   **İşletim Sistemi:** Windows, macOS veya Linux.
*   **Web Tarayıcı:** Google Chrome veya Mozilla Firefox.

### Adım Adım Lokal Kurulum

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/midvella/whatsapp-auto-message.git
    cd whatsapp-auto-message
    ```

2.  **Sanal Ortam (Virtual Environment) Oluşturun ve Aktif Edin (Önerilen):**
    ```bash
    # Windows için:
    python -m venv venv
    venv\Scripts\activate
    
    # macOS ve Linux için:
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Gerekli Kütüphaneleri Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Uygulamayı Başlatın:**
    ```bash
    python app.py
    ```

5.  **Arayüze Erişin:** 
    Tarayıcınızın adres çubuğuna giderek `http://localhost:5000` adresini açın. Kontrol paneli sizi karşılayacaktır. İlk girişinizdeyse WhatsApp Web yan sekmede otomatik olarak açılır ve sizden QR kodunu cep telefonunuzla okutmanız istenir.

---

## ⚠️ Önemli Güvenlik Uyarıları ve Yasal Bilgilendirme

Bu araç **sadece eğitim, test, kişisel kullanım ve otomasyon verimliliği** sağlamak amacıyla tasarlanmıştır:

*   ⛔ **Spam ve Taciz:** Bu aracı spam pazarlama mesajları göndermek veya insanları rahatsız edecek seri işlemler yürütmek için **kesinlikle kullanmamalısınız**.
*   🛑 **Hesap Banlanma Riski:** WhatsApp'ın resmi Kullanım Koşullarını (TOS) ihlal eden yüksek hacimli şüpheli bot faaliyetleri, kişisel hesabınızın **kalıcı olarak yasaklanmasına (ban)** neden olabilir. Sistem aşırı gönderimi engellemek için gecikmeler eklese de nihai karar WhatsApp algoritmalarına aittir.
*   ⚖️ **Sorumluluk Reddi:** Projenin kullanımından doğabilecek her türlü yasal ihlal, veri kaybı veya sistem engellemelerinin sorumluluğu **tamamen son kullanıcıya aittir**. Geliştirici hiçbir hukuki veya cezai mesuliyet kabul etmez.

---

## 🤝 Katkıda Bulunma

Projeyi geliştirmeye destek olmak isterseniz projeyi fork edip `Pull Request` gönderebilir veya bulduğunuz hataları raporlamak için `Issue` açabilirsiniz. Her türlü katkıya ve fikre açığız!

## 📜 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detayları dilediğiniz gibi kullanıp düzenleyebilirsiniz.
