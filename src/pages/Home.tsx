import Banner from '../components/Home/Banner';
import Gallery from '../components/Home/Gallery';

export default function Home() {
  return (
    <div className='p-8 space-y-10'>
      <Banner />
      <Gallery />
    </div>
  );
}
