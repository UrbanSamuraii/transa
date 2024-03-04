import styled, { css } from 'styled-components';

export const CSB_WIDTH: number = 350;
export const NAVBAR_HEIGHT: number = 2; // define in rem


export const InputField = styled.input`
  font-family: Arial, sans-serif;
  background-color: transparent;
  outline: none !important;
  border: none !important;
  color: white !important;
  font-size: 18px !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 4px 0 !important;

  ::placeholder {
    color: pink !important;
    background-color: inherit !important;
  }
`;


export const InputFieldCCF = styled.input`
-webkit-background-clip: text;
-webkit-text-fill-color: #ffffff;
font-family: Arial, sans-serif;
background-color: transparent;
outline: none !important;
border: none !important;
color: white !important;
font-size: 18px !important;
text-align: center;
width: 100% !important;
padding: 0 !important;
bottom: 10px;
transform: translateY(-20px);
::placeholder {
  color: pink !important;
  background-color: inherit !important;
}
  ${({ maxLength }) =>
        maxLength &&
        css`
      max-length: ${maxLength};
    `}
`;

export const InputContainerChat = styled.div`
  background-color: transparent;
  padding: 12px 16px;
  border: 2px solid rgba(255, 255, 255, 0.137);
  border-radius: 50px;
  width: 100%;
  height: 57px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  &:hover {
    border-color: #9b59b6;
    label {
      color: #9b59b6;
    }
  }
`;

export const InputLabelChat = styled.label`
background-color: #222222;
display: flex;
flex-direction: column;
font-family: 'Anta';
color: white;
display: inline-block;
padding: 1px;
border-radius: 10px;
transition: color 0.3s ease;
transform: translateY(-22px);
`;

export const InputContainer = styled.div`
  background-color: transparent;
  padding: 12px 16px;
	border: 2px solid rgba(255, 255, 255, 0.137);
  border-radius: 50px;
  width: 100%;
  height: 57px;
  box-sizing: border-box;
`;

export const InputLabel = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  color: #fff;
  display: inline-block; 
`;

export const Button = styled.button`
  width: 100%;
  height: 57px;
	background-color: rgb(188, 143, 243, 0.5);
  color: white;
  outline: none !important;
  border: none !important;
  border-radius: 50px;
  font-family: 'Anta';
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: rgba(188, 143, 243);
    transform: scale(1.05);
  }
`;

export const Button42 = styled.button`
  width: 100%;
  height: 46px;
  background-image: url(https://miro.medium.com/v2/resize:fit:2400/1*pyTVFh65W-y3JACaqGfIFQ.jpeg);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
	background-color: transparent;
  border-radius: 50px;
  transition: background-color 0.3s ease, transform 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: transparent;
    transform: scale(1.1);
  }
`;

export const Page = styled.div`
  background-image: url('https://wallpaperaccess.com/full/4848691.jpg');
  background-color: #00000050;
  background-blend-mode: color;
  background-size: cover;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ConversationSidebarStyle = styled.aside`
  position: fixed;
  left: 0;
  top: calc(${NAVBAR_HEIGHT}rem + 80px);
  height: calc(100% - ${NAVBAR_HEIGHT}rem - 80px);
  background-color: #1f1f1f;
  width: ${CSB_WIDTH}px;
  border-right: 1px solid #606060;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #606060 #1a1a1a;  

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #606060;
  }
  &::-webkit-scrollbar-track {
    background-color: #1a1a1a;
  }
  & header {
    position: fixed;
    display: flex;
    top: ${NAVBAR_HEIGHT}rem;
    justify-content: space-between;
    padding: 0 18px;
    background-color: #1f1f1f;
    height: 80px;
    width: ${CSB_WIDTH}px;
    border-bottom: 1px solid #606060;
    border-right: 1px solid #606060;
    
    & h2 {
      font-weight: 500;
      margin-right: 150px;
      color: #fff;
    }
    & .header-content {
      display: flex;
      align-items: center;
      color: #111;
    }
  }
`;

