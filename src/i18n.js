// İki dil desteği: Türkçe (kaynak) ve İngilizce.
// Arayüz metinleri Türkçe yazılır; İngilizce seçiliyse ekrandaki metinler bu sözlükle çevrilir.
// Tarih, süre ve sayı biçimleri util.js içinde dile göre üretilir.

const KEY = 'movecircle-lang';
const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
export const LANG = saved === 'en' || saved === 'tr' ? saved : (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en';
export const LOCALE = LANG === 'en' ? 'en-US' : 'tr-TR';
export const isEn = LANG === 'en';

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch {}
  location.reload();
}

// ---- Tam eşleşen metinler ----
const EN = {
  // MoveCircle+
  'Bir şeyler ters gitti': 'Something went wrong', 'Ekran yüklenemedi.': 'This screen could not load.', 'Verileri sıfırla ve yeniden aç': 'Reset data and reopen',
  'Ücretsiz deneme aktif': 'Free trial active', 'Abonelik aktif': 'Subscription active', 'Gelişmiş istatistikler': 'Advanced stats',
  'Ortalama tempo': 'Average pace', 'En hızlı koşu': 'Fastest run', 'Haftalık ortalama': 'Weekly average', 'Toplam koşu': 'Total runs',
  '5K tahmini': '5K estimate', '10K tahmini': '10K estimate', 'Tempo, en hızlı koşu ve 5K / 10K tahmini için yükselt': 'Upgrade for pace, fastest run and 5K / 10K estimates',
  // Genel / alt menü
  'Ana Sayfa': 'Home', 'Haritalar': 'Maps', 'Kayıt': 'Record', 'Gruplar': 'Groups', 'Sen': 'You',
  'Yükselt': 'Upgrade', 'Ekle': 'Add', 'Mesajlar': 'Messages', 'Ara': 'Search', 'Bildirimler': 'Notifications',
  'Kapat': 'Close', 'Paylaş': 'Share', 'Beğen': 'Like', 'Yorum': 'Comment', 'Kaydet': 'Save', 'Sil': 'Discard',
  'Gönder': 'Send', 'Tümü': 'All', 'Katıl': 'Join', 'Katıldın': 'Joined', 'Üyesin': 'Member',
  'Mesafe': 'Distance', 'Tempo': 'Pace', 'Süre': 'Time', 'Hız': 'Speed', 'Tırmanış': 'Elevation', 'Kalori': 'Calories', 'Beğeni': 'Kudos',
  'Koşu': 'Run', 'Bisiklet': 'Ride', 'Yürüyüş': 'Walk', 'Egzersiz': 'All sports',
  'KOŞU': 'RUN', 'BİSİKLET': 'RIDE', 'YÜRÜYÜŞ': 'WALK',
  'Akışın sonuna geldin 🎉': "You're all caught up 🎉",
  'Henüz yorum yok': 'No comments yet', 'Sonuç yok': 'No results', 'Aktivite bulunamadı': 'No activities found', 'Aktivite bulunamadı.': 'Activity not found.',
  'Yorum ekle…': 'Add a comment…', 'Anahtar kelimeyle ara': 'Search by keyword', 'Sporcu, kulüp veya aktivite ara': 'Search athletes, clubs or activities',
  'Mesajlar yakında': 'Messages coming soon', 'Sporcu arama yakında': 'Athlete search coming soon', 'Grup arama yakında': 'Group search coming soon', 'Grup ayarları yakında': 'Group settings coming soon',
  'Segmentler yakında': 'Segments coming soon', 'Ekipman yakında': 'Gear coming soon', '3D görünüm yakında': '3D view coming soon',
  // Ana sayfa
  'Günaydın': 'Good morning', 'İyi günler': 'Good afternoon', 'İyi akşamlar': 'Good evening', 'İyi geceler': 'Good night',
  'Bu hafta': 'This week', 'haftalık seri': 'week streak', 'SAHA KAYDI': 'FIELD LOG',
  'aktiviteni beğendi': 'gave you kudos', 'seni takip etmeye başladı': 'started following you', '“Sahil Akşam Turu” rotanı kaydetti': 'saved your “Coastal Evening Loop” route',
  'Dün': 'Yesterday', '2 sa': '2 h', '3 gün': '3 d',
  'Pzt': 'Mon', 'Sal': 'Tue', 'Çar': 'Wed', 'Per': 'Thu', 'Cum': 'Fri', 'Cmt': 'Sat', 'Paz': 'Sun',
  'Harika tempo! 🔥': 'Great pace! 🔥',
  // Manuel aktivite
  'Manuel aktivite ekle': 'Add manual activity', 'Tür': 'Type', 'Rota': 'Route', 'Süre (dakika)': 'Duration (minutes)', 'Başlık': 'Title', 'Aktivite eklendi': 'Activity added',
  // Paylaş / abonelik
  'Bağlantıyı kopyala': 'Copy link', 'Mesaj': 'Message', 'Hikâye': 'Story', 'Görsel olarak kaydet': 'Save as image',
  'Her adımından daha fazlasını çıkar': 'Get more out of every step',
  'Rotaları planla, kaydet ve çevrimdışı kullan': 'Plan, save and use routes offline',
  'Arkadaşlarınla özel yarışmalar oluştur': 'Create private challenges with friends',
  'Detaylı antrenman günlüğü': 'Detailed training log', 'Yük ve toparlanma takibi': 'Load and recovery tracking', 'Gelişmiş nabız bölgesi analizi': 'Advanced heart-rate zone analysis',
  '30 gün ücretsiz dene': 'Try 30 days free', 'MoveCircle+ aktif ✓': 'MoveCircle+ active ✓',
  'Bu bir demo: gerçek ödeme alınmaz, yalnızca yerel olarak açılır.': 'This is a demo: no real payment is taken; it only unlocks locally.',
  'MoveCircle+ deneme sürümü açıldı (demo)': 'MoveCircle+ trial unlocked (demo)', 'MoveCircle+ kapatıldı': 'MoveCircle+ turned off',
  // Haritalar
  'Rota ara': 'Search routes', 'Kaydedilenler': 'Saved', 'Atlas': 'Atlas', 'Rotalar': 'Routes', 'Uzunluk': 'Length', 'Zorluk': 'Difficulty', 'İrtifa': 'Elevation', 'Zemin': 'Surface',
  'Kolay': 'Easy', 'Orta': 'Moderate', 'Zor': 'Hard', 'Asfalt': 'Paved', 'Toprak': 'Dirt', 'Karışık': 'Mixed',
  'Nasıl hissetmek istiyorsun?': 'How do you want to feel?', 'Hepsi': 'All', 'Sakinleşmek': 'Calm', 'Enerji': 'Energized', 'Keşif': 'Curious',
  'Dönüş': 'Turns', 'Yeşil': 'Green', 'Su': 'Water', 'Eğim': 'Climb',
  'Bu filtrelere uyan rota yok.': 'No routes match these filters.', 'Rota kaydedildi': 'Route saved', 'Rota kaldırıldı': 'Route removed',
  'En çok tırmanış önce': 'Most climbing first', 'Varsayılan sıralama': 'Default order', 'Şimdilik yalnızca koşu rotaları': 'Run routes only for now',
  'Koyu harita': 'Dark map', 'Açık harita': 'Light map', 'Bu rotayı kullan': 'Use this route', 'Yükselti silueti': 'Elevation skyline',
  'Ayak İzi Atlası': 'Footprint Atlas', 'Bir sokağa dokun: oradan kaç kez geçtiğini gör.': 'Tap a street to see how often you passed it.',
  'Buradan hiç geçmedin. Bir dahaki keşfin burası olabilir.': "You've never been here. It could be your next discovery.",
  'Henüz çizgin yok. İlk aktiviteni kaydet, haritan burada oluşmaya başlasın.': 'No lines yet. Record your first activity and your map starts here.',
  'İlk çizgini çek': 'Draw your first line', 'Başlangıç ayı': 'Start month', 'Bitiş ayı': 'End month',
  // Kayıt
  'Demo hızı:': 'Demo speed:', 'Simülasyonu hızlandırmak için dokun': 'Tap to speed up the simulation', 'GPS hazır': 'GPS ready', '(simülasyon)': '(simulated)',
  'Bölüm ort. (/km)': 'Split avg (/km)', 'Mesafe (km)': 'Distance (km)', 'Ort. hız (km/s)': 'Avg speed (km/h)', 'Rota Ekle': 'Add Route',
  'Devam': 'Resume', 'Bitir': 'Finish', 'Spor seç': 'Choose sport', 'Rota seç': 'Choose route',
  'Aktiviteyi kaydet': 'Save activity', 'Nasıl geçti?': 'How did it go?', 'Yalnızca takipçiler görebilsin': 'Followers only',
  'Kaydetmek için çok kısa': 'Too short to save', 'Aktivite kaydedildi 🎉': 'Activity saved 🎉', 'Kayıt iptal edilsin mi?': 'Discard this recording?',
  // Aktivite detayı / mühür / film / kartpostal
  'Koşu Filmi': 'Run Film', 'Rota Mührü': 'Route Seal', 'Bölümler': 'Splits', 'km': 'km',
  'Bu koşudan üretilen tekil işaret. Kartpostala dönüştür ve paylaş.': 'A one-of-a-kind mark made from this run. Turn it into a postcard and share.',
  "Halkalar km'leri gösterir: kalın halka hızlı km, kırmızı halka en hızlı km.": 'Rings show kilometres: thick ring = fast km, red ring = fastest km.',
  'Kartpostal yap': 'Make a postcard', 'Kartpostal': 'Postcard', 'Gazete': 'Gazette', 'Pafta': 'Survey', 'Afiş': 'Poster',
  'Kartpostal indirildi': 'Postcard downloaded', 'Paylaşılamadı': "Couldn't share", 'Tekrar oynat': 'Replay', 'Zaman': 'Time', 'Filmde gezin': 'Scrub film', 'Duraklatıldı': 'Paused',
  'Aktivite silinsin mi?': 'Delete this activity?', 'Aktivite silindi': 'Activity deleted', "1 km'den kısa": 'Shorter than 1 km',
  // Gruplar
  'Meydan Okumalar': 'Challenges', 'Kulüpler': 'Clubs', 'Etkinlikler': 'Events', 'Yerel Kulüp Etkinlikleri': 'Local Club Events', 'Yarışlar': 'Races',
  'Kulübe katıldın': 'You joined the club', 'Kulüpten ayrıldın': 'You left the club', 'Meydan okumaya katıldın': 'Challenge joined', 'Meydan okumadan ayrıldın': 'Challenge left',
  'Etkinliğe katılıyorsun': "You're going", 'Katılım iptal edildi': 'RSVP cancelled',
  'Ekim 50 km Koşu': 'October 50 km Run', 'Ay bitmeden 50 km koş': 'Run 50 km before the month ends',
  'Haftalık 3 Aktivite': '3 Activities a Week', 'Bu hafta 3 aktivite kaydet': 'Log 3 activities this week',
  'Tepe Tırmanışı 1000 m': 'Hill Climb 1000 m', 'Ay içinde 1000 m tırmanış': 'Climb 1000 m this month',
  'Kordon Koşucuları': 'Seafront Runners', 'Yelkenli Pedal Kulübü': 'Yelkenli Pedal Club', 'Şafak Adımları': 'Dawn Steps', 'Tepe Avcıları Trail': 'Hill Hunters Trail',
  'Kordon Gece Koşusu': 'Seafront Night Run', 'Pazar Sahil Sürüşü': 'Sunday Coastal Ride', 'Çamlık Sabah Yürüyüşü': 'Pine Grove Morning Walk',
  'Liman Şehri Yarı Maratonu': 'Liman City Half Marathon', 'Kuzeytepe Trail Festivali': 'Kuzeytepe Trail Festival',
  'Çamlık Korusu girişi': 'Pine Grove entrance', 'Kuzeytepe Ormanı': 'Kuzeytepe Forest',
  // Sen
  'Profili düzenle': 'Edit profile', 'Profili paylaş': 'Share profile', 'İlerleme': 'Progress', 'Aktiviteler': 'Activities', 'Daha Fazla': 'More',
  'Son 12 hafta': 'Last 12 weeks', 'İlerlemeni detaylı gör': 'See your progress in detail', 'İstatistikler': 'Statistics', 'Segmentler': 'Segments', 'Ekipman': 'Gear',
  'Meydan okumalara göz at': 'Browse challenges', 'Motive kalmak ve rozet toplamak için bir meydan okumaya katıl.': 'Join a challenge to stay motivated.',
  'YIL HALKALARI': 'YEAR RINGS', 'Spor': 'Sport', 'Adet': 'Count',
  'Her halka bir hafta. Kalın halka daha uzun süre demek; ara verdiğin haftalar ince kalır, ceza yok.': 'Each ring is a week. Thicker means more time; rest weeks stay thin, no penalty.',
  'Profil bağlantısı kopyalandı': 'Profile link copied', 'Ad Soyad': 'Full name', 'Şehir': 'City', 'Profil rengi': 'Profile colour',
  'Ayarlar': 'Settings', 'Harita teması': 'Map theme', 'Koyu': 'Dark', 'Açık': 'Light', 'Harita teması değişti': 'Map theme changed',
  'Hava Paleti': 'Sky Palette', 'Açık · renkler güneşe göre değişir': 'On · colours follow the sun', 'Kapalı · sabit renkler': 'Off · fixed colours',
  'Hava Paleti açık': 'Sky Palette on', 'Hava Paleti kapalı': 'Sky Palette off',
  'Demo verilerini sıfırla': 'Reset demo data', 'Tüm yerel kayıtlar silinir': 'All local data will be erased', 'Tüm demo verileri sıfırlansın mı?': 'Reset all demo data?',
  'Hakkında': 'About', 'MoveCircle taslak sürüm 0.3 · tamamen çevrimdışı, sunucusuz': 'MoveCircle draft v0.3 · fully offline, no server',
  'Dil': 'Language', 'Türkçe': 'Türkçe', 'English': 'English',
  // Rota ve aktivite adları
  'Sahil Akşam Turu': 'Coastal Evening Loop', 'Martılı Blok Döngüsü': 'Martılı Block Loop', 'Kuzeytepe Tırmanışı': 'Kuzeytepe Climb', 'Çınaraltı 5K': 'Çınaraltı 5K',
  'Yelkenli Liman Koşusu': 'Yelkenli Harbour Run', 'Rüzgâr Parkı Turu': 'Wind Park Loop', 'Körfez Uzun Koşu': 'Bay Long Run', 'Bağlarbaşı Bisiklet Rotası': 'Bağlarbaşı Bike Route',
  'Rüzgâr Parkı': 'Wind Park', 'Kordon Atletizm Alanı': 'Seafront Track', 'Çamlık Korusu': 'Pine Grove', 'Fener Bahçesi': 'Lighthouse Garden', 'Mavi Körfez': 'Blue Bay', 'Liman Şehri': 'Liman City',
  'Sabah Koşusu': 'Morning Run', 'Öğleden Sonra Koşusu': 'Afternoon Run', 'Akşam Koşusu': 'Evening Run', 'Gece Koşusu': 'Night Run',
  'Sabah Sürüşü': 'Morning Ride', 'Öğleden Sonra Sürüşü': 'Afternoon Ride', 'Akşam Sürüşü': 'Evening Ride', 'Gece Sürüşü': 'Night Ride',
  'Sabah Yürüyüşü': 'Morning Walk', 'Öğleden Sonra Yürüyüşü': 'Afternoon Walk', 'Akşam Yürüyüşü': 'Evening Walk', 'Gece Yürüyüşü': 'Night Walk',
  'Rota mührü': 'Route seal', 'Kurgusal çevrimdışı harita · Liman Şehri': 'Fictional offline map · Liman City',
  'Kordon Atletizm Alanı, Martılı': 'Seafront Track, Martılı', 'Fener Bahçesi, Yelkenli': 'Lighthouse Garden, Yelkenli', 'Sahilkent, Liman Şehri': 'Sahilkent, Liman City',
  // 0.4
  'Gölgemle koş': 'Run with my ghost', 'Gölge seninle aynı hizada': 'Your ghost is right beside you',
  'Kapsül bırak': 'Drop capsule', 'Zaman Kapsülü': 'Time Capsule', 'Mühürle': 'Seal it', 'Kapsül mühürlendi': 'Capsule sealed',
  'Bu noktaya kendine bir not bırak. Buradan tekrar geçtiğinde açılacak.': "Leave a note to yourself here. It opens the next time you pass by.",
  'Gelecekteki kendine…': 'To your future self…', 'Devam et': 'Continue', 'Kapsülü bırakmak için rotada bir noktaya dokun': 'Tap a point on the route to drop the capsule',
  'Geçen ay buradan geçerken 5K’yı ilk kez durmadan koştun. Bugün de yapabilirsin.': 'Last month, passing here, you ran 5K non-stop for the first time. You can do it again today.',
  'Ritim Partisyonu': 'Rhythm Score', 'Her km bir nota: hızlı km yüksek, yavaş km alçak.': 'Each km is a note: fast km high, slow km low.', 'Dinle': 'Listen', 'Durdur': 'Stop',
  'HAREKET İMZASI': 'MOVEMENT SIGNATURE', 'En sık saat': 'Favourite time', 'Yönelim': 'Heading', 'Döngü rotası': 'Loop routes',
  'Dış halka günün saatlerini, iç gül gittiğin yönleri gösterir. Bir puan değil; senin tarzın.': 'The outer ring shows the hours you move, the inner rose the directions you go. Not a score; your style.',
  'İmzamı paylaş': 'Share my signature', 'İmza hazır': 'Signature ready',
  'Kuzey': 'North', 'Kuzeydoğu': 'Northeast', 'Doğu': 'East', 'Güneydoğu': 'Southeast', 'Güney': 'South', 'Güneybatı': 'Southwest', 'Batı': 'West', 'Kuzeybatı': 'Northwest',
  // Hava paleti ön ayarları
  'Akşam': 'Evening', 'Öğleden Sonra': 'Afternoon',
  'Gece': 'Night', 'Şafak': 'Dawn', 'Sabah': 'Morning', 'Öğle': 'Noon', 'İkindi': 'Afternoon', 'Gün batımı': 'Sunset',
};

