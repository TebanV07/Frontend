"""Apply translate pipe to settings.component.html"""
import re

path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\features\settings\settings.component.html"

with open(path, encoding="utf-8") as f:
    content = f.read()

replacements = [
    # Delete modal
    (
        "¿Eliminar tu cuenta?",
        "{{ 'settings.deleteModal.title' | translate }}"
    ),
    (
        "Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos tus datos, publicaciones y videos en un plazo de 30 días.",
        "{{ 'settings.deleteModal.body' | translate }}"
    ),
    (
        ">Confirma tu contraseña para continuar<",
        ">{{ 'settings.deleteModal.confirmLabel' | translate }}<"
    ),
    (
        "<span *ngIf=\"!isDeletingAccount\">Sí, eliminar mi cuenta</span>",
        "<span *ngIf=\"!isDeletingAccount\">{{ 'settings.deleteModal.confirmBtn' | translate }}</span>"
    ),
    # cancel button in delete modal
    (
        ">Cancelar\n        </button>",
        ">{{ 'common.cancel' | translate }}\n        </button>"
    ),
    # Header title
    (
        "Configuración\n    </h1>",
        "{{ 'settings.title' | translate }}\n    </h1>"
    ),
    # Nav tabs
    (
        "Perfil\n      </button>",
        "{{ 'settings.nav.profile' | translate }}\n      </button>"
    ),
    (
        "Cuenta\n      </button>",
        "{{ 'settings.nav.account' | translate }}\n      </button>"
    ),
    (
        "Notificaciones\n      </button>",
        "{{ 'settings.nav.notifications' | translate }}\n      </button>"
    ),
    (
        "Privacidad\n      </button>",
        "{{ 'settings.nav.privacy' | translate }}\n      </button>"
    ),
    (
        "Cerrar sesión\n      </button>",
        "{{ 'settings.nav.logout' | translate }}\n      </button>"
    ),
    # Toast
    (
        "Cambios guardados correctamente",
        "{{ 'settings.saved' | translate }}"
    ),
    # Profile tab
    (
        "<h2>Editar perfil</h2>",
        "<h2>{{ 'settings.profile.title' | translate }}</h2>"
    ),
    (
        'title="Cambiar foto"',
        '[title]="\'settings.profile.savePhoto\' | translate"'
    ),
    (
        ">JPG, PNG o WebP · Máx 5MB<",
        ">{{ 'settings.profile.avatarHint' | translate }}<"
    ),
    (
        "<span *ngIf=\"!isUploadingAvatar\">Guardar foto</span>",
        "<span *ngIf=\"!isUploadingAvatar\">{{ 'settings.profile.savePhoto' | translate }}</span>"
    ),
    # Form labels
    (
        ">Nombre<",
        ">{{ 'settings.profile.firstName' | translate }}<"
    ),
    (
        ">Apellido<",
        ">{{ 'settings.profile.lastName' | translate }}<"
    ),
    (
        ">Biografía<",
        ">{{ 'settings.profile.bio' | translate }}<"
    ),
    (
        'placeholder="Cuéntanos algo sobre ti..."',
        "[placeholder]=\"'settings.profile.bioPlaceholder' | translate\""
    ),
    (
        ">Sitio web<",
        ">{{ 'settings.profile.website' | translate }}<"
    ),
    (
        'placeholder="https://tu-sitio.com"',
        "[placeholder]=\"'settings.profile.websitePlaceholder' | translate\""
    ),
    (
        ">Ubicación<",
        ">{{ 'settings.profile.location' | translate }}<"
    ),
    (
        'placeholder="Ciudad, País"',
        "[placeholder]=\"'settings.profile.locationPlaceholder' | translate\""
    ),
    (
        ">Idioma nativo<",
        ">{{ 'settings.profile.nativeLanguage' | translate }}<"
    ),
    (
        "<span *ngIf=\"!isSaving\">Guardar cambios</span>",
        "<span *ngIf=\"!isSaving\">{{ 'settings.profile.saveChanges' | translate }}</span>"
    ),
    # Account tab
    (
        "<h2>Cuenta</h2>",
        "<h2>{{ 'settings.account.title' | translate }}</h2>"
    ),
    (
        ">Email<",
        ">{{ 'settings.account.email' | translate }}<"
    ),
    (
        ">Username<",
        ">{{ 'settings.account.username' | translate }}<"
    ),
    (
        ">Cuenta verificada<",
        ">{{ 'settings.account.verified' | translate }}<"
    ),
    (
        "? 'Verificada' : 'No verificada'",
        "? ('settings.account.verifiedYes' | translate) : ('settings.account.verifiedNo' | translate)"
    ),
    (
        "<h3>Cambiar contraseña</h3>",
        "<h3>{{ 'settings.account.changePassword' | translate }}</h3>"
    ),
    (
        ">Contraseña actual<",
        ">{{ 'settings.account.currentPassword' | translate }}<"
    ),
    (
        ">Nueva contraseña<",
        ">{{ 'settings.account.newPassword' | translate }}<"
    ),
    (
        ">Confirmar nueva contraseña<",
        ">{{ 'settings.account.confirmPassword' | translate }}<"
    ),
    (
        "<span *ngIf=\"!isSaving\">Cambiar contraseña</span>",
        "<span *ngIf=\"!isSaving\">{{ 'settings.account.changePassword' | translate }}</span>"
    ),
    # Danger zone
    (
        "<h3>Zona de peligro</h3>",
        "<h3>{{ 'settings.account.dangerZone' | translate }}</h3>"
    ),
    (
        "<p>Estas acciones son permanentes y no se pueden deshacer.</p>",
        "<p>{{ 'settings.account.dangerDesc' | translate }}</p>"
    ),
    (
        ">Eliminar cuenta\n              <",
        ">{{ 'settings.account.deleteAccount' | translate }}\n              <"
    ),
    (
        "<span class=\"danger-desc\">Elimina permanentemente tu cuenta, publicaciones y todos tus datos personales conforme a la LOPDP.</span>",
        "<span class=\"danger-desc\">{{ 'settings.account.deleteDesc' | translate }}</span>"
    ),
    (
        ">Eliminar cuenta\n              </button>",
        ">{{ 'settings.account.deleteAccount' | translate }}\n              </button>"
    ),
    # Notifications tab
    (
        "<h2>Notificaciones</h2>",
        "<h2>{{ 'settings.notifications.title' | translate }}</h2>"
    ),
    (
        ">Notificaciones push<",
        ">{{ 'settings.notifications.push' | translate }}<"
    ),
    (
        ">Recibe alertas de actividad en la app<",
        ">{{ 'settings.notifications.pushDesc' | translate }}<"
    ),
    (
        ">Notificaciones por email<",
        ">{{ 'settings.notifications.email' | translate }}<"
    ),
    (
        ">Recibe un resumen semanal y alertas importantes<",
        ">{{ 'settings.notifications.emailDesc' | translate }}<"
    ),
    # Privacy tab
    (
        "<h2>Privacidad y preferencias</h2>",
        "<h2>{{ 'settings.privacy.title' | translate }}</h2>"
    ),
    (
        ">Cuenta privada<",
        ">{{ 'settings.privacy.privateAccount' | translate }}<"
    ),
    (
        ">Solo tus seguidores pueden ver tu contenido<",
        ">{{ 'settings.privacy.privateDesc' | translate }}<"
    ),
    (
        ">Traducción automática<",
        ">{{ 'settings.privacy.autoTranslate' | translate }}<"
    ),
    (
        ">Traduce automáticamente el contenido de otros idiomas<",
        ">{{ 'settings.privacy.autoTranslateDesc' | translate }}<"
    ),
    (
        ">Idioma de traducción preferido<",
        ">{{ 'settings.privacy.prefLang' | translate }}<"
    ),
    (
        ">Mismo que el nativo<",
        ">{{ 'settings.privacy.prefLangDefault' | translate }}<"
    ),
    (
        ">Tema<",
        ">{{ 'settings.privacy.theme' | translate }}<"
    ),
    (
        ">Automático<",
        ">{{ 'settings.privacy.themeAuto' | translate }}<"
    ),
    (
        ">Oscuro<",
        ">{{ 'settings.privacy.themeDark' | translate }}<"
    ),
    (
        ">Claro<",
        ">{{ 'settings.privacy.themeLight' | translate }}<"
    ),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"NOT FOUND: {old[:60]!r}")

# "Guardar" save buttons (multiple) - replace remaining ones
content = re.sub(r'(<span \*ngIf="!isSaving">)Guardar(</span>)', r"\1{{ 'common.save' | translate }}\2", content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Done - {count} replacements applied")