export const ConversationChannelPageStyle = styled.div`
  position: fixed;
  left: 0;
  width: calc(100% - 310px);
  height: 100%;
  margin-left: 310px;
  background-image: url('https://wallpaperaccess.com/full/4848691.jpg');
  background-color: #00000050;
  background-blend-mode: color;
  background-size: cover;
  @media screen and (max-width: 800px) {
    width: 100%;
    margin-left: 0;
  }
`;

export const ConversationPannelStyle = styled.div`
  position: fixed;
  left: 0;
  top: 3rem;
  width: calc(100% - ${CSB_WIDTH}px);
  height: calc(100% - 3rem);
  margin-left: ${CSB_WIDTH}px;
  background-color: #1f1f1f;
`;

export const ConversationSidebarContainer = styled.div`
  padding: 0px;
  width: 310px;
`;

export const ConversationSidebarItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  height: 80px;
  border-radius: 10px;
  border-bottom: 1px solid #606060;
  &:hover {
    background-color: #363636;
  }
`;

export const ConversationSidebarTexts = styled.div`
  display: flex;
  flex-direction: column; 
  align-items: flex-start; 
  gap: 5px;
  margin-bottom: 12px;
  margin-top: 0px;
  border-bottom: 1px
`;

export const Button2FA = styled.button`
  padding: 10px;
  background-color: #363636;
  color: #fff;
  display: block;
  margin: 10px auto 0;
  text-align: center;
  border-radius: 10px;
`;

export const Text2FA = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  font-size: 32px;
  font-family: 'Anta';
`;

export const OverlayStyle = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  margin-right: ${CSB_WIDTH}px;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; 
`;

export const OverlayContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const ButtonCreateConv = styled.button`
  background-color: #222222;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  font-size: 20px;
  font-family: 'Anta';
  border-radius: 10px;
  height: 50px;
  width: 130px;
  text-transform: capitalize;
	transition: background-color 0.3s ease;
  &:hover {
    background-color: #363636;
  }
  `;

export const ButtonAddUser = styled.button`
  background-color: ##181c50;
  color: #fff; 
  border: none;
  padding: 0px 0px; 
  font-size: 15px; 
  border-radius: 5px;
  height: 30px;
  width: 120px;
  cursor: pointer;
`;

const messageCommonStyles = css`
	background: rgb(39, 39, 39);
  border-radius: 5px;
  padding: 4px 7px;
  position: relative;
  margin: 3px;
  min-height: 60px;
  word-wrap: break-word;
`;

export const MessageContainerStyle = styled.div`
  ${messageCommonStyles}
  margin-left: 2%;
  width: 50%;
`;

export const MessageContainerPersonnalStyle = styled.div`
  ${messageCommonStyles}
  margin: 3px 2% 3px 48%;
  width: 50%;
`;

export const MessageInputFieldStyle = styled.div`
  display: flex;
  position: fixed;
  bottom: 20px;
  left: 330px;
  right: 0;
  border-radius: 10px;
  transition: width 0.3s ease;
  @media screen and (max-width: 800px) {
    left: 20px;
  }
`;

export const MessageInputContainer = styled.div`
  display: flex;
  width: 100%;
`;

export const MessageInputTextArea = styled.textarea`
	background-color: rgb(32, 32, 32);
  border-radius: 15px;
  padding: 5px;
  border: none;
  color: white;
  font-size: 17px;
  // font-family: 'Anta';
  resize: none;
  overflow: hidden;
  width: 85%;
  outline: none;
  overflow-y: auto;
`;

export const MessageSendButton = styled.button`
  background: #9b59b6;
  border: none;
  border-radius: 50%;
  margin-top: 10px;
  margin-left: 10px;
  cursor: pointer;
  width: 45px;
  height: 45px;
  & i {
    color: white;
    font-size: 25px;
  }
`;

export const DarkRedButton = styled.button`
background-color: darkred;
color: white;
font-style: italic;
font-size: 12px;
padding: 8px 16px;
border: none;
border-radius: 4px;
cursor: pointer;
`;
