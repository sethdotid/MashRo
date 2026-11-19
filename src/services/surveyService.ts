import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { StoredSurveyResponse, SurveyDraft } from '../types/survey';
import { buildFirestorePayload } from '../utils/surveyLogic';

const COLLECTION_RESPONSES = 'survey_responses';
const COLLECTION_OWNER_SETTINGS = 'owner_settings';
const GOOGLE_FORMS_DOC_ID = 'google_forms';

export interface OwnerGoogleFormConfig {
  formId: string;
  formTitle: string;
  responderUri: string;
  updatedAtMs?: number;
}

export async function submitSurveyResponse(draft: SurveyDraft): Promise<string> {
  const newDocRef = doc(collection(db, COLLECTION_RESPONSES));
  const payload = buildFirestorePayload(draft);
  try {
    await setDoc(newDocRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_RESPONSES}/${newDocRef.id}`);
  }
}

export async function fetchSurveyResponses(): Promise<StoredSurveyResponse[]> {
  try {
    const q = query(collection(db, COLLECTION_RESPONSES), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      return {
        id: docSnap.id,
        createdAtMs: createdAt,
        source: data.source,
        hasTasted: data.hasTasted,
        activity: data.activity,
        activityOther: data.activityOther,
        hasOrdered: data.hasOrdered,
        ratingCassava: data.ratingCassava,
        ratingChicken: data.ratingChicken,
        ratingPumpkinSauce: data.ratingPumpkinSauce,
        ratingVegetables: data.ratingVegetables,
        ratingAroma: data.ratingAroma,
        ratingTexture: data.ratingTexture,
        ratingVisual: data.ratingVisual,
        ratingFlavorCombo: data.ratingFlavorCombo,
        ratingPortion: data.ratingPortion,
        ratingIngredientCombo: data.ratingIngredientCombo,
        satietyLevel: data.satietyLevel,
        ratingPackPracticality: data.ratingPackPracticality,
        ratingPackStrength: data.ratingPackStrength,
        ratingLeakResistance: data.ratingLeakResistance,
        ratingEaseOfOpening: data.ratingEaseOfOpening,
        ratingEatingConvenience: data.ratingEatingConvenience,
        priceReasonable: data.priceReasonable,
        purchaseLikelihood: data.purchaseLikelihood,
        purchaseFrequency: data.purchaseFrequency,
        repurchaseIntention: data.repurchaseIntention,
        preOrderEase: data.preOrderEase,
        preOrderResponsiveness: data.preOrderResponsiveness,
        preOrderAccuracy: data.preOrderAccuracy,
        preOrderPunctuality: data.preOrderPunctuality,
        overallSatisfaction: data.overallSatisfaction,
        recommendScore: data.recommendScore,
        favoriteComponents: Array.isArray(data.favoriteComponents) ? data.favoriteComponents : [],
        feedbackNotes: data.feedbackNotes,
      } as StoredSurveyResponse;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_RESPONSES);
  }
}

export async function deleteSurveyResponse(responseId: string): Promise<void> {
  const path = `${COLLECTION_RESPONSES}/${responseId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_RESPONSES, responseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadOwnerGoogleFormConfig(): Promise<OwnerGoogleFormConfig | null> {
  const path = `${COLLECTION_OWNER_SETTINGS}/${GOOGLE_FORMS_DOC_ID}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_OWNER_SETTINGS, GOOGLE_FORMS_DOC_ID));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      formId: String(data.formId ?? ''),
      formTitle: String(data.formTitle ?? ''),
      responderUri: String(data.responderUri ?? ''),
      updatedAtMs: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveOwnerGoogleFormConfig(config: OwnerGoogleFormConfig): Promise<void> {
  const path = `${COLLECTION_OWNER_SETTINGS}/${GOOGLE_FORMS_DOC_ID}`;
  try {
    await setDoc(doc(db, COLLECTION_OWNER_SETTINGS, GOOGLE_FORMS_DOC_ID), {
      formId: config.formId.trim().slice(0, 128),
      formTitle: config.formTitle.trim().slice(0, 200),
      responderUri: config.responderUri.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
