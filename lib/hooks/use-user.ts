import useSWR from 'swr';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUser() {
  const { data: user, error, isLoading } = useSWR<User>('/api/user', fetcher);

  return {
    user,
    isLoading,
    isError: error
  };
}