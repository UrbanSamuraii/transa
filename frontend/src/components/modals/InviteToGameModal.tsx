import { OverlayStyle, OverlayContent  } from '../../utils/styles';
import { InviteToGameForm } from '../forms/InviteToGameForm';
import OutsideClickHandler from 'react-outside-click-handler';

type InviteToGameModalProps = {
	setShowModal: (show: boolean) => void;
};

export const InviteToGameModal: React.FC<InviteToGameModalProps> = ({ setShowModal }) => {

	return (
		<OverlayStyle>
			<OutsideClickHandler onOutsideClick={() => {
				console.log('Close Modal');
				setShowModal(false);
			}}>
				<OverlayContent>
					<InviteToGameForm setShowModal={setShowModal}/>
				</OverlayContent>
			</OutsideClickHandler>
		</OverlayStyle>
	);
};