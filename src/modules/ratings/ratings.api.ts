import { api } from '../../shared/api/ApiClient';
import { Rating, RatingStats, CreateRatingRequest } from './types';

export async function createRating(request: CreateRatingRequest): Promise<Rating> {
  const res = await api.post('/api/ratings', request);
  return res.data as Rating;
}

export async function getUserRatings(userId: string): Promise<Rating[]> {
  const res = await api.get(`/api/users/${userId}/ratings`);
  return res.data as Rating[];
}

export async function getUserRatingStats(userId: string): Promise<RatingStats> {
  const res = await api.get(`/api/users/${userId}/rating-average`);
  return res.data as RatingStats;
}
