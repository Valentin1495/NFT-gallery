import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Layout from './components/Layout';
import CollectionDetails from './pages/CollectionDetails';
import Search from './pages/Search';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import Signin from './pages/Signin';
import RequireAuth from './components/RequireAuth';
import MyCollections from './pages/MyCollections';
import CreateCollection from './pages/CreateCollection';
import CreateItem from './pages/CreateItem';
import Account from './pages/Account';
import EditProfile from './pages/EditProfile';

function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Home />} />
          <Route path='collection/:colId' element={<CollectionDetails />} />
          <Route path='search' element={<Search />} />
          <Route path='*' element={<NotFound />} />

          <Route element={<RequireAuth />}>
            <Route path='collections' element={<MyCollections />} />
            <Route path='collection/create' element={<CreateCollection />} />
            <Route path='asset/create' element={<CreateItem />} />
            <Route path='account/:userId' element={<Account />} />
            <Route path='account/profile' element={<EditProfile />} />
          </Route>
        </Route>

        <Route path='/signup' element={<Register />} />
        <Route path='/signin' element={<Signin />} />
      </Routes>
    </div>
  );
}

export default App;