// ---- Kalıplı metinler ----
const RULES = [
  [/^(₺[\d.,]+)'den başlayan fiyatlarla$/, 'From $1'],
  [/^%(\d+)$/, '$1%'],
  [/^Bu sokaktan 1 kez geçtin$/, "You've passed this street once"],
  [/^(.+) · (\d+:\d\d) \/km$/, (m, t, p) => `${tr(t)} · ${p} /km`],
  [/^(.+) · ([A-Z][a-z]{2} \d{1,2}, \d{4})$/, (m, t, d) => `${tr(t)} · ${d}`],
  [/^Gölgenin (\d+) sn önündesin$/, "You're $1 s ahead of your ghost"], [/^Gölgenin (\d+) sn gerisindesin$/, "You're $1 s behind your ghost"],
  [/^(\d+) AKTİVİTE$/, '$1 ACTIVITIES'], [/^(.+) tarihinde bıraktın$/, 'You left this on $1'],
  [/^(Sabah|Öğleden Sonra|Akşam|Gece) · (\d\d–\d\d)$/, (m, a, b) => `${EN[a]} · ${b}`],
  [/^(Günaydın|İyi günler|İyi akşamlar|İyi geceler), (.+)$/, (m, g, n) => `${EN[g]}, ${n}`],
  [/^(.+) · ([\d.,]+) km · (.+) \/km$/, (m, t, k, p) => `${tr(t)} · ${k} km · ${p} /km`],
  [/^(\d+) aktivite$/, '$1 activities'],
  [/^(\d+) takipçi • (\d+) takip edilen$/, '$1 followers • $2 following'],
  [/^(\d+) beğeni$/, '$1 kudos'], [/^(\d+) yorum$/, '$1 comments'], [/^(\d+) beğeni · (\d+) yorum$/, '$1 kudos · $2 comments'],
  [/^Bu hafta (.+)$/, 'This week $1'],
  [/^(\d+) haftadır her hafta hareket ediyorsun\. Böyle devam!$/, "You've moved every week for $1 weeks. Keep going!"],
  [/^Bir aktivite kaydederek serini başlat\.$/, 'Record an activity to start your streak.'],
  [/^(.+) · (\d+) üye( · ✓ Katılıyorsun)?$/, (m, a, n, j) => `${tr(a)} · ${n} members${j ? ' · ✓ Going' : ''}`],
  [/^(Koşu|Bisiklet|Yürüyüş) · (.+) · (\d+) üye$/, (m, s, p, n) => `${tr(s)} · ${tr(p)} · ${n} members`],
  [/^(Koşu|Bisiklet|Yürüyüş) · (.+)$/, (m, s, p) => `${tr(s)} · ${tr(p)}`],
  [/^([\d.,]+) MoveCircle sporcusu katılıyor$/, '$1 MoveCircle athletes going'],
  [/^%(\d+) tamamlandı$/, '$1% complete'],
  [/^([\d,.]+) km · ([\d.]+) m · (Kolay|Orta|Zor)$/, (m, k, g, d) => `${k} km · ${g} m · ${tr(d)}`],
  [/^([\d,.]+) km · ([\d.]+) m$/, '$1 km · $2 m'],
  [/^(.+) · ([\d,.]+) km$/, (m, n, k) => `${tr(n)} · ${k} km`],
  [/^(Kolay|Orta|Zor) · (Asfalt|Toprak|Karışık)$/, (m, a, b) => `${tr(a)} · ${tr(b)}`],
  [/^([\d,.]+) km · ([\d.]+) m · (Kolay|Orta|Zor)$/, (m, a, b, c) => `${a} km · ${b} m · ${tr(c)}`],
  [/^Bu yıl: (.+)$/, 'This year: $1'], [/^(\d+) kayıtlı$/, '$1 saved'],
  [/^(\d+) meydan okumaya katıldın: (.+)$/, (m, n, l) => `You've joined ${n} challenge${n === '1' ? '' : 's'}: ${l.split(', ').map(tr).join(', ')}`],
  [/^Toplam süre: (.+) · En uzun: (.+)$/, 'Total time: $1 · Longest: $2'],
  [/^\/(\d+) hafta hareketli$/, '/$1 weeks active'], [/^(\d+) HAFTA$/, '$1 WEEKS'],
  [/^(.+) haftası · (\d+) dk$/, 'Week of $1 · $2 min'],
  [/^Şu an: (.+)\. Kayıt sırasında renkler sabit kalır\.$/, (m, p) => `Now: ${tr(p)}. Colours stay fixed while recording.`],
  [/^Bu sokaktan (\d+) kez geçtin$/, "You've passed this street $1 times"], [/^· ilk: (.+)$/, '· first: $1'],
  [/^(.+) · (\d+) aktivite$/, '$1 · $2 activities'],
  [/^([\d.]+) dönüş\/km$/, '$1 turns/km'], [/^%(\d+) yeşil$/, '$1% green'], [/^%(\d+) kıyıda$/, '$1% by the water'], [/^(\d+) m\/km tırmanış$/, '$1 m/km climbing'],
  [/^(.+): (.+) — bu rotada belirgin değil$/, (m, a, b) => `${tr(a)}: ${tr(b)} — not prominent on this route`],
  [/^(Dönüş|Yeşil|Su|Eğim): (.+)$/, (m, a, b) => `${tr(a)}: ${tr(b)}`],
  [/^(\d+)–(\d+) m · en yüksek nokta (\d+) m$/, '$1–$2 m · highest point $3 m'], [/^(\d+)–(\d+) m$/, '$1–$2 m'],
  [/^(\d+)\. km · (.+) \/km$/, 'km $1 · $2 /km'],
  [/^(.+): taslak sürümde devre dışı$/, (m, a) => `${tr(a)}: disabled in this draft`],
  [/^(\d+)sa (\d+)dk$/, '$1h $2m'], [/^(\d+)sa (\d+)dk$/, '$1h $2m'],
  [/^PAFTA (.+) · (.+) · LİMAN ŞEHRİ$/, 'SHEET $1 · $2 · LIMAN CITY'],
  [/^Demo hızı: (.+)$/, 'Demo speed: $1'],
  [/^(Sabah|Öğleden Sonra|Akşam|Gece) (Koşusu|Sürüşü|Yürüyüşü)$/, (m) => EN[m] || m],
];

export function tr(s) {
  if (!isEn || s == null) return s;
  const str = String(s);
  const core = str.trim();
  if (!core) return str;
  if (Object.prototype.hasOwnProperty.call(EN, core)) return str.replace(core, EN[core]);
  for (const [re, rep] of RULES) {
    if (re.test(core)) return str.replace(core, core.replace(re, rep));
  }
  return str;
}

const ATTRS = ['placeholder', 'title', 'aria-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);

function translateNode(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || SKIP.has(p.nodeName) || p.closest?.('[data-no-i18n]')) return;
    const out = tr(node.nodeValue);
    if (out !== node.nodeValue) node.nodeValue = out;
    return;
  }
  if (node.nodeType !== 1 || SKIP.has(node.nodeName) && node.nodeName !== 'INPUT') {
    if (node.nodeName === 'INPUT') for (const a of ATTRS) if (node.hasAttribute(a)) node.setAttribute(a, tr(node.getAttribute(a)));
    return;
  }
  if (node.closest?.('[data-no-i18n]')) return;
  for (const a of ATTRS) if (node.hasAttribute?.(a)) { const v = node.getAttribute(a); const o = tr(v); if (o !== v) node.setAttribute(a, o); }
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === 3) translateNode(n);
    else for (const a of ATTRS) if (n.hasAttribute(a)) { const v = n.getAttribute(a); const o = tr(v); if (o !== v) n.setAttribute(a, o); }
    n = walker.nextNode();
  }
}

export function startI18n() {
  document.documentElement.lang = LANG;
  if (!isEn) return;
  const origConfirm = window.confirm.bind(window);
  window.confirm = (m) => origConfirm(tr(m));
  translateNode(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
