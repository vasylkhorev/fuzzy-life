import { useEffect, useRef, useState } from "react";

function Popover({
  children,
  content,
  trigger = "click",
  placement = "top",
  alignment = "center"
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

  const placementClass =
    placement === "bottom"
      ? "top-full translate-y-2"
      : "bottom-full -translate-y-2";

  let alignmentClass = "";
  if (alignment === "left") {
    alignmentClass = "left-0 translate-x-0";
  } else if (alignment === "right") {
    alignmentClass = "right-0 translate-x-0";
  } else {
    alignmentClass = "left-1/2 -translate-x-1/2";
  }

  const spacingClass = placement === "bottom" ? "mt-2" : "mb-2";

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeft}
      className="relative flex h-fit w-fit justify-center normal-case">
      <div
        onClick={() => setShow(!show)}
      >
        {children}
      </div>
      <div
        hidden={!show}
        className={`pointer-events-none absolute ${placementClass} ${alignmentClass} z-50 transform transition-all`}
      >
        <div className={`pointer-events-auto ${spacingClass} w-max max-w-xs rounded shadow-[10px_30px_150px_rgba(46,38,92,0.25)]`}>
          {content}
        </div>
      </div>
    </div>
  );
}

export default Popover;
