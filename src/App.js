import Header from 'components/Common/Header';
import { useOttInfoDispatch } from 'contexts/OttInfoProvider';
import { useOttInfoState } from 'contexts/OttInfoProvider';
import useAsync from 'hooks/useAsync';
import { Outlet } from 'react-router';
import { getMyInfo, getOttList } from 'utils/api';
import { useEffect, useCallback } from 'react';
import useStorage from 'hooks/useStorage';
import { OTT_INFO_KEY, TOKEN_KEY, USER_INFO_KEY } from 'constants/keys';
import { useAuthDispatch } from 'contexts/authContext';
import { useAuthState } from 'contexts/authContext';
import LottieIcon from 'components/Common/LottieIcon';
import { Box } from '@mui/system';

function App() {
  const { isLoggedIn } = useAuthState();
  const { ottServices } = useOttInfoState();
  const { onUpdate: onUpdateOttInfo } = useOttInfoDispatch();
  const { onUpdate: onUpdateUserInfo, onLogout } = useAuthDispatch();
  const [storedOttInfo, setOttInfo] = useStorage(OTT_INFO_KEY, null, 'session');

  const [storedUserInfo, setUserInfo] = useStorage(
    USER_INFO_KEY,
    null,
    'session',
  );

  const [getOttListApiState, fetchOttListApiState] = useAsync(
    getOttList,
    [],
    [],
    true,
  );

  const [getMyInfoApiState, fetchGetMyInfoApiState] = useAsync(
    getMyInfo,
    [],
    [],
    true,
  );

  const {
    isLoading: myInfoLoading,
    value: myInfoValue,
    error: myInfoError,
  } = getMyInfoApiState;

  const {
    isLoading: ottListLoading,
    value: ottListValue,
    error: ottListError,
  } = getOttListApiState;

  const handleCheckStorage = useCallback(
    ({ key, newValue, storageArea }) => {
      // if (e.url !==  baseUrl) return
      const { token: storedToken } = storageArea;
      if (key === TOKEN_KEY && newValue === null) {
        sessionStorage.removeItem(USER_INFO_KEY);
        onLogout();
      }
      if (key === USER_INFO_KEY && newValue === null && storedToken) {
        fetchGetMyInfoApiState();
      }
      if (key === OTT_INFO_KEY && newValue === null) {
        fetchOttListApiState();
      }
    },
    [onLogout, fetchGetMyInfoApiState, fetchOttListApiState],
  );

  useEffect(() => {
    window.addEventListener('storage', handleCheckStorage);

    return () => {
      window.removeEventListener('storage', handleCheckStorage);
    };
  }, [handleCheckStorage]);

  useEffect(() => {
    if (storedOttInfo === null) {
      fetchOttListApiState();
    } else {
      onUpdateOttInfo(storedOttInfo);
    }
  }, [storedOttInfo, fetchOttListApiState, onUpdateOttInfo]);

  useEffect(() => {
    if (ottListValue) {
      setOttInfo(ottListValue);
      onUpdateOttInfo(ottListValue);
    }
  }, [setOttInfo, ottListValue, onUpdateOttInfo]);

  useEffect(() => {
    if (isLoggedIn && !storedUserInfo) {
      fetchGetMyInfoApiState();
    } else if (isLoggedIn && storedUserInfo) {
      onUpdateUserInfo(storedUserInfo);
    } else {
      onLogout();
    }
  }, [
    fetchGetMyInfoApiState,
    onUpdateUserInfo,
    isLoggedIn,
    storedUserInfo,
    onLogout,
  ]);

  useEffect(() => {
    if (myInfoValue) {
      setUserInfo(myInfoValue);
      onUpdateUserInfo(myInfoValue);
    }
  }, [onUpdateUserInfo, myInfoValue, setUserInfo]);

  return (
    <>
      <Header user={false} />
      {(ottListLoading || myInfoLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <LottieIcon type="loadingCat" />
        </Box>
      )}
      {(ottListError || myInfoError) && <h1>에러</h1>}
      {ottServices.length !== 0 && <Outlet />}
    </>
  );
}

export default App;
