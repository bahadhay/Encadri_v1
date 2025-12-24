export interface Evaluation {
  id: string;
  projectId: string;
  evaluatorEmail: string;
  evaluatorName?: string;
  reportQualityScore?: number;
  technicalImplementationScore?: number;
  presentationScore?: number;
  professionalConductScore?: number;
  finalGrade?: number;
  comments?: string;
  defenseDate?: string;
  createdDate?: string;
  updatedDate?: string;
}
