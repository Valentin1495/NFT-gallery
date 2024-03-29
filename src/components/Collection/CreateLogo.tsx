import { useMutation } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { BsImage } from 'react-icons/bs';
import useApiPrivate from '../../hooks/useApiPrivate';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';

interface Logo {
  logoFile: File | undefined;
  setLogoFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  logoString: string;
  setLogoString: React.Dispatch<React.SetStateAction<string>>;
  setLogoName: React.Dispatch<React.SetStateAction<string>>;
}

export default function CreateLogo({
  logoFile,
  setLogoFile,
  logoString,
  setLogoString,
  setLogoName,
}: Logo) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoTypeError, setLogoTypeError] = useState(false);
  const [logoSizeError, setLogoSizeError] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file && file.type.substring(0, 5) !== 'image') {
      setLogoTypeError(true);
    } else {
      setLogoTypeError(false);
    }

    if (file && file.size > 30000000) {
      setLogoSizeError(true);
    } else {
      setLogoSizeError(false);
    }

    if (
      file &&
      file.type.substring(0, 5) === 'image' &&
      file.size <= 30000000
    ) {
      setLogoFile(file);
    }

    if (!file) {
      setLogoFile(undefined);
      setLogoName('');
    }
  };

  const apiPrivate = useApiPrivate();

  const { mutate, isLoading } = useMutation({
    mutationFn: (file: FormData) =>
      apiPrivate.post('/images', file).then((res) => res.data),
    onSuccess: (data) => {
      setLogoName(data.imageName);
    },
    onError: (err: AxiosError) => {
      if (err.response?.status !== 403) {
        toast.error('Something went wrong: ' + err.message);
      }
    },
  });

  useEffect(() => {
    if (logoFile) {
      const formData = new FormData();
      formData.append('file', logoFile);

      mutate(formData);

      const reader = new FileReader();
      reader.readAsDataURL(logoFile);
      reader.onloadend = () => {
        setLogoString(reader.result as string);
      };
    } else {
      setLogoString('');
    }
  }, [logoFile, setLogoString, mutate]);

  return (
    <form className='flex flex-col items-center'>
      <h3 className='font-bold text-lg'>
        Logo image{' '}
        <span className='text-red-500 text-xl font-bold align-top'>*</span>
      </h3>
      <p className='text-sm text-center'>
        This image will also be used for navigation.{' '}
      </p>
      <input
        type='file'
        className='hidden'
        ref={fileInputRef}
        accept='image/*'
        onChange={handleChange}
      />
      {logoString ? (
        <img
          src={logoString}
          alt='logo'
          role='presentation'
          className='h-44 w-44 rounded-full object-cover mt-3 cursor-pointer'
          onClick={() => {
            setLogoFile(undefined);
            setLogoName('');
          }}
        />
      ) : (
        <button
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className='group relative border-2 border-gray-400 border-dashed rounded-full mt-3 w-44 h-44'
        >
          <BsImage className='h-20 w-20 text-gray-400 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2' />
          <div className='rounded-full bg-black/60 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)] absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 hidden group-hover:block' />
        </button>
      )}
      {isLoading && (
        <h5 className='mt-3 font-bold text-gray-500'>
          Uploading a logo image...
        </h5>
      )}
      {logoTypeError && (
        <div className='mt-3 text-center'>
          <h5 className='font-bold text-gray-500'>Unsupported file type</h5>
          <p className='text-red-500 font-semibold'>
            File type must be image/*
          </p>
        </div>
      )}
      {logoSizeError && (
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
