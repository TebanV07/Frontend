"""Apply translate pipe to country-setup and permissions HTML files"""

# ============================
# country-setup.component.html
# ============================
cs_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\shared\components\country-setup\country-setup.component.html"
with open(cs_path, encoding="utf-8") as f:
    cs = f.read()

cs_replacements = [
    ("<h2>¿De dónde eres?</h2>", "<h2>{{ 'countrySetup.title' | translate }}</h2>"),
    (
        "<p>Tu bandera aparecerá en tus posts y mensajes para que la gente sepa de dónde eres.</p>",
        "<p>{{ 'countrySetup.subtitle' | translate }}</p>"
    ),
    (
        "<span>Detectando tu país...</span>",
        "<span>{{ 'countrySetup.detecting' | translate }}</span>"
    ),
    (
        "<span class=\"detection-label\">País detectado:</span>",
        "<span class=\"detection-label\">{{ 'countrySetup.detected' | translate }}</span>"
    ),
    (
        "<span>No pudimos detectar tu país automáticamente.</span>",
        "<span>{{ 'countrySetup.notDetected' | translate }}</span>"
    ),
    (
        "<label class=\"select-label\">Selecciona tu país:</label>",
        "<label class=\"select-label\">{{ 'countrySetup.manualSelect' | translate }}</label>"
    ),
    (
        '<option value="" disabled>-- Elige tu país --</option>',
        '<option value="" disabled>{{ \'countrySetup.manualPlaceholder\' | translate }}</option>'
    ),
    (
        "No es mi país — cambiar\n    </button>",
        "{{ 'countrySetup.notMyCountry' | translate }}\n    </button>"
    ),
    (
        "<span *ngIf=\"!isSaving\">✅ Confirmar</span>",
        "<span *ngIf=\"!isSaving\">{{ 'countrySetup.confirm' | translate }}</span>"
    ),
    (
        "<span *ngIf=\"isSaving\">Guardando...</span>",
        "<span *ngIf=\"isSaving\">{{ 'countrySetup.saving' | translate }}</span>"
    ),
]
count = 0
for old, new in cs_replacements:
    if old in cs:
        cs = cs.replace(old, new)
        count += 1
    else:
        print(f"COUNTRY-SETUP NOT FOUND: {old[:70]!r}")
with open(cs_path, "w", encoding="utf-8") as f:
    f.write(cs)
print(f"country-setup: {count} replacements")


# ============================
# permissions.component.html
# ============================
perm_path = r"c:\Users\Usuario\Desktop\Red_SocialIA\Frontend\src\app\shared\components\permissions\permissions.component.html"
with open(perm_path, encoding="utf-8") as f:
    perm = f.read()

perm_replacements = [
    # Welcome step
    (
        "<h1>Configurar Permisos</h1>",
        "<h1>{{ 'permissions.welcome.title' | translate }}</h1>"
    ),
    (
        "<p>\n        Para ofrecerte la mejor experiencia, necesitamos acceso a algunos permisos de tu dispositivo.\n      </p>",
        "<p>{{ 'permissions.welcome.subtitle' | translate }}</p>"
    ),
    (
        "<span class=\"feature-text\">Cámara para transmisiones en vivo</span>",
        "<span class=\"feature-text\">{{ 'permissions.welcome.camera' | translate }}</span>"
    ),
    (
        "<span class=\"feature-text\">Micrófono para videollamadas</span>",
        "<span class=\"feature-text\">{{ 'permissions.welcome.microphone' | translate }}</span>"
    ),
    (
        "<span class=\"feature-text\">Notificaciones de mensajes</span>",
        "<span class=\"feature-text\">{{ 'permissions.welcome.notifications' | translate }}</span>"
    ),
    (
        ">Configurar Luego\n        </button>",
        ">{{ 'permissions.welcome.later' | translate }}\n        </button>"
    ),
    (
        ">Continuar\n        </button>",
        ">{{ 'permissions.welcome.continue' | translate }}\n        </button>"
    ),
    # Permissions step
    (
        "<h1>Permisos Necesarios</h1>",
        "<h1>{{ 'permissions.list.title' | translate }}</h1>"
    ),
    (
        "<p>Haz clic en cada permiso para solicitarlo a tu dispositivo</p>",
        "<p>{{ 'permissions.list.subtitle' | translate }}</p>"
    ),
    (
        ">✓ Concedido\n            </span>",
        ">{{ 'permissions.list.granted' | translate }}\n            </span>"
    ),
    (
        ">⚠ Requerido\n            </span>",
        ">{{ 'permissions.list.required' | translate }}\n            </span>"
    ),
    (
        ">ℹ Opcional\n            </span>",
        ">{{ 'permissions.list.optional' | translate }}\n            </span>"
    ),
    (
        "{{ permission.granted ? 'Concedido' : 'Solicitar Acceso' }}",
        "{{ (permission.granted ? 'permissions.list.granted' : 'permissions.list.request') | translate }}"
    ),
    (
        ">Atrás\n      </button>",
        ">{{ 'permissions.list.back' | translate }}\n      </button>"
    ),
    (
        ">Solicitar Todos\n      </button>",
        ">{{ 'permissions.list.requestAll' | translate }}\n      </button>"
    ),
    # Complete step
    (
        "<h1>¡Configuración Completada!</h1>",
        "<h1>{{ 'permissions.complete.title' | translate }}</h1>"
    ),
    (
        "<p>Tus permisos han sido configurados correctamente.</p>",
        "<p>{{ 'permissions.complete.subtitle' | translate }}</p>"
    ),
    (
        "{{ permission.granted ? 'Concedido' : 'No concedido' }}",
        "{{ (permission.granted ? 'permissions.complete.grantedStatus' : 'permissions.complete.deniedStatus') | translate }}"
    ),
]
count = 0
for old, new in perm_replacements:
    if old in perm:
        perm = perm.replace(old, new)
        count += 1
    else:
        print(f"PERMISSIONS NOT FOUND: {old[:70]!r}")
with open(perm_path, "w", encoding="utf-8") as f:
    f.write(perm)
print(f"permissions: {count} replacements")
