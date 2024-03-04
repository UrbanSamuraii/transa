import React, { useEffect } from 'react';
import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { ImplementNewPasswordForm } from '../forms/ImplementNewPasswordForm'
import OutsideClickHandler from 'react-outside-click-handler';

type NewPasswordModalProps = {
	setShowModal: (show: boolean) => void;
};

export const ImplementNewPasswordModal: React.FC<NewPasswordModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<ImplementNewPasswordForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};