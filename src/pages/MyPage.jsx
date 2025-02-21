import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Modal, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuthState, useAuthDispatch } from 'contexts/authContext';
import { ModalBox, PageContainer, PageContents } from 'components/Common';
import { USER_INFO_KEY } from 'constants/keys';
import useStorage from 'hooks/useStorage';
import useAsync from 'hooks/useAsync';
import { getAllMyParty, getNewUsername, updateUsername } from 'utils/api';
import MyPageTitle from 'components/MyParty/MyPageTitle';
import MyPartyTab from 'components/MyParty/MyPartyTab';
import UserNameEdit from 'components/MyParty/UserNameEdit';
import Alert from 'components/Common/Alert';
import ScrollTopBtn from 'components/Common/ScrollTopBtn';

const SIZE = 5;
const RANDOM_USERNAME_SIZE = 5;

const initialState = {
  parties: [],
  lastSortingId: 0,
  loadedSize: 0,
  totalSize: 0,
  buttonDisabled: true,
};

const MyPage = () => {
  const [, setUserInfo] = useStorage(USER_INFO_KEY, null, 'session');
  const { onUpdate: onUpdateUserInfo } = useAuthDispatch();
  const { username, points } = useAuthState();
  const { onLogout } = useAuthDispatch();
  const navigate = useNavigate();

  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const [onGoing, setOnGoing] = useState(initialState);
  const [recruiting, setRecruiting] = useState(initialState);
  const [finished, setFinished] = useState(initialState);

  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const [generatedUsernameAPIState, fetchGenerateUsernameAPI] = useAsync(
    getNewUsername,
    [],
    [],
    true,
  );
  const [, fetchupdateUsernameAPI] = useAsync(updateUsername, [], [], true);
  const { isLoading: generatedUsernameLoading, value: generatedUsernameValue } =
    generatedUsernameAPIState || {};
  const [onGoingAPIState, fetchOnGoingAPI] = useAsync(
    getAllMyParty,
    ['ONGOING', SIZE],
    [],
  );
  const [recruitingAPIState, fetchRecruitingAPI] = useAsync(
    getAllMyParty,
    ['RECRUITING', SIZE],
    [],
  );
  const [finishedAPIState, fetchFinishedAPI] = useAsync(
    getAllMyParty,
    ['FINISHED', SIZE],
    [],
  );

  const statusState = {
    ONGOING: onGoing,
    RECRUITING: recruiting,
    FINISHED: finished,
  };
  const fetchState = {
    ONGOING: fetchOnGoingAPI,
    RECRUITING: fetchRecruitingAPI,
    FINISHED: fetchFinishedAPI,
  };

  const { value: onGoingValue } = onGoingAPIState;
  const { value: recruitingValue } = recruitingAPIState;
  const { value: finishedValue } = finishedAPIState;

  useEffect(() => {
    if (onGoingValue) {
      const { totalSize, parties } = onGoingValue;

      setOnGoing(prevPartyState => {
        const loadedSize = prevPartyState.loadedSize + parties.length;

        return {
          ...prevPartyState,
          lastSortingId: totalSize && parties[parties.length - 1].sortingId,
          loadedSize,
          parties: [...prevPartyState.parties, ...parties],
          totalSize,
          buttonDisabled: !parties || totalSize === loadedSize,
        };
      });
    }
  }, [onGoingValue]);

  useEffect(() => {
    if (recruitingValue) {
      const { totalSize, parties } = recruitingValue;

      setRecruiting(prevPartyState => {
        const loadedSize = prevPartyState.loadedSize + parties.length;

        return {
          ...prevPartyState,
          lastSortingId: totalSize && parties[parties.length - 1].sortingId,
          loadedSize,
          parties: [...prevPartyState.parties, ...parties],
          totalSize,
          buttonDisabled: !parties || totalSize === loadedSize,
        };
      });
    }
  }, [recruitingValue]);

  useEffect(() => {
    if (finishedValue) {
      const { totalSize, parties } = finishedValue;

      setFinished(prevPartyState => {
        const loadedSize = prevPartyState.loadedSize + parties.length;

        return {
          ...prevPartyState,
          lastSortingId: totalSize && parties[parties.length - 1].sortingId,
          loadedSize,
          parties: [...prevPartyState.parties, ...parties],
          totalSize,
          buttonDisabled: !parties || totalSize === loadedSize,
        };
      });
    }
  }, [finishedValue]);

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClickCharge = useCallback(() => {
    navigate(`/charge`);
  }, [navigate]);

  const handleClickLogout = useCallback(() => {
    setIsOpenAlert(false);
    onLogout();
    navigate('/');
  }, [navigate, onLogout]);

  const handleClickParty = useCallback(
    partyId => {
      navigate(`/myParty/${partyId}`);
    },
    [navigate],
  );

  const handleClickMoreButton = status => {
    const { lastSortingId } = statusState[status];
    fetchState[status](status, SIZE, lastSortingId);
  };

  const handleUpdateUsername = useCallback(
    selectedUsername => {
      fetchupdateUsernameAPI({ username: selectedUsername });
      onUpdateUserInfo({ username: selectedUsername });
      setUserInfo(prevUserInfo => ({
        ...prevUserInfo,
        username: selectedUsername,
      }));
      handleCloseModal();
    },
    [fetchupdateUsernameAPI, handleCloseModal, onUpdateUserInfo, setUserInfo],
  );

  const handleShuffleUsername = () => {
    fetchGenerateUsernameAPI(RANDOM_USERNAME_SIZE);
  };

  const handleOpenEditModal = () => {
    fetchGenerateUsernameAPI(RANDOM_USERNAME_SIZE);
    setIsOpen(true);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.myPartyMain',
      }}
    >
      <PageContainer
        sx={{
          bgcolor: 'background.myPartyMain',
        }}
      >
        <MyPageTitle
          username={username}
          points={points}
          onClickCharge={handleClickCharge}
          onClickLogout={handleClickLogout}
          onClickEditButton={handleOpenEditModal}
        />
        <PageContents sx={{ p: 0 }}>
          {(onGoingValue || recruitingValue || finishedValue) && (
            <MyPartyTab
              value={step}
              onGoingState={onGoing}
              recruitingState={recruiting}
              finishedState={finished}
              onClickParty={handleClickParty}
              onClickMoreButton={handleClickMoreButton}
              onSetStep={newValue => setStep(newValue)}
            />
          )}
          <ScrollTopBtn />
        </PageContents>
        <Modal open={isOpen}>
          <ModalBox>
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'transparent',
              }}
            >
              <CloseIcon />
            </IconButton>
            <UserNameEdit
              username={username}
              generatedUsernameLoading={generatedUsernameLoading}
              generatedUsernameValue={generatedUsernameValue}
              onClose={handleCloseModal}
              onUpdateUsername={handleUpdateUsername}
              onClickShuffle={handleShuffleUsername}
            />
          </ModalBox>
        </Modal>
        <Alert
          isOpen={isOpenAlert}
          type="fail"
          messege="정말 로그아웃을 하시겠습니까?"
          leftButtonText="로그아웃 할래요!"
          rightButtonText="좀 더 볼래요!"
          isConfirm={true}
          onClose={() => setIsOpenAlert(false)}
          onClickLeftButton={handleClickLogout}
        />
      </PageContainer>
    </Box>
  );
};

export default MyPage;
