import styled, { css } from 'styled-components';
import React, { useState } from 'react';
// import { empty } from '@prisma/client/runtime/library';
import { InputFieldCCF } from '../../utils/styles';

interface InvitationBarContainerProps {
  visible: boolean;
}

export const Friendspage = styled.div`
  width: 100%;
  background-image: url('https://wallpaperaccess.com/full/4848691.jpg');
  background-color: #00000050;
  background-blend-mode: color;
  background-size: cover;
  height: 100%;
  display: flex;
  background-size: cover;
  justify-content: center;
  align-items: center;
  font-family: 'Anta';
`;

export const FriendsListContainer = styled.div`
  position: fixed;
  height: 85%;
  top: 10%;
  left: 5%;
  right: 51%;
  background-color: #222222CC;
  backdrop-filter: blur(6px);
  border-radius: 10px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #363636;
    border: 1px solid #222222;
  }
`;

export const FriendsListTitle = styled.div`
  background-color: #222222;
  color: white;
  padding: 30px;
  text-transform: uppercase;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 25px;
  letter-spacing: 2px;
	font-family: 'Anta';
  font-weight: bold;
`;

const FriendItemContainer = styled.div`
  padding: 20px 30px;
  gap: 30px;
  margin-bottom: 1px;
  border-radius: 10px;
  color: white;
  display: flex;
  align-items: center;
  background-color: #363636;
  position: relative;
`;

const ContextMenuButton = styled.button`
  position: absolute;
  right: 17px;
  height: 40px;
  width: 40px;
  border-radius: 50%;
  background-color: #ff00009c;
  color: white;
  border: none;
  padding: 5px;
  cursor: pointer;
  & > i {
    font-size: 25px;
  }
`;

const BlueCircle = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-size: cover;
`;

const StatusCircle = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-left: auto;
`;

const Username = styled.div`
  font-size: 20px;
`;

interface FriendItemProps {
  friend: {
    id: number;
    username: string;
    status: string;
    img_url: string;
  };
  removeFriend: (friendId: number) => void;
}

export const FriendItem: React.FC<FriendItemProps> = ({ friend, removeFriend }) => {
  const { id, username, status, img_url } = friend;
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const handleMouseEnter = () => {
    setShowDeleteButton(true);
  };

  const handleMouseLeave = () => {
    setShowDeleteButton(false);
  };

  const handleRemoveFriend = () => {
    removeFriend(id);
    setShowDeleteButton(false);
  };

  const img_url2 = img_url || "https://openseauserdata.com/files/b261626a159edf64a8a92aa7306053b8.png";

  // console.log(img_url2 < "https://openseauserdata.com/files/b261626a159edf64a8a92aa7306053b8.png");

  return (
    <FriendItemContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <BlueCircle style={{ backgroundImage: `url(${img_url2})` }} />
      <Username>{username}</Username>
      {showDeleteButton && (
        <ContextMenuButton onClick={handleRemoveFriend}><i className='bx bxs-user-minus'></i></ContextMenuButton>
      )}
      <StatusCircle style={{ backgroundColor: status === 'ONLINE' ? '#04f8399c' : '#ff00009c' }} />
    </FriendItemContainer>
  );
};

export const InvitationContainer = styled.div`
  display: flex;
  flex-direction: column; 
  width: 40%; 
  margin-left: 30px; 
`;

export const InvitationBarContainer = styled.div`
  position: fixed;
  z-index: 100;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
  align-items: center;
  justify-content: center;
  border-radius: 10px;
`;

const InputContainerFriends = styled.div`
  border-radius: 20px;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.137);
  width: 300px;
  height: 57px;
  border-radius: 50px;
  transition: border-color 0.3s ease;
  &:hover {
    border-color: #9b59b6;
    label {
      color: #9b59b6;
    }
  }
`;

