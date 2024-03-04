import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { DowngradeMemberInConversationForm } from '../forms/DowngradeMemberInConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type DowngradeUserModalProps = {
	setShowModal: (show: boolean) => void;
};

export const DowngradeMemberInConversationModal: React.FC<DowngradeUserModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<DowngradeMemberInConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};