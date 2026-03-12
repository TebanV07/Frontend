"""Apply translate pipe to post-card, post-detail, edit-post HTML files"""

# ============================
# edit-post.component.html
# ============================
ep_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\posts\components\edit-post\edit-post.component.html"
with open(ep_path, encoding="utf-8") as f:
    ep = f.read()

ep_replacements = [
    ("<h2>Editar Post</h2>", "<h2>{{ 'post.edit.title' | translate }}</h2>"),
    (">Contenido:\n    <textarea", ">{{ 'post.edit.content' | translate }}\n    <textarea"),
    (">Tags (separados por coma):\n    <input", ">{{ 'post.edit.tags' | translate }}\n    <input"),
    ("> Público", "> {{ 'post.edit.public' | translate }}"),
]
count = 0
for old, new in ep_replacements:
    if old in ep:
        ep = ep.replace(old, new)
        count += 1
    else:
        print(f"EDIT-POST NOT FOUND: {old[:60]!r}")
with open(ep_path, "w", encoding="utf-8") as f:
    f.write(ep)
print(f"edit-post: {count} replacements")


# ============================
# post-card.component.html
# ============================
pc_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\posts\components\post-card\post-card.component.html"
with open(pc_path, encoding="utf-8") as f:
    pc = f.read()

pc_replacements = [
    ("<h4>¿Eliminar este post?</h4>", "<h4>{{ 'post.deleteConfirm' | translate }}</h4>"),
    ("<p>Esta acción no se puede deshacer.</p>", "<p>{{ 'post.deleteBody' | translate }}</p>"),
    (">Cancelar\n        </button>", ">{{ 'common.cancel' | translate }}\n        </button>"),
    (
        "<span *ngIf=\"!isDeleting\">Eliminar</span>",
        "<span *ngIf=\"!isDeleting\">{{ 'common.delete' | translate }}</span>"
    ),
    # dropdown menu items
    (
        "Editar\n          </button>",
        "{{ 'post.editMenu' | translate }}\n          </button>"
    ),
    (
        "Eliminar\n          </button>",
        "{{ 'post.deleteMenu' | translate }}\n          </button>"
    ),
    (
        "Denunciar\n          </button>",
        "{{ 'post.reportMenu' | translate }}\n          </button>"
    ),
    (
        "Compartir\n        </button>",
        "{{ 'post.shareMenu' | translate }}\n        </button>"
    ),
    # video inline close button
    (
        "<button class=\"stop-btn\" (click)=\"stopInline($event)\">Cerrar</button>",
        "<button class=\"stop-btn\" (click)=\"stopInline($event)\">{{ 'post.close' | translate }}</button>"
    ),
    # image translate buttons
    (
        "<span *ngIf=\"translatingImageId !== image.id\">Traducir texto</span>",
        "<span *ngIf=\"translatingImageId !== image.id\">{{ 'post.translateText' | translate }}</span>"
    ),
    (
        "<span *ngIf=\"translatingImageId === image.id\">Extrayendo...</span>",
        "<span *ngIf=\"translatingImageId === image.id\">{{ 'post.extracting' | translate }}</span>"
    ),
    (
        "<span>{{ showImageTranslation[image.id] ? 'Ver imagen' : 'Ver texto' }}</span>",
        "<span>{{ (showImageTranslation[image.id] ? 'post.showImage' : 'post.showText') | translate }}</span>"
    ),
    (
        "<span class=\"panel-label\">Texto original</span>",
        "<span class=\"panel-label\">{{ 'post.originalText' | translate }}</span>"
    ),
    (
        "<p class=\"no-text\">ℹ️ No se encontró texto en esta imagen</p>",
        "<p class=\"no-text\">{{ 'post.noText' | translate }}</p>"
    ),
    # translation indicator
    (
        "<span>Translated to {{ flagService.getLanguageName(userLanguage) }}</span>",
        "<span>{{ 'post.translatedTo' | translate }} {{ flagService.getLanguageName(userLanguage) }}</span>"
    ),
    (
        "(from\n      <img",
        "{{ 'post.from' | translate }}\n      <img"
    ),
    # stats / actions
    (
        "<span class=\"comment-count\">{{ post.comments_count }} comments</span>",
        "<span class=\"comment-count\">{{ post.comments_count }} {{ 'post.comments' | translate }}</span>"
    ),
    (
        "<span>Comment</span>",
        "<span>{{ 'post.comment' | translate }}</span>"
    ),
]
count = 0
for old, new in pc_replacements:
    if old in pc:
        pc = pc.replace(old, new)
        count += 1
    else:
        print(f"POST-CARD NOT FOUND: {old[:70]!r}")
with open(pc_path, "w", encoding="utf-8") as f:
    f.write(pc)
print(f"post-card: {count} replacements")


# ============================
# post-detail.component.html
# ============================
pd_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\posts\components\post-detail\post-detail.component.html"
with open(pd_path, encoding="utf-8") as f:
    pd = f.read()

pd_replacements = [
    (
        "<span>Loading post...</span>",
        "<span>{{ 'common.loading' | translate }}</span>"
    ),
    (
        "class=\"btn-back\">Go back to feed</button>",
        "class=\"btn-back\">{{ 'post.back' | translate }}</button>"
    ),
    (
        ">Back\n      </button>",
        ">{{ 'common.back' | translate }}\n      </button>"
    ),
    (
        "<span>{{ showTranslation ? 'Showing translation' : 'Translate this post' }}</span>",
        "<span>{{ (showTranslation ? 'post.showingTranslation' : 'post.translatePost') | translate }}</span>"
    ),
    (
        "<span>{{ isTranslating ? 'Translating...' : (showTranslation ? 'Show Original' : 'Translate') }}</span>",
        "<span>{{ (isTranslating ? 'post.translating' : (showTranslation ? 'post.showOriginal' : 'post.translate')) | translate }}</span>"
    ),
    (
        "<span>Translated to {{ flagService.getLanguageName(selectedTranslationLanguage) }}</span>",
        "<span>{{ 'post.translatedTo' | translate }} {{ flagService.getLanguageName(selectedTranslationLanguage) }}</span>"
    ),
    (
        "· from\n            <img",
        "· {{ 'post.from' | translate }}\n            <img"
    ),
    (
        "<span class=\"comment-count\">{{ post.comments_count }} comments</span>",
        "<span class=\"comment-count\">{{ post.comments_count }} {{ 'post.comments' | translate }}</span>"
    ),
]
count = 0
for old, new in pd_replacements:
    if old in pd:
        pd = pd.replace(old, new)
        count += 1
    else:
        print(f"POST-DETAIL NOT FOUND: {old[:70]!r}")
with open(pd_path, "w", encoding="utf-8") as f:
    f.write(pd)
print(f"post-detail: {count} replacements")
