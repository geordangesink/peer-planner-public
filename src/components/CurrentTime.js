import { html } from "htm/react";
import { useState, useEffect } from "react";

export default () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Custom formatting for date and time
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formattedDate = formatDate(dateTime);

  return html`
    <div className="flex w-full h-[var(--title-bar-height)] ml-[50px] flex-col justify-center items-center">
      <h4 className="mt-[5px]">${formattedDate}</h4>
    </div>
  `;
};
