"""Apply translate pipe to sidebar, trending, lives HTML files"""

# ============================
# sidebar.component.html
# ============================
sb_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\shared\components\sidebar\sidebar.component.html"
with open(sb_path, encoding="utf-8") as f:
    sb = f.read()

sb_replacements = [
    (
        "<span class=\"stat-label\">Seguidores</span>",
        "<span class=\"stat-label\">{{ 'sidebar.followers' | translate }}</span>"
    ),
    (
        "<span class=\"stat-label\">Siguiendo</span>",
        "<span class=\"stat-label\">{{ 'sidebar.following' | translate }}</span>"
    ),
    (
        "<span class=\"stat-label\">Posts</span>",
        "<span class=\"stat-label\">{{ 'sidebar.posts' | translate }}</span>"
    ),
    (
        "<h4 class=\"section-title\">Navegación</h4>",
        "<h4 class=\"section-title\">{{ 'sidebar.navigation' | translate }}</h4>"
    ),
    (
        "<h4 class=\"section-title\">AI Translation</h4>",
        "<h4 class=\"section-title\">{{ 'sidebar.aiTranslation' | translate }}</h4>"
    ),
    (
        "<span>Activo</span>",
        "<span>{{ 'sidebar.active' | translate }}</span>"
    ),
    (
        "<span class=\"info-title\">Real-time Translation</span>",
        "<span class=\"info-title\">{{ 'sidebar.realtimeTranslation' | translate }}</span>"
    ),
    (
        "<span class=\"info-desc\">Videos & Posts</span>",
        "<span class=\"info-desc\">{{ 'sidebar.realtimeDesc' | translate }}</span>"
    ),
    (
        "<span class=\"info-title\">24+ Languages</span>",
        "<span class=\"info-title\">{{ 'sidebar.languages' | translate }}</span>"
    ),
    (
        "<span class=\"info-desc\">Global connectivity</span>",
        "<span class=\"info-desc\">{{ 'sidebar.languagesDesc' | translate }}</span>"
    ),
    (
        "<span class=\"info-title\">Instant Processing</span>",
        "<span class=\"info-title\">{{ 'sidebar.instant' | translate }}</span>"
    ),
    (
        "<span class=\"info-desc\">Lightning fast</span>",
        "<span class=\"info-desc\">{{ 'sidebar.instantDesc' | translate }}</span>"
    ),
]
count = 0
for old, new in sb_replacements:
    if old in sb:
        sb = sb.replace(old, new)
        count += 1
    else:
        print(f"SIDEBAR NOT FOUND: {old[:70]!r}")
with open(sb_path, "w", encoding="utf-8") as f:
    f.write(sb)
print(f"sidebar: {count} replacements")


# ============================
# trending.component.html
# ============================
tr_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\trending\components\trending\trending.component.html"
with open(tr_path, encoding="utf-8") as f:
    tr = f.read()

tr_replacements = [
    ("<p>Cargando tendencias...</p>", "<p>{{ 'trending.loading' | translate }}</p>"),
    ("<h2>🔥 Tendencias</h2>", "<h2>🔥 {{ 'trending.title' | translate }}</h2>"),
    (
        "<div class=\"filter-label\">🌍 Filtrar por país</div>",
        "<div class=\"filter-label\">🌍 {{ 'trending.filterByCountry' | translate }}</div>"
    ),
    (
        "<span class=\"country-label\">Global</span>",
        "<span class=\"country-label\">{{ 'trending.global' | translate }}</span>"
    ),
    (
        "<p>No hay tendencias disponibles</p>",
        "<p>{{ 'trending.noTrending' | translate }}</p>"
    ),
    # Description line with "visualizaciones" and "Solo de"
    (
        "· {{ formatNumber(selectedTrending.views) }} visualizaciones",
        "· {{ formatNumber(selectedTrending.views) }} {{ 'trending.views' | translate }}"
    ),
    (
        "<span *ngIf=\"selectedCountry\">· Solo de {{ getSelectedCountryName() }}</span>",
        "<span *ngIf=\"selectedCountry\">· {{ 'trending.onlyFrom' | translate }} {{ getSelectedCountryName() }}</span>"
    ),
    (
        'title="Cuadrícula"',
        "[title]=\"'trending.gridView' | translate\""
    ),
    (
        'title="Lista"',
        "[title]=\"'trending.listView' | translate\""
    ),
    (
        "<label>Ordenar:</label>",
        "<label>{{ 'trending.sort' | translate }}</label>"
    ),
    (
        "<option value=\"trending\">Más tendencia</option>",
        "<option value=\"trending\">{{ 'trending.sortTrending' | translate }}</option>"
    ),
    (
        "<option value=\"views\">Más vistas</option>",
        "<option value=\"views\">{{ 'trending.sortViews' | translate }}</option>"
    ),
    (
        "<option value=\"recent\">Más recientes</option>",
        "<option value=\"recent\">{{ 'trending.sortRecent' | translate }}</option>"
    ),
    (
        "<div class=\"trending-badge\">🔥 Tendencia</div>",
        "<div class=\"trending-badge\">🔥 {{ 'trending.trendingBadge' | translate }}</div>"
    ),
    (
        "<button class=\"watch-btn\" [routerLink]=\"['/videos', video.uuid]\">Ver ahora →</button>",
        "<button class=\"watch-btn\" [routerLink]=\"['/videos', video.uuid]\">{{ 'trending.watchNow' | translate }} →</button>"
    ),
]
count = 0
for old, new in tr_replacements:
    if old in tr:
        tr = tr.replace(old, new)
        count += 1
    else:
        print(f"TRENDING NOT FOUND: {old[:70]!r}")
with open(tr_path, "w", encoding="utf-8") as f:
    f.write(tr)
print(f"trending: {count} replacements")


# ============================
# lives.component.html
# ============================
lv_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\lives\components\lives\lives.component.html"
with open(lv_path, encoding="utf-8") as f:
    lv = f.read()

lv_replacements = [
    (
        "<div class=\"sidebar-header\"><h2>En Vivo</h2></div>",
        "<div class=\"sidebar-header\"><h2>{{ 'lives.title' | translate }}</h2></div>"
    ),
    (
        "<div class=\"chat-header\"><h3>Chat</h3></div>",
        "<div class=\"chat-header\"><h3>{{ 'lives.chat' | translate }}</h3></div>"
    ),
    (
        '<span class="live-badge">LIVE</span>',
        "<span class=\"live-badge\">{{ 'lives.live' | translate }}</span>"
    ),
    (
        'placeholder="Say something..."',
        "[placeholder]=\"'lives.say' | translate\""
    ),
    (
        "<button (click)=\"sendMessage()\">Send</button>",
        "<button (click)=\"sendMessage()\">{{ 'lives.send' | translate }}</button>"
    ),
]
count = 0
for old, new in lv_replacements:
    if old in lv:
        lv = lv.replace(old, new)
        count += 1
    else:
        print(f"LIVES NOT FOUND: {old[:70]!r}")
with open(lv_path, "w", encoding="utf-8") as f:
    f.write(lv)
print(f"lives: {count} replacements")
