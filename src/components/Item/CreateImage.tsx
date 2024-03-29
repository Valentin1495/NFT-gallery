import { useMutation } from '@tanstack/react-query';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { BsImage } from 'react-icons/bs';
import useApiPrivate from '../../hooks/useApiPrivate';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

interface Item {
  itemFile: File | null;
  setItemFile: React.Dispatch<React.SetStateAction<File | null>>;
  itemString: string;
  setItemString: React.Dispatch<React.SetStateAction<string>>;
  setItemName: React.Dispatch<React.SetStateAction<string>>;
}

export default function CreateImage({
  itemFile,
  setItemFile,
  itemString,
  setItemString,
  setItemName,
}: Item) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bannerTypeError, setBannerTypeError] = useState(false);
  const [bannerSizeError, setBannerSizeError] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.substring(0, 5) !== 'image') {
      setBannerTypeError(true);
    } else {
      setBannerTypeError(false);
    }

    if (file && file.size > 30000000) {
      setBannerSizeError(true);
    } else {
      setBannerSizeError(false);
    }

    if (
      file &&
      file.type.substring(0, 5) === 'image' &&
      file.size <= 30000000
    ) {
      setItemFile(file);
    }

    if (!file) {
      setItemFile(null);
    }
  };

  const apiPrivate = useApiPrivate();

  const { mutate, isLoading } = useMutation({
    mutationFn: (file: FormData) =>
      apiPrivate.post('/images', file).then((res) => res.data),
    onSuccess: (data) => {
      setItemName(data.imageName);
    },
    onError: (err: AxiosError) => {
      if (err.response?.status !== 403) {
        toast.error('Something went wrong: ' + err.message);
      }
    },
  });

  useEffect(() => {
    if (itemFile) {
      const formData = new FormData();
      formData.append('file', itemFile);

      mutate(formData);

      const reader = new FileReader();
      reader.readAsDataURL(itemFile);
      reader.onloadend = () => {
        setItemString(reader.result as string);
      };
    } else {
      setItemString('');
    }
  }, [itemFile, setItemString, mutate]);

  return (
    <form className='flex flex-col items-center w-1/2'>
      <h3 className='font-bold text-lg'>
        Item image{' '}
        <span className='text-red-500 text-xl font-bold align-top'>*</span>
      </h3>
      <input
        type='file'
        className='hidden'
        ref={fileInputRef}
        accept='image/*'
        onChange={handleChange}
      />
      {itemString ? (
        <img
          src={itemString}
          alt='logo'
          role='presentation'
          className='h-60 w-full rounded-xl object-cover mt-3 cursor-pointer'
          onClick={() => setItemFile(null)}
        />
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className='group relative border-2 border-gray-400 border-dashed mt-3 w-full h-60 rounded-xl'
        >
          <BsImage className='h-20 w-20 text-gray-400  absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2' />
          <div className='rounded-xl bg-black/60 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 hidden group-hover:block' />
        </button>
      )}
      {isLoading && (
        <h5
          className='mt-3
        font-bold text-gray-500'
        >
          Uploading a item image...
        </h5>
      )}
      {bannerTypeError && (
        <div className='mt-3 text-center'>
          <h5 className='font-bold text-gray-500'>Unsupported file type</h5>
          <p className='text-red-500 font-semibold'>
            File type must be image/*
          </p>
        </div>
      )}
      {bannerSizeError && (
        <div className='mt-2 text-center'>
          <h5 className='font-bold text-gray-500'>File too large</h5>
          <p className='text-red-500 font-semibold'>
            File is larger than 30,000,000 bytes
          </p>
        </div>
      )}
    </form>
  );
}
