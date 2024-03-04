import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { BlockUserForm } from '../forms/BlockUserForm';
import OutsideClickHandler from 'react-outside-click-handler';

type BlockConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const BlockUserModal: React.FC<BlockConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<BlockUserForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};