export const InputLabelFriends = styled.label`
  background-color: #222222;
  color: white;
  display: inline-block;
  padding: 1px;
  border-radius: 10px;
  transition: color 0.3s ease;
  transform: translateY(-22px);
  margin-left: 62px;
`;

const Message = styled.div`
  margin-right: auto;
  color: white;
`;

export const SendButton = styled.button`
  background-color: #222222;
  color: white;
  margin-top: 15px;
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  font-family: 'Anta';
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #363636;
  }
`;

export const MenuContainer = styled.div`
  background-color: transparent;
  display: flex;
  flex-direction: column;
  padding: 25px;
  align-items: center;
`;

export const Title = styled.h2`
    font-size: 22px;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 30px;
`;

const BlurredBackground = styled.div`
  position: fixed;
  top: -0%;
  left: -0%;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #222222CC;
  backdrop-filter: blur(6px);
  z-index: -1;
`;

interface InvitationBarProps {
  sendInvitation: (invitationDetails: { usernameOrEmail: string }) => void;
}

export const InvitationBar: React.FC<InvitationBarProps> = ({ sendInvitation }) => {
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setMessage('');
  };

  const handleSendInvitation = () => {
    if (inputValue.trim() === '') {
      setMessage('Please enter the username or email.');
    } if (inputValue.length > 10) {
      setMessage('Input exceeds the maximum character limit.');
    } else {
      sendInvitation({ usernameOrEmail: inputValue });
      setInputValue('');
      setMessage('');
    }
  };

  return (
	<div>
  <MenuContainer>
    <Title>Invite Friends</Title>
    <BlurredBackground />
    <Message>{message}</Message>
    <InputContainerFriends>
      <InputLabelFriends>
          Username or email
      </InputLabelFriends>
      <InputFieldCCF maxLength={30}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      />
    </InputContainerFriends>
    <SendButton onClick={handleSendInvitation}>Send Invitation</SendButton>
  </MenuContainer>
  </div>
  );
};

///////// INVITATION LIST /////////


export const InvitationsListContainer = styled.div`
  position: fixed;
  height: 85%;
  left: 51%;
  right: 5%;
  background-color: #222222CC;
  backdrop-filter: blur(6px);
  border-radius: 10px;
  overflow-y: auto;
  top: 10%;
  &::-webkit-scrollbar {
    width: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
      border: 1px solid #000;
  }
`;

const InvitationItemContainer = styled.div`
  padding: 20px 30px;
  gap: 30px;
  border-radius: 10px;
  margin-bottom: 1px;
  color: white;
  display: flex;
  align-items: center;
  background-color: #363636;
  position: relative;
`;

const ActionButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  color: white;
  padding: 5px;
  right: 30px;
  cursor: pointer;
  position: fixed;
`;

const AcceptButton = styled(ActionButton)`
  background-color: #04f8399c;
  right: 65px;
  &:before {
    content: '✔';
  }
`;

const RefuseButton = styled(ActionButton)`
  background-color: #ff00009c;
  &:before {
    content: '✖';
  }
`;

const invitUsername = styled.div`
  font-size: 20px;
`;

interface InvitationItemProps {
	invitation: {
	  id: number;
	  username: string;
	};
	acceptInvitation: (invitationId: number) => void;
	refuseInvitation: (invitationId: number) => void;
  }
  
  export const InvitationItem: React.FC<InvitationItemProps> = ({ invitation, acceptInvitation, refuseInvitation }) => {
	const { id, username } = invitation;

	const handleRefuseInvitation = () => {
		refuseInvitation(id);
	};

	const handleAcceptInvitation = () => {
		acceptInvitation(id);
	};
  
	return (
	  <InvitationItemContainer>
		<BlueCircle />
		<Username>{username}</Username>
		<AcceptButton onClick={handleAcceptInvitation} />
      	<RefuseButton onClick={handleRefuseInvitation} />
	  </InvitationItemContainer>
	);
  };
  