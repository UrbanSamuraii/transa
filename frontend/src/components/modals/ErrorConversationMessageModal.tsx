import OutsideClickHandler from 'react-outside-click-handler';
import styled from 'styled-components';
import React from 'react';

const OverlayStyle = styled.div`
	position: fixed;
	top: 5%;
	left: 40%;
	width: 20%;
	height: 20%;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ErrorContainer = styled.div`
  border: 1px solid red;
  padding: 20px;
  background: pink;
  text-align: center;
`;

type ErrorFormProps = {
  setShowModalError: (show: boolean) => void;
  errorMessage: string;
};

export const ErrorForm: React.FC<ErrorFormProps> = ({ setShowModalError, errorMessage }) => {
  return (
    <ErrorContainer>
      {/* <p>An error occurred</p> */}
      <p>{errorMessage}</p>
    </ErrorContainer>
  );
};

type ErrorMessageModalProps = {
	setShowModalError: (show: boolean) => void;
	errorMessage: string;
};
  
export const ErrorConversationMessageModal: React.FC<ErrorMessageModalProps> = ({ setShowModalError, errorMessage }) => {
	return (
		<OutsideClickHandler onOutsideClick={() => setShowModalError(false)}>
			<OverlayStyle>
				<ErrorForm setShowModalError={setShowModalError} errorMessage={errorMessage} />
			</OverlayStyle>
		</OutsideClickHandler>
	);
};