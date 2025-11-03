import { useEffect, useRef, useState } from "react";

function Popover({
  children,
  content,
  trigger = "click"
}) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);

  const handleMouseOver = () => {
    if (trigger === "hover") {
      setShow(true);
    }
  };

  const handleMouseLeft = () => {
    if (trigger === "hover") {
      setShow(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShow(false);
      }
    }

    if (show) {
      // Bind the event listener
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show, wrapperRef]);

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeft}
      className="relative flex h-fit w-fit justify-center">
      <div
        onClick={() => setShow(!show)}
      >
        {children}
      </div>
      <div
        hidden={!show}
        className="pointer-events-none absolute bottom-full left-1/2 z-50 -translate-x-1/2 -translate-y-2 transform transition-all"
      >
        <div className="pointer-events-auto mb-2 w-max max-w-xs rounded shadow-[10px_30px_150px_rgba(46,38,92,0.25)]">
          {content}
        </div>
      </div>
    </div>
  );
}

export default Popover;
