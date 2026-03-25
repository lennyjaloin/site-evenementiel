import { z } from 'zod';

// ========================================
// AUTH
// ========================================

export const registerSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide")
    .max(120, "Email trop long (max 120 caracteres)"),
  password: z
    .string({ required_error: "Le mot de passe est obligatoire" })
    .min(6, "Le mot de passe doit faire au moins 6 caracteres")
    .max(100, "Mot de passe trop long"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide"),
  password: z
    .string({ required_error: "Le mot de passe est obligatoire" })
    .min(1, "Le mot de passe est obligatoire"),
});

// ========================================
// EVENTS
// ========================================

export const createEventSchema = z.object({
  title: z
    .string({ required_error: "Le titre est obligatoire" })
    .min(1, "Le titre ne peut pas etre vide")
    .max(150, "Titre trop long (max 150 caracteres)"),
  description: z
    .string({ required_error: "La description est obligatoire" })
    .min(1, "La description ne peut pas etre vide"),
  location: z
    .string()
    .max(180, "Lieu trop long (max 180 caracteres)")
    .nullable()
    .optional(),
  date_start: z
    .string()
    .nullable()
    .optional(),
  date_end: z
    .string()
    .nullable()
    .optional(),
  capacity: z
    .number()
    .int("La capacite doit etre un nombre entier")
    .min(1, "La capacite doit etre au moins 1")
    .nullable()
    .optional(),
  image_url: z
    .string()
    .url("URL d'image invalide")
    .max(255, "URL trop longue")
    .nullable()
    .optional(),
  is_public: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional()
    .default(1),
});

export const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre ne peut pas etre vide")
    .max(150, "Titre trop long")
    .optional(),
  description: z
    .string()
    .min(1, "La description ne peut pas etre vide")
    .optional(),
  location: z
    .string()
    .max(180)
    .nullable()
    .optional(),
  date_start: z
    .string()
    .nullable()
    .optional(),
  date_end: z
    .string()
    .nullable()
    .optional(),
  capacity: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  image_url: z
    .string()
    .url()
    .max(255)
    .nullable()
    .optional(),
  is_public: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional(),
});

// ========================================
// RESERVATIONS
// ========================================

export const createReservationSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int("L'ID doit etre un entier")
    .positive("L'ID doit etre positif"),
  // On accepte aussi eventId (alias frontend)
  eventId: z
    .number()
    .int()
    .positive()
    .optional(),
  nom: z
    .string({ required_error: "Le nom est obligatoire" })
    .min(1, "Le nom ne peut pas etre vide")
    .max(80, "Nom trop long (max 80 caracteres)"),
  prenom: z
    .string({ required_error: "Le prenom est obligatoire" })
    .min(1, "Le prenom ne peut pas etre vide")
    .max(80, "Prenom trop long (max 80 caracteres)"),
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .email("Format d'email invalide")
    .max(120, "Email trop long"),
}).refine(
  (data) => data.event_id || data.eventId,
  { message: "event_id ou eventId est obligatoire" }
);

// ========================================
// INSCRIPTIONS
// ========================================

export const createInscriptionSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int()
    .positive(),
});

// ========================================
// PAYMENTS
// ========================================

export const createPaymentSchema = z.object({
  event_id: z
    .number({ required_error: "L'ID de l'evenement est obligatoire" })
    .int()
    .positive(),
  amount: z
    .number({ required_error: "Le montant est obligatoire" })
    .positive("Le montant doit etre positif"),
});
