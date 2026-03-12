"""Apply translate pipe to notifications HTML files"""

# notifications-page.component.html
page_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\settings\notifications-page\notifications-page.component.html"
with open(page_path, encoding="utf-8") as f:
    page = f.read()

page_replacements = [
    ("<h1>Notificaciones</h1>", "<h1>{{ 'notifications.title' | translate }}</h1>"),
    ("Marcar todo como leído", "{{ 'notifications.markAllRead' | translate }}"),
    (">Limpiar todo\n      </button>", ">{{ 'notifications.clearAll' | translate }}\n      </button>"),
    (">Todas\n      <span", ">{{ 'notifications.filterAll' | translate }}\n      <span"),
    (">Sin leer\n      <span", ">{{ 'notifications.filterUnread' | translate }}\n      <span"),
    ("<p>Cargando notificaciones...</p>", "<p>{{ 'notifications.loading' | translate }}</p>"),
    (
        "<h3>{{ filter === 'unread' ? 'Sin notificaciones sin leer' : 'No tienes notificaciones' }}</h3>",
        "<h3>{{ (filter === 'unread' ? 'notifications.emptyUnread' : 'notifications.emptyAll') | translate }}</h3>"
    ),
    (
        "<p>{{ filter === 'unread' ? 'Estás al día con todo' : 'Vuelve pronto para nuevas notificaciones' }}</p>",
        "<p>{{ (filter === 'unread' ? 'notifications.emptyUnreadSub' : 'notifications.emptyAllSub') | translate }}</p>"
    ),
    (
        "<span *ngIf=\"!notification.is_read\" class=\"unread-badge\">Nuevo</span>",
        "<span *ngIf=\"!notification.is_read\" class=\"unread-badge\">{{ 'notifications.new' | translate }}</span>"
    ),
    (
        "\"notification.is_read ? 'Marcar como no leído' : 'Marcar como leído'\"",
        "\"(notification.is_read ? 'notifications.markUnread' : 'notifications.markRead') | translate\""
    ),
    (
        'title="Eliminar"\n            (click)="deleteNotification',
        '[title]="\'notifications.delete\' | translate"\n            (click)="deleteNotification'
    ),
    (">&#8592; Anterior", ">&#8592; {{ 'common.back' | translate }}"),
]

count = 0
for old, new in page_replacements:
    if old in page:
        page = page.replace(old, new)
        count += 1
    else:
        print(f"PAGE NOT FOUND: {old[:70]!r}")

with open(page_path, "w", encoding="utf-8") as f:
    f.write(page)
print(f"notifications-page: {count} replacements")

# notifications.component.html (dropdown)
notif_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\shared\components\notifications\notifications.component.html"
with open(notif_path, encoding="utf-8") as f:
    notif = f.read()

notif_replacements = [
    ("<h3>Notificaciones</h3>", "<h3>{{ 'notifications.title' | translate }}</h3>"),
    (
        "{{ isMarkingAsRead ? 'Marcando...' : 'Marcar todo como leído' }}",
        "{{ (isMarkingAsRead ? 'notifications.markingAllRead' : 'notifications.markAllRead') | translate }}"
    ),
    (
        ">Limpiar todo\n      </button>",
        ">{{ 'notifications.clearAll' | translate }}\n      </button>"
    ),
    (
        "<p>No tienes notificaciones</p>",
        "<p>{{ 'notifications.emptyAll' | translate }}</p>"
    ),
    (
        "<p>Cargando...</p>",
        "<p>{{ 'common.loading' | translate }}</p>"
    ),
    (
        "\"notification.is_read ? 'Marcar como no leído' : 'Marcar como leído'\"",
        "\"(notification.is_read ? 'notifications.markUnread' : 'notifications.markRead') | translate\""
    ),
    (
        'title="Eliminar"\n              (click)="deleteNotification',
        '[title]="\'notifications.delete\' | translate"\n              (click)="deleteNotification'
    ),
]

count2 = 0
for old, new in notif_replacements:
    if old in notif:
        notif = notif.replace(old, new)
        count2 += 1
    else:
        print(f"NOTIF NOT FOUND: {old[:70]!r}")

with open(notif_path, "w", encoding="utf-8") as f:
    f.write(notif)
print(f"notifications: {count2} replacements")
