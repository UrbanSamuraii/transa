import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { BanUserFromConversationForm } from '../forms/BanUserFromConversationForm';
import OutsideClickHandler from 'react-outside-click-handler';

type BanUserConversationModalProps = {
	setShowModal: (show: boolean) => void;
};

export const BanUserFromConversationModal: React.FC<BanUserConversationModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<BanUserFromConversationForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};