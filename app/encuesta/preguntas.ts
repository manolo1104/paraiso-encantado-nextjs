/**
 * Las preguntas de la encuesta, en un solo lugar para poder cambiarlas sin tocar
 * la página.
 *
 * Criterio para que una pregunta entre aquí: **que su respuesta te haga hacer
 * algo distinto mañana.** "¿Te gustó el hotel?" no cambia nada; "¿salió agua
 * caliente?" manda a un plomero. Por eso quedaron fuera las genéricas de
 * cuestionario de hotel y entraron las que tocan la operación real de Xilitla:
 * llegar por la sierra, el agua caliente, la señal, el spa privado y el tour.
 *
 * Regla de tamaño: si pasa de un minuto, la gente la abandona a la mitad y te
 * quedas sin el dato. Si agregas una pregunta, quita otra.
 */

export interface PreguntaEscala {
  key: string;
  label: string;
  /** Se muestra debajo, para que el huésped sepa qué estamos preguntando */
  hint?: string;
  /** Solo aplica a algunos huéspedes; se puede saltar sin culpa */
  opcional?: boolean;
}

export const ESCALAS: PreguntaEscala[] = [
  {
    key: 'limpieza',
    label: 'Limpieza de la suite',
    hint: 'Al llegar y durante la estancia',
  },
  {
    key: 'agua',
    label: 'Agua caliente y presión de la regadera',
    hint: 'Es lo que más se rompe y lo que menos nos dicen en persona',
  },
  {
    key: 'descanso',
    label: 'Descanso: cama, ruido y temperatura',
  },
  {
    key: 'desayuno',
    label: 'Desayuno en El Papán Huasteco',
  },
  {
    key: 'atencion',
    label: 'Atención del personal',
    hint: 'Desde el WhatsApp antes de llegar hasta el check-out',
  },
  {
    key: 'spa',
    label: 'Tu piscina spa privada',
    hint: 'Solo si tu suite tenía una',
    opcional: true,
  },
];

/** Pregunta condicional: solo se califica al guía si sí tomó tour. */
export const TOUR = {
  key: 'tour',
  pregunta: '¿Tomaste algún tour con nosotros?',
  siLabel: 'Sí',
  noLabel: 'No',
  escalaLabel: '¿Cómo estuvo el guía?',
};

/**
 * Llegar a Xilitla es parte de la experiencia y es donde más se pierde gente:
 * carretera de sierra, poca señal y un camino de terracería al final.
 */
export const LLEGADA = {
  key: 'llegada',
  pregunta: '¿Te costó trabajo llegar al hotel?',
  opciones: ['Sin problema', 'Un poco', 'Me perdí'],
};

export const ABIERTA = {
  label: '¿Qué te faltó o qué cambiarías?',
  placeholder: 'Aquí es donde de verdad aprendemos. Aunque sea una línea.',
};

/** NPS clásico: la única cifra que sirve para comparar mes contra mes. */
export const NPS = {
  pregunta: '¿Qué tan probable es que nos recomiendes?',
  minLabel: 'Nada probable',
  maxLabel: 'Segurísimo',
};
