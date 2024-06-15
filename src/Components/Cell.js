import React from "react";
import styles from "./Cell.module.css";

const Cell = ({
  day,
  hour,
  isSelected,
  onMouseDown,
  text,
  toggleAllDay,
  big,
  isAllDaycell,
  isDayCell,
}) => {
  const handleClick = () => {
    if (toggleAllDay) {
      toggleAllDay(day);
    }
  };

  return (
    <div
      className={`${styles.cell} ${isSelected ? styles.selected : ""} ${
        big ? styles.big : ""
      } ${isDayCell ? styles.day : ""} ${isAllDaycell ? styles.allDay : ""}`}
      onMouseDown={onMouseDown}
      onClick={handleClick}
      data-day={day}
      data-hour={hour}
    >
      {text}
    </div>
  );
};

export default Cell;
