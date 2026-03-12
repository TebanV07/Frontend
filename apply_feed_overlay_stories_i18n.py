"""Apply translate pipe to feed, video-overlay, stories HTML files"""

# ============================
# feed.component.html
# ============================
feed_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\feed\components\feed\feed.component.html"
with open(feed_path, encoding="utf-8") as f:
    feed = f.read()

feed_replacements = [
    (
        "<h3>AI Translation Active</h3>",
        "<h3>{{ 'feed.aiActive' | translate }}</h3>"
    ),
    (
        "<p>All content automatically translated to your preferred language</p>",
        "<p>{{ 'feed.aiDesc' | translate }}</p>"
    ),
    (
        "<span class=\"stat-label\">Languages</span>",
        "<span class=\"stat-label\">{{ 'feed.aiLanguages' | translate }}</span>"
    ),
    (
        "<span class=\"stat-label\">Videos</span>",
        "<span class=\"stat-label\">{{ 'feed.aiVideos' | translate }}</span>"
    ),
    (
        "Personas que quizás conozcas\n      </h3>",
        "{{ 'feed.suggestedTitle' | translate }}\n      </h3>"
    ),
    (
        ">Ver todo\n      </button>",
        ">{{ 'feed.suggestedSeeAll' | translate }}\n      </button>"
    ),
    (
        "<strong>{{ user.followers_count || 0 }}</strong> seguidores",
        "<strong>{{ user.followers_count || 0 }}</strong> {{ 'feed.suggestedFollowers' | translate }}"
    ),
    (
        "• {{ user.mutualFollowersCount }} en común",
        "• {{ user.mutualFollowersCount }} {{ 'feed.suggestedMutual' | translate }}"
    ),
    (
        'title="Ocultar sugerencia"',
        "[title]=\"'explore.suggested.hide' | translate\""
    ),
    (
        "{{ followingUsers[user.id] ? 'Siguiendo' : 'Seguir' }}",
        "{{ (followingUsers[user.id] ? 'feed.following' : 'feed.follow') | translate }}"
    ),
    (
        "<p>Cargando posts...</p>",
        "<p>{{ 'feed.loadingPosts' | translate }}</p>"
    ),
    (
        "<h3>No hay posts aún</h3>",
        "<h3>{{ 'feed.noPosts' | translate }}</h3>"
    ),
    (
        "<p>¡Sé el primero en compartir algo!</p>",
        "<p>{{ 'feed.noPostsSub' | translate }}</p>"
    ),
]
count = 0
for old, new in feed_replacements:
    if old in feed:
        feed = feed.replace(old, new)
        count += 1
    else:
        print(f"FEED NOT FOUND: {old[:70]!r}")
with open(feed_path, "w", encoding="utf-8") as f:
    f.write(feed)
print(f"feed: {count} replacements")


# ============================
# video-overlay.component.html
# ============================
vo_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\feed\components\video-overlay\video-overlay.component.html"
with open(vo_path, encoding="utf-8") as f:
    vo = f.read()

vo_replacements = [
    (
        '<button class="follow-btn">Seguir</button>',
        '<button class="follow-btn">{{ \'videoOverlay.follow\' | translate }}</button>'
    ),
    (
        "Subtítulos:\n        </label>",
        "{{ 'videoOverlay.subtitles' | translate }}\n        </label>"
    ),
    (
        "(Original)\n          </option>",
        "{{ 'videoOverlay.original' | translate }}\n          </option>"
    ),
    (
        '<optgroup label="Disponibles"',
        '<optgroup [label]="\'videoOverlay.available\' | translate"'
    ),
    (
        '<optgroup label="Solicitar traducción"',
        '<optgroup [label]="\'videoOverlay.requestTranslation\' | translate"'
    ),
    (
        "(solicitar)\n              </option>",
        "{{ 'videoOverlay.request' | translate }}\n              </option>"
    ),
    (
        '<span class="btn-label">Traducir</span>',
        '<span class="btn-label">{{ \'videoOverlay.translate\' | translate }}</span>'
    ),
    (
        "<h4>Traducir Video</h4>",
        "<h4>{{ 'videoOverlay.translateVideo' | translate }}</h4>"
    ),
    (
        "<button class=\"close-btn\" (click)=\"toggleTranslationMenu()\">✕</button>",
        "<button class=\"close-btn\" (click)=\"toggleTranslationMenu()\">{{ 'videoOverlay.close' | translate }}</button>"
    ),
    (
        "<p class=\"menu-description\">\n          Genera subtítulos traducidos con IA para este video\n        </p>",
        "<p class=\"menu-description\">{{ 'videoOverlay.translateDesc' | translate }}</p>"
    ),
    (
        "<h5>✅ Disponibles:</h5>",
        "<h5>{{ 'videoOverlay.availableLangs' | translate }}</h5>"
    ),
    (
        "<h5>🌐 Solicitar traducción:</h5>",
        "<h5>{{ 'videoOverlay.requestLangs' | translate }}</h5>"
    ),
]
count = 0
for old, new in vo_replacements:
    if old in vo:
        vo = vo.replace(old, new)
        count += 1
    else:
        print(f"VIDEO-OVERLAY NOT FOUND: {old[:70]!r}")
with open(vo_path, "w", encoding="utf-8") as f:
    f.write(vo)
print(f"video-overlay: {count} replacements")

# Check remaining parts of video-overlay for requesting/translationPending
with open(vo_path, encoding="utf-8") as f:
    vo2 = f.read()

import re
remaining_es = re.findall(r'Solicitando|solicitada|pending|Requesting', vo2, re.IGNORECASE)
if remaining_es:
    print(f"video-overlay remaining: {remaining_es}")


# ============================
# stories.component.html
# ============================
st_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\shared\components\stories\stories.component.html"
with open(st_path, encoding="utf-8") as f:
    st = f.read()

st_replacements = [
    (
        '<h3 class="stories-title">Historias</h3>',
        "<h3 class=\"stories-title\">{{ 'stories.title' | translate }}</h3>"
    ),
    (
        "{{ story.isOwn ? 'Agregar' : story.user.name.split(' ')[0] }}",
        "{{ story.isOwn ? ('stories.add' | translate) : story.user.name.split(' ')[0] }}"
    ),
]
count = 0
for old, new in st_replacements:
    if old in st:
        st = st.replace(old, new)
        count += 1
    else:
        print(f"STORIES NOT FOUND: {old[:70]!r}")
with open(st_path, "w", encoding="utf-8") as f:
    f.write(st)
print(f"stories: {count} replacements")
