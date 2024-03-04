import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { UnblockUserForm } from '../forms/UnblockUserForm';
import OutsideClickHandler from 'react-outside-click-handler';

type UnblockConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const UnblockUserModal: React.FC<UnblockConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<UnblockUserForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};