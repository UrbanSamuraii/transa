import './GlobalMessages.css';
import React, { ReactNode, useEffect, useRef } from "react";

type ScrollableContainerProps = {
	children: ReactNode; 
};
  
export const ScrollableContainer = ({ children }: ScrollableContainerProps) => {
  
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (containerRef.current) {
		  // Scroll to the bottom whenever messages change
		  containerRef.current.scrollTop = Number.MAX_SAFE_INTEGER;
		}
	  }, [children]);
	
	  return (
		<div className="scrollablePanel" ref={containerRef}>
		  {React.Children.map(children, (child, index) => (
			<div key={index}>{child}</div>
		  ))}
		</div>
	  );
	};

export default ScrollableContainer;
