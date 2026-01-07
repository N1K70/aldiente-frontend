export interface Rating {
  id: string;
  appointment_id: string;
  from_user_id: string;
  to_user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  from_user_email?: string;
}

export interface RatingStats {
  average_rating: number;
  total_ratings: number;
}

export interface CreateRatingRequest {
  appointmentId: string;
  toUserId: string;
  rating: number;
  comment?: string;
}
