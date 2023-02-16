import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NotFound from './NotFound';
import { getUser } from '../api/NFTeamApi';
import { Item } from './CollectionDetails';
import { useState } from 'react';
import ItemCard from '../components/ItemCard';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import useApiPrivate from '../hooks/useApiPrivate';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

export interface Member {
  memberId: number;
  bannerImageName: string;
  profileImageName: string;
  nickname: string;
  description: string;
}

interface Profile {
  member: Member;
  items: Item[];
}

export default function Account() {
  const { userId } = useParams();
  const myId = localStorage.getItem('id');
  const [items, setItems] = useState<Item[] | undefined>();
  const [user, setUser] = useState<Member | undefined>();

  const { isLoading, data } = useQuery<Profile>({
    queryKey: ['members', userId],
    queryFn: () => getUser(userId!),
    onSuccess: (data) => {
      setUser(data.member);
      if (data.items?.length) {
        setItems(data.items);
      }
    },
  });

  const queryClient = useQueryClient();
  const apiPrivate = useApiPrivate();

  const { mutate } = useMutation({
    mutationFn: () => apiPrivate.delete(`api/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['members', userId]);
      window.localStorage.clear();
      window.location.replace('/');
    },
    onError: (err: AxiosError) => {
      if (err.response?.status !== 403) {
        toast.error('Something went wrong: ' + err.message);
      }
    },
  });

  if (isLoading) return <p>Loading...</p>;

  if (!data) return <NotFound />;

  return (
    <div className='space-y-10'>
      <section className='relative h-[300px]'>
        <img
          src={
            user?.bannerImageName ||
            import.meta.env.VITE_IMAGE_URL + user?.bannerImageName
          }
          alt='User banner'
          className='w-full h-full object-cover'
        />
        <img
          src={user?.profileImageName}
          alt='User logo'
          className='rounded-full object-cover absolute -bottom-5 border-[6px] shadow-lg border-white left-8 w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44'
        />
      </section>

      <section className='space-y-2 flex px-8'>
        <article className='space-y-2 flex-1'>
          <h1 className='font-bold text-3xl'>{user?.nickname}</h1>
          <p>{user?.description}</p>
        </article>
        <article className='relative'>
          <button
            className={`${myId === userId ? 'inline-flex' : 'hidden'} dots`}
          >
            <BiDotsVerticalRounded className='w-6 h-6' />
          </button>
          <div className='dots-dropdown flex flex-col w-32 absolute top-6 right-3 bg-white rounded-md'>
            <Link
              to={'/account/profile'}
              className='hover:bg-gray-200 p-2 dots-link cursor-pointer'
            >
              Edit profile
            </Link>
            <button
              onClick={() => mutate()}
              className='hover:bg-gray-200 p-2 cursor-pointer'
            >
              Remove profile
            </button>
          </div>
        </article>
      </section>

      <section className='grid mb-5 grid-cols-1 md:grid-cols-3 gap-5 xl:grid-cols-5 p-8'>
        {items?.map((item) => (
          <ItemCard
            key={item.itemId}
            itemId={item.itemId}
            ownerId={item.ownerId}
            itemImageName={item.itemImageName}
            itemName={item.itemName}
            itemPrice={item.itemPrice}
            coinName={item.coinName}
            coinImage={item.coinImage}
            collectionName={item.collectionName}
          />
        ))}
      </section>
    </div>
  );
}