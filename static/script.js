const uygulama = {
    veriler: {
        contacts: [],
        groups: [],
        messages: []
    },
    durum: {
        pollInterval: null
    },

    baslat() {
        this.elemanlari_yakala();
        this.olaylari_bagla();
        this.verileri_yukle();
        this.durum_takibini_baslat();
    },

    elemanlari_yakala() {
        this.tabs = document.querySelectorAll('.tab-btn');
        this.contents = document.querySelectorAll('.tab-content');
        this.browserSelect = document.getElementById('browser-type');

        this.formContact = document.getElementById('form-add-contact');
        this.formGroup = document.getElementById('form-add-group');
        this.formMessage = document.getElementById('form-add-message');

        this.tableContacts = document.getElementById('table-contacts');
        this.tableGroups = document.getElementById('table-groups');
        this.tableMessages = document.getElementById('table-messages');
        this.selectTemplate = document.getElementById('select-template');
        this.targetSelectionList = document.getElementById('target-selection-list');

        this.btnPrepareSend = document.getElementById('btn-prepare-send');
        this.statusIcon = document.querySelector('.status-icon');
        this.statusText = document.getElementById('status-text');
        this.statusDetail = document.getElementById('status-detail');
        this.statTotal = document.getElementById('stat-total');
        this.statSuccess = document.getElementById('stat-success');
        this.statFailed = document.getElementById('stat-failed');

        this.confirmModal = document.getElementById('confirm-modal');
        this.reviewModal = document.getElementById('review-send-modal');
        this.editModal = document.getElementById('edit-modal');
        this.editFields = document.getElementById('edit-fields');
        this.editId = document.getElementById('edit-id');
        this.editType = document.getElementById('edit-type');
        this.btnSaveEdit = document.getElementById('btn-save-edit');
        this.botLogsContainer = document.getElementById('bot-logs');
        this.modalConfirmCallbacks = {};
    },

    olaylari_bagla() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.tabs.forEach(t => t.classList.remove('active'));
                this.contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        this.browserSelect.addEventListener('change', () => {
            this.sunucu.ayar_kaydet({ browser: this.browserSelect.value });
        });

        this.formContact.addEventListener('submit', (e) => {
            e.preventDefault();
            const isim = document.getElementById('contact-name').value;
            let numara = document.getElementById('contact-phone').value;
            numara = numara.replace(/\s+/g, '');
            if (!/^\d+$/.test(numara)) {
                return alert('HATA: Numara sadece rakamlardan oluşmalıdır!');
            }
            this.sunucu.kisi_ekle({ name: isim, phone: numara });
            this.formContact.reset();
        });

        this.formGroup.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sunucu.grup_ekle({ name: document.getElementById('group-name').value });
        });

        this.formMessage.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sunucu.sablon_ekle({
                title: document.getElementById('msg-title').value,
                text: document.getElementById('msg-text').value
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.arayuz.pencereleri_kapat());
        });
        document.getElementById('modal-cancel').addEventListener('click', () => this.arayuz.pencereleri_kapat());
        document.getElementById('review-cancel').addEventListener('click', () => this.arayuz.pencereleri_kapat());
        document.getElementById('edit-cancel').addEventListener('click', () => this.arayuz.pencereleri_kapat());

        this.btnPrepareSend.addEventListener('click', () => this.islemler.gonderimi_hazirla());

        document.getElementById('review-confirm').addEventListener('click', () => {
            this.arayuz.pencereleri_kapat();
            this.sunucu.gonderimi_baslat();
        });

        this.btnSaveEdit.addEventListener('click', () => this.islemler.degisiklikleri_kaydet());
    },

    async verileri_yukle() {
        try {
            const res = await fetch('/api/data');
            const bilgi = await res.json();
            this.veriler = bilgi;

            if (bilgi.config && bilgi.config.browser) {
                this.browserSelect.value = bilgi.config.browser;
            }

            this.arayuz.her_seyi_ciz();
        } catch (e) { console.error('Hata:', e); }
    },

    durum_takibini_baslat() {
        this.durum.pollInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const anlik_durum = await res.json();
                this.arayuz.durumu_guncelle(anlik_durum);
            } catch (e) { }
        }, 2000);
    },

    sunucu: {
        async _post(url, payload) {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            uygulama.verileri_yukle();
        },
        async _sil(url) {
            await fetch(url, { method: 'DELETE' });
            uygulama.verileri_yukle();
        },
        async _guncelle(url, payload) {
            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            uygulama.verileri_yukle();
        },

        async ayar_kaydet(ayar) {
            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ayar)
            });
        },

        kisi_ekle(kisi) {
            this._post('/api/contacts', kisi);
            uygulama.formContact.reset();
        },
        kisi_guncelle(id, kisi) { this._guncelle(`/api/contacts/${id}`, kisi); },
        grup_guncelle(id, grup) { this._guncelle(`/api/groups/${id}`, grup); },
        kisi_sil(id) { this._sil(`/api/contacts/${id}`); },
        kisileri_temizle() { this._post('/api/contacts/clear', {}); },

        grup_ekle(grup) {
            this._post('/api/groups', grup);
            uygulama.formGroup.reset();
        },
        grup_sil(id) { this._sil(`/api/groups/${id}`); },
        gruplari_temizle() { this._post('/api/groups/clear', {}); },

        sablon_ekle(sablon) {
            this._post('/api/messages', sablon);
            uygulama.formMessage.reset();
        },
        sablon_guncelle(id, sablon) { this._guncelle(`/api/messages/${id}`, sablon); },
        sablon_sil(id) { this._sil(`/api/messages/${id}`); },
        sablonlari_temizle() { this._post('/api/messages/clear', {}); },

        async gonderimi_baslat() {
            if (!uygulama.durum.hazir_liste) return;
            const sablonId = uygulama.selectTemplate.value;
            const sablon = uygulama.veriler.messages.find(m => m.id === sablonId);

            try {
                const res = await fetch('/api/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        targets: uygulama.durum.hazir_liste,
                        template_name: sablon ? sablon.title : "Bilinmeyen"
                    })
                });
                const sonuc = await res.json();
                if (sonuc.success) {
                    uygulama.tabs[0].click();
                } else {
                    alert('Hata: ' + sonuc.message);
                }
            } catch (e) { alert('Gönderim başlatılamadı.'); }
        }
    },

    arayuz: {
        her_seyi_ciz() {
            this.kisileri_ciz();
            this.gruplari_ciz();
            this.sablonlari_ciz();
            this.formu_ciz();
        },

        kisileri_ciz() {
            uygulama.tableContacts.innerHTML = uygulama.veriler.contacts.map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>+${c.phone}</td>
                    <td>
                        <button class="btn-edit-sm" onclick="uygulama.islemler.kisi_duzenle_ac('${c.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-sm" onclick="uygulama.islemler.kisi_sil_onay('${c.id}', '${c.name}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        gruplari_ciz() {
            uygulama.tableGroups.innerHTML = uygulama.veriler.groups.map(g => `
                <tr>
                    <td>${g.name}</td>
                    <td>
                        <button class="btn-edit-sm" onclick="uygulama.islemler.grup_duzenle_ac('${g.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-sm" onclick="uygulama.islemler.grup_sil_onay('${g.id}', '${g.name}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        sablonlari_ciz() {
            uygulama.tableMessages.innerHTML = uygulama.veriler.messages.map(m => `
                <tr>
                    <td><strong>${m.title}</strong></td>
                    <td style="white-space: pre-wrap; font-size: 0.9rem">${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}</td>
                    <td>
                        <button class="btn-edit-sm" onclick="uygulama.islemler.sablon_duzenle_ac('${m.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-danger-sm" onclick="uygulama.islemler.sablon_sil_onay('${m.id}', '${m.title}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        formu_ciz() {
            uygulama.selectTemplate.innerHTML = '<option value="">-- Şablon Seç --</option>' +
                uygulama.veriler.messages.map(m => `<option value="${m.id}">${m.title}</option>`).join('');

            let html = '';
            uygulama.veriler.groups.forEach(g => {
                html += `
                    <label class="target-item">
                        <input type="checkbox" class="target-cb" data-type="group" data-id="${g.id}">
                        <span class="badge badge-group">Grup</span>
                        <div><strong>${g.name}</strong></div>
                    </label>
                `;
            });
            uygulama.veriler.contacts.forEach(c => {
                html += `
                    <label class="target-item">
                        <input type="checkbox" class="target-cb" data-type="contact" data-id="${c.id}">
                        <span class="badge badge-contact">Kişi</span>
                        <div><strong>${c.name}</strong> <span style="font-size:0.85rem; color:#94a3b8">(+${c.phone})</span></div>
                    </label>
                `;
            });
            uygulama.targetSelectionList.innerHTML = html || '<div style="color:#94a3b8; padding:1rem">Henüz rehbere kayıtlı kişi veya grup yok. Sağ üstteki sekmelerden ekleyin.</div>';
        },

        onay_kutusu_ac(baslik, icerik, fonksiyon) {
            document.getElementById('modal-title').innerHTML = `<i class="fas fa-exclamation-triangle warning-icon"></i> ${baslik}`;
            document.getElementById('modal-body').innerHTML = icerik;

            const buton = document.getElementById('modal-confirm');
            const yeni_buton = buton.cloneNode(true);
            buton.parentNode.replaceChild(yeni_buton, buton);

            yeni_buton.addEventListener('click', () => {
                this.pencereleri_kapat();
                fonksiyon();
            });

            uygulama.confirmModal.classList.add('show');
        },

        ozet_ekrani_ac(mesaj, liste) {
            document.getElementById('review-message-text').textContent = mesaj;

            const ul = document.getElementById('review-target-list');
            ul.innerHTML = liste.map(t => {
                const ikon = t.type === 'group' ? '<i class="fas fa-users color-group"></i>' : '<i class="fas fa-user color-contact"></i>';
                const detay = t.type === 'contact' ? ` (+${t.phone})` : ' (Grup)';
                return `<li>${ikon} <strong>${t.name}</strong>${detay}</li>`;
            }).join('');

            uygulama.reviewModal.classList.add('show');
        },

        pencereleri_kapat() {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        },

        duzenleme_penceresi_ac(tip, id, veri) {
            uygulama.editType.value = tip;
            uygulama.editId.value = id;
            let html = '';

            if (tip === 'contact') {
                document.getElementById('edit-modal-title').innerHTML = '<i class="fas fa-user-edit"></i> Kişiyi Düzenle';
                html = `
                    <div class="form-group">
                        <label>İsim</label>
                        <input type="text" id="edit-contact-name" value="${veri.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Telefon</label>
                        <input type="text" id="edit-contact-phone" value="${veri.phone}" required>
                    </div>
                `;
            } else if (tip === 'group') {
                document.getElementById('edit-modal-title').innerHTML = '<i class="fas fa-users-cog"></i> Grubu Düzenle';
                html = `
                    <div class="form-group">
                        <label>Grup Adı</label>
                        <input type="text" id="edit-group-name" value="${veri.name}" required>
                    </div>
                `;
            } else if (tip === 'message') {
                document.getElementById('edit-modal-title').innerHTML = '<i class="fas fa-comment-edit"></i> Şablonu Düzenle';
                html = `
                    <div class="form-group">
                        <label>Başlık</label>
                        <input type="text" id="edit-msg-title" value="${veri.title}" required>
                    </div>
                    <div class="form-group">
                        <label>İçerik</label>
                        <textarea id="edit-msg-text" rows="5" required>${veri.text}</textarea>
                    </div>
                `;
            }

            uygulama.editFields.innerHTML = html;
            uygulama.editModal.classList.add('show');
        },

        durumu_guncelle(durum) {
            if (!durum) return;

            uygulama.statTotal.textContent = durum.total;
            uygulama.statSuccess.textContent = durum.success;
            uygulama.statFailed.textContent = durum.failed;

            if (durum.is_running) {
                uygulama.statusIcon.className = 'status-icon running';
                uygulama.statusIcon.innerHTML = '<i class="fas fa-cogs"></i>';
                uygulama.statusText.textContent = `İşleniyor: ${durum.current}/${durum.total}`;
                uygulama.btnPrepareSend.disabled = true;
                uygulama.btnPrepareSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderim Sürüyor';
            }
            else if (durum.total > 0 && durum.current >= durum.total) {
                uygulama.statusIcon.className = 'status-icon done';
                uygulama.statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                uygulama.statusText.textContent = `Tamamlandı`;
                uygulama.btnPrepareSend.disabled = false;
                uygulama.btnPrepareSend.innerHTML = '<i class="fas fa-rocket"></i> Yeni Gönderim Başlat';
            }
            else if (!durum.driver_ready) {
                uygulama.statusText.textContent = `Sistem Hazırlanıyor`;
                uygulama.statusIcon.className = 'status-icon running';
                uygulama.btnPrepareSend.disabled = true;
            }
            else {
                uygulama.statusText.textContent = `Hazır`;
                uygulama.statusIcon.className = 'status-icon waiting';
                uygulama.statusIcon.innerHTML = '<i class="fab fa-whatsapp"></i>';
                uygulama.btnPrepareSend.disabled = false;
                uygulama.btnPrepareSend.innerHTML = '<i class="fas fa-rocket"></i> Gönderimi Başlat';
            }

            uygulama.statusDetail.textContent = durum.status_message;

            if (durum.logs && durum.logs.length > 0) {
                const logHtml = durum.logs.map(l => `
                    <div class="log-item ${l.status}">
                        <span class="log-time">[${l.time}]</span>
                        <span class="log-msg"><strong>'${l.template}'</strong> şablonu <strong>'${l.target}'</strong> hedefine ${l.status === 'success' ? 'gönderildi' : 'gönderilemedi'}. ${l.status === 'error' ? '(' + l.message + ')' : ''}</span>
                    </div>
                `).reverse().join('');
                uygulama.botLogsContainer.innerHTML = logHtml;
            } else if (!durum.is_running && durum.total === 0) {
                uygulama.botLogsContainer.innerHTML = '<div style="color:#94a3b8; padding:0.5rem">Henüz bir işlem yapılmadı.</div>';
            }
        }
    },

    islemler: {
        kisi_sil_onay(id, isim) {
            uygulama.arayuz.onay_kutusu_ac('Kişiyi Sil', `<strong>${isim}</strong> adlı kişiyi rehberden silmek istiyor musunuz?`, () => uygulama.sunucu.kisi_sil(id));
        },
        kisileri_temizle_onay() {
            uygulama.arayuz.onay_kutusu_ac('Rehberi Temizle', '<span style="color:var(--danger)">Dikkat!</span> Rehberdeki <strong>TÜM KİŞİLER</strong> silinecek. Emin misiniz?', () => uygulama.sunucu.kisileri_temizle());
        },
        grup_sil_onay(id, isim) {
            uygulama.arayuz.onay_kutusu_ac('Grubu Sil', `<strong>${isim}</strong> grubunu listeden çıkarmak istiyor musunuz?`, () => uygulama.sunucu.grup_sil(id));
        },
        gruplari_temizle_onay() {
            uygulama.arayuz.onay_kutusu_ac('Grupları Temizle', 'Listelenen <strong>TÜM GRUPLAR</strong> silinecek. Emin misiniz?', () => uygulama.sunucu.gruplari_temizle());
        },
        sablon_sil_onay(id, baslik) {
            uygulama.arayuz.onay_kutusu_ac('Şablonu Sil', `<strong>${baslik}</strong> şablonunu silmek istiyor musunuz?`, () => uygulama.sunucu.sablon_sil(id));
        },
        sablonlari_temizle_onay() {
            uygulama.arayuz.onay_kutusu_ac('Şablonları Temizle', 'Kaydedilmiş <strong>TÜM ŞABLONLAR</strong> silinecek. Emin misiniz?', () => uygulama.sunucu.sablonlari_temizle());
        },

        kisi_duzenle_ac(id) {
            const c = uygulama.veriler.contacts.find(x => x.id === id);
            if (c) uygulama.arayuz.duzenleme_penceresi_ac('contact', id, c);
        },
        grup_duzenle_ac(id) {
            const g = uygulama.veriler.groups.find(x => x.id === id);
            if (g) uygulama.arayuz.duzenleme_penceresi_ac('group', id, g);
        },
        sablon_duzenle_ac(id) {
            const m = uygulama.veriler.messages.find(x => x.id === id);
            if (m) uygulama.arayuz.duzenleme_penceresi_ac('message', id, m);
        },

        degisiklikleri_kaydet() {
            const tip = uygulama.editType.value;
            const id = uygulama.editId.value;

            if (tip === 'contact') {
                const isim = document.getElementById('edit-contact-name').value;
                let numara = document.getElementById('edit-contact-phone').value;
                numara = numara.replace(/\s+/g, '');
                if (!/^\d+$/.test(numara)) {
                    return alert('HATA: Numara sadece rakamlardan oluşmalıdır!');
                }
                uygulama.sunucu.kisi_guncelle(id, { name: isim, phone: numara });
            } else if (tip === 'group') {
                uygulama.sunucu.grup_guncelle(id, {
                    name: document.getElementById('edit-group-name').value
                });
            } else if (tip === 'message') {
                uygulama.sunucu.sablon_guncelle(id, {
                    title: document.getElementById('edit-msg-title').value,
                    text: document.getElementById('edit-msg-text').value
                });
            }
            uygulama.arayuz.pencereleri_kapat();
        },

        gonderimi_hazirla() {
            const sablonId = uygulama.selectTemplate.value;
            if (!sablonId) return alert('Lütfen bir mesaj şablonu seçin!');

            const sablon = uygulama.veriler.messages.find(m => m.id === sablonId);
            if (!sablon) return;

            const secili_kutular = document.querySelectorAll('.target-cb:checked');
            if (secili_kutular.length === 0) return alert('Lütfen en az bir kişi veya grup seçin!');

            const liste = [];
            secili_kutular.forEach(cb => {
                const tip = cb.dataset.type;
                const id = cb.dataset.id;

                if (tip === 'contact') {
                    const c = uygulama.veriler.contacts.find(x => x.id === id);
                    if (c) liste.push({ type: 'contact', phone: c.phone, name: c.name, message: sablon.text });
                } else if (tip === 'group') {
                    const g = uygulama.veriler.groups.find(x => x.id === id);
                    if (g) liste.push({ type: 'group', phone: '', name: g.name, message: sablon.text });
                }
            });

            uygulama.durum.hazir_liste = liste;
            uygulama.arayuz.ozet_ekrani_ac(sablon.text, liste);
        }
    }
};

uygulama.baslat();
