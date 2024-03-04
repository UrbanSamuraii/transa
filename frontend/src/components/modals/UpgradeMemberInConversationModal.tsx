import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { UpgradeMemberInConversationForm } from '../forms/UpgradeMemberConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type UpgradeUserModalProps = {
	setShowModal: (show: boolean) => void;
};

export const UpgradeMemberInConversationModal: React.FC<UpgradeUserModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<UpgradeMemberInConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};