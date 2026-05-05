export const TRAINING_SCENARIOS = [
  {
    id: 'saludo-inicial',
    title: 'Primer contacto orientado a reserva',
    userId: 'train-user-1@local',
    userName: 'Carlos',
    steps: [
      {
        user: 'Hola, quiero info del hotel',
        expectAll: ['edward james|las pozas', 'check-?in|check-?out|fechas', 'huesped(?:es)?|hu[eé]sped(?:es)?|persona(?:s)?'],
        expectAny: ['check-?in.*check-?out', 'fechas.*huesped', 'fechas.*persona'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'tours-basico',
    title: 'Consulta de tours con destinos',
    userId: 'train-user-2@local',
    userName: 'Andrea',
    steps: [
      {
        user: '¿Qué tours tienen?',
        expectAll: ['tour', 'destino|incluye|cascada|edward james|tamul', 'https?://'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'escalacion-humano',
    title: 'Escalación cuando piden persona',
    userId: 'train-user-3@local',
    userName: 'Luis',
    steps: [
      {
        user: 'Quiero hablar con una persona',
        expectAny: ['te comunico con nuestro equipo', 'en breve te contactan', 'te atiende una persona'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'politicas-ninos',
    title: 'Política de menores de 6 años',
    userId: 'train-user-4@local',
    userName: 'Mariana',
    steps: [
      {
        user: 'Voy con 2 adultos y un niño de 5 años, ¿cómo cuentan los niños?',
        expectAll: ['menor(?:es)? de 6|menos de 6', 'no cuentan|gratuito|gratis|sin cargo'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'reserva-solicita-folio',
    title: 'Consulta de reserva exige folio',
    userId: 'train-user-5@local',
    userName: 'Covarrubias',
    steps: [
      {
        user: 'me puedes dar los datlles de mi reserva?',
        expectAll: ['folio', 'wa-[a-z0-9]{4,}|wa-xxxxxxxx|wa-'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'cambio-huespedes-post-confirmacion',
    title: 'Ajuste de precio al agregar huéspedes',
    userId: 'train-user-6@local',
    userName: 'Sofía',
    steps: [
      {
        user: 'Ya tengo reserva confirmada para 2 personas y quiero agregar 1 huésped más, ¿cambia el precio?',
        expectAll: ['cambia el precio|cambio de precio|cambia la tarifa|ajuste de tarifa', '3.?4 personas|3 o más huéspedes|3-4 personas|tarifa de 3', 'folio'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'precio-discrepancia-externa',
    title: 'Cliente dice que vio precio más barato',
    userId: 'train-user-7@local',
    userName: 'Jorge',
    steps: [
      {
        user: 'En otra página vi la habitación más barata, ¿me respetas ese precio?',
        expectAll: ['precio oficial', 'equipo|humano|persona'],
        forbid: ['\\*\\*', 'te lo respeto', 'te la dejo']
      }
    ]
  },
  {
    id: 'mascotas-no-permitidas',
    title: 'Cliente quiere llevar mascota',
    userId: 'train-user-8@local',
    userName: 'Fer',
    steps: [
      {
        user: '¿Puedo llevar a mi perrito?',
        expectAll: ['mascotas', 'no permitidas|no se permiten|no admitimos'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'movilidad-reducida',
    title: 'Recomendación para adultos mayores',
    userId: 'train-user-9@local',
    userName: 'Patricia',
    steps: [
      {
        user: 'Voy con mi mamá y no puede subir escaleras, ¿qué habitación recomiendas?',
        expectAll: ['bromelias 1|bromelias', 'sin escaleras|planta baja|fácil acceso|movilidad reducida'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'desayuno-grupo-menor-minimo',
    title: 'Grupo menor al mínimo para desayuno grupal',
    userId: 'train-user-10@local',
    userName: 'Laura',
    steps: [
      {
        user: 'Somos 18 personas, ¿pueden darnos desayuno buffet?',
        expectAll: ['30 personas o más|30 personas|mínimo 30', 'equipo|opciones|revisar'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'cena-grupal-anticipo',
    title: 'Cena grupal con anticipo',
    userId: 'train-user-11@local',
    userName: 'Ricardo',
    steps: [
      {
        user: 'Somos 40 personas y queremos cena, ¿qué opciones manejan?',
        expectAll: ['50%|50 por ciento|anticipo', '30 personas o más|mínimo 30|40 personas', 'antojitos|tacos de cecina|enchiladas|ensalada'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'hora-actual-hotel',
    title: 'Pregunta por la hora actual del hotel',
    userId: 'train-user-12@local',
    userName: 'Mónica',
    steps: [
      {
        user: '¿Qué hora es allá ahorita?',
        expectAny: ['\\b\\d{1,2}:\\d{2}\\b', 'a\\.m\\.|p\\.m\\.|am|pm'],
        forbid: ['\\*\\*']
      }
    ]
  },
  {
    id: 'fecha-ambigua',
    title: 'Cliente da fecha ambigua',
    userId: 'train-user-13@local',
    userName: 'Iván',
    steps: [
      {
        user: 'Quiero reservar para el puente de noviembre',
        expectAll: ['fecha|check-in|check-out'],
        forbid: ['\\*\\*', 'sí hay disponibilidad', 'te aparto']
      }
    ]
  },
  {
    id: 'dos-opciones-reserva',
    title: 'Cliente quiere reservar y deben mostrarse ambas opciones',
    userId: 'train-user-14@local',
    userName: 'Ana',
    steps: [
      {
        user: 'Quiero reservar con ustedes por WhatsApp',
        expectAll: ['opción 1|whatsapp', 'opción 2|motor', 'https?://paraisoencantado\\.com/reservar'],
        forbid: ['\\*\\*']
      }
    ]  },

  // ── FLUJOS MULTI-TURNO ────────────────────────────────────

  {
    id: 'flujo-disponibilidad-hoy',
    title: 'Flujo: disponibilidad hoy → checkout mañana → mostrar opciones',
    userId: 'train-user-15@local',
    userName: 'Covarrubias',
    steps: [
      {
        user: 'tienen habitaciones disponibles para hoy? somos 2 personas',
        expectAll: ['check-?out|salida|cu[aá]ndo|noches|fecha'],
        forbid: ['\\*\\*', 'sí hay disponibilidad', 'todas disponibles']
      },
      {
        user: 'mañana, solo 1 noche',
        expectAny: ['disponible', 'suite|habitaci[oó]n', 'precio|mxn'],
        forbid: ['\\*\\*']
      }
    ]
  },

  {
    id: 'flujo-folio-pegado',
    title: 'Flujo: cliente pega confirmación completa → bot intenta buscar folio',
    userId: 'train-user-16@local',
    userName: 'Covarrubias',
    steps: [
      {
        user: 'Tengo esta reserva: \ud83e\uddfe Folio de reserva: WA-MNSK76FL\nCheck-in: sábado, 25 de abril de 2026\nCheck-out: domingo, 26 de abril de 2026\nHabitación: Suite LindaVista (2 huéspedes)',
        expectAny: ['wa-mnsk76fl|folio', 'no encontramos|no existe|revisar|equipo|lindavista'],
        forbid: ['\\*\\*']
      }
    ]
  },

  {
    id: 'flujo-agregar-persona-post-confirmacion',
    title: 'Flujo: reserva confirmada → quiere agregar persona → informa cambio de tarifa',
    userId: 'train-user-17@local',
    userName: 'Covarrubias',
    steps: [
      {
        user: 'Ya tengo reserva confirmada para 2 personas y quiero agregar 1 huésped más, cambia el precio?',
        expectAll: ['tarifa|precio|cambia', '3.?4 personas|tres|3.?4|tarifa de 3'],
        forbid: ['\\*\\*']
      }
    ]
  },

  {
    id: 'flujo-tours-persona-extra',
    title: 'Flujo: ajuste de tours con persona extra → pide folio',
    userId: 'train-user-18@local',
    userName: 'Covarrubias',
    steps: [
      {
        user: 'También para los tours quiero agregar una persona extra',
        expectAll: ['tour', 'folio|reserva|ajust']
      }
    ]  }
];
