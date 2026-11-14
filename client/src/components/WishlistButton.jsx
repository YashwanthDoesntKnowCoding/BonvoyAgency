import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function WishlistButton({ packageId, packageTitle = 'trip' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const wishlistQuery = useQuery({
    queryKey: ['wishlist', user?.user_id],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response.data.data;
    },
    enabled: Boolean(user),
    retry: false,
  });
  const items = wishlistQuery.data || [];
  const isSaved = items.some((item) => Number(item.packageId || item.package_id) === Number(packageId));

  useEffect(() => {
    if (wishlistQuery.isError) {
      toast.error(wishlistQuery.error.response?.data?.error?.message || 'Could not load your wishlist.');
    }
  }, [wishlistQuery.isError, wishlistQuery.error]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/wishlist/${packageId}`);
        return false;
      }
      await api.post('/wishlist', { packageId });
      return true;
    },
    onSuccess: async (added) => {
      await queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(added ? 'Trip saved to your wishlist.' : 'Trip removed from your wishlist.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Could not update your wishlist. Please try again.');
    },
  });

  const handleClick = () => {
    if (!user) {
      toast('Sign in to save trips to your wishlist.');
      navigate('/login');
      return;
    }
    mutation.mutate();
  };

  return (
    <button
      type="button"
      className={`wishlist-toggle${isSaved ? ' saved' : ''}`}
      aria-label={`${isSaved ? 'Remove' : 'Add'} ${packageTitle} ${isSaved ? 'from' : 'to'} wishlist`}
      aria-pressed={isSaved}
      disabled={mutation.isPending || (user && wishlistQuery.isLoading)}
      onClick={handleClick}
    >
      <span className="wishlist-heart" aria-hidden="true">{isSaved ? '♥' : '♡'}</span>
      {isSaved ? 'Saved' : 'Save trip'}
    </button>
  );
}
