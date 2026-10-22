# MoveCircle — fitness takip uygulaması taslağı

Tamamen **frontend**, **sunucusuz** ve **çevrimdışı** çalışan bir koşu/bisiklet takip uygulaması taslağı.
Tüm isimler, mekânlar, kulüpler ve yarışlar kurgusaldır. Harita, kod ile üretilen kurgusal bir şehirdir
("Liman Şehri"); hiçbir döşeme (tile) sunucusuna veya API'ye istek atılmaz.

## Ekranlar
| Sekme | İçerik |
|---|---|
| Ana Sayfa | Seri kartı, aktivite akışı (mini harita, beğeni, yorum, paylaş), bildirimler, arama, manuel aktivite ekleme |
| Haritalar | Çevrimdışı vektör harita, rota pinleri, Uzunluk/Zorluk/İrtifa/Zemin filtreleri, rota kartları, kaydetme |
| Kayıt | Spor seçimi, rota seçimi, simüle GPS kaydı (1×/10×/30× demo hızı), duraklat/bitir/kaydet |
| Gruplar | Meydan okumalar (ilerleme çubuğu), kulüpler, yerel etkinlikler, yarışlar |
| Sen | Profil, 12 haftalık ilerleme grafiği, aktiviteler (arama), istatistikler, ayarlar (tema, verileri sıfırla) |
| Aktivite detayı | Büyük harita, istatistikler, irtifa grafiği, km bölümleri, yorumlar, silme |
| MoveCircle+ | Abonelik ekranı (demo, ödeme yok) |

Veriler `localStorage` içinde tutulur (`src/store.js`).

## 0.2 ile gelenler
- **Ayak İzi Atlası** — Haritalar → Atlas: tüm aktivitelerin üst üste çizildiği kişisel harita, ay aralığı kaydırıcısı, sokağa dokununca kaç kez geçildiği.
- **Rota Mührü + Kartpostal** — her aktiviteden deterministik SVG mühür; Gazete / Pafta / Afiş şablonlarıyla PNG paylaşımı.
- **Koşu Filmi** — eğik açılı, tempoya göre hızlanan 20 sn tekrar; kayıttan sonra otomatik oynar, mühürle biter.
- **Rota Karakter Kartı** — dönüş / yeşil / su / eğim göstergeleri, ruh hâline göre sıralama, göstergeye dokununca haritada vurgu.
- **Hava Paleti** — vurgu rengi güneşin konumuna göre değişir (Sen → Ayarlar).

## 0.4 ile gelenler (Strava'da olmayanlar)
- **Gölge Koşucu** — Kayıt ekranında aynı rotadaki en iyi geçmiş koşunla canlı yarış: haritada hayalet nokta, panelde "Gölgenin 12 sn önündesin".
- **Zaman Kapsülü** — Aktivite detayında "Kapsül bırak" ile rotadaki bir noktaya kendine not bırak; kayıt sırasında oradan geçince zarf açılır.
- **Ritim Partisyonu** — km bölümleri nota dizeğine yazılır (hızlı km yüksek nota); "Dinle" ile Web Audio üzerinden melodi olarak çalar.
- **Hareket İmzası** — Sen → İlerleme: günün saatleri (dış halka) ve gidilen yönlerden (iç gül) oluşan kişisel glif; PNG olarak paylaşılır.

## Dil desteği
Türkçe ve İngilizce. İlk açılışta cihaz diline göre seçilir; **Sen → Ayarlar → Dil · Language** ile değiştirilir.
Arayüz metinleri Türkçe yazılır, `src/i18n.js` içindeki sözlük İngilizceye çevirir; tarih, süre ve ondalık biçimleri `src/util.js` dile göre üretir.
Yeni bir metin eklerken İngilizce karşılığını `EN` sözlüğüne (ya da kalıplı metinler için `RULES` listesine) eklemek yeterli.

## Klasör yapısı
```
src/
  main.js            # hash router + alt menü
  store.js           # yerel durum, örnek veriler
  map/city.js        # kurgusal şehir geometrisi, rotalar, irtifa
  map/render.js      # Leaflet (CRS.Simple) çizimi + mini SVG harita
  views/*.js         # ekranlar
  features/*.js      # mühür, kartpostal, film, karakter, palet, gölge/kapsül, ritim, imza, sanat
android/             # Capacitor Android projesi
.github/workflows/   # Web + APK derleme
```

## Yerel geliştirme
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ → web sürümü
npm run android:debug  # Android SDK + JDK 21 gerekli
```

## GitHub ile derleme
1. Bu klasörü yeni bir GitHub deposuna `main` dalı olarak gönder.
2. **Settings → Pages → Source: GitHub Actions** seç.
3. Her `main` push'unda Actions:
   - web sürümünü derler ve GitHub Pages'e yayınlar,
   - `patika-debug.apk` ve `patika-web.zip` dosyalarını **Artifacts** olarak ekler.
4. Sürüm yayınlamak için etiket at: `git tag v0.1.0 && git push --tags` → APK ve web zip'i
   otomatik bir **Release**'e eklenir.

> APK debug imzalıdır; telefona doğrudan kurulabilir ("bilinmeyen kaynaklar" izni gerekir).
> Mağaza için release imzası ileride eklenebilir.

## Notlar / sonraki adımlar
- Kayıt şu an seçilen rota üzerinde **simülasyon** yapar (harita kurgusal olduğu için).
  Gerçek GPS için `@capacitor/geolocation` eklenip gerçek koordinatlar kurgusal şehre eşlenebilir
  ya da gerçek bir çevrimdışı harita paketi (ör. MBTiles/PMTiles) bağlanabilir.
- Uygulama düz JavaScript; istenirse React/Vue'ya taşınması kolaydır.
